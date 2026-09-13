export type TransportMode = 'transit' | 'driving' | 'cycling' | 'walking';

export type CommuteDirection = 'to_work' | 'from_work';

export interface PersonProfile {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  travelTimeMinutes: number;
  mode: TransportMode;
  color: string;
  visible: boolean;
  maxTransfers?: number; // 0, 1, 2, or undefined for unlimited
  maxWalkToStationMin?: number; // Max walk from home to station (First Mile, e.g. 5, 10, 15, 20 min)
  maxWalkFromStationMin?: number; // Max walk from station to destination/work (Last Mile, e.g. 5, 10, 15, 20 min)
  maxTransferWaitMin?: number; // 5, 10, 15, 20 min max wait/buffer at transfers
  transitModes?: TransitSubMode[]; // Allowed transit modes (tram, ubahn, bus, expressbus, sbahn, train)
}

export type PolygonFidelity = 'AUTOMATIC' | 'LOW' | 'MEDIUM' | 'HIGH';

export type BasemapPlatform = 'osm' | 'google';

export type MapVariant = 'normal' | 'satellite' | 'streets' | 'transit';

export type BasemapProvider =
  | 'osm'
  | 'google_roadmap'
  | 'google_satellite'
  | 'google_terrain'
  | 'osm_normal'
  | 'osm_satellite'
  | 'osm_streets'
  | 'osm_transit'
  | 'google_normal'
  | 'google_streets'
  | 'google_transit';

export type PriorityHeatmapItem = 'ubahn' | 'sbahn' | 'highway';

export const ALL_HEATMAP_ITEMS: PriorityHeatmapItem[] = ['ubahn', 'sbahn', 'highway'];

export type PriorityHeatmapMode = 'none' | 'ubahn' | 'sbahn' | 'highway';

export type TransitSubMode = 'tram' | 'ubahn' | 'bus' | 'expressbus' | 'sbahn' | 'train';

export const ALL_TRANSIT_SUBMODES: TransitSubMode[] = ['tram', 'ubahn', 'bus', 'expressbus', 'sbahn', 'train'];

export const DEFAULT_TRANSIT_SUBMODES: TransitSubMode[] = ['tram', 'ubahn', 'bus', 'expressbus'];

export interface TransitStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: string[];
  types: ('sbahn' | 'ubahn' | 'tram' | 'bus' | 'train')[];
}

export interface TransitConnection {
  from: string;
  to: string;
  minutes: number;
  lines: string[];
  type: 'sbahn' | 'ubahn' | 'tram' | 'bus' | 'train';
}

export interface TransitRegionMetadata {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  source: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  stationCount: number;
  connectionCount: number;
  downloadSizeApprox?: string;
  downloadUrl?: string;
  isBuiltIn?: boolean;
}

export interface TransitRegion extends TransitRegionMetadata {
  stations: TransitStation[];
  connections: TransitConnection[];
}

export interface HeatmapSettings {
  mode: PriorityHeatmapMode;
  selectedItems?: PriorityHeatmapItem[];
  radiusKm: number; // e.g. 1.5 km buffer or gradient distance
  intensity: number; // 0.2 to 1.0 opacity
}

export interface IsochroneOptions {
  liveTraffic: boolean;
  enableSmoothing: boolean;
  fidelity: PolygonFidelity;
  heatmap?: HeatmapSettings;
  transitModes?: TransitSubMode[];
}

export interface CommuteSchedule {
  direction: CommuteDirection;
  dayOfWeek: 'workday' | 'weekend';
  time: string; // "08:30"
  options: IsochroneOptions;
}

export interface FallbackSuggestion {
  id: string;
  type: 'increase_time' | 'change_mode' | 'mutual_increase';
  title: string;
  description: string;
  personId?: string;
  suggestedMinutes?: number;
  suggestedMode?: TransportMode;
}

export interface CalculationResult {
  isochrones: Record<string, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>;
  intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  rawIntersection?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  intersectionAreaKm2: number;
  rawIntersectionAreaKm2?: number;
  emptyIntersection: boolean;
  suggestions: FallbackSuggestion[];
}

export interface CommuteRouteDetails {
  summary: string;
  firstMileWalkMin?: number;
  firstMileStationName?: string;
  firstMileWalkLimitMin?: number;
  inVehicleMin?: number;
  linesUsed?: string[];
  transfersCount?: number;
  lastMileWalkMin?: number;
  lastMileStationName?: string;
  lastMileWalkLimitMin?: number;
  steps?: string[];
}

export interface CommuteEstimate {
  personId: string;
  personName: string;
  personColor: string;
  mode: TransportMode;
  travelTimeMinutes: number;
  limitMinutes: number;
  isWithinLimit: boolean;
  distanceKm: number;
  details?: CommuteRouteDetails;
}

export interface InspectionPoint {
  lat: number;
  lng: number;
  address?: string;
  estimates: CommuteEstimate[];
  allWithinLimit: boolean;
  activePersonsCount: number;
  withinLimitCount: number;
}

export interface PresetScenario {
  id: string;
  name: string;
  city: string;
  description: string;
  center: [number, number];
  zoom: number;
  profiles: PersonProfile[];
}
