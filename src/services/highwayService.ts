import * as turf from '@turf/turf';
import {
  HighwayDataset,
  HighwayDatasetMetadata,
  HighwayJunctionFeature,
  HighwayRampFeature,
  HighwayAreaFeature,
} from '../types';
import defaultHighwayData from '../data/highwayData.json';

const STORAGE_KEY = 'living_area_highway_data_custom_v1';

let cachedDataset: HighwayDataset | null = null;
const listeners = new Set<(dataset: HighwayDataset) => void>();

/**
 * Loads the active Highway dataset.
 * Checks localStorage for a user-updated OSM pull, else falls back to bundled static JSON.
 */
export function getHighwayDataset(): HighwayDataset {
  if (cachedDataset) {
    return cachedDataset;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HighwayDataset;
      if (parsed && parsed.metadata && parsed.junctions && parsed.ramps) {
        cachedDataset = parsed;
        return cachedDataset;
      }
    }
  } catch (err) {
    console.warn('[HighwayService] Failed to load custom highway dataset from storage:', err);
  }

  cachedDataset = defaultHighwayData as unknown as HighwayDataset;
  return cachedDataset;
}

export function getHighwayMetadata(): HighwayDatasetMetadata {
  return getHighwayDataset().metadata;
}

export function getHighwayJunctions(): HighwayJunctionFeature[] {
  return getHighwayDataset().junctions;
}

export function getHighwayRamps(): HighwayRampFeature[] {
  return getHighwayDataset().ramps;
}

export function getHighwayAreas(): HighwayAreaFeature[] {
  return getHighwayDataset().areas;
}

export function subscribeHighwayData(listener: (dataset: HighwayDataset) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(dataset: HighwayDataset) {
  cachedDataset = dataset;
  listeners.forEach((l) => {
    try {
      l(dataset);
    } catch (err) {
      console.error('[HighwayService] Listener error:', err);
    }
  });
}

/**
 * Resets highway dataset back to the built-in bundled version.
 */
export function resetHighwayDataToDefault(): HighwayDataset {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  cachedDataset = defaultHighwayData as unknown as HighwayDataset;
  notifyListeners(cachedDataset);
  return cachedDataset;
}

const OVERPASS_MIRRORS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/**
 * Pulls the latest motorway junctions and ramp links directly from OpenStreetMap via Overpass API.
 */
export async function syncHighwayDataFromOSM(
  bbox: [number, number, number, number] = [11.30, 48.00, 11.75, 48.28]
): Promise<HighwayDataset> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const query = `[out:json][timeout:45];
(
  node["highway"="motorway_junction"](${minLat},${minLng},${maxLat},${maxLng});
  way["highway"="motorway_link"](${minLat},${minLng},${maxLat},${maxLng});
);
out body;
>;
out skel qt;`;

  let rawData: any = null;
  let lastError: string = '';

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        body: query,
        headers: {
          'User-Agent': 'LivingAreaFinder-Web/1.0 (OpenStreetMap highway sync)',
        },
      });
      const text = await res.text();
      if (res.ok && text.trim().startsWith('{')) {
        rawData = JSON.parse(text);
        break;
      } else {
        lastError = `Status ${res.status}: ${text.slice(0, 100)}`;
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  if (!rawData || !rawData.elements) {
    throw new Error(`Konnte keine Verbindung zu OSM-Overpass aufbauen (${lastError})`);
  }

  // Node coordinate lookup
  const nodeMap = new Map<number, [number, number]>();
  for (const el of rawData.elements) {
    if (el.type === 'node') {
      nodeMap.set(el.id, [Number(el.lon.toFixed(5)), Number(el.lat.toFixed(5))]);
    }
  }

  const junctionNodes = rawData.elements.filter(
    (e: any) => e.type === 'node' && e.tags && e.tags.highway === 'motorway_junction'
  );
  const linkWays = rawData.elements.filter(
    (e: any) => e.type === 'way' && e.tags && e.tags.highway === 'motorway_link'
  );

  const rampFeatures: HighwayRampFeature[] = [];
  for (const link of linkWays) {
    const coords = (link.nodes || []).map((nid: number) => nodeMap.get(nid)).filter(Boolean);
    if (coords.length >= 2) {
      const name = link.tags.name || link.tags.destination || 'Auffahrt / Abfahrt';
      const ref = link.tags.ref || link.tags.destination_ref || '';
      rampFeatures.push({
        type: 'Feature',
        id: `ramp-${link.id}`,
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: {
          id: String(link.id),
          name,
          ref,
          oneway: link.tags.oneway !== 'no',
          maxspeed: link.tags.maxspeed || null,
        },
      });
    }
  }

  const junctionFeatures: HighwayJunctionFeature[] = [];
  for (const j of junctionNodes) {
    let name = j.tags.name || '';
    const ref = j.tags.ref || '';
    if (!name && ref) {
      name = `AS ${ref}`;
    } else if (!name) {
      name = 'Autobahnanschlussstelle';
    }
    const motorway = j.tags['destination:ref'] || j.tags.destination || '';

    junctionFeatures.push({
      type: 'Feature',
      id: `junction-${j.id}`,
      geometry: {
        type: 'Point',
        coordinates: [Number(j.lon.toFixed(5)), Number(j.lat.toFixed(5))],
      },
      properties: {
        id: String(j.id),
        name,
        ref,
        motorway,
        lat: Number(j.lat.toFixed(5)),
        lng: Number(j.lon.toFixed(5)),
      },
    });
  }

  // Precompute Areas
  const areaFeatures: HighwayAreaFeature[] = [];
  for (const jFeature of junctionFeatures) {
    const jPt = turf.point(jFeature.geometry.coordinates);
    const nearbyRampLines: any[] = [];

    for (const rFeature of rampFeatures) {
      try {
        const line = turf.lineString(rFeature.geometry.coordinates);
        const dist = turf.pointToLineDistance(jPt, line, { units: 'kilometers' });
        if (dist <= 0.65) {
          nearbyRampLines.push(line);
        }
      } catch {}
    }

    if (nearbyRampLines.length > 0) {
      try {
        const fc = turf.featureCollection(nearbyRampLines);
        const buffered = turf.buffer(fc, 0.07, { units: 'kilometers' });
        if (buffered && buffered.features && buffered.features.length > 0) {
          let mergedPoly = buffered.features[0];
          if (buffered.features.length > 1) {
            try {
              const unioned = turf.union(buffered);
              if (unioned) mergedPoly = unioned;
            } catch {
              mergedPoly = buffered.features[0];
            }
          }
          if (mergedPoly && mergedPoly.geometry) {
            areaFeatures.push({
              type: 'Feature',
              id: `area-${jFeature.properties.id}`,
              geometry: mergedPoly.geometry as any,
              properties: {
                junctionId: jFeature.properties.id,
                name: jFeature.properties.name,
                ref: jFeature.properties.ref,
              },
            });
          }
        }
      } catch {}
    } else {
      try {
        const circ = turf.circle(jPt, 0.2, { steps: 24, units: 'kilometers' });
        areaFeatures.push({
          type: 'Feature',
          id: `area-${jFeature.properties.id}`,
          geometry: circ.geometry as any,
          properties: {
            junctionId: jFeature.properties.id,
            name: jFeature.properties.name,
            ref: jFeature.properties.ref,
          },
        });
      } catch {}
    }
  }

  const updatedDataset: HighwayDataset = {
    metadata: {
      source: 'OpenStreetMap contributors (ODbL) via Overpass API',
      sourceUrl: 'https://www.openstreetmap.org',
      license: 'Open Database License (ODbL)',
      region: 'München & Metropolregion',
      regionId: 'munich-mvv',
      lastUpdated: new Date().toISOString(),
      bbox,
      junctionCount: junctionFeatures.length,
      rampCount: rampFeatures.length,
      areaCount: areaFeatures.length,
    },
    junctions: junctionFeatures,
    ramps: rampFeatures,
    areas: areaFeatures,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDataset));
  } catch (err) {
    console.warn('[HighwayService] Could not persist to localStorage:', err);
  }

  notifyListeners(updatedDataset);
  return updatedDataset;
}
