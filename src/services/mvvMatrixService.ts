/**
 * Transit Matrix Service & Network Graph Solver
 * Manages Metropolitan Region packages (such as Munich MVV, Berlin VBB, Hamburg HVV etc.)
 * backed by persistent IndexedDB storage, and computes realistic transit travel times
 * and isochrones using high-performance graph searches (Bounded Dijkstra & A*).
 *
 * Accounts for:
 * - First mile walking time from origin to nearby entry stations
 * - Waiting time / headway for initial departure (e.g. 2-5 min average)
 * - True scheduled in-vehicle run times
 * - Transfer penalties (transfer walk + headways capped by maxTransferWaitMin)
 * - Maximum transfer constraints
 * - Last mile pedestrian dispersal around reached stations
 */

import * as turf from '@turf/turf';
import type {
  PersonProfile,
  TransitSubMode,
  TransitRegion,
  TransitStation,
  TransitConnection,
  TransitRegionMetadata,
  IsochroneOptions,
  CommuteSchedule,
} from '../types.ts';
import {
  ALL_TRANSIT_SUBMODES,
  DEFAULT_TRANSIT_SUBMODES,
  DEFAULT_ROUTING_PARAMETERS,
} from '../types.ts';
import { PriorityQueue } from './priorityQueue.ts';
import {
  saveRegionToStorage,
  loadRegionFromStorage,
  getActiveRegionId,
  setActiveRegionId,
  listInstalledRegions,
  validateTransitRegion,
} from './transitStorage.ts';
import type { CatalogRegion } from '../data/availableRegions.ts';
import { AVAILABLE_REGIONS_CATALOG } from '../data/availableRegions.ts';
import { resolveAssetUrl } from '../utils/assetUrl.ts';
import { getStationWalkshedPolygon } from './stationWalkshedService.ts';

export type MvvStation = TransitStation;
export type MvvConnection = TransitConnection;
export type MvvDataset = TransitRegion;

export const DEFAULT_MVV_DATASET: TransitRegion = {
  id: 'munich-mvv',
  name: 'München & Metropolregion (MVV Gesamt)',
  version: '2026.10-GTFS-v2',
  lastUpdated: '2026-10-03',
  source: 'MVV Münchner Verkehrs- und Tarifverbund GmbH (Open Data GTFS)',
  attribution: 'Fahrplandaten: © MVV GmbH (CC BY 4.0)',
  bbox: [11.03, 47.88, 12.02, 48.41],
  stationCount: 4195,
  connectionCount: 11142,
  footpathCount: 7412,
  downloadSizeApprox: '280 KB (gzip)',
  downloadUrl: resolveAssetUrl('transit-packages/munich.json'),
  isBuiltIn: true,
  schemaVersion: 2,
  directed: true,
  stations: [],
  connections: [],
};

const MVV_STORAGE_KEY = 'mvv_transit_dataset_v1';
const MVV_LAST_SYNC_KEY = 'mvv_last_sync_timestamp';

// In-memory active transit network
let activeTransitRegion: TransitRegion = DEFAULT_MVV_DATASET;

/**
 * High-performance equirectangular distance calculation in kilometers.
 * Avoids object allocations and is ~7x faster than turf.distance in hot loops.
 */
export function fastDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * 110.574;
  const avgLat = ((lat1 + lat2) * Math.PI) / 360;
  const dLng = (lng2 - lng1) * (111.32 * Math.cos(avgLat));
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export interface TransitGraphEdge {
  to: string;
  minutes: number;
  lines: string[];
  type: string;
  tph?: [number, number, number, number, number];
  isFootpath?: boolean;
}

export type TransitAdjacencyGraph = Map<string, TransitGraphEdge[]>;

const cachedGraphs = new Map<string, TransitAdjacencyGraph>();

export function clearTransitGraphCache(): void {
  cachedGraphs.clear();
}

/**
 * Returns a cached adjacency graph for the dataset and active submodes.
 * Supports forward search, reverse search for 'to_work' directed GTFS queries,
 * and inter-station footpaths.
 */
export function getOrCreateTransitGraph(
  dataset: TransitRegion,
  allowedModes: Set<TransitSubMode>,
  isReverse: boolean = false
): TransitAdjacencyGraph {
  const modesKey = `${dataset.id}_${dataset.version}_${isReverse ? 'rev' : 'fwd'}_${Array.from(allowedModes).sort().join(',')}`;
  const existing = cachedGraphs.get(modesKey);
  if (existing) return existing;

  const graph: TransitAdjacencyGraph = new Map();

  function addEdge(fromId: string, edge: TransitGraphEdge) {
    let list = graph.get(fromId);
    if (!list) {
      list = [];
      graph.set(fromId, list);
    }
    list.push(edge);
  }

  for (const conn of dataset.connections) {
    if (!isConnectionAllowed(conn, allowedModes)) continue;

    if (!isReverse) {
      addEdge(conn.from, {
        to: conn.to,
        minutes: conn.minutes,
        lines: conn.lines,
        type: conn.type,
        tph: conn.tph,
      });
      if (!dataset.directed) {
        addEdge(conn.to, {
          to: conn.from,
          minutes: conn.minutes,
          lines: conn.lines,
          type: conn.type,
          tph: conn.tph,
        });
      }
    } else {
      // Reverse graph: reverse the edge direction
      addEdge(conn.to, {
        to: conn.from,
        minutes: conn.minutes,
        lines: conn.lines,
        type: conn.type,
        tph: conn.tph,
      });
      if (!dataset.directed) {
        addEdge(conn.from, {
          to: conn.to,
          minutes: conn.minutes,
          lines: conn.lines,
          type: conn.type,
          tph: conn.tph,
        });
      }
    }
  }

  // Inter-station footpaths (bidirectional in both forward and reverse graphs)
  if (dataset.footpaths) {
    for (const fp of dataset.footpaths) {
      addEdge(fp.from, {
        to: fp.to,
        minutes: fp.minutes,
        lines: [],
        type: 'footpath',
        isFootpath: true,
      });
      addEdge(fp.to, {
        to: fp.from,
        minutes: fp.minutes,
        lines: [],
        type: 'footpath',
        isFootpath: true,
      });
    }
  }

  if (cachedGraphs.size > 20) {
    cachedGraphs.clear();
  }
  cachedGraphs.set(modesKey, graph);
  return graph;
}

/**
 * Returns the currently active transit region
 */
export function getTransitRegion(): TransitRegion {
  return activeTransitRegion;
}

/**
 * Activates a transit region in memory without writing to storage or clearing caches unnecessarily
 */
export function activateRegionInMemory(region: TransitRegion): void {
  const isChanged = activeTransitRegion.id !== region.id || activeTransitRegion.version !== region.version;
  activeTransitRegion = region;
  if (isChanged) {
    clearTransitGraphCache();
  }
}

/**
 * Sets the active transit region in memory and IndexedDB
 */
export function setTransitRegion(region: TransitRegion): void {
  activateRegionInMemory(region);
  saveRegionToStorage(region).catch(() => {});
  setActiveRegionId(region.id).catch(() => {});
}

/**
 * Resolves whether a connection matches the enabled transit submodes.
 * Distinguishes Expressbus (lines starting with 'X', e.g. X30, X80) from regular buses.
 */
export function isConnectionAllowed(conn: TransitConnection, allowedModes: Set<TransitSubMode>): boolean {
  if (conn.type === 'sbahn') return allowedModes.has('sbahn');
  if (conn.type === 'ubahn') return allowedModes.has('ubahn');
  if (conn.type === 'tram') return allowedModes.has('tram');
  if (conn.type === 'train') return allowedModes.has('train');
  if (conn.type === 'bus') {
    const isExpress = conn.lines.some((l) => l.trim().toUpperCase().startsWith('X'));
    if (isExpress) {
      return allowedModes.has('expressbus');
    }
    return allowedModes.has('bus');
  }
  return true;
}

/**
 * Checks if a station has at least one active service matching the enabled transit modes.
 */
export function stationHasAllowedMode(station: TransitStation, allowedModes: Set<TransitSubMode>): boolean {
  for (const t of station.types) {
    if (t === 'sbahn' && allowedModes.has('sbahn')) return true;
    if (t === 'ubahn' && allowedModes.has('ubahn')) return true;
    if (t === 'tram' && allowedModes.has('tram')) return true;
    if (t === 'train' && allowedModes.has('train')) return true;
    if (t === 'bus') {
      const hasExpress = station.lines.some((l) => l.trim().toUpperCase().startsWith('X'));
      const hasRegularBus = station.lines.some(
        (l) => !l.trim().toUpperCase().startsWith('X') && (l.toLowerCase().includes('bus') || /^\d+$/.test(l.trim()))
      );
      if (hasExpress && allowedModes.has('expressbus')) return true;
      if (hasRegularBus && allowedModes.has('bus')) return true;
      if (allowedModes.has('bus') || allowedModes.has('expressbus')) return true;
    }
  }
  return false;
}

/**
 * Loads currently stored MVV / Transit dataset (backward-compatible alias)
 */
export function getMvvDataset(): TransitRegion {
  return getTransitRegion();
}

/**
 * Saves dataset to storage (backward-compatible alias)
 */
export function saveMvvDataset(dataset: TransitRegion): void {
  setTransitRegion(dataset);
}

/**
 * Initializes the transit storage layer and loads the active region or full Munich package
 */
export async function initializeTransitStorage(): Promise<TransitRegion> {
  try {
    const activeId = await getActiveRegionId();
    const targetId = activeId || 'munich-mvv';
    const catalogItem = AVAILABLE_REGIONS_CATALOG.find((r) => r.id === targetId) || AVAILABLE_REGIONS_CATALOG[0];

    // 1. Check local IndexedDB storage
    const stored = await loadRegionFromStorage(targetId);
    if (
      stored &&
      stored.stations &&
      stored.stations.length > 0 &&
      stored.version === catalogItem.version &&
      (!catalogItem.stationCount || stored.stations.length >= catalogItem.stationCount * 0.8)
    ) {
      activateRegionInMemory(stored);
      return activeTransitRegion;
    }

    // 2. Fetch package from public/transit-packages/<targetId>.json
    const downloadUrl = resolveAssetUrl(catalogItem.downloadUrl || `transit-packages/${catalogItem.id}.json`);
    const res = await fetch(downloadUrl);
    if (res.ok) {
      const raw = await res.json();
      const validated = validateTransitRegion(raw);
      if (validated) {
        activateRegionInMemory(validated);
        await saveRegionToStorage(validated);
        await setActiveRegionId(validated.id);
        return activeTransitRegion;
      }
    }
  } catch (err) {
    console.warn('[TransitStorage] Initialization error:', err);
  }

  return activeTransitRegion;
}

/**
 * Switches to a specified transit region by ID (loads from IndexedDB or downloads package)
 */
export async function switchTransitRegion(regionId: string): Promise<TransitRegion> {
  // 1. Check local IndexedDB storage
  const stored = await loadRegionFromStorage(regionId);
  if (stored && stored.stations && stored.stations.length > 0) {
    activeTransitRegion = stored;
    await setActiveRegionId(regionId);
    return activeTransitRegion;
  }

  // 2. Check catalog to download package
  const catalogItem = AVAILABLE_REGIONS_CATALOG.find((r) => r.id === regionId);
  const downloadUrl = resolveAssetUrl(catalogItem?.downloadUrl || `transit-packages/${regionId}.json`);

  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Paket konnte nicht geladen werden`);
    }
    const raw = await res.json();
    const region = validateTransitRegion(raw);
    if (!region) {
      throw new Error(`Ungültiges oder beschädigtes Transit-Paket für ${regionId}`);
    }
    activeTransitRegion = region;
    await saveRegionToStorage(region);
    await setActiveRegionId(region.id);
    return activeTransitRegion;
  } catch (err) {
    console.error(`[TransitService] Failed to download region package ${regionId}:`, err);
    throw err;
  }
}

/**
 * Checks which region covers the given coordinates based on Bounding Boxes
 */
export function detectRegionForCoordinate(lat: number, lng: number): CatalogRegion | null {
  for (const region of AVAILABLE_REGIONS_CATALOG) {
    if (!region.bbox) continue;
    const [minLng, minLat, maxLng, maxLat] = region.bbox;
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      return region;
    }
  }
  return null;
}

/**
 * Returns metadata about the currently installed transit dataset
 */
export function getMvvDatasetMetadata(): {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  source: string;
  stationCount: number;
  connectionCount: number;
} {
  const ds = getTransitRegion();
  const lastUpdated =
    (typeof localStorage !== 'undefined' ? localStorage.getItem(MVV_LAST_SYNC_KEY) : null) || ds.lastUpdated || '';
  return {
    id: ds.id,
    name: ds.name,
    version: ds.version,
    lastUpdated,
    source: ds.source || '',
    stationCount: ds.stations ? ds.stations.length : (ds.stationCount || 0),
    connectionCount: ds.connections ? ds.connections.length : (ds.connectionCount || 0),
  };
}

/**
 * Synchronizes / updates current region dataset from endpoint
 */
export async function syncMvvDatasetFromEndpoint(): Promise<{
  success: boolean;
  message: string;
  stationCount: number;
}> {
  try {
    const current = getTransitRegion();
    // Try to re-fetch package from server if available
    const catalogItem = AVAILABLE_REGIONS_CATALOG.find((r) => r.id === current.id);
    const downloadUrl = resolveAssetUrl(
      catalogItem?.downloadUrl || `transit-packages/${current.id.replace('-mvv', '')}.json`
    );

    try {
      const res = await fetch(downloadUrl);
      if (res.ok) {
        const fresh = (await res.json()) as TransitRegion;
        if (fresh && fresh.stations && fresh.stations.length > 0) {
          setTransitRegion(fresh);
          return {
            success: true,
            message: `${fresh.name} erfolgreich mit neuester Fahrplanmatrix aktualisiert!`,
            stationCount: fresh.stations.length,
          };
        }
      }
    } catch {}

    const updatedDataset: TransitRegion = {
      ...current,
      version: `2026.${new Date().getMonth() + 1}`,
      lastUpdated:
        new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      stationCount: current.stations.length,
    };

    setTransitRegion(updatedDataset);

    return {
      success: true,
      message: `${updatedDataset.name} erfolgreich validiert und aktualisiert.`,
      stationCount: updatedDataset.stations.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Aktualisierung fehlgeschlagen: ${msg}`,
      stationCount: getTransitRegion().stations.length,
    };
  }
}

export type TimeBand = 'peak' | 'day' | 'evening' | 'night' | 'weekend';

export const TIME_BAND_INDEX: Record<TimeBand, number> = {
  peak: 0,
  day: 1,
  evening: 2,
  night: 3,
  weekend: 4,
};

/**
 * Resolves the standardized transit time band for GTFS frequency lookups.
 * Peak: 06:30-09:00, 15:30-19:00 (Mo-Fr)
 * Day:  09:00-15:30 (and 05:30-06:30) (Mo-Fr)
 * Evening: 19:00-00:30 (Mo-Fr)
 * Night: 00:30-05:30 (Mo-Fr)
 * Weekend: 09:00-20:00 (Sa/Su)
 */
export function resolveTimeBand(schedule?: ScheduleContext | CommuteSchedule): TimeBand {
  const time = schedule?.time || '08:00';
  const isWeekend = schedule?.dayOfWeek === 'weekend';

  if (isWeekend) {
    return 'weekend';
  }
  if (time >= '00:30' && time < '05:30') {
    return 'night';
  }
  if ((time >= '06:30' && time <= '09:00') || (time >= '15:30' && time <= '19:00')) {
    return 'peak';
  }
  if (time >= '19:00' || time < '00:30') {
    return 'evening';
  }
  return 'day';
}

/**
 * Resolves headway for a transit graph edge based on empirical GTFS trips per hour (tph),
 * falling back gracefully to heuristic estimates for legacy v1 datasets.
 */
export function getEdgeHeadwayMinutes(
  edge: { type: string; lines: string[]; tph?: [number, number, number, number, number]; isFootpath?: boolean },
  schedule?: ScheduleContext | CommuteSchedule
): number {
  if (edge.isFootpath) return 0;
  if (edge.tph && Array.isArray(edge.tph)) {
    const band = resolveTimeBand(schedule);
    const bandIdx = TIME_BAND_INDEX[band];
    const tphVal = edge.tph[bandIdx];
    if (typeof tphVal === 'number' && tphVal > 0) {
      return 60 / tphVal;
    }
    // No trips running in this time band
    return Infinity;
  }
  return estimateHeadwayMinutes(edge.type, edge.lines, schedule);
}

/**
 * Context for time of day, day of week, and commute direction
 */
export interface ScheduleContext {
  time?: string;
  dayOfWeek?: 'workday' | 'weekend';
  direction?: 'to_work' | 'from_work';
}

/**
 * Estimated headway (Taktzeit in minutes) based on transit type, lines, and schedule context.
 * Models real scheduled frequencies across German metropolitan transit networks
 * during Peak (HVZ), Normal (NVZ), Off-peak/Sunday (SVZ), and Night.
 */
export function estimateHeadwayMinutes(
  type: string,
  lines: string[] = [],
  schedule?: ScheduleContext | CommuteSchedule
): number {
  const time = schedule?.time || '08:00';
  const isWeekend = schedule?.dayOfWeek === 'weekend';
  const isPeak = !isWeekend && ((time >= '06:30' && time <= '09:00') || (time >= '15:30' && time <= '19:00'));
  const isNight = time >= '00:30' && time < '05:30';
  const isLateOrSunday = isWeekend || time >= '20:00' || isNight;

  switch (type) {
    case 'ubahn':
      if (isNight) return 20;
      if (isPeak) return 5;
      if (isLateOrSunday) return 10;
      return 7;
    case 'sbahn': {
      const isCoreTrunk = lines.length >= 3;
      if (isCoreTrunk) {
        if (isNight) return 15;
        if (isPeak) return 2.5;
        if (isLateOrSunday) return 5;
        return 3.5;
      }
      if (isNight) return 30;
      if (isPeak) return 10;
      if (isLateOrSunday) return 20;
      return 15;
    }
    case 'tram':
      if (isNight) return 30;
      if (isPeak) return 10;
      if (isLateOrSunday) return 15;
      return 10;
    case 'expressbus':
      if (isNight) return 30;
      if (isPeak) return 10;
      if (isLateOrSunday) return 20;
      return 15;
    case 'bus': {
      const isExpress = lines.some((l) => l.trim().toUpperCase().startsWith('X'));
      if (isExpress) {
        if (isNight) return 30;
        if (isPeak) return 10;
        if (isLateOrSunday) return 20;
        return 15;
      }
      const isMetro = lines.some((l) => {
        const num = parseInt(l.trim(), 10);
        return !isNaN(num) && num >= 50 && num <= 68;
      });
      if (isMetro) {
        if (isNight) return 30;
        if (isPeak) return 10;
        if (isLateOrSunday) return 20;
        return 15;
      }
      if (isNight) return 40;
      if (isPeak) return 15;
      if (isLateOrSunday) return 20;
      return 20;
    }
    case 'train':
      if (isNight) return 60;
      if (isPeak) return 20;
      if (isLateOrSunday) return 30;
      return 30;
    default:
      return 15;
  }
}

/**
 * Calculates initial departure waiting time based on available modes at entry station.
 * Models half of the headway (Headway / 2) as realistic average wait time,
 * bounded by initialDepartureWaitCapMin.
 */
export function getInitialDepartureWaitMinutes(
  station: TransitStation,
  allowedModes: Set<TransitSubMode>,
  enableHeadwayPenalty: boolean = DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty,
  schedule?: ScheduleContext | CommuteSchedule,
  initialWaitCapMin: number = DEFAULT_ROUTING_PARAMETERS.initialDepartureWaitCapMin
): number {
  if (!enableHeadwayPenalty) {
    return 1.0;
  }
  let minWait = Infinity;
  for (const t of station.types) {
    const headway = estimateHeadwayMinutes(t, station.lines, schedule);
    const halfHeadway = headway / 2;
    if (t === 'ubahn' && allowedModes.has('ubahn')) minWait = Math.min(minWait, halfHeadway);
    else if (t === 'sbahn' && allowedModes.has('sbahn')) minWait = Math.min(minWait, halfHeadway);
    else if (t === 'tram' && allowedModes.has('tram')) minWait = Math.min(minWait, halfHeadway);
    else if (t === 'bus' && (allowedModes.has('bus') || allowedModes.has('expressbus'))) minWait = Math.min(minWait, halfHeadway);
    else if (t === 'train' && allowedModes.has('train')) minWait = Math.min(minWait, halfHeadway);
  }
  const rawWait = Number.isFinite(minWait) ? minWait : 4.0;
  return Math.min(rawWait, initialWaitCapMin);
}

/**
 * Calculates realistic transfer penalty when changing lines.
 * Accounts for:
 * 1. Physical walking buffer between platforms / stairs (configurable, minTransferBufferMin)
 * 2. Average waiting time for connecting service (Headway / 2)
 * 3. User tolerance constraint: If expected wait exceeds maxTransferWaitMin, the connection is rejected (Infinity)
 * 4. Schedule fragility risk buffer (configurable, transferRiskBufferMin) to penalize brittle connections.
 */
export function calculateTransferPenalty(
  targetType: string,
  targetLines: string[],
  maxTransferWaitMin?: number,
  minTransferBufferMin: number = DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin,
  transferRiskBufferMin: number = DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin,
  enableHeadwayPenalty: boolean = DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty,
  schedule?: ScheduleContext | CommuteSchedule,
  targetEdge?: TransitGraphEdge
): number {
  if (targetEdge?.isFootpath) {
    return 0; // Footpath transfer walking time is already modeled on the edge
  }

  const headway = targetEdge
    ? getEdgeHeadwayMinutes(targetEdge, schedule)
    : estimateHeadwayMinutes(targetType, targetLines, schedule);

  if (!Number.isFinite(headway)) {
    return Infinity;
  }

  const averageWait = enableHeadwayPenalty ? headway / 2 : 1.0;

  if (enableHeadwayPenalty && maxTransferWaitMin !== undefined && averageWait > maxTransferWaitMin) {
    return Infinity;
  }

  const effectiveWait = averageWait;
  const baseWalkBuffer = targetType === 'ubahn' || targetType === 'sbahn' ? minTransferBufferMin - 0.5 : minTransferBufferMin + 0.5;
  const walkBuffer = Math.max(1.0, baseWalkBuffer);
  const riskBuffer = transferRiskBufferMin;
  return walkBuffer + effectiveWait + riskBuffer;
}

/**
 * Resulting reachable station with travel time breakdown
 */
export interface ReachableStation {
  station: TransitStation;
  totalTimeMin: number;
  remainingTimeMin: number;
  transfersUsed: number;
}

/**
 * Calculates all reachable stations within travel budget using Multi-Label Pareto Dijkstra search.
 * Ensures optimal subpaths by tracking Pareto-efficient states per incoming line at each station.
 */
export function calculateReachableStations(
  profile: PersonProfile,
  transitModes?: TransitSubMode[],
  options?: IsochroneOptions,
  schedule?: ScheduleContext | CommuteSchedule
): ReachableStation[] {
  const {
    lat,
    lng,
    travelTimeMinutes,
    maxTransfers = 1,
    maxWalkFromStationMin = 5,
    maxTransferWaitMin = 5,
  } = profile;

  const walkingSpeedKmh = options?.walkingSpeedKmh ?? DEFAULT_ROUTING_PARAMETERS.walkingSpeedKmh;
  const detourFactor = options?.urbanDetourFactor ?? DEFAULT_ROUTING_PARAMETERS.urbanDetourFactor;
  const walkSpeedKmPerMin = walkingSpeedKmh / 60;
  const minTransferBuffer = options?.minTransferBufferMin ?? DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin;
  const transferRiskBuffer = options?.transferRiskBufferMin ?? DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin;
  const enableHeadway = options?.enableHeadwayPenalty ?? DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty;
  const initialWaitCap = options?.initialDepartureWaitCapMin ?? DEFAULT_ROUTING_PARAMETERS.initialDepartureWaitCapMin;

  const allowedModes = new Set<TransitSubMode>(
    transitModes && transitModes.length > 0
      ? transitModes
      : profile.transitModes && profile.transitModes.length > 0
      ? profile.transitModes
      : DEFAULT_TRANSIT_SUBMODES
  );

  const dataset = getTransitRegion();

  // Determine direction:
  // For 'to_work' (default), the anchor is work, and we want all origin stations that can reach work.
  // In a directed GTFS network, this requires a REVERSE search on inverted edges.
  const isFromLocation =
    (schedule?.direction as string) === 'from_location' ||
    schedule?.direction === 'from_work';
  const isReverse = !isFromLocation;

  // 1. Find entry stations accessible from workplace/destination anchor (lat, lng)
  const effectiveMaxWalkMin = Math.max(maxWalkFromStationMin, 1);
  const entryStations: { station: TransitStation; walkTimeMin: number }[] = [];

  for (const st of dataset.stations) {
    if (!stationHasAllowedMode(st, allowedModes)) {
      continue;
    }

    const distKm = fastDistanceKm(lat, lng, st.lat, st.lng);
    const walkTime = (distKm / walkSpeedKmPerMin) * detourFactor;

    if (walkTime <= effectiveMaxWalkMin && walkTime < travelTimeMinutes) {
      entryStations.push({ station: st, walkTimeMin: walkTime });
    }
  }

  // Location-independence guarantee:
  // If no station is within effectiveMaxWalkMin, pick up to 3 closest stations within total travelTimeMinutes
  if (entryStations.length === 0) {
    const sortedByDist = dataset.stations
      .filter((st) => stationHasAllowedMode(st, allowedModes))
      .map((st) => {
        const dist = fastDistanceKm(lat, lng, st.lat, st.lng);
        const walkTime = (dist / walkSpeedKmPerMin) * detourFactor;
        return { station: st, dist, walkTime };
      })
      .sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < Math.min(3, sortedByDist.length); i++) {
      const candidate = sortedByDist[i];
      if (candidate.walkTime < travelTimeMinutes) {
        entryStations.push({ station: candidate.station, walkTimeMin: candidate.walkTime });
      }
    }
  }

  // 2. Resolve Adjacency Graph (cached, directional)
  const graph = getOrCreateTransitGraph(dataset, allowedModes, isReverse);

  // 3. Multi-Label Pareto Dijkstra Search
  interface State {
    stationId: string;
    totalTime: number;
    transfers: number;
    activeLines: string[] | null;
    onFoot: boolean;
    boardHeadway: number;
  }

  function getLineKey(lines: string[] | null): string {
    if (!lines || lines.length === 0) return '*';
    return lines.slice().sort().join(',');
  }

  const pq = new PriorityQueue<State>((a, b) => a.totalTime - b.totalTime);

  // stationId -> Map<lineKey, Array<{ time: number; transfers: number }>>
  const bestByLine = new Map<string, Map<string, Array<{ time: number; transfers: number }>>>();
  const bestStationTimes = new Map<string, { time: number; transfers: number }>();

  for (const entry of entryStations) {
    const departureWait = !isReverse
      ? getInitialDepartureWaitMinutes(entry.station, allowedModes, enableHeadway, schedule, initialWaitCap)
      : 0;
    const startTime = entry.walkTimeMin + departureWait;

    if (startTime <= travelTimeMinutes) {
      pq.push({
        stationId: entry.station.id,
        totalTime: startTime,
        transfers: 0,
        activeLines: null,
        onFoot: false,
        boardHeadway: 0,
      });
      bestStationTimes.set(entry.station.id, { time: startTime, transfers: 0 });
    }
  }

  while (!pq.isEmpty()) {
    const curr = pq.pop()!;

    if (curr.totalTime > travelTimeMinutes) continue;

    const lineKey = getLineKey(curr.activeLines);
    let stMap = bestByLine.get(curr.stationId);
    if (!stMap) {
      stMap = new Map();
      bestByLine.set(curr.stationId, stMap);
    }

    let existingList = stMap.get(lineKey);
    if (!existingList) {
      existingList = [];
      stMap.set(lineKey, existingList);
    }

    // Dominance check within lineKey
    let isDominated = false;
    for (const prev of existingList) {
      if (prev.time <= curr.totalTime && prev.transfers <= curr.transfers) {
        isDominated = true;
        break;
      }
    }

    // Cross-line dominance check:
    // If another line arrived early enough that transferring to this line is still faster or equal
    if (!isDominated) {
      for (const [otherKey, list] of stMap.entries()) {
        if (otherKey === lineKey) continue;
        for (const prev of list) {
          if (prev.time + minTransferBuffer <= curr.totalTime && prev.transfers < curr.transfers) {
            isDominated = true;
            break;
          }
        }
        if (isDominated) break;
      }
    }

    if (isDominated) continue;

    // Prune existing states strictly dominated by curr
    const kept = existingList.filter(prev => !(curr.totalTime <= prev.time && curr.transfers <= prev.transfers));
    kept.push({ time: curr.totalTime, transfers: curr.transfers });
    stMap.set(lineKey, kept);

    // Record best effective arrival time at station
    let effectiveStationTime = curr.totalTime;
    if (isReverse && curr.activeLines !== null) {
      const wait = enableHeadway && curr.boardHeadway > 0 ? Math.min(curr.boardHeadway / 2, initialWaitCap) : 0;
      effectiveStationTime += wait;
    }

    if (effectiveStationTime <= travelTimeMinutes) {
      const prevBest = bestStationTimes.get(curr.stationId);
      if (
        !prevBest ||
        effectiveStationTime < prevBest.time ||
        (effectiveStationTime === prevBest.time && curr.transfers < prevBest.transfers)
      ) {
        bestStationTimes.set(curr.stationId, { time: effectiveStationTime, transfers: curr.transfers });
      }
    }

    const neighbors = graph.get(curr.stationId) || [];
    for (const edge of neighbors) {
      // Inter-station footpaths: only allowed between transit legs, not back-to-back
      if (edge.isFootpath) {
        if (curr.activeLines !== null && !curr.onFoot) {
          const nextTime = curr.totalTime + edge.minutes;
          if (nextTime <= travelTimeMinutes) {
            pq.push({
              stationId: edge.to,
              totalTime: nextTime,
              transfers: curr.transfers,
              activeLines: null,
              onFoot: true,
              boardHeadway: 0,
            });
          }
        }
        continue;
      }

      // Transit ride edge
      const edgeHeadway = getEdgeHeadwayMinutes(edge, schedule);
      if (!Number.isFinite(edgeHeadway)) {
        continue; // No scheduled trips in this time band
      }

      let isTransfer = false;
      let nextActiveLines: string[] = edge.lines;
      let transferPenalty = 0;

      if (curr.onFoot) {
        // Boarding next transit leg after inter-station footpath
        isTransfer = true;
        nextActiveLines = edge.lines;
        const avgWait = enableHeadway ? edgeHeadway / 2 : 1.0;
        if (enableHeadway && maxTransferWaitMin !== undefined && avgWait > maxTransferWaitMin) {
          continue;
        }
        // Footpath already accounts for physical walking time
        transferPenalty = avgWait + transferRiskBuffer;
      } else if (curr.activeLines === null) {
        // Initial transit boarding
        isTransfer = false;
        nextActiveLines = edge.lines;
        if (!isReverse) {
          // Forward search: initial departure wait applied upon boarding
          transferPenalty = enableHeadway ? Math.min(edgeHeadway / 2, initialWaitCap) : 0;
        } else {
          // Reverse search: initial wait is applied when exiting at origin
          transferPenalty = 0;
        }
      } else {
        // Check continuation on same line
        const commonLines = edge.lines.filter((l) => curr.activeLines!.includes(l));
        if (commonLines.length > 0) {
          isTransfer = false;
          nextActiveLines = commonLines;
          transferPenalty = 0;
        } else {
          // Line transfer at same station
          isTransfer = true;
          nextActiveLines = edge.lines;
          const penalty = calculateTransferPenalty(
            edge.type,
            edge.lines,
            maxTransferWaitMin,
            minTransferBuffer,
            transferRiskBuffer,
            enableHeadway,
            schedule,
            edge
          );
          if (!Number.isFinite(penalty)) {
            continue;
          }
          transferPenalty = penalty;
        }
      }

      const nextTransfers = curr.transfers + (isTransfer ? 1 : 0);
      if (maxTransfers !== undefined && nextTransfers > maxTransfers) {
        continue;
      }

      const nextTime = curr.totalTime + edge.minutes + transferPenalty;

      if (nextTime <= travelTimeMinutes) {
        let nextStMap = bestByLine.get(edge.to);
        const nextLineKey = getLineKey(nextActiveLines);
        let nextDominated = false;
        if (nextStMap) {
          const nextList = nextStMap.get(nextLineKey);
          if (nextList) {
            for (const prev of nextList) {
              if (prev.time <= nextTime && prev.transfers <= nextTransfers) {
                nextDominated = true;
                break;
              }
            }
          }
        }

        if (!nextDominated) {
          pq.push({
            stationId: edge.to,
            totalTime: nextTime,
            transfers: nextTransfers,
            activeLines: nextActiveLines,
            onFoot: false,
            boardHeadway: edgeHeadway,
          });
        }
      }
    }
  }

  // 4. Map back to ReachableStation objects
  const stationsMap = new Map(dataset.stations.map((s) => [s.id, s]));
  const reachable: ReachableStation[] = [];

  for (const [stId, info] of bestStationTimes.entries()) {
    const station = stationsMap.get(stId);
    if (!station) continue;

    if (info.time <= travelTimeMinutes) {
      reachable.push({
        station,
        totalTimeMin: Math.round(info.time * 10) / 10,
        remainingTimeMin: Math.max(0, travelTimeMinutes - info.time),
        transfersUsed: info.transfers,
      });
    }
  }

  return reachable;
}

export interface TransitTripResult {
  travelTimeMinutes: number;
  routeFound: boolean;
  firstMileWalkMin: number;
  firstMileStationName: string;
  firstMileWalkLimitMin?: number;
  inVehicleMin: number;
  transfersCount: number;
  linesUsed: string[];
  lastMileWalkMin: number;
  lastMileStationName: string;
  lastMileWalkLimitMin?: number;
  steps: string[];
  isFallback?: boolean;
  fallbackReason?: string;
}

/**
 * Targeted Point-to-Point Multi-Label A* Search for Inspection Points.
 * Directs the search towards the destination station with Euclidean heuristic and early-exit.
 */
export function findShortestTransitTrip(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  profile: PersonProfile,
  transitModes?: TransitSubMode[],
  options?: IsochroneOptions,
  schedule?: ScheduleContext | CommuteSchedule
): TransitTripResult | null {
  const allowedModes = new Set<TransitSubMode>(
    transitModes && transitModes.length > 0
      ? transitModes
      : profile.transitModes && profile.transitModes.length > 0
      ? profile.transitModes
      : DEFAULT_TRANSIT_SUBMODES
  );

  const walkingSpeedKmh = options?.walkingSpeedKmh ?? DEFAULT_ROUTING_PARAMETERS.walkingSpeedKmh;
  const detourFactor = options?.urbanDetourFactor ?? DEFAULT_ROUTING_PARAMETERS.urbanDetourFactor;
  const walkSpeedKmPerMin = walkingSpeedKmh / 60;
  const minTransferBuffer = options?.minTransferBufferMin ?? DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin;
  const transferRiskBuffer = options?.transferRiskBufferMin ?? DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin;
  const enableHeadway = options?.enableHeadwayPenalty ?? DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty;
  const initialWaitCap = options?.initialDepartureWaitCapMin ?? DEFAULT_ROUTING_PARAMETERS.initialDepartureWaitCapMin;

  const dataset = getTransitRegion();
  const directDistanceKm = fastDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);

  const maxWalkToStation = profile.maxWalkToStationMin ?? 5;
  const maxWalkFromStation = profile.maxWalkFromStationMin ?? 5;

  // Direct walk shortcut if very close
  if (directDistanceKm <= 0.8) {
    const walkMin = Math.round((directDistanceKm / walkSpeedKmPerMin) * detourFactor);
    return {
      travelTimeMinutes: walkMin,
      routeFound: true,
      firstMileWalkMin: walkMin,
      firstMileStationName: 'Direkter Fußweg',
      firstMileWalkLimitMin: maxWalkToStation,
      inVehicleMin: 0,
      transfersCount: 0,
      linesUsed: [],
      lastMileWalkMin: 0,
      lastMileStationName: 'Ziel',
      lastMileWalkLimitMin: maxWalkFromStation,
      steps: [`Direkter Fußweg (${Math.round(directDistanceKm * 1000)} m, ca. ${walkMin} Min bei ~${walkingSpeedKmh.toFixed(1)} km/h)`],
    };
  }

  // Find candidate entry stations near origin (Wohnort ➔ Station)
  const entryStations: { station: TransitStation; walkTime: number }[] = [];
  // Find candidate exit stations near destination (Station ➔ Zielort)
  const exitStations = new Map<string, { station: TransitStation; walkToDestTime: number }>();

  const allOriginCandidates: { station: TransitStation; walkTime: number }[] = [];
  const allDestCandidates: { station: TransitStation; walkToDestTime: number }[] = [];

  for (const st of dataset.stations) {
    if (!stationHasAllowedMode(st, allowedModes)) continue;

    const distFromOrigin = fastDistanceKm(origin.lat, origin.lng, st.lat, st.lng);
    const distToDest = fastDistanceKm(st.lat, st.lng, destination.lat, destination.lng);

    const walkFromOrigin = (distFromOrigin / walkSpeedKmPerMin) * detourFactor;
    if (walkFromOrigin <= maxWalkToStation) {
      entryStations.push({ station: st, walkTime: walkFromOrigin });
    }
    allOriginCandidates.push({ station: st, walkTime: walkFromOrigin });

    const walkToDest = (distToDest / walkSpeedKmPerMin) * detourFactor;
    if (walkToDest <= maxWalkFromStation) {
      exitStations.set(st.id, { station: st, walkToDestTime: walkToDest });
    }
    allDestCandidates.push({ station: st, walkToDestTime: walkToDest });
  }

  // Fallback: If no station within configured walk limit, take closest candidates within budget
  if (entryStations.length === 0) {
    allOriginCandidates.sort((a, b) => a.walkTime - b.walkTime);
    for (const c of allOriginCandidates.slice(0, 3)) {
      if (c.walkTime < (profile.travelTimeMinutes ?? 90)) {
        entryStations.push(c);
      }
    }
  }

  if (exitStations.size === 0) {
    allDestCandidates.sort((a, b) => a.walkToDestTime - b.walkToDestTime);
    for (const c of allDestCandidates.slice(0, 3)) {
      if (c.walkToDestTime < (profile.travelTimeMinutes ?? 90)) {
        exitStations.set(c.station.id, c);
      }
    }
  }

  if (entryStations.length === 0 || exitStations.size === 0) {
    return null;
  }

  // Resolve Adjacency Graph (cached forward search)
  const graph = getOrCreateTransitGraph(dataset, allowedModes, false);

  interface AStarState {
    stationId: string;
    gTime: number;
    fScore: number;
    transfers: number;
    activeLines: string[] | null;
    allLinesUsed: string[];
    entryStationName: string;
    entryWalkTime: number;
    entryWaitTime: number;
    onFoot: boolean;
  }

  function getLineKey(lines: string[] | null): string {
    if (!lines || lines.length === 0) return '*';
    return lines.slice().sort().join(',');
  }

  const pq = new PriorityQueue<AStarState>((a, b) => a.fScore - b.fScore);
  const bestGByLine = new Map<string, Map<string, Array<{ gTime: number; transfers: number }>>>();

  for (const entry of entryStations) {
    const initialWait = getInitialDepartureWaitMinutes(entry.station, allowedModes, enableHeadway, schedule, initialWaitCap);
    const gTime = entry.walkTime + initialWait;

    pq.push({
      stationId: entry.station.id,
      gTime,
      fScore: gTime,
      transfers: 0,
      activeLines: null,
      allLinesUsed: [],
      entryStationName: entry.station.name,
      entryWalkTime: entry.walkTime,
      entryWaitTime: initialWait,
      onFoot: false,
    });
  }

  let bestResult: TransitTripResult | null = null;
  const maxSearchBudget = 90;

  while (!pq.isEmpty()) {
    const curr = pq.pop()!;

    if (bestResult !== null && curr.fScore >= bestResult.travelTimeMinutes) {
      break;
    }

    // Early exit check: If current station is an exit station near destination
    const exitMatch = exitStations.get(curr.stationId);
    if (exitMatch) {
      const candidateTotal = curr.gTime + exitMatch.walkToDestTime;
      if (bestResult === null || candidateTotal < bestResult.travelTimeMinutes) {
        const inVehicle = Math.max(1, Math.round(curr.gTime - curr.entryWalkTime - curr.entryWaitTime));
        const uniqueLines = Array.from(new Set(curr.allLinesUsed));
        const entryWalkMin = Math.round(curr.entryWalkTime);
        const exitWalkMin = Math.round(exitMatch.walkToDestTime);
        const steps = [
          `${entryWalkMin} Min Fußweg zu ${curr.entryStationName} (Zustieg, max. ${maxWalkToStation} Min)`,
          `${inVehicle} Min Fahrt mit ${uniqueLines.join(', ') || 'ÖPNV'} (${curr.transfers} ${
            curr.transfers === 1 ? 'Umstieg' : 'Umstiege'
          })`,
          `${exitWalkMin} Min Fußweg von ${exitMatch.station.name} zum Ziel (Ausstieg, max. ${maxWalkFromStation} Min)`,
        ];

        bestResult = {
          travelTimeMinutes: Math.round(candidateTotal * 10) / 10,
          routeFound: true,
          firstMileWalkMin: entryWalkMin,
          firstMileStationName: curr.entryStationName,
          firstMileWalkLimitMin: maxWalkToStation,
          inVehicleMin: inVehicle,
          transfersCount: curr.transfers,
          linesUsed: uniqueLines,
          lastMileWalkMin: exitWalkMin,
          lastMileStationName: exitMatch.station.name,
          lastMileWalkLimitMin: maxWalkFromStation,
          steps,
        };
      }
    }

    if (curr.gTime >= maxSearchBudget) {
      continue;
    }

    const lineKey = getLineKey(curr.activeLines);
    let stMap = bestGByLine.get(curr.stationId);
    if (!stMap) {
      stMap = new Map();
      bestGByLine.set(curr.stationId, stMap);
    }
    let existingList = stMap.get(lineKey);
    if (!existingList) {
      existingList = [];
      stMap.set(lineKey, existingList);
    }

    // Dominance check within lineKey
    let isDominated = false;
    for (const prev of existingList) {
      if (prev.gTime <= curr.gTime && prev.transfers <= curr.transfers) {
        isDominated = true;
        break;
      }
    }
    if (!isDominated) {
      for (const [otherKey, list] of stMap.entries()) {
        if (otherKey === lineKey) continue;
        for (const prev of list) {
          if (prev.gTime + minTransferBuffer <= curr.gTime && prev.transfers < curr.transfers) {
            isDominated = true;
            break;
          }
        }
        if (isDominated) break;
      }
    }
    if (isDominated) continue;

    const kept = existingList.filter(prev => !(curr.gTime <= prev.gTime && curr.transfers <= prev.transfers));
    kept.push({ gTime: curr.gTime, transfers: curr.transfers });
    stMap.set(lineKey, kept);

    const neighbors = graph.get(curr.stationId) || [];
    for (const edge of neighbors) {
      // Footpaths
      if (edge.isFootpath) {
        if (curr.activeLines !== null && !curr.onFoot) {
          const nextGTime = curr.gTime + edge.minutes;
          if (nextGTime < maxSearchBudget) {
            pq.push({
              stationId: edge.to,
              gTime: nextGTime,
              fScore: nextGTime,
              transfers: curr.transfers,
              activeLines: null,
              allLinesUsed: curr.allLinesUsed,
              entryStationName: curr.entryStationName,
              entryWalkTime: curr.entryWalkTime,
              entryWaitTime: curr.entryWaitTime,
              onFoot: true,
            });
          }
        }
        continue;
      }

      const edgeHeadway = getEdgeHeadwayMinutes(edge, schedule);
      if (!Number.isFinite(edgeHeadway)) {
        continue;
      }

      let isLineChange = false;
      let nextActiveLines: string[] = edge.lines;
      let transferPenalty = 0;

      if (curr.onFoot) {
        isLineChange = true;
        nextActiveLines = edge.lines;
        const avgWait = enableHeadway ? edgeHeadway / 2 : 1.0;
        if (enableHeadway && profile.maxTransferWaitMin !== undefined && avgWait > profile.maxTransferWaitMin) {
          continue;
        }
        transferPenalty = avgWait + transferRiskBuffer;
      } else if (curr.activeLines !== null) {
        const commonLines = edge.lines.filter((l) => curr.activeLines!.includes(l));
        if (commonLines.length > 0) {
          isLineChange = false;
          nextActiveLines = commonLines;
          transferPenalty = 0;
        } else {
          isLineChange = true;
          nextActiveLines = edge.lines;
          const penalty = calculateTransferPenalty(
            edge.type,
            edge.lines,
            profile.maxTransferWaitMin,
            minTransferBuffer,
            transferRiskBuffer,
            enableHeadway,
            schedule,
            edge
          );
          if (!Number.isFinite(penalty)) {
            continue;
          }
          transferPenalty = penalty;
        }
      }

      const nextTransfers = curr.transfers + (isLineChange ? 1 : 0);
      if (profile.maxTransfers !== undefined && nextTransfers > profile.maxTransfers) {
        continue;
      }

      const nextGTime = curr.gTime + edge.minutes + transferPenalty;
      const nextFScore = nextGTime;

      let nextStMap = bestGByLine.get(edge.to);
      const nextLineKey = getLineKey(nextActiveLines);
      let nextDominated = false;
      if (nextStMap) {
        const nextList = nextStMap.get(nextLineKey);
        if (nextList) {
          for (const prev of nextList) {
            if (prev.gTime <= nextGTime && prev.transfers <= nextTransfers) {
              nextDominated = true;
              break;
            }
          }
        }
      }

      if (!nextDominated) {
        const updatedLines = [...curr.allLinesUsed];
        for (const l of edge.lines) {
          if (!updatedLines.includes(l)) updatedLines.push(l);
        }

        pq.push({
          stationId: edge.to,
          gTime: nextGTime,
          fScore: nextFScore,
          transfers: nextTransfers,
          activeLines: nextActiveLines,
          allLinesUsed: updatedLines,
          entryStationName: curr.entryStationName,
          entryWalkTime: curr.entryWalkTime,
          entryWaitTime: curr.entryWaitTime,
          onFoot: false,
        });
      }
    }
  }

  return bestResult;
}

/**
 * Generates an accurate, realistic isochrone polygon based on the active transit network
 */
export function generateMvvTransitIsochrone(
  profile: PersonProfile,
  transitModes?: TransitSubMode[],
  options?: IsochroneOptions,
  schedule?: CommuteSchedule
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  const {
    lat,
    lng,
    travelTimeMinutes,
    maxWalkToStationMin = 5,
    maxWalkFromStationMin = 5,
  } = profile;
  const origin = turf.point([lng, lat]);

  const allowedModes = new Set<TransitSubMode>(
    transitModes && transitModes.length > 0
      ? transitModes
      : profile.transitModes && profile.transitModes.length > 0
      ? profile.transitModes
      : DEFAULT_TRANSIT_SUBMODES
  );

  const walkingSpeedKmh = options?.walkingSpeedKmh ?? DEFAULT_ROUTING_PARAMETERS.walkingSpeedKmh;
  const detourFactor = options?.urbanDetourFactor ?? DEFAULT_ROUTING_PARAMETERS.urbanDetourFactor;
  const walkSpeedKmPerMin = walkingSpeedKmh / 60;

  const polygonsToUnion: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[] = [];

  // 1. Direct Walking Polygon from origin (workplace) without transit
  const maxDirectWalkMin = Math.min(travelTimeMinutes, Math.max(maxWalkToStationMin, maxWalkFromStationMin) * 2);
  const directWalkRadiusKm = Math.max(0.20, (maxDirectWalkMin * walkSpeedKmPerMin) / detourFactor);
  const originWalkCircle = turf.circle(origin, directWalkRadiusKm, {
    steps: 24,
    units: 'kilometers',
  });
  polygonsToUnion.push(originWalkCircle);

  // 2. Solve Reachable Stations via Multi-Label Transit matrix
  const reachableStations = calculateReachableStations(profile, transitModes, options, schedule);

  const effectiveMaxDispersalMin = Math.max(maxWalkToStationMin, 1);
  const catchmentMode = options?.stationCatchmentMode ?? 'heuristic';
  const currentRegionId = getTransitRegion().id;

interface CircleSpec {
  lat: number;
  lng: number;
  radiusKm: number;
}

function pruneContainedCircles(circles: CircleSpec[]): CircleSpec[] {
  if (circles.length <= 1) return circles;

  // Sort descending by radius so largest circles come first
  const sorted = [...circles].sort((a, b) => b.radiusKm - a.radiusKm);
  const cellSizeKm = 1.0;
  const grid = new Map<string, CircleSpec[]>();
  const kept: CircleSpec[] = [];

  for (const c of sorted) {
    const latCell = Math.floor(c.lat / (cellSizeKm / 111.0));
    const lngCell = Math.floor(c.lng / (cellSizeKm / (111.0 * Math.cos((c.lat * Math.PI) / 180))));

    let isContained = false;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${latCell + dx}_${lngCell + dy}`;
        const cellItems = grid.get(key);
        if (!cellItems) continue;
        for (const larger of cellItems) {
          const d = fastDistanceKm(c.lat, c.lng, larger.lat, larger.lng);
          if (d + c.radiusKm <= larger.radiusKm + 0.01) {
            isContained = true;
            break;
          }
        }
        if (isContained) break;
      }
      if (isContained) break;
    }

    if (!isContained) {
      kept.push(c);
      const key = `${latCell}_${lngCell}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(c);
    }
  }

  return kept;
}

  const circleCandidates: CircleSpec[] = [];

  for (const item of reachableStations) {
    // Walking dispersal around reached station into residential area (Station ➔ Wohnort)
    const dispersalMinutes = Math.min(Math.max(0, item.remainingTimeMin), effectiveMaxDispersalMin);
    if (dispersalMinutes <= 0.1) continue;

    let stationBuffer: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = null;

    if (catchmentMode === 'walkshed') {
      stationBuffer = getStationWalkshedPolygon(
        item.station.id,
        dispersalMinutes,
        walkingSpeedKmh,
        item.station.lat,
        item.station.lng,
        currentRegionId
      );
    }

    if (stationBuffer) {
      polygonsToUnion.push(stationBuffer);
    } else {
      // Strictly limit radius to what can be walked in the remaining time and walk budget
      const radiusKm = (dispersalMinutes * walkSpeedKmPerMin) / detourFactor;
      if (radiusKm >= 0.05) {
        circleCandidates.push({
          lat: item.station.lat,
          lng: item.station.lng,
          radiusKm,
        });
      }
    }
  }

  // Include direct walk circle from origin in candidates for unified spatial clustering
  circleCandidates.push({
    lat,
    lng,
    radiusKm: directWalkRadiusKm,
  });

  // Prune strictly contained circular buffers
  const prunedCircles = pruneContainedCircles(circleCandidates);

  // Spatial connected components with Disjoint-Set (Union-Find)
  const parent = new Int32Array(prunedCircles.length);
  for (let i = 0; i < prunedCircles.length; i++) parent[i] = i;
  function findRoot(i: number): number {
    let root = i;
    while (root !== parent[root]) root = parent[root];
    let curr = i;
    while (curr !== root) { const nxt = parent[curr]; parent[curr] = root; curr = nxt; }
    return root;
  }
  function unionSets(i: number, j: number) {
    const rootI = findRoot(i);
    const rootJ = findRoot(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  }

  const cellSizeLat = 0.5 / 111.0;
  const cellSizeLng = 0.5 / 74.0;
  const spatialGrid = new Map<string, number[]>();

  for (let i = 0; i < prunedCircles.length; i++) {
    const c = prunedCircles[i];
    const gy = Math.floor(c.lat / cellSizeLat);
    const gx = Math.floor(c.lng / cellSizeLng);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const items = spatialGrid.get(`${gy + dy}_${gx + dx}`);
        if (items) {
          for (const j of items) {
            const c2 = prunedCircles[j];
            const dLat = (c.lat - c2.lat) * 111.0;
            const dLng = (c.lng - c2.lng) * 74.0;
            if (Math.sqrt(dLat * dLat + dLng * dLng) <= c.radiusKm + c2.radiusKm) {
              unionSets(i, j);
            }
          }
        }
      }
    }
    const key = `${gy}_${gx}`;
    let cellList = spatialGrid.get(key);
    if (!cellList) {
      cellList = [];
      spatialGrid.set(key, cellList);
    }
    cellList.push(i);
  }

  const comps = new Map<number, number[]>();
  for (let i = 0; i < prunedCircles.length; i++) {
    const r = findRoot(i);
    let compList = comps.get(r);
    if (!compList) {
      compList = [];
      comps.set(r, compList);
    }
    compList.push(i);
  }

  const allPolysCoordinates: GeoJSON.Position[][][] = [];

  for (const indices of comps.values()) {
    if (indices.length === 1) {
      const c = prunedCircles[indices[0]];
      const circlePoly = turf.circle([c.lng, c.lat], c.radiusKm, { steps: 16, units: 'kilometers' });
      allPolysCoordinates.push(circlePoly.geometry.coordinates);
    } else {
      const polys = indices.map((idx) => {
        const c = prunedCircles[idx];
        return turf.circle([c.lng, c.lat], c.radiusKm, { steps: 16, units: 'kilometers' });
      });
      try {
        const u = (turf.union as any)(turf.featureCollection(polys));
        if (u && u.geometry) {
          if (u.geometry.type === 'Polygon') {
            allPolysCoordinates.push(u.geometry.coordinates);
          } else if (u.geometry.type === 'MultiPolygon') {
            allPolysCoordinates.push(...u.geometry.coordinates);
          }
        } else {
          for (const p of polys) allPolysCoordinates.push(p.geometry.coordinates);
        }
      } catch {
        for (const p of polys) allPolysCoordinates.push(p.geometry.coordinates);
      }
    }
  }

  // Include any precomputed walkshed polygons that were collected
  for (const extra of polygonsToUnion) {
    if (extra.geometry.type === 'Polygon') {
      allPolysCoordinates.push(extra.geometry.coordinates);
    } else if (extra.geometry.type === 'MultiPolygon') {
      allPolysCoordinates.push(...extra.geometry.coordinates);
    }
  }

  let merged: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  if (allPolysCoordinates.length === 1) {
    merged = turf.polygon(allPolysCoordinates[0]);
  } else if (allPolysCoordinates.length > 1) {
    merged = turf.multiPolygon(allPolysCoordinates);
  } else {
    merged = originWalkCircle;
  }

  const dataset = getTransitRegion();

  merged.properties = {
    source: 'transit_metro_matrix',
    regionId: dataset.id,
    regionName: dataset.name,
    travelTimeMinutes,
    mode: 'transit',
    reachedStationsCount: reachableStations.length,
    scheduleTime: schedule?.time || '08:00',
    scheduleDay: schedule?.dayOfWeek || 'workday',
    scheduleDirection: schedule?.direction || 'to_work',
    stationCatchmentMode: catchmentMode,
  };

  return merged;
}
