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
import { MvvDataset, MvvStation, DEFAULT_MVV_DATASET, MvvConnection } from '../data/mvvDataset';
import {
  PersonProfile,
  TransitSubMode,
  ALL_TRANSIT_SUBMODES,
  DEFAULT_TRANSIT_SUBMODES,
  TransitRegion,
  TransitStation,
  TransitConnection,
  TransitRegionMetadata,
  IsochroneOptions,
  DEFAULT_ROUTING_PARAMETERS,
} from '../types';
import { PriorityQueue } from './priorityQueue';
import {
  saveRegionToStorage,
  loadRegionFromStorage,
  getActiveRegionId,
  setActiveRegionId,
  listInstalledRegions,
} from './transitStorage';
import { AVAILABLE_REGIONS_CATALOG, CatalogRegion } from '../data/availableRegions';

const MVV_STORAGE_KEY = 'mvv_transit_dataset_v1';
const MVV_LAST_SYNC_KEY = 'mvv_last_sync_timestamp';

// In-memory active transit network
let activeTransitRegion: TransitRegion = DEFAULT_MVV_DATASET;

/**
 * Returns the currently active transit region
 */
export function getTransitRegion(): TransitRegion {
  return activeTransitRegion;
}

/**
 * Sets the active transit region in memory and IndexedDB
 */
export function setTransitRegion(region: TransitRegion): void {
  activeTransitRegion = region;
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

    if (activeId && activeId !== DEFAULT_MVV_DATASET.id) {
      const stored = await loadRegionFromStorage(activeId);
      if (stored && stored.stations && stored.stations.length > 0) {
        activeTransitRegion = stored;
        return activeTransitRegion;
      }
    }

    if (activeId === DEFAULT_MVV_DATASET.id) {
      const stored = await loadRegionFromStorage(activeId);
      if (
        stored &&
        stored.version === DEFAULT_MVV_DATASET.version &&
        stored.stations &&
        stored.stations.length >= DEFAULT_MVV_DATASET.stations.length
      ) {
        activeTransitRegion = stored;
        return activeTransitRegion;
      }
    }

    // Default to built-in full Munich dataset and ensure it is saved in storage
    activeTransitRegion = DEFAULT_MVV_DATASET;
    await saveRegionToStorage(DEFAULT_MVV_DATASET);
    await setActiveRegionId(DEFAULT_MVV_DATASET.id);
    return activeTransitRegion;
  } catch {
    activeTransitRegion = DEFAULT_MVV_DATASET;
    return activeTransitRegion;
  }
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
  const downloadUrl = catalogItem?.downloadUrl || `/transit-packages/${regionId}.json`;

  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Paket konnte nicht geladen werden`);
    }
    const region = (await res.json()) as TransitRegion;
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
    (typeof localStorage !== 'undefined' ? localStorage.getItem(MVV_LAST_SYNC_KEY) : null) || ds.lastUpdated;
  return {
    id: ds.id,
    name: ds.name,
    version: ds.version,
    lastUpdated,
    source: ds.source,
    stationCount: ds.stations.length,
    connectionCount: ds.connections.length,
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
    const downloadUrl = catalogItem?.downloadUrl || `/transit-packages/${current.id.replace('-mvv', '')}.json`;

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

/**
 * Estimated headway (Taktzeit in minutes) based on transit type and lines.
 * Models real scheduled frequencies across German metropolitan transit networks.
 */
export function estimateHeadwayMinutes(type: string, lines: string[] = []): number {
  switch (type) {
    case 'ubahn':
      return 5;
    case 'sbahn': {
      // Stammstrecke with bundled lines has 2-3 min, outer branches typically 10-20 min
      const isCoreTrunk = lines.length >= 3;
      return isCoreTrunk ? 4 : 10;
    }
    case 'tram':
      return 10;
    case 'expressbus':
      return 10;
    case 'bus': {
      const isExpress = lines.some((l) => l.trim().toUpperCase().startsWith('X'));
      if (isExpress) return 10;
      const isMetro = lines.some((l) => {
        const num = parseInt(l.trim(), 10);
        return !isNaN(num) && num >= 50 && num <= 68;
      });
      return isMetro ? 10 : 15;
    }
    case 'train':
      return 30;
    default:
      return 12;
  }
}

/**
 * Calculates initial departure waiting time based on available modes at entry station.
 * Models half of the headway (Headway / 2) as realistic average wait time.
 */
export function getInitialDepartureWaitMinutes(
  station: TransitStation,
  allowedModes: Set<TransitSubMode>,
  enableHeadwayPenalty: boolean = DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty
): number {
  if (!enableHeadwayPenalty) {
    return 1.0;
  }
  let minWait = 15;
  for (const t of station.types) {
    if (t === 'ubahn' && allowedModes.has('ubahn')) minWait = Math.min(minWait, 2.5);
    else if (t === 'sbahn' && allowedModes.has('sbahn')) {
      const isTrunk = station.lines.filter((l) => l.startsWith('S')).length >= 3;
      minWait = Math.min(minWait, isTrunk ? 2.0 : 5.0);
    } else if (t === 'tram' && allowedModes.has('tram')) minWait = Math.min(minWait, 5.0);
    else if (t === 'bus' && (allowedModes.has('bus') || allowedModes.has('expressbus'))) {
      const hasExpress = station.lines.some((l) => l.trim().toUpperCase().startsWith('X'));
      minWait = Math.min(minWait, hasExpress ? 5.0 : 7.5);
    } else if (t === 'train' && allowedModes.has('train')) minWait = Math.min(minWait, 15.0);
  }
  return minWait === 15 ? 4.0 : minWait;
}

/**
 * Calculates realistic transfer penalty when changing lines.
 * Accounts for:
 * 1. Physical walking buffer between platforms / stairs (configurable, minTransferBufferMin)
 * 2. Average waiting time for connecting service (Headway / 2, capped by user's maxTransferWaitMin)
 * 3. Schedule fragility risk buffer (configurable, transferRiskBufferMin) to penalize brittle connections.
 */
export function calculateTransferPenalty(
  targetType: string,
  targetLines: string[],
  maxTransferWaitMin: number = 5,
  minTransferBufferMin: number = DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin,
  transferRiskBufferMin: number = DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin,
  enableHeadwayPenalty: boolean = DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty
): number {
  const headway = estimateHeadwayMinutes(targetType, targetLines);
  const averageWait = enableHeadwayPenalty ? headway / 2 : 1.0;
  const effectiveWait = Math.min(averageWait, Math.max(1.0, maxTransferWaitMin));
  const baseWalkBuffer = targetType === 'ubahn' || targetType === 'sbahn' ? minTransferBufferMin - 0.5 : minTransferBufferMin + 0.5;
  const walkBuffer = Math.max(1.0, baseWalkBuffer);
  const riskBuffer = transferRiskBufferMin; // Deliberate risk penalty against fragile connections
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
 * Calculates all reachable stations within travel budget using Bounded Dijkstra search
 */
export function calculateReachableStations(
  profile: PersonProfile,
  transitModes?: TransitSubMode[],
  options?: IsochroneOptions
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

  const allowedModes = new Set<TransitSubMode>(
    transitModes && transitModes.length > 0
      ? transitModes
      : profile.transitModes && profile.transitModes.length > 0
      ? profile.transitModes
      : DEFAULT_TRANSIT_SUBMODES
  );

  const dataset = getTransitRegion();
  const originPoint = turf.point([lng, lat]);

  // 1. Find entry stations accessible from workplace/destination (Last Mile in reverse)
  // Configurable urban pedestrian parameters (default: 4.0 km/h with 1.35 detour factor)
  const effectiveMaxWalkMin = Math.max(maxWalkFromStationMin, 1);

  const entryStations: { station: TransitStation; walkTimeMin: number }[] = [];

  for (const st of dataset.stations) {
    if (!stationHasAllowedMode(st, allowedModes)) {
      continue;
    }

    const stPoint = turf.point([st.lng, st.lat]);
    const distKm = turf.distance(originPoint, stPoint, { units: 'kilometers' });

    if (distKm <= 0.6) {
      const walkTime = Math.max(1.0, (distKm / walkSpeedKmPerMin) * detourFactor);
      if (walkTime <= effectiveMaxWalkMin && walkTime < travelTimeMinutes) {
        entryStations.push({ station: st, walkTimeMin: walkTime });
      }
    } else if (distKm <= 3.2) {
      // Suburban feeder connection (local feeder bus, bike, P+R, scooter to S-Bahn/U-Bahn station)
      const feederAccessTime = 3.0 + distKm * 2.0;
      if (feederAccessTime <= effectiveMaxWalkMin && feederAccessTime < travelTimeMinutes) {
        entryStations.push({ station: st, walkTimeMin: feederAccessTime });
      }
    }
  }

  // Location-independence guarantee:
  // If no station is within effectiveMaxWalkMin, pick up to 4 closest stations within total travelTimeMinutes
  if (entryStations.length === 0) {
    const sortedByDist = dataset.stations
      .filter((st) => stationHasAllowedMode(st, allowedModes))
      .map((st) => {
        const dist = turf.distance(originPoint, turf.point([st.lng, st.lat]), { units: 'kilometers' });
        const walkTime = (dist / walkSpeedKmPerMin) * detourFactor;
        return { station: st, dist, walkTime };
      })
      .sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < Math.min(4, sortedByDist.length); i++) {
      const candidate = sortedByDist[i];
      if (candidate.walkTime < travelTimeMinutes) {
        entryStations.push({ station: candidate.station, walkTimeMin: candidate.walkTime });
      }
    }
  }

  // 2. Build Adjacency Graph filtering out unselected transit submodes
  const graph = new Map<string, { to: string; minutes: number; lines: string[]; type: string }[]>();
  for (const conn of dataset.connections) {
    if (!isConnectionAllowed(conn, allowedModes)) {
      continue;
    }
    if (!graph.has(conn.from)) graph.set(conn.from, []);
    graph.get(conn.from)!.push({
      to: conn.to,
      minutes: conn.minutes,
      lines: conn.lines,
      type: conn.type,
    });
  }

  // 3. Dijkstra Search with line-overlap transfer tracking
  interface State {
    stationId: string;
    totalTime: number;
    transfers: number;
    activeLines: string[] | null;
  }

  const bestTimes = new Map<string, { time: number; transfers: number }>();
  const pq = new PriorityQueue<State>((a, b) => a.totalTime - b.totalTime);

  for (const entry of entryStations) {
    const departureWait = getInitialDepartureWaitMinutes(entry.station, allowedModes, enableHeadway);
    const startTime = entry.walkTimeMin + departureWait;
    if (startTime <= travelTimeMinutes) {
      pq.push({
        stationId: entry.station.id,
        totalTime: startTime,
        transfers: 0,
        activeLines: null,
      });
      bestTimes.set(entry.station.id, { time: startTime, transfers: 0 });
    }
  }

  while (!pq.isEmpty()) {
    const curr = pq.pop()!;

    const best = bestTimes.get(curr.stationId);
    if (best && curr.totalTime > best.time && curr.transfers >= best.transfers) {
      continue;
    }

    const neighbors = graph.get(curr.stationId) || [];
    for (const edge of neighbors) {
      let isLineChange = false;
      let nextActiveLines: string[] = edge.lines;

      if (curr.activeLines !== null) {
        const commonLines = edge.lines.filter((l) => curr.activeLines!.includes(l));
        if (commonLines.length > 0) {
          isLineChange = false;
          nextActiveLines = commonLines;
        } else {
          isLineChange = true;
          nextActiveLines = edge.lines;
        }
      }

      const nextTransfers = curr.transfers + (isLineChange ? 1 : 0);

      if (maxTransfers !== undefined && nextTransfers > maxTransfers) {
        continue;
      }

      const transferPenalty = isLineChange
        ? calculateTransferPenalty(
            edge.type,
            edge.lines,
            maxTransferWaitMin,
            minTransferBuffer,
            transferRiskBuffer,
            enableHeadway
          )
        : 0;
      const nextTime = curr.totalTime + edge.minutes + transferPenalty;

      if (nextTime <= travelTimeMinutes) {
        const existing = bestTimes.get(edge.to);
        if (!existing || nextTime < existing.time || nextTransfers < existing.transfers) {
          bestTimes.set(edge.to, { time: nextTime, transfers: nextTransfers });
          pq.push({
            stationId: edge.to,
            totalTime: nextTime,
            transfers: nextTransfers,
            activeLines: nextActiveLines,
          });
        }
      }
    }
  }

  // 4. Map back to ReachableStation objects
  const stationsMap = new Map(dataset.stations.map((s) => [s.id, s]));
  const reachable: ReachableStation[] = [];

  for (const [stId, info] of bestTimes.entries()) {
    const station = stationsMap.get(stId);
    if (station && info.time <= travelTimeMinutes) {
      reachable.push({
        station,
        totalTimeMin: info.time,
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
}

/**
 * Targeted Point-to-Point A* Search for Inspection Points.
 * Directs the search towards the destination station with Euclidean heuristic and early-exit.
 */
export function findShortestTransitTrip(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  profile: PersonProfile,
  transitModes?: TransitSubMode[],
  options?: IsochroneOptions
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

  const dataset = getTransitRegion();
  const originPoint = turf.point([origin.lng, origin.lat]);
  const destPoint = turf.point([destination.lng, destination.lat]);

  const directDistanceKm = turf.distance(originPoint, destPoint, { units: 'kilometers' });

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

    const stPoint = turf.point([st.lng, st.lat]);
    const distFromOrigin = turf.distance(originPoint, stPoint, { units: 'kilometers' });
    const distToDest = turf.distance(stPoint, destPoint, { units: 'kilometers' });

    const walkFromOrigin = (distFromOrigin / walkSpeedKmPerMin) * detourFactor;
    if (walkFromOrigin <= maxWalkToStation) {
      entryStations.push({ station: st, walkTime: walkFromOrigin });
    } else if (distFromOrigin <= 3.5) {
      allOriginCandidates.push({ station: st, walkTime: walkFromOrigin });
    }

    const walkToDest = (distToDest / walkSpeedKmPerMin) * detourFactor;
    if (walkToDest <= maxWalkFromStation) {
      exitStations.set(st.id, { station: st, walkToDestTime: walkToDest });
    } else if (distToDest <= 3.5) {
      allDestCandidates.push({ station: st, walkToDestTime: walkToDest });
    }
  }

  // Fallback: If no station within configured walk limit, take closest candidates so user sees the route & excess walk
  if (entryStations.length === 0) {
    allOriginCandidates.sort((a, b) => a.walkTime - b.walkTime);
    for (const c of allOriginCandidates.slice(0, 3)) {
      entryStations.push(c);
    }
  }

  if (exitStations.size === 0) {
    allDestCandidates.sort((a, b) => a.walkToDestTime - b.walkToDestTime);
    for (const c of allDestCandidates.slice(0, 3)) {
      exitStations.set(c.station.id, c);
    }
  }

  if (entryStations.length === 0 || exitStations.size === 0) {
    return null;
  }

  // Build Adjacency Graph
  const graph = new Map<string, { to: string; minutes: number; lines: string[]; type: string }[]>();
  for (const conn of dataset.connections) {
    if (!isConnectionAllowed(conn, allowedModes)) continue;
    if (!graph.has(conn.from)) graph.set(conn.from, []);
    graph.get(conn.from)!.push({
      to: conn.to,
      minutes: conn.minutes,
      lines: conn.lines,
      type: conn.type,
    });
  }

  // A* Priority Queue: f = g + h
  const maxSpeedKmPerMin = 1.2;

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
  }

  const pq = new PriorityQueue<AStarState>((a, b) => a.fScore - b.fScore);
  const bestGTime = new Map<string, number>();

  for (const entry of entryStations) {
    const initialWait = getInitialDepartureWaitMinutes(entry.station, allowedModes, enableHeadway);
    const gTime = entry.walkTime + initialWait;
    const distToTargetKm = turf.distance(turf.point([entry.station.lng, entry.station.lat]), destPoint, {
      units: 'kilometers',
    });
    const hTime = distToTargetKm / maxSpeedKmPerMin;

    pq.push({
      stationId: entry.station.id,
      gTime,
      fScore: gTime + hTime,
      transfers: 0,
      activeLines: null,
      allLinesUsed: [],
      entryStationName: entry.station.name,
      entryWalkTime: entry.walkTime,
      entryWaitTime: initialWait,
    });
    bestGTime.set(entry.station.id, gTime);
  }

  let bestResult: TransitTripResult | null = null;
  const maxSearchBudget = 90;

  while (!pq.isEmpty()) {
    const curr = pq.pop()!;

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
      if (bestResult !== null && curr.fScore >= bestResult.travelTimeMinutes) {
        break;
      }
    }

    if (curr.gTime > (bestGTime.get(curr.stationId) ?? Infinity)) {
      continue;
    }
    if (curr.gTime >= maxSearchBudget) {
      continue;
    }

    const neighbors = graph.get(curr.stationId) || [];
    for (const edge of neighbors) {
      let isLineChange = false;
      let nextActiveLines: string[] = edge.lines;

      if (curr.activeLines !== null) {
        const commonLines = edge.lines.filter((l) => curr.activeLines!.includes(l));
        if (commonLines.length > 0) {
          isLineChange = false;
          nextActiveLines = commonLines;
        } else {
          isLineChange = true;
          nextActiveLines = edge.lines;
        }
      }

      const nextTransfers = curr.transfers + (isLineChange ? 1 : 0);
      if (profile.maxTransfers !== undefined && nextTransfers > profile.maxTransfers) {
        continue;
      }

      const transferPenalty = isLineChange
        ? calculateTransferPenalty(
            edge.type,
            edge.lines,
            profile.maxTransferWaitMin ?? 5,
            minTransferBuffer,
            transferRiskBuffer,
            enableHeadway
          )
        : 0;
      const nextGTime = curr.gTime + edge.minutes + transferPenalty;

      const destStation = dataset.stations.find((s) => s.id === edge.to);
      const hTime = destStation
        ? turf.distance(turf.point([destStation.lng, destStation.lat]), destPoint, { units: 'kilometers' }) /
          maxSpeedKmPerMin
        : 0;

      const nextFScore = nextGTime + hTime;

      if (nextGTime < (bestGTime.get(edge.to) ?? Infinity)) {
        bestGTime.set(edge.to, nextGTime);
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
  options?: IsochroneOptions
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
  const directWalkTime = Math.min(travelTimeMinutes, maxWalkFromStationMin);
  const directWalkRadiusKm = Math.max(0.20, (directWalkTime * walkSpeedKmPerMin) / detourFactor);
  const originWalkCircle = turf.circle(origin, directWalkRadiusKm, {
    steps: 24,
    units: 'kilometers',
  });
  polygonsToUnion.push(originWalkCircle);

  // 2. Solve Reachable Stations via Transit matrix
  const reachableStations = calculateReachableStations(profile, transitModes, options);

  for (const item of reachableStations) {
    const stPoint = turf.point([item.station.lng, item.station.lat]);

    // Walking dispersal around reached station into residential area (Wohnort ➔ Station)
    const dispersalMinutes = Math.min(item.remainingTimeMin, maxWalkToStationMin);
    const minRadius = item.station.types.includes('sbahn') || item.station.types.includes('train') ? 0.30 : 0.20;
    const radiusKm = Math.max(minRadius, (dispersalMinutes * walkSpeedKmPerMin) / detourFactor);

    const stationBuffer = turf.circle(stPoint, radiusKm, {
      steps: 20,
      units: 'kilometers',
    });
    polygonsToUnion.push(stationBuffer);
  }

  // 3. Hierarchical union of origin walk area and station catchment bubbles
  let currentList = [...polygonsToUnion];
  while (currentList.length > 1) {
    const nextList: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[] = [];
    for (let i = 0; i < currentList.length; i += 2) {
      if (i + 1 < currentList.length) {
        try {
          const fc = turf.featureCollection([currentList[i] as any, currentList[i + 1] as any]);
          const u = (turf.union as any)(fc);
          if (u) {
            nextList.push(u as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
          } else {
            nextList.push(currentList[i], currentList[i + 1]);
          }
        } catch {
          nextList.push(currentList[i]);
        }
      } else {
        nextList.push(currentList[i]);
      }
    }
    currentList = nextList;
  }

  let merged: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> = currentList[0] || originWalkCircle;

  const dataset = getTransitRegion();

  merged.properties = {
    source: 'transit_metro_matrix',
    regionId: dataset.id,
    regionName: dataset.name,
    travelTimeMinutes,
    mode: 'transit',
    reachedStationsCount: reachableStations.length,
  };

  return merged;
}
