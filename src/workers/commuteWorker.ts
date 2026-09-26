import * as turf from '@turf/turf';
import {
  PersonProfile,
  CommuteSchedule,
  CalculationResult,
  TransitRegion,
  IsochroneFallbackAlert,
  HeatmapZoneFeature,
} from '../types';
import { generateIsochrone, IsochroneProvider } from '../services/isochroneEngine';
import {
  calculateMultiIntersection,
  calculateAreaKm2,
  generateEmptyIntersectionSuggestions,
} from '../services/geometry';
import { maskByResidentialAreas } from '../data/residentialZones';
import { setTransitRegion } from '../services/mvvMatrixService';
import { generatePriorityHeatmapZones, getPriorityTargets } from '../services/priorityHeatmapEngine';
import { getHighwayRamps } from '../services/highwayService';

export interface CommuteWorkerRequest {
  requestId: string;
  profiles: PersonProfile[];
  schedule: CommuteSchedule;
  onlyResidential: boolean;
  activeTransitRegion?: TransitRegion;
  selectedProvider?: IsochroneProvider;
  googleMapsApiKey?: string;
  orsApiKey?: string;
}

export interface CommuteWorkerResponse {
  requestId: string;
  success: boolean;
  result?: CalculationResult;
  error?: string;
}

let latestRequestId = '';

self.addEventListener('message', async (event: MessageEvent<CommuteWorkerRequest>) => {
  const data = event.data;
  if (!data || !data.requestId) return;

  latestRequestId = data.requestId;
  const currentRequestId = data.requestId;

  const {
    requestId,
    profiles,
    schedule,
    onlyResidential,
    activeTransitRegion,
    selectedProvider,
    googleMapsApiKey,
    orsApiKey,
  } = data;

  try {
    if (activeTransitRegion) {
      setTransitRegion(activeTransitRegion);
    }

    const active = profiles.filter((p) => p.visible);
    if (active.length === 0) {
      const emptyResponse: CommuteWorkerResponse = {
        requestId,
        success: true,
        result: undefined,
      };
      if (currentRequestId === latestRequestId) {
        self.postMessage(emptyResponse);
      }
      return;
    }

    const overrideConfig = {
      selectedProvider,
      googleMapsApiKey,
      orsApiKey,
    };

    const isochronePromises = active.map(async (p) => {
      const poly = await generateIsochrone(p, schedule, overrideConfig);
      return { id: p.id, poly };
    });

    const generated = await Promise.all(isochronePromises);
    // Cooperative cancellation check
    if (currentRequestId !== latestRequestId) return;

    const isochronesMap: Record<string, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = {};
    const polygonList: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = [];
    const fallbackAlerts: IsochroneFallbackAlert[] = [];

    generated.forEach(({ id, poly }) => {
      isochronesMap[id] = poly;
      polygonList.push(poly);
      if (poly.properties?.isFallback && poly.properties?.fallbackReason) {
        const p = active.find((person) => person.id === id);
        fallbackAlerts.push({
          personId: id,
          personName: p?.name || p?.address || 'Referenzort',
          mode: p?.mode || 'driving',
          requestedProvider: poly.properties.requestedProvider || 'calibrated',
          reason: poly.properties.fallbackReason,
          statusCode: poly.properties.statusCode,
        });
      }
    });

    const rawIntersection = calculateMultiIntersection(polygonList);
    // Cooperative cancellation check
    if (currentRequestId !== latestRequestId) return;

    const rawAreaKm2 = calculateAreaKm2(rawIntersection);

    let finalIntersection = rawIntersection;
    let finalAreaKm2 = rawAreaKm2;

    if (onlyResidential && rawIntersection) {
      const masked = maskByResidentialAreas(rawIntersection);
      // Cooperative cancellation check
      if (currentRequestId !== latestRequestId) return;
      if (masked) {
        finalIntersection = masked;
        finalAreaKm2 = calculateAreaKm2(masked);
      }
    }

    if (currentRequestId !== latestRequestId) return;

    // Background computation: Priority Heatmap Zones (Turf buffer, union, intersect)
    let heatmapZones: HeatmapZoneFeature[] | undefined;
    if (
      finalIntersection &&
      schedule.options?.heatmap &&
      schedule.options.heatmap.mode !== 'none'
    ) {
      try {
        heatmapZones = generatePriorityHeatmapZones(finalIntersection as any, schedule.options.heatmap);
      } catch (e) {
        console.warn('[commuteWorker] Heatmap zone generation failed:', e);
      }
    }

    if (currentRequestId !== latestRequestId) return;

    // Background computation: POI Target & Ramp Pre-filtering
    let relevantTargetIds: string[] | undefined;
    let relevantRampIds: string[] | undefined;

    if (finalIntersection) {
      try {
        const rawBbox = turf.bbox(finalIntersection as any);
        const radiusKm = schedule.options?.heatmap?.radiusKm || 1.5;
        const latMargin = radiusKm / 110.574;
        const midLat = (rawBbox[1] + rawBbox[3]) / 2;
        const lngMargin = radiusKm / (111.32 * Math.max(0.1, Math.cos((midLat * Math.PI) / 180)));
        const searchBbox = [
          rawBbox[0] - lngMargin,
          rawBbox[1] - latMargin,
          rawBbox[2] + lngMargin,
          rawBbox[3] + latMargin,
        ];

        const allTargets = getPriorityTargets(['ubahn', 'sbahn', 'highway']);
        relevantTargetIds = allTargets
          .filter((t) => {
            if (t.lng < searchBbox[0] || t.lng > searchBbox[2] || t.lat < searchBbox[1] || t.lat > searchBbox[3]) {
              return false;
            }
            try {
              return turf.booleanPointInPolygon(turf.point([t.lng, t.lat]), finalIntersection as any);
            } catch {
              return false;
            }
          })
          .map((t) => t.id);

        const allRamps = getHighwayRamps();
        relevantRampIds = allRamps
          .filter((r) => {
            const coords = r.geometry.coordinates;
            if (!coords || coords.length === 0) return false;
            const mid = coords[Math.floor(coords.length / 2)];
            if (mid[0] < searchBbox[0] || mid[0] > searchBbox[2] || mid[1] < searchBbox[1] || mid[1] > searchBbox[3]) {
              return false;
            }
            try {
              return turf.booleanPointInPolygon(turf.point(mid), finalIntersection as any);
            } catch {
              return false;
            }
          })
          .map((r) => r.properties.id);
      } catch (err) {
        console.warn('[commuteWorker] POI pre-filtering failed:', err);
      }
    }

    if (currentRequestId !== latestRequestId) return;

    const isEmpty = !finalIntersection || finalAreaKm2 <= 0;
    const suggestions = isEmpty ? generateEmptyIntersectionSuggestions(active) : [];

    const result: CalculationResult = {
      isochrones: isochronesMap,
      intersection: finalIntersection,
      rawIntersection,
      intersectionAreaKm2: finalAreaKm2,
      rawIntersectionAreaKm2: rawAreaKm2,
      emptyIntersection: isEmpty,
      suggestions,
      fallbackAlerts: fallbackAlerts.length > 0 ? fallbackAlerts : undefined,
      heatmapZones,
      relevantTargetIds,
      relevantRampIds,
    };

    const response: CommuteWorkerResponse = {
      requestId,
      success: true,
      result,
    };

    self.postMessage(response);
  } catch (err: any) {
    if (currentRequestId === latestRequestId) {
      const errorResponse: CommuteWorkerResponse = {
        requestId,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(errorResponse);
    }
  }
});
