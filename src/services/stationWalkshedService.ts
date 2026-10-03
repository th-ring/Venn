/**
 * stationWalkshedService.ts
 * Manages precomputed pedestrian network walksheds for transit stations.
 * Provides 0 ms latency, 100% offline, barrier-aware pedestrian contours.
 */

import * as turf from '@turf/turf';
import type { StationWalkshedDataset, StationWalkshedContours } from '../types.ts';
import { resolveAssetUrl } from '../utils/assetUrl.ts';

const walkshedCache = new Map<string, StationWalkshedDataset>();
const loadPromises = new Map<string, Promise<StationWalkshedDataset | null>>();

/**
 * Validates whether raw parsed data adheres to the StationWalkshedDataset schema.
 */
export function validateStationWalkshedDataset(raw: any): StationWalkshedDataset | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.regionId !== 'string' || typeof raw.stations !== 'object' || raw.stations === null) {
    return null;
  }
  return raw as StationWalkshedDataset;
}

/**
 * Directly injects a walkshed dataset into cache (useful for tests and synthetic datasets).
 */
export function setStationWalkshedDataset(regionId: string, dataset: StationWalkshedDataset): void {
  walkshedCache.set(regionId, dataset);
}

/**
 * Clears the walkshed in-memory cache.
 */
export function clearWalkshedCache(): void {
  walkshedCache.clear();
  loadPromises.clear();
}

/**
 * Checks whether walkshed data for a given region is already loaded in memory.
 */
export function isStationWalkshedLoaded(regionId: string): boolean {
  return walkshedCache.has(regionId);
}

/**
 * Asynchronously loads the precomputed station walkshed dataset for a transit region.
 * Fetches the compact JSON asset on demand to keep the main bundle lightweight.
 */
export async function loadStationWalksheds(regionId: string = 'munich-mvv'): Promise<StationWalkshedDataset | null> {
  const normalizedId = regionId === 'munich' ? 'munich-mvv' : regionId;

  if (walkshedCache.has(normalizedId)) {
    return walkshedCache.get(normalizedId)!;
  }

  if (loadPromises.has(normalizedId)) {
    return loadPromises.get(normalizedId)!;
  }

  const promise = (async () => {
    try {
      if (typeof fetch === 'undefined') {
        return null;
      }

      const assetPath = resolveAssetUrl(`transit-packages/walksheds/${normalizedId}.json`);
      const res = await fetch(assetPath);

      if (!res.ok) {
        console.warn(`[StationWalkshedService] Could not load walksheds for ${normalizedId}: HTTP ${res.status}`);
        return null;
      }

      const json = await res.json();
      const validated = validateStationWalkshedDataset(json);
      if (validated) {
        walkshedCache.set(normalizedId, validated);
        return validated;
      } else {
        console.warn(`[StationWalkshedService] Invalid walkshed dataset format for ${normalizedId}`);
        return null;
      }
    } catch (err: any) {
      console.warn(`[StationWalkshedService] Failed to fetch walksheds for ${normalizedId}:`, err?.message || err);
      return null;
    } finally {
      loadPromises.delete(normalizedId);
    }
  })();

  loadPromises.set(normalizedId, promise);
  return promise;
}

/**
 * Synchronously retrieves and scales a realistic pedestrian walkshed polygon for a station.
 * Returns null if the dataset or station is not found, triggering graceful fallback to circular heuristic.
 *
 * @param stationId The unique station ID
 * @param remainingMin The remaining walk time budget in minutes
 * @param userSpeedKmh The user's walking speed in km/h (default: 4.0)
 * @param stationLat Station latitude
 * @param stationLng Station longitude
 * @param regionId The active transit region ID (default: 'munich-mvv')
 */
export function getStationWalkshedPolygon(
  stationId: string,
  remainingMin: number,
  userSpeedKmh: number = 4.0,
  stationLat: number,
  stationLng: number,
  regionId: string = 'munich-mvv'
): GeoJSON.Feature<GeoJSON.Polygon> | null {
  const normalizedId = regionId === 'munich' ? 'munich-mvv' : regionId;
  const dataset = walkshedCache.get(normalizedId);
  if (!dataset || !dataset.stations) {
    return null;
  }

  const stationData: StationWalkshedContours | undefined = dataset.stations[stationId];
  if (!stationData) {
    return null;
  }

  // Determine closest reference contour (5, 10, or 15 minutes)
  let refMinutes = 5;
  let contourCoords: [number, number][] | undefined = undefined;

  if (remainingMin <= 7.5 && stationData[5]) {
    refMinutes = 5;
    contourCoords = stationData[5];
  } else if (remainingMin <= 12.5 && stationData[10]) {
    refMinutes = 10;
    contourCoords = stationData[10];
  } else if (stationData[15]) {
    refMinutes = 15;
    contourCoords = stationData[15];
  } else if (stationData[10]) {
    refMinutes = 10;
    contourCoords = stationData[10];
  } else if (stationData[5]) {
    refMinutes = 5;
    contourCoords = stationData[5];
  }

  if (!contourCoords || contourCoords.length < 4) {
    return null;
  }

  // Calculate dynamic scale factor based on time and walking speed
  const baseSpeed = dataset.baseWalkingSpeedKmh || 4.0;
  const timeRatio = remainingMin / refMinutes;
  const speedRatio = userSpeedKmh / baseSpeed;
  const scale = Math.max(0.05, Math.min(timeRatio * speedRatio, 4.0));

  try {
    const basePolygon = turf.polygon([contourCoords]);
    const scaled = turf.transformScale(basePolygon, scale, {
      origin: [stationLng, stationLat],
    });

    scaled.properties = {
      source: 'precomputed_walkshed',
      stationId,
      remainingMinutes: remainingMin,
      scaledBy: scale,
    };

    return scaled as GeoJSON.Feature<GeoJSON.Polygon>;
  } catch (err) {
    console.warn(`[StationWalkshedService] Failed to scale walkshed polygon for station ${stationId}:`, err);
    return null;
  }
}
