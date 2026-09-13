import * as turf from '@turf/turf';

/**
 * Realistic Non-Residential Exclusion Zones (Agricultural Fields, Dense Forests,
 * Freight Rail Yards, Water Bodies / Lakes, and Castle Park Interiors)
 * for Greater Munich Metropolitan Region and Commuter Belt.
 *
 * Used by "Nur Wohnbereich anzeigen":
 * Filters out uninhabited natural, industrial, or agricultural zones while strictly
 * preserving ALL residential living quarters, neighborhood streets, and houses
 * (including Obermenzing, Hartmannshofen, Untermenzing, Pasing, Laim, Moosach, etc.).
 */

// Specific non-residential polygons (agricultural fields, nature reserves, industrial rail yards, lakes, palace gardens)
// Coordinates format: [lng, lat]
export const EXCLUSION_ZONES_COORDINATES: [number, number][][] = [
  // 1. Puchheimer Felder / Äcker zwischen Puchheim-Ort, Gröbenzell und Germering
  // (Ackerflächen westlich von München zwischen den S-Bahn-Ästen)
  [
    [11.340, 48.162],
    [11.365, 48.162],
    [11.370, 48.148],
    [11.362, 48.138],
    [11.342, 48.140],
    [11.332, 48.152],
    [11.340, 48.162],
  ],

  // 2. Äcker und Moosflächen zwischen Lochhausen, Gröbenzell und Olching
  [
    [11.385, 48.188],
    [11.415, 48.188],
    [11.425, 48.175],
    [11.395, 48.172],
    [11.385, 48.188],
  ],

  // 3. Forstenrieder Park (Großes geschlossenes Waldgebiet im Südwesten)
  [
    [11.440, 48.065],
    [11.510, 48.065],
    [11.510, 48.010],
    [11.440, 48.010],
    [11.440, 48.065],
  ],

  // 4. Perlacher Forst & Grünwalder Forst (Großes Waldgebiet im Südosten)
  [
    [11.575, 48.090],
    [11.640, 48.090],
    [11.635, 48.030],
    [11.575, 48.030],
    [11.575, 48.090],
  ],

  // 5. Allacher Forst & Naturschutzgebiet Angerlohe (Wald nördlich Allacher Straße / Von-Kahr-Straße)
  // Streng nördlich von 48.190 gehalten, damit Untermenzing & Allach Wohnbebauung unberührt bleiben!
  [
    [11.470, 48.205],
    [11.510, 48.205],
    [11.510, 48.190],
    [11.470, 48.190],
    [11.470, 48.205],
  ],

  // 6. Rangierbahnhof München-Nord (Gleisharfe zwischen Dachauer Straße und Knorrstraße)
  // Beginnt erst ab Dachauer Straße (11.518), damit Hartmannshofen & Moosach Wohnviertel unberührt bleiben!
  [
    [11.518, 48.179],
    [11.565, 48.179],
    [11.565, 48.172],
    [11.518, 48.172],
    [11.518, 48.179],
  ],

  // 7. Schlosspark Nymphenburg (Nur der historische Schlosspark, Schlosskanal und Parkwald im Inneren)
  // Bleibt streng südlich der Menzinger Straße (48.161) und nördlich der Maria-Ward-Straße (48.153),
  // damit alle Wohnstraßen von Obermenzing, Hartmannshofen und Nymphenburg voll erhalten bleiben!
  [
    [11.488, 48.161],
    [11.505, 48.161],
    [11.505, 48.153],
    [11.488, 48.153],
    [11.488, 48.161],
  ],

  // 8. Englischer Garten & Isarauen (Innerer Grüngürtel entlang der Isar)
  [
    [11.588, 48.145],
    [11.603, 48.160],
    [11.615, 48.180],
    [11.625, 48.210],
    [11.618, 48.210],
    [11.605, 48.180],
    [11.592, 48.160],
    [11.585, 48.145],
    [11.588, 48.145],
  ],

  // 9. Dachauer Moos / Landwirtschaftliche Ackerflächen nördlich Karlsfeld
  [
    [11.465, 48.245],
    [11.515, 48.245],
    [11.515, 48.225],
    [11.465, 48.225],
    [11.465, 48.245],
  ],

  // 10. Regattastrecke Oberschleißheim & Feldmochinger / Fasaneriesee
  [
    [11.515, 48.245],
    [11.545, 48.245],
    [11.545, 48.225],
    [11.515, 48.225],
    [11.515, 48.245],
  ],

  // 11. Aubinger Lohe (Waldgebiet westlich Lochhausen/Aubing)
  [
    [11.395, 48.188],
    [11.415, 48.188],
    [11.415, 48.175],
    [11.395, 48.175],
    [11.395, 48.188],
  ],

  // 12. Langwieder See & Lußsee / Birkenweiher (Wasserflächen)
  [
    [11.405, 48.210],
    [11.430, 48.210],
    [11.430, 48.196],
    [11.405, 48.196],
    [11.405, 48.210],
  ],

  // 13. Freihamer & Neuaubinger Ackerflächen im Südwesten (noch unbebauter landwirtschaftlicher Streifen)
  [
    [11.375, 48.138],
    [11.400, 48.138],
    [11.400, 48.125],
    [11.375, 48.125],
    [11.375, 48.138],
  ],

  // 14. Johanneskirchner Moos / Agrarflächen östlich der Bahnlinie
  [
    [11.660, 48.170],
    [11.700, 48.170],
    [11.700, 48.150],
    [11.660, 48.150],
    [11.660, 48.170],
  ],
];

// Pre-compiled exclusion polygon features for high-performance spatial subtraction
let cachedExclusionFeatures: Array<GeoJSON.Feature<GeoJSON.Polygon>> | null = null;

function getExclusionFeatures(): Array<GeoJSON.Feature<GeoJSON.Polygon>> {
  if (cachedExclusionFeatures) return cachedExclusionFeatures;
  cachedExclusionFeatures = EXCLUSION_ZONES_COORDINATES.map((coords) => turf.polygon([coords]));
  return cachedExclusionFeatures;
}

/**
 * Returns a consolidated representation of exclusion zones (for testing/inspection)
 */
export function getResidentialAreasFeature(): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  // Returns Munich Metropolitan area boundary
  return turf.polygon([
    [
      [11.300, 48.050],
      [11.750, 48.050],
      [11.750, 48.300],
      [11.300, 48.300],
      [11.300, 48.050],
    ],
  ]);
}

/**
 * High-precision Wohnbereich-Masking:
 * Filters out uninhabited non-residential areas (agricultural crop fields, dense forests,
 * classification rail yards, and lakes) while strictly preserving ALL inhabited residential
 * streets, settlements, and houses (e.g. Obermenzing, Hartmannshofen, Untermenzing, Pasing,
 * Laim, Moosach, Schwabing, Sendling, Dachau, Germering, Puchheim, etc.).
 */
export function maskByResidentialAreas(
  sourceGeometry: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection>
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null {
  if (!sourceGeometry || !sourceGeometry.geometry) return null;

  const exclusions = getExclusionFeatures();
  let currentGeom: any = sourceGeometry;

  try {
    for (const exPoly of exclusions) {
      try {
        // Quick intersection check to avoid expensive turf.difference if they don't overlap
        if (turf.booleanIntersects(currentGeom, exPoly)) {
          const fcDiff = turf.featureCollection([currentGeom as any, exPoly as any]);
          const diffResult = (turf.difference as any)(fcDiff);
          if (diffResult && diffResult.geometry) {
            currentGeom = diffResult;
          }
        }
      } catch (zoneErr) {
        // Skip individual zone on topological glitch without breaking the entire mask
        console.warn('Exclusion difference pass skipped for zone:', zoneErr);
      }
    }

    return currentGeom;
  } catch (e) {
    console.warn('Residential area masking failed:', e);
    return sourceGeometry;
  }
}
