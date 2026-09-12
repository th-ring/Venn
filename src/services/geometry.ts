import * as turf from '@turf/turf';
import { PersonProfile, FallbackSuggestion } from '../types';

/**
 * Calculates the intersection of an array of GeoJSON Polygons or MultiPolygons.
 * Handles Turf v7 (featureCollection input) and earlier v6 signatures safely.
 */
export function calculateMultiIntersection(
  polygons: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null {
  if (!polygons || polygons.length === 0) return null;
  if (polygons.length === 1) return polygons[0];

  let currentResult: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null = polygons[0];

  for (let i = 1; i < polygons.length; i++) {
    const nextPoly = polygons[i];
    if (!currentResult) return null;

    try {
      // In Turf v7: turf.intersect(featureCollection([p1, p2]))
      // Let's support both Turf v7 and legacy signatures
      let intersected: any = null;
      try {
        const fc = turf.featureCollection([currentResult as any, nextPoly]);
        intersected = (turf.intersect as any)(fc);
      } catch {
        // Fallback to 2-arg signature
        intersected = (turf.intersect as any)(currentResult, nextPoly);
      }

      if (!intersected || !intersected.geometry) {
        return null;
      }

      // Clean geometry coordinates if needed
      currentResult = intersected;
    } catch (err) {
      console.warn('Intersection step failed:', err);
      return null;
    }
  }

  return currentResult;
}

/**
 * Calculates the area in square kilometers of a GeoJSON feature
 */
export function calculateAreaKm2(
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null
): number {
  if (!feature) return 0;
  try {
    const areaM2 = turf.area(feature as any);
    return Math.round((areaM2 / 1_000_000) * 100) / 100;
  } catch {
    return 0;
  }
}

/**
 * Checks if a coordinate [lng, lat] is inside a polygon or multipolygon
 */
export function isPointInPolygon(
  coord: [number, number], // [lng, lat]
  polygonFeature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null
): boolean {
  if (!polygonFeature) return false;
  try {
    const pt = turf.point(coord);
    const geom = polygonFeature.geometry;
    if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      return turf.booleanPointInPolygon(pt, polygonFeature as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
    }
    if (geom.type === 'GeometryCollection') {
      for (const g of geom.geometries) {
        if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
          if (turf.booleanPointInPolygon(pt, turf.feature(g) as any)) return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Calculates distance in kilometers between two coords
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const from = turf.point([lng1, lat1]);
  const to = turf.point([lng2, lat2]);
  return Math.round(turf.distance(from, to, { units: 'kilometers' }) * 10) / 10;
}

/**
 * Generates smart suggestions when the intersection is empty (FR-3.3 Fallback-Handling)
 */
export function generateEmptyIntersectionSuggestions(
  profiles: PersonProfile[]
): FallbackSuggestion[] {
  const active = profiles.filter((p) => p.visible);
  if (active.length < 2) return [];

  const suggestions: FallbackSuggestion[] = [];

  // 1. Calculate pairwise distances between destinations
  let maxPairDist = 0;
  let furthestPair: [PersonProfile, PersonProfile] = [active[0], active[1]];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const d = calculateDistanceKm(active[i].lat, active[i].lng, active[j].lat, active[j].lng);
      if (d > maxPairDist) {
        maxPairDist = d;
        furthestPair = [active[i], active[j]];
      }
    }
  }

  const [pA, pB] = furthestPair;

  // Suggestion 1: Check if one profile has a very low travel time
  const lowestTimeProfile = [...active].sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes)[0];
  if (lowestTimeProfile.travelTimeMinutes < 60) {
    const bump = Math.min(lowestTimeProfile.travelTimeMinutes + 15, 90);
    suggestions.push({
      id: `bump-${lowestTimeProfile.id}`,
      type: 'increase_time',
      title: `Reisezeit für ${lowestTimeProfile.name} anheben`,
      description: `Erhöhe die maximale Zeit von ${lowestTimeProfile.travelTimeMinutes} Min auf ${bump} Min (+15 Min), um das Erreichbarkeitspolygon auszuweiten.`,
      personId: lowestTimeProfile.id,
      suggestedMinutes: bump,
    });
  }

  // Suggestion 2: Check if someone is on foot or bicycle while distance is large
  const slowModeProfile = active.find((p) => p.mode === 'walking' || p.mode === 'cycling');
  if (slowModeProfile && maxPairDist > 8) {
    const targetMode = slowModeProfile.mode === 'walking' ? 'cycling' : 'transit';
    const modeLabel = targetMode === 'cycling' ? 'Fahrrad' : (targetMode === 'transit' ? 'ÖPNV' : 'Pkw');
    suggestions.push({
      id: `mode-${slowModeProfile.id}`,
      type: 'change_mode',
      title: `Verkehrsmittel für ${slowModeProfile.name} wechseln`,
      description: `Die Distanz zwischen den Zielorten beträgt ca. ${maxPairDist} km. Ein Wechsel zu ${modeLabel} vergrößert den Aktionsradius spürbar.`,
      personId: slowModeProfile.id,
      suggestedMode: targetMode,
    });
  }

  // Suggestion 3: Mutual increase
  suggestions.push({
    id: 'mutual-bump',
    type: 'mutual_increase',
    title: 'Reisezeit aller Profile moderat erhöhen',
    description: 'Erhöhe die Reisezeit aller Beteiligten um je +10 Minuten, um einen gemeinsamen Lebensraum zu erschließen.',
  });

  return suggestions;
}
