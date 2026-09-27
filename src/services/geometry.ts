import * as turf from '@turf/turf';
import type { PersonProfile, FallbackSuggestion } from '../types.ts';

/**
 * Calculates the intersection of an array of GeoJSON Polygons or MultiPolygons.
 * Uses Turf v7 FeatureCollection multi-intersection with robust pairwise fallback.
 */
export function calculateMultiIntersection(
  polygons: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null {
  if (!polygons || polygons.length === 0) return null;
  if (polygons.length === 1) return polygons[0];

  // Turf v7 fast path: intersect all features at once via FeatureCollection
  try {
    const fc = turf.featureCollection(polygons);
    const intersected = turf.intersect(fc);
    if (!intersected || !intersected.geometry) {
      return null;
    }
    return intersected;
  } catch {
    // Pairwise fallback for complex or edge-case geometries
    let currentResult: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null = polygons[0];

    for (let i = 1; i < polygons.length; i++) {
      const nextPoly = polygons[i];
      if (!currentResult) return null;

      try {
        const pair: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = [
          currentResult as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
          nextPoly,
        ];
        const step = turf.intersect(turf.featureCollection(pair));
        if (!step || !step.geometry) {
          return null;
        }
        currentResult = step;
      } catch (err) {
        console.warn('Pairwise intersection step failed:', err);
        return null;
      }
    }

    return currentResult;
  }
}

/**
 * Removes interior rings (holes) from a Polygon or MultiPolygon feature.
 * Preserves the outer boundary (coordinates[0]) of each polygon component,
 * effectively filling artificial voids or unreached pockets (e.g. from Google Maps Isochrones API preview artifacts).
 */
export function fillPolygonHoles<T extends GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>(
  feature: T
): T {
  if (!feature || !feature.geometry) return feature;

  if (feature.geometry.type === 'Polygon') {
    return {
      ...feature,
      geometry: {
        type: 'Polygon',
        coordinates: [feature.geometry.coordinates[0]],
      },
    };
  }

  if (feature.geometry.type === 'MultiPolygon') {
    return {
      ...feature,
      geometry: {
        type: 'MultiPolygon',
        coordinates: feature.geometry.coordinates.map((polyCoords) => [polyCoords[0]]),
      },
    };
  }

  return feature;
}

/**
 * Calculates the area in square kilometers of a GeoJSON feature
 */
export function calculateAreaKm2(
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null
): number {
  if (!feature) return 0;
  try {
    const areaM2 = turf.area(feature);
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
          if (turf.booleanPointInPolygon(pt, turf.feature(g) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)) {
            return true;
          }
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
 * Calculates a representative interior center point for a polygon or multipolygon.
 * Uses turf.pointOnFeature to ensure the coordinate is guaranteed to lie inside the feature.
 */
export function getPolygonCenter(
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null
): [number, number] | null {
  if (!feature || !feature.geometry) return null;
  try {
    const pt = turf.pointOnFeature(feature as any);
    if (pt && pt.geometry && pt.geometry.coordinates) {
      return [pt.geometry.coordinates[0], pt.geometry.coordinates[1]]; // [lng, lat]
    }
  } catch (err) {
    console.warn('Failed to calculate polygon center:', err);
  }
  return null;
}

/**
 * Extracts a balanced set of coordinates (up to maxPoints) within and along the perimeter
 * of the polygon feature to evaluate travel time spread (min, max, spread) across the area.
 */
export function samplePolygonPoints(
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null,
  maxPoints = 20
): Array<[number, number]> {
  if (!feature || !feature.geometry) return [];
  const points: Array<[number, number]> = [];

  try {
    const center = getPolygonCenter(feature);
    if (center) {
      points.push(center);
    }

    const rawCoords: Array<[number, number]> = [];

    const extractCoords = (geom: GeoJSON.Geometry) => {
      if (geom.type === 'Polygon') {
        const poly = geom as GeoJSON.Polygon;
        if (poly.coordinates[0]) {
          poly.coordinates[0].forEach((c) => rawCoords.push([c[0], c[1]]));
        }
      } else if (geom.type === 'MultiPolygon') {
        const multi = geom as GeoJSON.MultiPolygon;
        multi.coordinates.forEach((poly) => {
          if (poly[0]) {
            poly[0].forEach((c) => rawCoords.push([c[0], c[1]]));
          }
        });
      } else if (geom.type === 'GeometryCollection') {
        geom.geometries.forEach(extractCoords);
      }
    };

    extractCoords(feature.geometry);

    if (rawCoords.length > 0) {
      const step = Math.max(1, Math.floor(rawCoords.length / Math.max(1, maxPoints - 1)));
      for (let i = 0; i < rawCoords.length && points.length < maxPoints; i += step) {
        points.push(rawCoords[i]);
      }
    }
  } catch (err) {
    console.warn('Error sampling polygon points:', err);
  }

  return points;
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
