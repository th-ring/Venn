import * as turf from '@turf/turf';
import {
  PersonProfile,
  CommuteSchedule,
  CalculationResult,
  TransitRegion,
  IsochroneFallbackAlert,
  HeatmapZoneFeature,
  CommuteEstimate,
  ApartmentListing,
  IntersectionSubArea,
  PortalSearchLink,
} from '../types';
import { generateIsochrone, IsochroneProvider, estimateCommuteTime } from '../services/isochroneEngine';
import {
  calculateMultiIntersection,
  calculateAreaKm2,
  generateEmptyIntersectionSuggestions,
  isPointInPolygon,
  getPolygonCenter,
  samplePolygonPoints,
} from '../services/geometry';
import { maskByResidentialAreas } from '../data/residentialZones';
import { setTransitRegion } from '../services/mvvMatrixService';
import { generatePriorityHeatmapZones, getPriorityTargets } from '../services/priorityHeatmapEngine';
import { getHighwayRamps } from '../services/highwayService';
import { extractIntersectionSubAreas, getPortalSearchLinks } from '../services/apartmentService';

export interface CommuteWorkerRequest {
  type?: 'CALCULATE_COMMUTE';
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
  type?: 'COMMUTE_RESULT';
  requestId: string;
  success: boolean;
  result?: CalculationResult;
  error?: string;
}

export interface CommuteWorkerInspectionRequest {
  type: 'INSPECT_POINT';
  requestId: string;
  lat: number;
  lng: number;
  intersectionFeature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  profiles: PersonProfile[];
  schedule: CommuteSchedule;
  isochronesMap?: Record<string, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>;
  activeTransitRegion?: TransitRegion;
  apartments?: ApartmentListing[];
}

export interface CommuteWorkerInspectionResponse {
  type: 'INSPECT_POINT_RESULT';
  requestId: string;
  success: boolean;
  lat: number;
  lng: number;
  isInIntersection: boolean;
  isIntersectionInspection: boolean;
  estimates: CommuteEstimate[];
  allWithinLimit: boolean;
  withinLimitCount: number;
  centerCoord: [number, number] | null;
  avgCommuteMinutes?: number;
  commuteSpreadMinutes?: number;
  subAreas?: IntersectionSubArea[];
  portalLinks?: PortalSearchLink[];
  selectedSubAreaId?: string;
  error?: string;
}

export type CommuteWorkerIncomingMessage =
  | CommuteWorkerRequest
  | CommuteWorkerInspectionRequest;

export type CommuteWorkerOutgoingMessage =
  | CommuteWorkerResponse
  | CommuteWorkerInspectionResponse;

let latestRequestId = '';

self.addEventListener('message', async (event: MessageEvent<CommuteWorkerIncomingMessage>) => {
  const data = event.data;
  if (!data || !data.requestId) return;

  if (data.type === 'INSPECT_POINT') {
    handleInspectPoint(data);
    return;
  }

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

async function handleInspectPoint(data: CommuteWorkerInspectionRequest) {
  const {
    requestId,
    lat,
    lng,
    intersectionFeature,
    profiles,
    schedule,
    isochronesMap,
    activeTransitRegion,
    apartments,
  } = data;

  try {
    if (activeTransitRegion) {
      setTransitRegion(activeTransitRegion);
    }

    const active = profiles.filter((p) => p.visible);
    const isInIntersection = intersectionFeature
      ? isPointInPolygon([lng, lat], intersectionFeature)
      : false;

    const isIntersectionInspection = isInIntersection && !!intersectionFeature;
    const centerCoord = isIntersectionInspection ? getPolygonCenter(intersectionFeature) : null;
    const sampleCoords = isIntersectionInspection ? samplePolygonPoints(intersectionFeature, 12) : [];

    const estimates: CommuteEstimate[] = active.map((p) => {
      const poly = isochronesMap?.[p.id];
      const isInIsochrone = poly ? isPointInPolygon([lng, lat], poly) : false;

      let { travelTimeMinutes, distanceKm, details } = estimateCommuteTime(
        { lat, lng },
        { lat: p.lat, lng: p.lng },
        p.mode,
        schedule,
        p.maxTransfers,
        p.maxWalkToStationMin,
        p.maxWalkFromStationMin,
        p.transitModes
      );

      const isWithinLimit = travelTimeMinutes <= p.travelTimeMinutes;

      let minMinutes: number | undefined;
      let maxMinutes: number | undefined;
      let spanPlusMinus: number | undefined;
      let centerMinutes: number | undefined;
      let centerDistanceKm: number | undefined;

      if (isIntersectionInspection && centerCoord) {
        const centerEst = estimateCommuteTime(
          { lat: centerCoord[1], lng: centerCoord[0] },
          { lat: p.lat, lng: p.lng },
          p.mode,
          schedule,
          p.maxTransfers,
          p.maxWalkToStationMin,
          p.maxWalkFromStationMin,
          p.transitModes
        );

        centerMinutes = centerEst.travelTimeMinutes;
        centerDistanceKm = centerEst.distanceKm;

        const sampleTimes: number[] = [centerMinutes];
        sampleCoords.forEach((coord) => {
          const sampleEst = estimateCommuteTime(
            { lat: coord[1], lng: coord[0] },
            { lat: p.lat, lng: p.lng },
            p.mode,
            schedule,
            p.maxTransfers,
            p.maxWalkToStationMin,
            p.maxWalkFromStationMin,
            p.transitModes
          );
          sampleTimes.push(sampleEst.travelTimeMinutes);
        });

        minMinutes = Math.min(...sampleTimes);
        maxMinutes = Math.max(...sampleTimes);
        spanPlusMinus = Math.max(1, Math.round(Math.max(centerMinutes - minMinutes, maxMinutes - centerMinutes)));

        if (centerEst.details) {
          details = centerEst.details;
        }
      }

      return {
        personId: p.id,
        personName: p.name,
        personColor: p.color,
        mode: p.mode,
        travelTimeMinutes,
        limitMinutes: p.travelTimeMinutes,
        isWithinLimit,
        distanceKm,
        details,
        minMinutes,
        maxMinutes,
        spanPlusMinus,
        centerMinutes,
        centerDistanceKm,
      };
    });

    const withinLimitCount = estimates.filter((e) => e.isWithinLimit).length;
    const allWithinLimit = withinLimitCount === active.length;

    let avgCommuteMinutes: number | undefined;
    let commuteSpreadMinutes: number | undefined;
    let subAreas: IntersectionSubArea[] | undefined;
    let portalLinks: PortalSearchLink[] | undefined;
    let selectedSubAreaId: string | undefined;

    if (isIntersectionInspection && centerCoord) {
      const centerTimes = estimates.map((e) => e.centerMinutes ?? e.travelTimeMinutes);
      avgCommuteMinutes = Math.round(
        centerTimes.reduce((acc, t) => acc + t, 0) / (centerTimes.length || 1)
      );
      if (centerTimes.length === 2) {
        commuteSpreadMinutes = Math.round(Math.abs(centerTimes[0] - centerTimes[1]) / 2);
      } else if (centerTimes.length > 2) {
        commuteSpreadMinutes = Math.round(
          Math.max(...centerTimes.map((t) => Math.abs(t - (avgCommuteMinutes || 0))))
        );
      } else {
        commuteSpreadMinutes = 0;
      }

      if (apartments && apartments.length > 0) {
        subAreas = extractIntersectionSubAreas(intersectionFeature, apartments);
      }

      let clickedSubArea = subAreas?.find((sa) => {
        try {
          return turf.booleanPointInPolygon(turf.point([lng, lat]), sa.feature);
        } catch {
          return false;
        }
      });

      const activeBbox = clickedSubArea
        ? clickedSubArea.bbox
        : (turf.bbox(intersectionFeature as any) as [number, number, number, number]);

      portalLinks = clickedSubArea
        ? clickedSubArea.portalLinks
        : getPortalSearchLinks({ lat: centerCoord[1], lng: centerCoord[0] }, activeBbox);

      selectedSubAreaId = clickedSubArea?.id;
    }

    const response: CommuteWorkerInspectionResponse = {
      type: 'INSPECT_POINT_RESULT',
      requestId,
      success: true,
      lat,
      lng,
      isInIntersection,
      isIntersectionInspection,
      estimates,
      allWithinLimit,
      withinLimitCount,
      centerCoord,
      avgCommuteMinutes,
      commuteSpreadMinutes,
      subAreas,
      portalLinks,
      selectedSubAreaId,
    };

    self.postMessage(response);
  } catch (err: any) {
    const errorResponse: CommuteWorkerInspectionResponse = {
      type: 'INSPECT_POINT_RESULT',
      requestId,
      success: false,
      lat,
      lng,
      isInIntersection: false,
      isIntersectionInspection: false,
      estimates: [],
      allWithinLimit: false,
      withinLimitCount: 0,
      centerCoord: null,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errorResponse);
  }
}
