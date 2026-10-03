import {
  PersonProfile,
  CommuteSchedule,
  TransportMode,
  CalculatedRoute,
  RouteProvider,
  RouteProviderPreference,
} from '../types';
import { getGoogleMapsApiKey, getOrsApiKey } from './isochroneEngine';
import { findShortestTransitTrip, getTransitRegion } from './mvvMatrixService';

export type { RouteProvider, RouteProviderPreference, CalculatedRoute };


// In-memory cache for computed routes
const routeCache = new Map<string, CalculatedRoute>();
const MAX_ROUTE_CACHE_SIZE = 100;

function makeRouteCacheKey(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportMode,
  providerPref: RouteProviderPreference,
  liveTraffic: boolean
): string {
  return `${origin.lat.toFixed(5)}_${origin.lng.toFixed(5)}_${destination.lat.toFixed(5)}_${destination.lng.toFixed(5)}_${mode}_${providerPref}_${liveTraffic ? 1 : 0}`;
}

/**
 * 1. Google Maps External URL Helpers (Free, zero API quota, instant in new tab)
 */

export function getGoogleMapsSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function getGoogleMapsStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function getGoogleMapsDirectionsUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportMode
): string {
  let travelmode = 'driving';
  if (mode === 'transit') travelmode = 'transit';
  if (mode === 'cycling') travelmode = 'bicycling';
  if (mode === 'walking') travelmode = 'walking';

  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}&destination=${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}&travelmode=${travelmode}`;
}

/**
 * Decodes Google Encoded Polyline algorithm into [lat, lng] coordinates.
 */
export function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat * 1e-5, lng * 1e-5]);
  }

  return points;
}

/**
 * 2. Tier 1: OpenRouteService (ORS) Directions API
 */
async function fetchOrsRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportMode,
  apiKey: string
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMinutes: number; steps: string[]; summary: string }> {
  let profile = 'driving-car';
  if (mode === 'cycling') profile = 'cycling-regular';
  if (mode === 'walking') profile = 'foot-walking';

  const url = `https://api.heigit.org/openrouteservice/v2/directions/${profile}/geojson`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': apiKey.trim(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
      instructions: true,
      language: 'de',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouteService HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature || !feature.geometry?.coordinates) {
    throw new Error('OpenRouteService lieferte keine Route');
  }

  // GeoJSON is [lng, lat] -> convert to Leaflet [lat, lng]
  const coordinates: [number, number][] = feature.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  const summary = feature.properties?.summary || {};
  const distanceKm = (summary.distance || 0) / 1000;
  const durationMinutes = Math.round((summary.duration || 0) / 60);

  const steps: string[] = [];
  const segments = feature.properties?.segments || [];
  for (const seg of segments) {
    if (Array.isArray(seg.steps)) {
      for (const step of seg.steps) {
        if (step.instruction) {
          const stepDist = step.distance ? ` (${step.distance < 1000 ? `${Math.round(step.distance)}m` : `${(step.distance / 1000).toFixed(1)}km`})` : '';
          steps.push(`${step.instruction}${stepDist}`);
        }
      }
    }
  }

  return {
    coordinates,
    distanceKm: Number(distanceKm.toFixed(1)),
    durationMinutes,
    steps,
    summary: `${(distanceKm).toFixed(1)} km · ca. ${durationMinutes} Min`,
  };
}

/**
 * 3. Tier 1 Fallback: OSRM (Open Source Routing Machine) Keyless Public API
 */
async function fetchOsrmRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportMode
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMinutes: number; steps: string[]; summary: string }> {
  let profile = 'driving';
  if (mode === 'walking') profile = 'foot';
  if (mode === 'cycling') profile = 'bike';

  const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`OSRM HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(data.message || 'OSRM konnte keine Route berechnen');
  }

  const route = data.routes[0];
  const coordinates: [number, number][] = (route.geometry?.coordinates || []).map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  const distanceKm = (route.distance || 0) / 1000;
  const durationMinutes = Math.round((route.duration || 0) / 60);

  const steps: string[] = [];
  const legs = route.legs || [];
  for (const leg of legs) {
    if (Array.isArray(leg.steps)) {
      for (const step of leg.steps) {
        const stepName = step.name || step.maneuver?.type || 'Straße folgen';
        const stepDist = step.distance ? ` (${Math.round(step.distance)}m)` : '';
        steps.push(`${stepName}${stepDist}`);
      }
    }
  }

  return {
    coordinates,
    distanceKm: Number(distanceKm.toFixed(1)),
    durationMinutes,
    steps,
    summary: `${(distanceKm).toFixed(1)} km · ca. ${durationMinutes} Min`,
  };
}

/**
 * 4. Tier 2: Google Routes API (computeRoutes)
 */
async function fetchGoogleRoutesApi(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportMode,
  apiKey: string,
  liveTraffic: boolean
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMinutes: number; steps: string[]; summary: string; isTrafficAware: boolean }> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('Kein Google Maps API-Key hinterlegt');
  }

  let travelMode = 'DRIVE';
  let routingPreference: string | undefined = undefined;

  if (mode === 'cycling') travelMode = 'BICYCLE';
  else if (mode === 'walking') travelMode = 'WALK';
  else if (mode === 'transit') travelMode = 'TRANSIT';
  else {
    // DRIVE
    travelMode = 'DRIVE';
    routingPreference = liveTraffic ? 'TRAFFIC_AWARE' : 'TRAFFIC_UNAWARE';
  }

  const payload: Record<string, any> = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    travelMode,
    computeAlternativeRoutes: false,
    languageCode: 'de-DE',
    units: 'METRIC',
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  };

  // Google Routes API strictly requires routingPreference ONLY for DRIVE / TWO_WHEELER
  if (routingPreference && (travelMode === 'DRIVE' || travelMode === 'TWO_WHEELER')) {
    payload.routingPreference = routingPreference;
  }

  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': trimmedKey,
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.legs.steps',
      'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    const msg = errJson?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Google Routes API: ${msg}`);
  }

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) {
    throw new Error('Google Routes API hat keine Route gefunden');
  }

  const encodedPolyline = route.polyline?.encodedPolyline || '';
  const coordinates = encodedPolyline ? decodeGooglePolyline(encodedPolyline) : [];

  // duration format is like "1420s"
  let durationSec = 0;
  if (route.duration) {
    durationSec = parseInt(route.duration.replace('s', ''), 10) || 0;
  }
  const durationMinutes = Math.round(durationSec / 60);
  const distanceKm = Number(((route.distanceMeters || 0) / 1000).toFixed(1));

  const steps: string[] = [];
  const legs = route.legs || [];
  for (const leg of legs) {
    if (Array.isArray(leg.steps)) {
      for (const step of leg.steps) {
        if (step.navigationInstruction?.instructions) {
          steps.push(step.navigationInstruction.instructions);
        } else if (step.transitDetails) {
          const td = step.transitDetails;
          const lineName = td.transitLine?.name || td.transitLine?.shortName || 'ÖPNV';
          const headsign = td.headsign ? ` Richtung ${td.headsign}` : '';
          const stops = td.stopCount ? ` (${td.stopCount} Haltestellen)` : '';
          steps.push(`${lineName}${headsign}${stops}`);
        }
      }
    }
  }

  return {
    coordinates,
    distanceKm,
    durationMinutes,
    steps,
    summary: route.description || `${distanceKm} km · ca. ${durationMinutes} Min`,
    isTrafficAware: travelMode === 'DRIVE' && liveTraffic,
  };
}

/**
 * 5. Main On-Demand Route Calculation Orchestrator
 */
export async function calculatePersonRoute(
  origin: { lat: number; lng: number },
  profile: PersonProfile,
  schedule: CommuteSchedule,
  preferredProvider: RouteProviderPreference = 'auto'
): Promise<CalculatedRoute> {
  const destination = { lat: profile.lat, lng: profile.lng };
  const liveTraffic = schedule.options?.liveTraffic ?? false;
  const googleKey = getGoogleMapsApiKey();
  const orsKey = getOrsApiKey();

  // Check cache first
  const cacheKey = makeRouteCacheKey(origin, destination, profile.mode, preferredProvider, liveTraffic);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Determine which provider to attempt first
  const shouldTryGoogle =
    Boolean(googleKey) &&
    (preferredProvider === 'google' || (preferredProvider === 'auto' && profile.mode === 'transit'));

  // 1. Google Routes API (if chosen or for auto transit with key)
  if (shouldTryGoogle) {
    try {
      const gRes = await fetchGoogleRoutesApi(origin, destination, profile.mode, googleKey, liveTraffic);
      const result: CalculatedRoute = {
        personId: profile.id,
        personName: profile.name,
        personColor: profile.color,
        mode: profile.mode,
        origin,
        destination,
        coordinates: gRes.coordinates,
        distanceKm: gRes.distanceKm,
        durationMinutes: gRes.durationMinutes,
        provider: 'google',
        providerLabel: gRes.isTrafficAware ? 'Google Routes (Live-Verkehr)' : 'Google Routes API',
        summary: gRes.summary,
        steps: gRes.steps,
        isTrafficAware: gRes.isTrafficAware,
      };
      if (routeCache.size >= MAX_ROUTE_CACHE_SIZE) {
        const oldest = routeCache.keys().next().value;
        if (oldest) routeCache.delete(oldest);
      }
      routeCache.set(cacheKey, result);
      return result;
    } catch (err: any) {
      console.warn('[RouteService] Google Routes API failed, attempting open-source fallback:', err);
      // If user strictly requested Google, return error rather than falling back silently
      if (preferredProvider === 'google') {
        return {
          personId: profile.id,
          personName: profile.name,
          personColor: profile.color,
          mode: profile.mode,
          origin,
          destination,
          coordinates: [],
          distanceKm: 0,
          durationMinutes: 0,
          provider: 'google',
          providerLabel: 'Google Routes API',
          error: err?.message || 'Google Routes API fehlgeschlagen',
        };
      }
    }
  }

  // 2. Transit Mode: Open-Source MVV Station Matrix Route
  if (profile.mode === 'transit') {
    const transitTrip = findShortestTransitTrip(origin, destination, profile, undefined, schedule.options, schedule);
    if (transitTrip && transitTrip.routeFound) {
      // Connect origin -> destination direct line or through transit stations if available
      const coords: [number, number][] = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ];
      const result: CalculatedRoute = {
        personId: profile.id,
        personName: profile.name,
        personColor: profile.color,
        mode: 'transit',
        origin,
        destination,
        coordinates: coords,
        distanceKm: Number(
          (
            Math.sqrt(
              Math.pow((origin.lat - destination.lat) * 111.3, 2) +
                Math.pow((origin.lng - destination.lng) * 71.5, 2)
            ) * 1.2
          ).toFixed(1)
        ),
        durationMinutes: transitTrip.travelTimeMinutes,
        provider: 'mvv',
        providerLabel: `ÖPNV (${getTransitRegion().name})`,
        summary: `${transitTrip.linesUsed.join(', ') || 'ÖPNV'} · ${transitTrip.travelTimeMinutes} Min`,
        steps: transitTrip.steps,
      };
      routeCache.set(cacheKey, result);
      return result;
    }
  }

  // 3. OpenRouteService (if ORS key available)
  if (orsKey && profile.mode !== 'transit') {
    try {
      const orsRes = await fetchOrsRoute(origin, destination, profile.mode, orsKey);
      const result: CalculatedRoute = {
        personId: profile.id,
        personName: profile.name,
        personColor: profile.color,
        mode: profile.mode,
        origin,
        destination,
        coordinates: orsRes.coordinates,
        distanceKm: orsRes.distanceKm,
        durationMinutes: orsRes.durationMinutes,
        provider: 'ors',
        providerLabel: 'OpenRouteService (OSM)',
        summary: orsRes.summary,
        steps: orsRes.steps,
      };
      routeCache.set(cacheKey, result);
      return result;
    } catch (err: any) {
      console.warn('[RouteService] ORS failed, falling back to OSRM:', err);
    }
  }

  // 4. OSRM Keyless Fallback
  try {
    const osrmRes = await fetchOsrmRoute(origin, destination, profile.mode);
    const result: CalculatedRoute = {
      personId: profile.id,
      personName: profile.name,
      personColor: profile.color,
      mode: profile.mode,
      origin,
      destination,
      coordinates: osrmRes.coordinates,
      distanceKm: osrmRes.distanceKm,
      durationMinutes: osrmRes.durationMinutes,
      provider: 'osrm',
      providerLabel: 'OSRM (OpenStreetMap)',
      summary: osrmRes.summary,
      steps: osrmRes.steps,
    };
    routeCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    return {
      personId: profile.id,
      personName: profile.name,
      personColor: profile.color,
      mode: profile.mode,
      origin,
      destination,
      coordinates: [],
      distanceKm: 0,
      durationMinutes: 0,
      provider: 'osrm',
      providerLabel: 'Routenberechnung',
      error: err?.message || 'Keine Route ermittelbar',
    };
  }
}

/**
 * Calculates on-demand routes for all active, visible persons
 */
export async function calculateAllRoutes(
  origin: { lat: number; lng: number },
  profiles: PersonProfile[],
  schedule: CommuteSchedule,
  preferredProvider: RouteProviderPreference = 'auto'
): Promise<CalculatedRoute[]> {
  const visibleProfiles = profiles.filter((p) => p.visible !== false);
  const promises = visibleProfiles.map((p) =>
    calculatePersonRoute(origin, p, schedule, preferredProvider)
  );
  return Promise.all(promises);
}

export function clearRouteCache(): void {
  routeCache.clear();
}
