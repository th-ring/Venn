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
  maxWalkToStationMin?: number; // 5, 10, 15, or undefined
  maxTransferWaitMin?: number; // 5, 10, 15, 20 min max wait/buffer at transfers
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

export interface IsochroneOptions {
  liveTraffic: boolean;
  enableSmoothing: boolean;
  fidelity: PolygonFidelity;
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
  intersectionAreaKm2: number;
  emptyIntersection: boolean;
  suggestions: FallbackSuggestion[];
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
