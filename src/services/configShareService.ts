import {
  PersonProfile,
  CommuteSchedule,
  BasemapProvider,
  LayerId,
  PoiIconSettings,
  DEFAULT_LAYER_ORDER,
  DEFAULT_POI_ICON_SETTINGS,
} from '../types';

export interface FullShareConfig {
  version: 2;
  profiles: PersonProfile[];
  schedule: CommuteSchedule;
  basemap?: BasemapProvider;
  layerOrder?: LayerId[];
  hiddenLayers?: LayerId[];
  poiIconSettings?: PoiIconSettings;
  onlyResidential?: boolean;
  showIndividualIsochrones?: boolean;
  showIntersectionLayer?: boolean;
  activeScenarioId?: string;
}

const LOCAL_STORAGE_STATE_KEY = 'venn_saved_state';
const LEGACY_STORAGE_STATE_KEY = 'living_area_finder_saved_state';

/**
 * Compact representation for URL-Hash payload (saves URL character length)
 */
interface CompactPayloadV2 {
  v: 2;
  p: Array<{
    id?: string;
    n: string;
    a: string;
    lat: number;
    lng: number;
    t: number;
    m: any;
    c: string;
    v?: boolean;
    mt?: number;
    mw?: number;
    mfw?: number;
    mtw?: number;
    tm?: any[];
  }>;
  s: {
    d: any;
    w: any;
    t: string;
    lt?: boolean;
    sm?: boolean;
    fi?: any;
    fh?: boolean;
    hm?: any;
    ro?: any;
    tsm?: any[];
    wsk?: number;
    udf?: number;
    mtb?: number;
    trb?: number;
    ehp?: boolean;
    csk?: number;
    dpb?: number;
  };
  b?: BasemapProvider;
  lo?: LayerId[];
  hl?: LayerId[];
  poi?: PoiIconSettings;
  res?: boolean;
  si?: boolean;
  sx?: boolean;
  sc?: string;
}

/**
 * Converts a full configuration into a compact JSON-serializable structure
 */
function toCompactPayload(config: FullShareConfig): CompactPayloadV2 {
  return {
    v: 2,
    p: config.profiles.map((p, idx) => ({
      id: p.id || `p-${idx + 1}`,
      n: p.name,
      a: p.address,
      lat: p.lat,
      lng: p.lng,
      t: p.travelTimeMinutes,
      m: p.mode,
      c: p.color,
      v: p.visible,
      mt: p.maxTransfers,
      mw: p.maxWalkToStationMin,
      mfw: p.maxWalkFromStationMin,
      mtw: p.maxTransferWaitMin,
      tm: p.transitModes,
    })),
    s: {
      d: config.schedule.direction,
      w: config.schedule.dayOfWeek,
      t: config.schedule.time,
      lt: config.schedule.options?.liveTraffic,
      sm: config.schedule.options?.enableSmoothing,
      fi: config.schedule.options?.fidelity,
      fh: config.schedule.options?.fillHoles,
      hm: config.schedule.options?.heatmap,
      ro: config.schedule.options?.rentalOverlay,
      tsm: config.schedule.options?.transitModes,
      wsk: config.schedule.options?.walkingSpeedKmh,
      udf: config.schedule.options?.urbanDetourFactor,
      mtb: config.schedule.options?.minTransferBufferMin,
      trb: config.schedule.options?.transferRiskBufferMin,
      ehp: config.schedule.options?.enableHeadwayPenalty,
      csk: config.schedule.options?.cyclingSpeedKmh,
      dpb: config.schedule.options?.drivingParkingBufferMin,
    },
    b: config.basemap,
    lo: config.layerOrder,
    hl: config.hiddenLayers,
    poi: config.poiIconSettings,
    res: config.onlyResidential,
    si: config.showIndividualIsochrones,
    sx: config.showIntersectionLayer,
    sc: config.activeScenarioId,
  };
}

/**
 * Reconstructs a full configuration from parsed JSON (supports V1 and V2)
 */
function fromCompactPayload(parsed: any): FullShareConfig | null {
  if (!parsed || typeof parsed !== 'object') return null;

  // 1. Parse Profiles
  const rawProfiles = Array.isArray(parsed.p) ? parsed.p : [];
  if (rawProfiles.length === 0) return null;

  const profiles: PersonProfile[] = rawProfiles.map((item: any, idx: number) => ({
    id: item.id || `p-shared-${idx}-${Date.now()}`,
    name: item.n || `Person ${idx + 1}`,
    address: item.a || '',
    lat: Number(item.lat),
    lng: Number(item.lng),
    travelTimeMinutes: Number(item.t) || 35,
    mode: item.m || 'transit',
    color: item.c || '#3B82F6',
    visible: item.v !== false,
    maxTransfers: item.mt !== undefined ? Number(item.mt) : undefined,
    maxWalkToStationMin: item.mw !== undefined ? Number(item.mw) : undefined,
    maxWalkFromStationMin: item.mfw !== undefined ? Number(item.mfw) : undefined,
    maxTransferWaitMin: item.mtw !== undefined ? Number(item.mtw) : undefined,
    transitModes: Array.isArray(item.tm) ? item.tm : undefined,
  }));

  // 2. Parse Schedule
  const s = parsed.s || {};
  const schedule: CommuteSchedule = {
    direction: s.d || 'to_work',
    dayOfWeek: s.w || 'workday',
    time: s.t || '07:00',
    options: {
      liveTraffic: s.lt ?? false,
      enableSmoothing: s.sm ?? true,
      fidelity: s.fi || 'AUTOMATIC',
      fillHoles: s.fh ?? true,
      heatmap: s.hm,
      rentalOverlay: s.ro,
      transitModes: s.tsm,
      walkingSpeedKmh: s.wsk,
      urbanDetourFactor: s.udf,
      minTransferBufferMin: s.mtb,
      transferRiskBufferMin: s.trb,
      enableHeadwayPenalty: s.ehp,
      cyclingSpeedKmh: s.csk,
      drivingParkingBufferMin: s.dpb,
    },
  };

  // 3. Parse optional extra parameters
  const basemap: BasemapProvider | undefined = parsed.b;
  const layerOrder: LayerId[] | undefined = Array.isArray(parsed.lo) ? parsed.lo : undefined;
  const hiddenLayers: LayerId[] | undefined = Array.isArray(parsed.hl) ? parsed.hl : undefined;
  const poiIconSettings: PoiIconSettings | undefined = parsed.poi
    ? { ...DEFAULT_POI_ICON_SETTINGS, ...parsed.poi }
    : undefined;
  const onlyResidential: boolean | undefined = parsed.res;
  const showIndividualIsochrones: boolean | undefined = parsed.si;
  const showIntersectionLayer: boolean | undefined = parsed.sx;
  const activeScenarioId: string | undefined = parsed.sc;

  return {
    version: 2,
    profiles,
    schedule,
    basemap,
    layerOrder,
    hiddenLayers,
    poiIconSettings,
    onlyResidential,
    showIndividualIsochrones,
    showIntersectionLayer,
    activeScenarioId,
  };
}

/**
 * Encodes full configuration into a shareable URL
 */
export function serializeConfigToUrl(config: FullShareConfig): string {
  const compact = toCompactPayload(config);
  const encoded = encodeURIComponent(JSON.stringify(compact));
  return `${window.location.origin}${window.location.pathname}#zone=${encoded}`;
}

/**
 * Exports full configuration as formatted JSON
 */
export function serializeConfigToJson(config: FullShareConfig): string {
  return JSON.stringify(toCompactPayload(config), null, 2);
}

/**
 * Parses configuration from URL hash or raw string input (URL or JSON)
 */
export function parseConfigFromInput(input: string): FullShareConfig | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Case 1: Full URL with #zone= or #config=
  let jsonString = '';
  if (trimmed.includes('#zone=')) {
    const raw = trimmed.split('#zone=')[1];
    jsonString = decodeURIComponent(raw);
  } else if (trimmed.includes('#config=')) {
    const raw = trimmed.split('#config=')[1];
    jsonString = decodeURIComponent(raw);
  } else if (trimmed.startsWith('#') || trimmed.startsWith('zone=')) {
    const raw = trimmed.replace(/^#?zone=/, '').replace(/^#?config=/, '');
    jsonString = decodeURIComponent(raw);
  } else {
    // Case 2: Raw JSON string
    jsonString = trimmed;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return fromCompactPayload(parsed);
  } catch (err) {
    console.warn('Failed to parse config from input:', err);
    return null;
  }
}

/**
 * Reads configuration from current window.location.hash
 */
export function parseConfigFromWindowHash(): FullShareConfig | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  return parseConfigFromInput(hash);
}

/**
 * Persists the user's active local profile & settings in localStorage
 */
export function saveLocalProfileState(config: FullShareConfig): void {
  try {
    const compact = toCompactPayload(config);
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(compact));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

/**
 * Loads the user's saved local profile & settings from localStorage
 */
export function loadLocalProfileState(): FullShareConfig | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_STATE_KEY) || localStorage.getItem(LEGACY_STORAGE_STATE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return fromCompactPayload(parsed);
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
    return null;
  }
}

/**
 * Clears local profile state from localStorage
 */
export function clearLocalProfileState(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_STATE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_STATE_KEY);
  } catch (e) {
    console.warn('Failed to clear state from localStorage:', e);
  }
}
