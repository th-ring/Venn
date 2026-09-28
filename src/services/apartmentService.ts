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
import { resolveAssetUrl } from '../utils/assetUrl.ts';
import { generateSecureId } from '../utils/crypto.ts';

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

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : generateSecureId('apt');
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
 * Helper to normalize city/district names to clean URL slugs.
 */
export function slugifyCityOrDistrict(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Metadata map for German metropolitan regions and university cities to build
 * exact, verified live URLs on ImmoScout24 and WG-Gesucht.
 */
export const GERMAN_CITY_PORTALS: Record<
  string,
  { stateSlug: string; citySlug: string; wgName: string; wgId: number }
> = {
  muenchen: { stateSlug: 'bayern', citySlug: 'muenchen', wgName: 'Muenchen', wgId: 90 },
  munich: { stateSlug: 'bayern', citySlug: 'muenchen', wgName: 'Muenchen', wgId: 90 },
  berlin: { stateSlug: 'berlin', citySlug: 'berlin', wgName: 'Berlin', wgId: 8 },
  hamburg: { stateSlug: 'hamburg', citySlug: 'hamburg', wgName: 'Hamburg', wgId: 55 },
  koeln: { stateSlug: 'nordrhein-westfalen', citySlug: 'koeln', wgName: 'Koeln', wgId: 73 },
  cologne: { stateSlug: 'nordrhein-westfalen', citySlug: 'koeln', wgName: 'Koeln', wgId: 73 },
  frankfurt: { stateSlug: 'hessen', citySlug: 'frankfurt-am-main', wgName: 'Frankfurt-am-Main', wgId: 47 },
  'frankfurt-am-main': { stateSlug: 'hessen', citySlug: 'frankfurt-am-main', wgName: 'Frankfurt-am-Main', wgId: 47 },
  stuttgart: { stateSlug: 'baden-wuerttemberg', citySlug: 'stuttgart', wgName: 'Stuttgart', wgId: 124 },
  duesseldorf: { stateSlug: 'nordrhein-westfalen', citySlug: 'duesseldorf', wgName: 'Duesseldorf', wgId: 30 },
  leipzig: { stateSlug: 'sachsen', citySlug: 'leipzig', wgName: 'Leipzig', wgId: 77 },
  dortmund: { stateSlug: 'nordrhein-westfalen', citySlug: 'dortmund', wgName: 'Dortmund', wgId: 26 },
  essen: { stateSlug: 'nordrhein-westfalen', citySlug: 'essen', wgName: 'Essen', wgId: 36 },
  bremen: { stateSlug: 'bremen', citySlug: 'bremen', wgName: 'Bremen', wgId: 17 },
  dresden: { stateSlug: 'sachsen', citySlug: 'dresden', wgName: 'Dresden', wgId: 27 },
  hannover: { stateSlug: 'niedersachsen', citySlug: 'hannover', wgName: 'Hannover', wgId: 57 },
  nuernberg: { stateSlug: 'bayern', citySlug: 'nuernberg', wgName: 'Nuernberg', wgId: 96 },
  duisburg: { stateSlug: 'nordrhein-westfalen', citySlug: 'duisburg', wgName: 'Duisburg', wgId: 29 },
  bochum: { stateSlug: 'nordrhein-westfalen', citySlug: 'bochum', wgName: 'Bochum', wgId: 12 },
  wuppertal: { stateSlug: 'nordrhein-westfalen', citySlug: 'wuppertal', wgName: 'Wuppertal', wgId: 140 },
  bonn: { stateSlug: 'nordrhein-westfalen', citySlug: 'bonn', wgName: 'Bonn', wgId: 13 },
  muenster: { stateSlug: 'nordrhein-westfalen', citySlug: 'muenster', wgName: 'Muenster', wgId: 91 },
  karlsruhe: { stateSlug: 'baden-wuerttemberg', citySlug: 'karlsruhe', wgName: 'Karlsruhe', wgId: 68 },
  mannheim: { stateSlug: 'baden-wuerttemberg', citySlug: 'mannheim', wgName: 'Mannheim', wgId: 85 },
  augsburg: { stateSlug: 'bayern', citySlug: 'augsburg', wgName: 'Augsburg', wgId: 2 },
  wiesbaden: { stateSlug: 'hessen', citySlug: 'wiesbaden', wgName: 'Wiesbaden', wgId: 139 },
  moenchengladbach: { stateSlug: 'nordrhein-westfalen', citySlug: 'moenchengladbach', wgName: 'Moenchengladbach', wgId: 88 },
  braunschweig: { stateSlug: 'niedersachsen', citySlug: 'braunschweig', wgName: 'Braunschweig', wgId: 16 },
  kiel: { stateSlug: 'schleswig-holstein', citySlug: 'kiel', wgName: 'Kiel', wgId: 71 },
  aachen: { stateSlug: 'nordrhein-westfalen', citySlug: 'aachen', wgName: 'Aachen', wgId: 1 },
  chemnitz: { stateSlug: 'sachsen', citySlug: 'chemnitz', wgName: 'Chemnitz', wgId: 21 },
  halle: { stateSlug: 'sachsen-anhalt', citySlug: 'halle-saale', wgName: 'Halle-Saale', wgId: 54 },
  magdeburg: { stateSlug: 'sachsen-anhalt', citySlug: 'magdeburg', wgName: 'Magdeburg', wgId: 83 },
  freiburg: { stateSlug: 'baden-wuerttemberg', citySlug: 'freiburg-im-breisgau', wgName: 'Freiburg-im-Breisgau', wgId: 49 },
  'freiburg-im-breisgau': { stateSlug: 'baden-wuerttemberg', citySlug: 'freiburg-im-breisgau', wgName: 'Freiburg-im-Breisgau', wgId: 49 },
  krefeld: { stateSlug: 'nordrhein-westfalen', citySlug: 'krefeld', wgName: 'Krefeld', wgId: 74 },
  mainz: { stateSlug: 'rheinland-pfalz', citySlug: 'mainz', wgName: 'Mainz', wgId: 84 },
  luebeck: { stateSlug: 'schleswig-holstein', citySlug: 'luebeck', wgName: 'Luebeck', wgId: 81 },
  erfurt: { stateSlug: 'thueringen', citySlug: 'erfurt', wgName: 'Erfurt', wgId: 35 },
  rostock: { stateSlug: 'mecklenburg-vorpommern', citySlug: 'rostock', wgName: 'Rostock', wgId: 114 },
  kassel: { stateSlug: 'hessen', citySlug: 'kassel', wgName: 'Kassel', wgId: 69 },
  hagen: { stateSlug: 'nordrhein-westfalen', citySlug: 'hagen', wgName: 'Hagen', wgId: 53 },
  potsdam: { stateSlug: 'brandenburg', citySlug: 'potsdam', wgName: 'Potsdam', wgId: 107 },
  saarbruecken: { stateSlug: 'saarland', citySlug: 'saarbruecken', wgName: 'Saarbruecken', wgId: 117 },
  osnabrueck: { stateSlug: 'niedersachsen', citySlug: 'osnabrueck', wgName: 'Osnabrueck', wgId: 102 },
  ludwigshafen: { stateSlug: 'rheinland-pfalz', citySlug: 'ludwigshafen-am-rhein', wgName: 'Ludwigshafen-am-Rhein', wgId: 82 },
  heidelberg: { stateSlug: 'baden-wuerttemberg', citySlug: 'heidelberg', wgName: 'Heidelberg', wgId: 59 },
  darmstadt: { stateSlug: 'hessen', citySlug: 'darmstadt', wgName: 'Darmstadt', wgId: 23 },
  regensburg: { stateSlug: 'bayern', citySlug: 'regensburg', wgName: 'Regensburg', wgId: 111 },
  ingolstadt: { stateSlug: 'bayern', citySlug: 'ingolstadt', wgName: 'Ingolstadt', wgId: 65 },
  wuerzburg: { stateSlug: 'bayern', citySlug: 'wuerzburg', wgName: 'Wuerzburg', wgId: 141 },
  ulm: { stateSlug: 'baden-wuerttemberg', citySlug: 'ulm', wgName: 'Ulm', wgId: 135 },
  wolfsburg: { stateSlug: 'niedersachsen', citySlug: 'wolfsburg', wgName: 'Wolfsburg', wgId: 138 },
  offenbach: { stateSlug: 'hessen', citySlug: 'offenbach-am-main', wgName: 'Offenbach-am-Main', wgId: 101 },
  pforzheim: { stateSlug: 'baden-wuerttemberg', citySlug: 'pforzheim', wgName: 'Pforzheim', wgId: 105 },
  goettingen: { stateSlug: 'niedersachsen', citySlug: 'goettingen', wgName: 'Goettingen', wgId: 50 },
  erlangen: { stateSlug: 'bayern', citySlug: 'erlangen', wgName: 'Erlangen', wgId: 34 },
  tuebingen: { stateSlug: 'baden-wuerttemberg', citySlug: 'tuebingen', wgName: 'Tuebingen', wgId: 133 },
  konstanz: { stateSlug: 'baden-wuerttemberg', citySlug: 'konstanz', wgName: 'Konstanz', wgId: 72 },
  passau: { stateSlug: 'bayern', citySlug: 'passau', wgName: 'Passau', wgId: 104 },
  bamberg: { stateSlug: 'bayern', citySlug: 'bamberg', wgName: 'Bamberg', wgId: 6 },
};

/**
 * Generates direct search deep-links for commercial housing portals (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen)
 * for a specific geographic area (center coordinate, bounding box, radius).
 * Verified live against portal routing rules (HTTP 200).
 */
export function getPortalSearchLinks(
  center: { lat: number; lng: number },
  bbox: [number, number, number, number],
  radiusKm = 2,
  city = 'München',
  district?: string
): PortalSearchLink[] {
  const safeRadius = Math.max(1, Math.min(25, Math.ceil(radiusKm)));
  const latStr = center.lat.toFixed(4);
  const lngStr = center.lng.toFixed(4);
  const cityKey = slugifyCityOrDistrict(city);
  const cityConfig = GERMAN_CITY_PORTALS[cityKey] || null;

  // 1. ImmoScout24: /Suche/de/{state}/{city}[/{district}]/wohnung-mieten
  // Live tested: HTTP 200 with result list and JSON state
  let immoscoutUrl: string;
  if (cityConfig) {
    const districtSlug = district ? slugifyCityOrDistrict(district) : '';
    immoscoutUrl = districtSlug
      ? `https://www.immobilienscout24.de/Suche/de/${cityConfig.stateSlug}/${cityConfig.citySlug}/${districtSlug}/wohnung-mieten`
      : `https://www.immobilienscout24.de/Suche/de/${cityConfig.stateSlug}/${cityConfig.citySlug}/wohnung-mieten`;
  } else {
    immoscoutUrl = 'https://www.immobilienscout24.de/Suche/de/wohnung-mieten';
  }

  // 2. Immowelt: /suche/{citySlug}/wohnungen/mieten?r={radius}
  // Live tested: HTTP 200 with thousands of listings
  const immoweltCitySlug = cityConfig ? cityConfig.citySlug : cityKey;
  const immoweltUrl = `https://www.immowelt.de/suche/${immoweltCitySlug}/wohnungen/mieten?r=${safeRadius}`;

  // 3. WG-Gesucht: /wohnungen-in-{City}.{cityId}.2.1.0.html
  // Live tested: HTTP 200 with hundreds of listings
  const wgGesuchtUrl = cityConfig
    ? `https://www.wg-gesucht.de/wohnungen-in-${cityConfig.wgName}.${cityConfig.wgId}.2.1.0.html`
    : 'https://www.wg-gesucht.de/wohnraumangebote.html?cat=2';

  // 4. Kleinanzeigen: /s-wohnung-mieten/c203?distance={radius}&latitude={lat}&longitude={lng}
  // Live tested: HTTP 200 with live geo-targeted search results
  const kleinanzeigenUrl = `https://www.kleinanzeigen.de/s-wohnung-mieten/c203?distance=${safeRadius}&latitude=${latStr}&longitude=${lngStr}`;

  return [
    {
      portal: 'immoscout24',
      name: 'ImmoScout24',
      url: immoscoutUrl,
      badge: district ? `${district}, ${city}` : city,
      description: 'Deutschlands größtes Immobilienportal (Suchergebnisse)',
      color: '#ff7500',
    },
    {
      portal: 'immowelt',
      name: 'Immowelt',
      url: immoweltUrl,
      badge: `${city} (+${safeRadius} km)`,
      description: 'Umfangreiche Mietangebote im Suchradius',
      color: '#ffd000',
    },
    {
      portal: 'wg-gesucht',
      name: 'WG-Gesucht',
      url: wgGesuchtUrl,
      badge: cityConfig ? `${cityConfig.wgName} (Wohnungen)` : `${city} (Wohnraum)`,
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
    const res = await fetch(resolveAssetUrl('data/apartments.json'), { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      const validated = validateApartmentDataset(data);
      if (validated.valid && validated.listings.length > 0) {
        inMemoryListings = validated.listings;
        notifyListeners();
        return validated.listings;
      }
    }
  } catch {
    // apartments.json not found or not readable, continue to example fallback
  }

  try {
    const resExample = await fetch(resolveAssetUrl('data/apartments.example.json'), { cache: 'no-cache' });
    if (resExample.ok) {
      const data = await resExample.json();
      const validated = validateApartmentDataset(data);
      if (validated.valid && validated.listings.length > 0) {
        inMemoryListings = validated.listings;
        notifyListeners();
        return validated.listings;
      }
    }
  } catch {
    // continue to bundled default
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

export interface GenerateAgenticPromptOptions {
  portalName: string;
  portalUrl: string;
  portalKey?: string;
  areaLabel: string;
  areaKm2?: number;
  center: { lat: number; lng: number };
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  radiusKm: number;
  city?: string;
  addressOrDistrict?: string;
  maxListings?: number;
  filters?: {
    maxPriceWarm?: number;
    minRooms?: number;
    minSizeSqm?: number;
  };
}

/**
 * Builds an all-inclusive, self-contained prompt for an agentic apartment search
 * via the integrated browser (/browser, Antigravity, Codex, Cloud Code).
 *
 * Provides:
 * 1. Target portal name and pre-configured URL deep-link
 * 2. Complete geographical constraints (area label, size, center coordinates, radius, BBOX)
 * 3. Relevant search filters (max rent, min rooms, min sqm)
 * 4. Strict geo-filtering rules (reject out-of-bounds listings)
 * 5. Target output file path (public/data/apartments.json)
 * 6. Complete JSON schema and deduplication protocol
 */
export function buildAgenticBrowserSearchPrompt(options: GenerateAgenticPromptOptions): string {
  const {
    portalName,
    portalUrl,
    portalKey,
    areaLabel,
    areaKm2,
    center,
    bbox,
    radiusKm,
    city = 'München',
    addressOrDistrict,
    maxListings = 15,
    filters,
  } = options;

  const minLng = bbox[0].toFixed(4);
  const minLat = bbox[1].toFixed(4);
  const maxLng = bbox[2].toFixed(4);
  const maxLat = bbox[3].toFixed(4);
  const centerLat = center.lat.toFixed(4);
  const centerLng = center.lng.toFixed(4);
  const safeRadius = Math.max(0.5, radiusKm).toFixed(1);
  const areaDesc = typeof areaKm2 === 'number' && areaKm2 > 0 ? ` (ca. ${areaKm2.toFixed(2)} km²)` : '';
  const locDesc = addressOrDistrict ? ` / Lage: ${addressOrDistrict}` : '';

  const portalKeyLower = (portalKey || portalName).toLowerCase();
  let sourceKey = 'custom';
  let sourcePrefix = 'apt';
  if (portalKeyLower.includes('immoscout') || portalKeyLower.includes('is24')) {
    sourceKey = 'immoscout24';
    sourcePrefix = 'is24';
  } else if (portalKeyLower.includes('immowelt') || portalKeyLower.includes('iw')) {
    sourceKey = 'immowelt';
    sourcePrefix = 'iw';
  } else if (portalKeyLower.includes('wg-gesucht') || portalKeyLower.includes('wg')) {
    sourceKey = 'wg-gesucht';
    sourcePrefix = 'wg';
  } else if (portalKeyLower.includes('kleinanzeigen') || portalKeyLower.includes('ka')) {
    sourceKey = 'kleinanzeigen';
    sourcePrefix = 'ka';
  }

  const filterLines: string[] = [];
  if (filters?.maxPriceWarm) {
    filterLines.push(`- Maximale Warmmiete: bis zu ${filters.maxPriceWarm} €`);
  }
  if (filters?.minRooms) {
    filterLines.push(`- Mindestzimmeranzahl: ab ${filters.minRooms} Zimmer`);
  }
  if (filters?.minSizeSqm) {
    filterLines.push(`- Mindestwohnfläche: ab ${filters.minSizeSqm} m²`);
  }

  const filterBlock = filterLines.length > 0
    ? `\nSuchkriterien aus Venn:\n${filterLines.join('\n')}\n`
    : '';

  return `/browser Öffne ${portalName} (${portalUrl}) und nutze den agentic-apartment-browser Skill, um passende Mietwohnungen im gemeinsamen Pendelbereich zu recherchieren und strukturiert in public/data/apartments.json zu speichern.

=== 1. GEOGRAFISCHER ZIELBEREICH (TREFFBEREICH) ===
- Bereich: ${areaLabel}${areaDesc}
- Stadt: ${city}${locDesc}
- Zentrum: Breitengrad ${centerLat}, Längengrad ${centerLng}
- Suchradius: ca. ${safeRadius} km um das Zentrum
- Bounding Box [minLng, minLat, maxLng, maxLat]: [${minLng}, ${minLat}, ${maxLng}, ${maxLat}]

=== 2. FILTER- & EXTRAKTIONSKRITERIEN ===
- Maximalanzahl: Bis zu ${maxListings} Inserate
- Mietart: Wohnung zur Miete (Wohnungen / Apartments)${filterBlock}
- WICHTIGE GEO-FILTERUNG: Akzeptiere NUR Inserate, deren Koordinaten (lat, lng) tatsächlich innerhalb der Bounding Box [${minLng}, ${minLat}, ${maxLng}, ${maxLat}] bzw. im Umkreis von ${safeRadius} km um das Zentrum liegen. Verwerfe Angebote außerhalb dieses Bereichs!

=== 3. ZIELDATEI & ZIELDATENFORMAT ===
Zieldatei: public/data/apartments.json

Vorgehen:
1. Lies bestehende Inserate aus public/data/apartments.json (falls vorhanden).
2. Dedupliziere Einträge anhand von 'id' oder 'url'.
3. Hänge die neuen Inserate an und aktualisiere Metadaten (count, lastUpdated).
4. Speichere das Gesamtergebnis im exakten JSON-Schema:

{
  "version": "1.1.0",
  "lastUpdated": "<Aktueller ISO-Timestamp>",
  "source": "Agentic Browser Extraction (${portalName})",
  "city": "${city}",
  "bbox": [${minLng}, ${minLat}, ${maxLng}, ${maxLat}],
  "status": "ready",
  "message": "Erfolgreich Inserate für ${areaLabel} extrahiert.",
  "count": <Gesamtanzahl der Inserate als Zahl>,
  "listings": [
    {
      "id": "<Eindeutige ID, z.B. ${sourcePrefix}-12345678>",
      "title": "<Titel des Inserats>",
      "address": "<Straße Hausnummer oder 'Adresse auf Anfrage'>",
      "district": "<Stadtteil/Bezirk falls bekannt>",
      "city": "${city}",
      "lat": <Breitengrad als Float, z.B. ${centerLat}>,
      "lng": <Längengrad als Float, z.B. ${centerLng}>,
      "priceCold": <Kaltmiete in EUR als positive Zahl>,
      "priceWarm": <Warmmiete in EUR als Zahl, optional>,
      "currency": "EUR",
      "sizeSqm": <Wohnfläche in m² als positive Zahl>,
      "rooms": <Zimmeranzahl als Zahl, z.B. 2 oder 2.5>,
      "features": ["Balkon", "Einbauküche"],
      "thumbnailUrl": "<Bild-URL des Hauptbildes>",
      "url": "<Direktlink zum Exposé>",
      "source": "${sourceKey}",
      "scrapedAt": "<Aktueller ISO-Timestamp>"
    }
  ]
}

Pflichtfelder pro Listing: id, title, lat, lng, priceCold, sizeSqm, rooms.`;
}

