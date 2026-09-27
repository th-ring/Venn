import * as turf from '@turf/turf';
import type {
  ApartmentListing,
  ApartmentCommuteScore,
  ApartmentFilterSettings,
  PersonCommuteToApartment,
  HousingSource,
  PersonProfile,
  CommuteSchedule,
  TransportMode,
  PortalSearchLink,
  IntersectionSubArea,
} from '../types.ts';
import { DEFAULT_APARTMENT_FILTER } from '../types.ts';
import { DEFAULT_APARTMENT_LISTINGS } from '../data/apartments/defaultApartments.ts';

const STORAGE_KEY_CUSTOM_APARTMENTS = 'venn_custom_apartments';
const STORAGE_KEY_FILTER_SETTINGS = 'venn_apartment_filters';

let inMemoryListings: ApartmentListing[] = [...DEFAULT_APARTMENT_LISTINGS];
const listeners = new Set<(listings: ApartmentListing[]) => void>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn(inMemoryListings);
    } catch (e) {
      console.warn('Apartment subscriber error:', e);
    }
  });
}

/**
 * Validates a single apartment listing object against the required schema.
 * Returns the cleaned/sanitized ApartmentListing or null if invalid.
 */
export function validateApartmentListing(raw: any): ApartmentListing | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `apt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;

  const lat = typeof raw.lat === 'number' ? raw.lat : parseFloat(raw.lat);
  const lng = typeof raw.lng === 'number' ? raw.lng : parseFloat(raw.lng);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const priceCold = typeof raw.priceCold === 'number' ? raw.priceCold : parseFloat(raw.priceCold);
  if (isNaN(priceCold) || priceCold <= 0) {
    return null;
  }

  const sizeSqm = typeof raw.sizeSqm === 'number' ? raw.sizeSqm : parseFloat(raw.sizeSqm);
  if (isNaN(sizeSqm) || sizeSqm <= 0) {
    return null;
  }

  const rooms = typeof raw.rooms === 'number' ? raw.rooms : parseFloat(raw.rooms);
  if (isNaN(rooms) || rooms <= 0) {
    return null;
  }

  const priceWarm = typeof raw.priceWarm === 'number' ? raw.priceWarm : raw.priceWarm ? parseFloat(raw.priceWarm) : undefined;
  const address = typeof raw.address === 'string' ? raw.address.trim() : 'Adresse auf Anfrage';
  const district = typeof raw.district === 'string' && raw.district.trim() ? raw.district.trim() : undefined;
  const city = typeof raw.city === 'string' && raw.city.trim() ? raw.city.trim() : 'München';

  const features: string[] = Array.isArray(raw.features)
    ? raw.features.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
    : [];

  const images: string[] = Array.isArray(raw.images)
    ? raw.images.filter((img: any) => typeof img === 'string' && img.startsWith('http'))
    : [];

  let thumbnailUrl = typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl.startsWith('http')
    ? raw.thumbnailUrl
    : images.length > 0
    ? images[0]
    : undefined;

  const url = typeof raw.url === 'string' && raw.url.trim() ? raw.url.trim() : undefined;
  const source: HousingSource = typeof raw.source === 'string' && raw.source.trim() ? raw.source.trim() : 'custom';
  const description = typeof raw.description === 'string' ? raw.description.trim() : undefined;
  const contactName = typeof raw.contactName === 'string' ? raw.contactName.trim() : undefined;
  const availableFrom = typeof raw.availableFrom === 'string' ? raw.availableFrom.trim() : undefined;
  const constructionYear = typeof raw.constructionYear === 'number' ? raw.constructionYear : undefined;
  const floor = raw.floor !== undefined ? raw.floor : undefined;
  const scrapedAt = typeof raw.scrapedAt === 'string' ? raw.scrapedAt : new Date().toISOString();

  return {
    id,
    title,
    address,
    district,
    city,
    lat,
    lng,
    priceCold,
    priceWarm,
    currency: raw.currency || 'EUR',
    sizeSqm,
    rooms,
    floor,
    constructionYear,
    availableFrom,
    features,
    images,
    thumbnailUrl,
    url,
    source,
    description,
    contactName,
    scrapedAt,
  };
}

/**
 * Validates an entire dataset (JSON file content, raw object, or array).
 */
export function validateApartmentDataset(raw: any): {
  valid: boolean;
  listings: ApartmentListing[];
  errors: string[];
} {
  const errors: string[] = [];
  if (!raw) {
    return { valid: false, listings: [], errors: ['Leere Daten übergeben.'] };
  }

  let candidates: any[] = [];
  if (Array.isArray(raw)) {
    candidates = raw;
  } else if (typeof raw === 'object') {
    if (Array.isArray(raw.listings)) {
      candidates = raw.listings;
    } else if (Array.isArray(raw.items)) {
      candidates = raw.items;
    } else if (Array.isArray(raw.data)) {
      candidates = raw.data;
    } else {
      return {
        valid: false,
        listings: [],
        errors: ['Die Datei enthält kein gültiges "listings"-Array.'],
      };
    }
  } else {
    return { valid: false, listings: [], errors: ['Ungültiges Format.'] };
  }

  const validListings: ApartmentListing[] = [];
  candidates.forEach((cand, idx) => {
    const validated = validateApartmentListing(cand);
    if (validated) {
      validListings.push(validated);
    } else {
      errors.push(`Eintrag #${idx + 1} (${cand?.title || 'Ohne Titel'}) ist unvollständig oder fehlerhaft.`);
    }
  });

  return {
    valid: validListings.length > 0,
    listings: validListings,
    errors,
  };
}

/**
 * Filters listings to those strictly located within the common intersection feature polygon.
 */
export function filterApartmentsInPolygon(
  listings: ApartmentListing[],
  polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null
): ApartmentListing[] {
  if (!polygon || !polygon.geometry) return [];

  // Fast BBOX check first
  let bbox: number[] | null = null;
  try {
    bbox = turf.bbox(polygon as any);
  } catch (err) {
    console.warn('Could not calculate bbox for intersection:', err);
  }

  return listings.filter((apt) => {
    if (bbox) {
      if (apt.lng < bbox[0] || apt.lng > bbox[2] || apt.lat < bbox[1] || apt.lat > bbox[3]) {
        return false;
      }
    }

    try {
      const pt = turf.point([apt.lng, apt.lat]);
      if (polygon.geometry.type === 'GeometryCollection') {
        return polygon.geometry.geometries.some((geom) => {
          return turf.booleanPointInPolygon(pt, geom as any);
        });
      }
      return turf.booleanPointInPolygon(pt, polygon as any);
    } catch {
      return false;
    }
  });
}

/**
 * Generates direct search deep-links for commercial housing portals (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen)
 * for a specific geographic area (center coordinate, bounding box, radius).
 * Allows users to instantly view live portal listings for any intersection or sub-area.
 */
export function getPortalSearchLinks(
  center: { lat: number; lng: number },
  bbox: [number, number, number, number],
  radiusKm = 2,
  city = 'München'
): PortalSearchLink[] {
  const safeRadius = Math.max(1, Math.min(25, Math.ceil(radiusKm)));
  const latStr = center.lat.toFixed(4);
  const lngStr = center.lng.toFixed(4);
  const cityEncoded = encodeURIComponent(city);

  // 1. ImmoScout24: Radius search with centerlat/centerlon & radius in km
  const immoscoutUrl = `https://www.immobilienscout24.de/Suche/radius/wohnung-mieten?centerlat=${latStr}&centerlon=${lngStr}&radius=${safeRadius}&userGeoAttributes=true`;

  // 2. Immowelt: Radius search with lat/lon & distance in km
  const immoweltUrl = `https://www.immowelt.de/liste/wohnungen/mieten?lat=${latStr}&lon=${lngStr}&distance=${safeRadius}`;

  // 3. WG-Gesucht: Radius search around city / coordinates
  const wgGesuchtUrl = `https://www.wg-gesucht.de/wohnungen-in-${cityEncoded}.html?distance=${safeRadius}`;

  // 4. Kleinanzeigen: Radius search around coordinates
  const kleinanzeigenUrl = `https://www.kleinanzeigen.de/s-wohnung-mieten/c203?distance=${safeRadius}&latitude=${latStr}&longitude=${lngStr}`;

  return [
    {
      portal: 'immoscout24',
      name: 'ImmoScout24',
      url: immoscoutUrl,
      badge: `~${safeRadius} km Umkreis`,
      description: 'Deutschlands größtes Immobilienportal (Radius-Suche)',
      color: '#ff7500',
    },
    {
      portal: 'immowelt',
      name: 'Immowelt',
      url: immoweltUrl,
      badge: `~${safeRadius} km Umkreis`,
      description: 'Umfangreiche Mietangebote im Suchradius',
      color: '#ffd000',
    },
    {
      portal: 'wg-gesucht',
      name: 'WG-Gesucht',
      url: wgGesuchtUrl,
      badge: `${city} (+${safeRadius} km)`,
      description: 'Wohnungen, Apartments & WG-Zimmer',
      color: '#e05929',
    },
    {
      portal: 'kleinanzeigen',
      name: 'Kleinanzeigen',
      url: kleinanzeigenUrl,
      badge: `~${safeRadius} km Umkreis`,
      description: 'Provisionsfreie Privat- & Maklerangebote',
      color: '#86b817',
    },
  ];
}

/**
 * Extracts individual contiguous sub-areas / islands from an intersection feature.
 * When combining different transit modes (e.g. ÖPNV corridors with car isochrones),
 * the intersection geometry often forms multiple disjoint polygons ("Punktbereiche").
 * This function flattens and enriches each sub-area with area stats, center, BBOX, and portal links.
 */
export function extractIntersectionSubAreas(
  intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null,
  listings: ApartmentListing[] = [],
  city = 'München'
): IntersectionSubArea[] {
  if (!intersection || !intersection.geometry) return [];

  const subAreas: IntersectionSubArea[] = [];

  try {
    const flattened = turf.flatten(intersection as any);
    const features = flattened.features as unknown as Array<GeoJSON.Feature<GeoJSON.Polygon>>;

    features.forEach((feature, index) => {
      if (!feature.geometry || feature.geometry.type !== 'Polygon') return;

      const areaM2 = turf.area(feature);
      const areaKm2 = Math.round((areaM2 / 1_000_000) * 100) / 100;
      // Skip degenerate polygons (< 0.001 km² = 1000 m²)
      if (areaKm2 < 0.001) return;

      const bbox = turf.bbox(feature) as [number, number, number, number];

      // Calculate interior representative point for center
      let centerLat = (bbox[1] + bbox[3]) / 2;
      let centerLng = (bbox[0] + bbox[2]) / 2;
      try {
        const pointOnPoly = turf.pointOnFeature(feature);
        if (pointOnPoly && pointOnPoly.geometry) {
          centerLng = pointOnPoly.geometry.coordinates[0];
          centerLat = pointOnPoly.geometry.coordinates[1];
        }
      } catch {}

      const radiusKm = Math.max(0.5, Math.round(Math.sqrt((areaKm2 || 0.1) / Math.PI) * 10) / 10);
      const portalLinks = getPortalSearchLinks({ lat: centerLat, lng: centerLng }, bbox, radiusKm, city);

      // Count listings inside this sub-polygon
      const listingsInPoly = listings.filter((apt) => {
        try {
          const pt = turf.point([apt.lng, apt.lat]);
          return turf.booleanPointInPolygon(pt, feature);
        } catch {
          return false;
        }
      });

      subAreas.push({
        id: `subarea-${index}`,
        index,
        label: features.length > 1
          ? `Bereich ${index + 1} (${areaKm2} km² · ${listingsInPoly.length} Whg.)`
          : `Treffbereich (${areaKm2} km² · ${listingsInPoly.length} Whg.)`,
        center: { lat: centerLat, lng: centerLng },
        bbox,
        areaKm2,
        radiusKm,
        feature,
        portalLinks,
        listingsCount: listingsInPoly.length,
      });
    });

    // Sort sub-areas by area descending (largest first)
    subAreas.sort((a, b) => b.areaKm2 - a.areaKm2);
    // Re-index after sorting
    subAreas.forEach((sa, idx) => {
      sa.index = idx;
      if (subAreas.length > 1) {
        sa.label = `Bereich ${idx + 1} (${sa.areaKm2} km² · ${sa.listingsCount} Whg.)`;
      }
    });
  } catch (err) {
    console.warn('Error extracting intersection sub-areas:', err);
  }

  return subAreas;
}

/**
 * Estimates commute time in minutes and road distance from an apartment to a workplace.
 * Provides fast, deterministic, self-contained travel calculations.
 */
export function estimateApartmentCommuteTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportMode = 'transit',
  schedule?: CommuteSchedule
): { travelTimeMinutes: number; distanceKm: number } {
  const from = turf.point([origin.lng, origin.lat]);
  const to = turf.point([destination.lng, destination.lat]);
  const straightDistKm = turf.distance(from, to, { units: 'kilometers' });

  let roadDistanceKm = straightDistKm;
  let travelTimeMin = 0;

  switch (mode) {
    case 'walking': {
      roadDistanceKm = straightDistKm * 1.3;
      travelTimeMin = (roadDistanceKm / 4.8) * 60;
      break;
    }
    case 'cycling': {
      roadDistanceKm = straightDistKm * 1.25;
      travelTimeMin = (roadDistanceKm / 16.0) * 60;
      break;
    }
    case 'driving': {
      roadDistanceKm = straightDistKm * 1.28;
      const speedKmh = roadDistanceKm > 6 ? Math.min(80, 38 + (roadDistanceKm - 6) * 3.2) : 38;
      travelTimeMin = (roadDistanceKm / speedKmh) * 60 + 5;
      break;
    }
    case 'transit':
    default: {
      roadDistanceKm = straightDistKm * 1.22;
      const speedKmh = roadDistanceKm > 10 ? 28 : 22;
      travelTimeMin = (roadDistanceKm / speedKmh) * 60 + 5;
      break;
    }
  }

  return {
    travelTimeMinutes: Math.max(1, Math.round(travelTimeMin)),
    distanceKm: parseFloat(roadDistanceKm.toFixed(1)),
  };
}

/**
 * Calculates commute time and fairness score from an apartment to each person's workplace.
 */
export function calculateApartmentCommute(
  apartment: ApartmentListing,
  profiles: PersonProfile[],
  schedule: CommuteSchedule,
  estimator: (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: TransportMode,
    schedule: CommuteSchedule,
    profile: PersonProfile
  ) => { travelTimeMinutes: number; distanceKm: number } = (orig, dest, mode, sched) =>
    estimateApartmentCommuteTime(orig, dest, mode, sched)
): ApartmentCommuteScore {
  const active = profiles.filter((p) => p.visible);
  if (active.length === 0) {
    return {
      apartmentId: apartment.id,
      personCommutes: [],
      avgCommuteMinutes: 0,
      maxCommuteMinutes: 0,
      commuteSpreadMinutes: 0,
      allWithinLimit: true,
    };
  }

  const personCommutes: PersonCommuteToApartment[] = active.map((p) => {
    const est = estimator(
      { lat: apartment.lat, lng: apartment.lng },
      { lat: p.lat, lng: p.lng },
      p.mode,
      schedule,
      p
    );

    const isWithinLimit = est.travelTimeMinutes <= p.travelTimeMinutes;

    return {
      personId: p.id,
      personName: p.name,
      personColor: p.color,
      travelTimeMinutes: est.travelTimeMinutes,
      limitMinutes: p.travelTimeMinutes,
      isWithinLimit,
      distanceKm: est.distanceKm,
      mode: p.mode,
    };
  });

  const times = personCommutes.map((c) => c.travelTimeMinutes);
  const avgCommuteMinutes = Math.round(times.reduce((a, b) => a + b, 0) / (times.length || 1));
  const maxCommuteMinutes = Math.max(...times);

  let commuteSpreadMinutes = 0;
  if (times.length === 2) {
    commuteSpreadMinutes = Math.round(Math.abs(times[0] - times[1]));
  } else if (times.length > 2) {
    commuteSpreadMinutes = Math.round(Math.max(...times.map((t) => Math.abs(t - avgCommuteMinutes))));
  }

  const allWithinLimit = personCommutes.every((c) => c.isWithinLimit);

  return {
    apartmentId: apartment.id,
    personCommutes,
    avgCommuteMinutes,
    maxCommuteMinutes,
    commuteSpreadMinutes,
    allWithinLimit,
  };
}

/**
 * Filter and sort apartments based on user filter criteria and commute metrics.
 */
export function filterAndRankApartments(
  listings: ApartmentListing[],
  intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null,
  filters: ApartmentFilterSettings,
  profiles: PersonProfile[],
  schedule: CommuteSchedule,
  targetSubArea?: IntersectionSubArea | null
): Array<{ listing: ApartmentListing; score: ApartmentCommuteScore }> {
  let filtered = [...listings];

  // 1. In-Intersection / In-SubArea filter
  if (filters.onlyWithinIntersection) {
    if (targetSubArea?.feature) {
      filtered = filterApartmentsInPolygon(filtered, targetSubArea.feature);
    } else if (intersection) {
      filtered = filterApartmentsInPolygon(filtered, intersection);
    }
  }

  // 2. Price filter (uses priceWarm or priceCold)
  if (filters.maxPriceWarm && filters.maxPriceWarm > 0) {
    filtered = filtered.filter((apt) => {
      const price = apt.priceWarm || apt.priceCold;
      return price <= filters.maxPriceWarm!;
    });
  }

  // 3. Size filter
  if (filters.minSizeSqm && filters.minSizeSqm > 0) {
    filtered = filtered.filter((apt) => apt.sizeSqm >= filters.minSizeSqm!);
  }

  // 4. Rooms filter
  if (filters.minRooms && filters.minRooms > 0) {
    filtered = filtered.filter((apt) => apt.rooms >= filters.minRooms!);
  }

  // 5. Source filter
  if (filters.selectedSources && filters.selectedSources.length > 0) {
    filtered = filtered.filter((apt) => filters.selectedSources!.includes(apt.source));
  }

  // 6. Text search query
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (apt) =>
        apt.title.toLowerCase().includes(q) ||
        apt.address.toLowerCase().includes(q) ||
        (apt.district && apt.district.toLowerCase().includes(q)) ||
        (apt.features && apt.features.some((f) => f.toLowerCase().includes(q)))
    );
  }

  // Calculate scores for all remaining listings
  const itemsWithScores = filtered.map((listing) => ({
    listing,
    score: calculateApartmentCommute(listing, profiles, schedule),
  }));

  // Sorting
  itemsWithScores.sort((a, b) => {
    switch (filters.sortBy) {
      case 'commute_balance':
        // Primary: Both within limit, then lowest combined average commute + spread penalty
        if (a.score.allWithinLimit !== b.score.allWithinLimit) {
          return a.score.allWithinLimit ? -1 : 1;
        }
        const penaltyA = a.score.avgCommuteMinutes + a.score.commuteSpreadMinutes * 0.5;
        const penaltyB = b.score.avgCommuteMinutes + b.score.commuteSpreadMinutes * 0.5;
        return penaltyA - penaltyB;
      case 'price_asc':
        return (a.listing.priceWarm || a.listing.priceCold) - (b.listing.priceWarm || b.listing.priceCold);
      case 'price_desc':
        return (b.listing.priceWarm || b.listing.priceCold) - (a.listing.priceWarm || a.listing.priceCold);
      case 'size_desc':
        return b.listing.sizeSqm - a.listing.sizeSqm;
      case 'rent_sqm_asc': {
        const sqmA = a.listing.priceCold / a.listing.sizeSqm;
        const sqmB = b.listing.priceCold / b.listing.sizeSqm;
        return sqmA - sqmB;
      }
      default:
        return 0;
    }
  });

  return itemsWithScores;
}

/**
 * Loads the current active apartment catalog.
 * Priority:
 * 1. Saved custom listings from localStorage if present
 * 2. Fetched from /data/apartments.json (network)
 * 3. Default bundled Munich listings
 */
export async function loadApartmentCatalog(): Promise<ApartmentListing[]> {
  const custom = loadCustomApartments();
  if (custom && custom.length > 0) {
    inMemoryListings = custom;
    notifyListeners();
    return custom;
  }

  try {
    const res = await fetch('/data/apartments.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      const validated = validateApartmentDataset(data);
      if (validated.valid && validated.listings.length > 0) {
        inMemoryListings = validated.listings;
        notifyListeners();
        return validated.listings;
      }
    }
  } catch (err) {
    console.info('Using bundled default apartments (fetch /data/apartments.json not reachable in local dev):', err);
  }

  inMemoryListings = [...DEFAULT_APARTMENT_LISTINGS];
  notifyListeners();
  return inMemoryListings;
}

export function getLoadedApartments(): ApartmentListing[] {
  return inMemoryListings;
}

export function saveCustomApartments(listings: ApartmentListing[]): void {
  inMemoryListings = listings;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_APARTMENTS, JSON.stringify(listings));
  } catch (e) {
    console.warn('Failed to save apartments to localStorage:', e);
  }
  notifyListeners();
}

export function loadCustomApartments(): ApartmentListing[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_APARTMENTS);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const result = validateApartmentDataset(parsed);
    return result.valid ? result.listings : null;
  } catch {
    return null;
  }
}

export function clearCustomApartments(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_APARTMENTS);
  } catch {}
  inMemoryListings = [...DEFAULT_APARTMENT_LISTINGS];
  notifyListeners();
}

export function subscribeApartments(fn: (listings: ApartmentListing[]) => void): () => void {
  listeners.add(fn);
  fn(inMemoryListings);
  return () => {
    listeners.delete(fn);
  };
}

export function getSavedApartmentFilters(): ApartmentFilterSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FILTER_SETTINGS);
    if (saved) {
      return { ...DEFAULT_APARTMENT_FILTER, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_APARTMENT_FILTER;
}

export function saveApartmentFilters(filters: ApartmentFilterSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_FILTER_SETTINGS, JSON.stringify(filters));
  } catch {}
}
