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
  maxWalkToStationMin?: number; // Max walk from home to station (First Mile, default 5 min)
  maxWalkFromStationMin?: number; // Max walk from station to destination/work (Last Mile, default 5 min)
  maxTransferWaitMin?: number; // Max wait/buffer at transfers (default 5 min)
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

export interface RentalOverlaySettings {
  enabled: boolean;
  opacity: number; // 0.15 to 0.70, default 0.35
  selectedRegionId?: string; // e.g. 'munich-mvv'
}

export type LayerId =
  | 'inspection'
  | 'persons'
  | 'poi_icons'
  | 'intersection'
  | 'heatmap'
  | 'isochrones'
  | 'rental'
  | 'basemap';

export const DEFAULT_LAYER_ORDER: LayerId[] = [
  'inspection',
  'persons',
  'poi_icons',
  'intersection',
  'heatmap',
  'isochrones',
  'rental',
  'basemap',
];

export interface PoiIconSettings {
  visible: boolean;
  showUbahn: boolean;
  showSbahn: boolean;
  showHighway: boolean;
  onlyWithinIntersection: boolean;
}

export const DEFAULT_POI_ICON_SETTINGS: PoiIconSettings = {
  visible: true,
  showUbahn: true,
  showSbahn: true,
  showHighway: true,
  onlyWithinIntersection: true,
};

export interface IsochroneOptions {
  liveTraffic: boolean;
  enableSmoothing: boolean;
  fidelity: PolygonFidelity;
  fillHoles?: boolean;
  heatmap?: HeatmapSettings;
  rentalOverlay?: RentalOverlaySettings;
  transitModes?: TransitSubMode[];
  poiIcons?: PoiIconSettings;
  layerOrder?: LayerId[];
}

export interface CommuteSchedule {
  direction: CommuteDirection;
  dayOfWeek: 'workday' | 'weekend';
  time: string; // "07:00"
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

export interface IsochroneFallbackAlert {
  personId: string;
  personName: string;
  mode: TransportMode;
  requestedProvider: 'google' | 'ors' | 'calibrated';
  reason: string;
  statusCode?: number;
}

export interface CalculationResult {
  isochrones: Record<string, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>;
  intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  rawIntersection?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  intersectionAreaKm2: number;
  rawIntersectionAreaKm2?: number;
  emptyIntersection: boolean;
  suggestions: FallbackSuggestion[];
  fallbackAlerts?: IsochroneFallbackAlert[];
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

export type ResidentialQualityTier = 'average' | 'good' | 'prime';

export interface RentalDistrictProperties {
  districtNumber: string;
  name: string;
  avgRentColdSqm: number;
  minRentColdSqm: number;
  maxRentColdSqm: number;
  qualityTier: ResidentialQualityTier;
  qualityLabel: string;
  description?: string;
  source: string;
  sourceUrl?: string;
  lastUpdated: string;
}

export type RentalDistrictFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  RentalDistrictProperties
>;

export type RentalDistrictFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  RentalDistrictProperties
>;

export interface RentalRegionCatalogEntry {
  id: string;
  name: string;
  cityName: string;
  available: boolean;
  source: string;
  sourceUrl: string;
  license: string;
  lastUpdated: string;
  unit: string;
  description: string;
}

export interface InspectionPoint {
  lat: number;
  lng: number;
  address?: string;
  estimates: CommuteEstimate[];
  allWithinLimit: boolean;
  activePersonsCount: number;
  withinLimitCount: number;
  rentalInfo?: RentalDistrictProperties;
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
