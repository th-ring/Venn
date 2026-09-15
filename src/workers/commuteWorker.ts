/// <reference lib="webworker" />

import {
  PersonProfile,
  CommuteSchedule,
  CalculationResult,
  TransitRegion,
  IsochroneFallbackAlert,
} from '../types';
import { generateIsochrone, IsochroneProvider } from '../services/isochroneEngine';
import {
  calculateMultiIntersection,
  calculateAreaKm2,
  generateEmptyIntersectionSuggestions,
} from '../services/geometry';
import { maskByResidentialAreas } from '../data/residentialZones';
import { setTransitRegion } from '../services/mvvMatrixService';

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

self.addEventListener('message', async (event: MessageEvent<CommuteWorkerRequest>) => {
  const data = event.data;
  if (!data || !data.requestId) return;

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
      self.postMessage(emptyResponse);
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
    const rawAreaKm2 = calculateAreaKm2(rawIntersection);

    let finalIntersection = rawIntersection;
    let finalAreaKm2 = rawAreaKm2;

    if (onlyResidential && rawIntersection) {
      const masked = maskByResidentialAreas(rawIntersection);
      if (masked) {
        finalIntersection = masked;
        finalAreaKm2 = calculateAreaKm2(masked);
      }
    }

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
    };

    const response: CommuteWorkerResponse = {
      requestId,
      success: true,
      result,
    };

    self.postMessage(response);
  } catch (err: any) {
    const errorResponse: CommuteWorkerResponse = {
      requestId,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errorResponse);
  }
});
