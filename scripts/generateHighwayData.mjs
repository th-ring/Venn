import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cachePath = 'C:\\Users\\haeri\\.gemini\\antigravity\\brain\\aed67d7e-b957-49b6-8a96-7c9d35d094e7\\scratch\\overpass_cache.json';

const rawData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

// Build coordinate lookup map
const nodeMap = new Map();
for (const el of rawData.elements) {
  if (el.type === 'node') {
    nodeMap.set(el.id, [Number(el.lon.toFixed(5)), Number(el.lat.toFixed(5))]);
  }
}

const junctionNodes = rawData.elements.filter(
  (e) => e.type === 'node' && e.tags && e.tags.highway === 'motorway_junction'
);
const linkWays = rawData.elements.filter(
  (e) => e.type === 'way' && e.tags && e.tags.highway === 'motorway_link'
);

console.log(`Processing ${junctionNodes.length} junctions and ${linkWays.length} ramp ways...`);

// 1. Process Ramps
const rampFeatures = [];
for (const link of linkWays) {
  const coords = link.nodes.map((nid) => nodeMap.get(nid)).filter(Boolean);
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

// 2. Process Junctions
const junctionFeatures = [];
for (const j of junctionNodes) {
  let name = j.tags.name || '';
  const ref = j.tags.ref || '';
  if (!name && ref) {
    name = `AS ${ref}`;
  } else if (!name) {
    name = 'Autobahnanschlussstelle';
  }

  // Detect motorway from ref, destination or nearby
  let motorway = j.tags['destination:ref'] || j.tags.destination || '';

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

// 3. Generate Area Enclosures (Bereichsumkreisung)
const areaFeatures = [];
for (const jFeature of junctionFeatures) {
  const jPt = turf.point(jFeature.geometry.coordinates);
  const nearbyRampLines = [];

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
          geometry: mergedPoly.geometry,
          properties: {
            junctionId: jFeature.properties.id,
            name: jFeature.properties.name,
            ref: jFeature.properties.ref,
          },
        });
      }
    } catch {}
  } else {
    try {
      const circ = turf.circle(jPt, 0.2, { steps: 24, units: 'kilometers' });
      areaFeatures.push({
        type: 'Feature',
        id: `area-${jFeature.properties.id}`,
        geometry: circ.geometry,
        properties: {
          junctionId: jFeature.properties.id,
          name: jFeature.properties.name,
          ref: jFeature.properties.ref,
        },
      });
    } catch {}
  }
}

console.log(`Generated ${areaFeatures.length} junction area enclosures.`);

const outputDataset = {
  metadata: {
    source: 'OpenStreetMap contributors (ODbL) via Overpass API',
    sourceUrl: 'https://www.openstreetmap.org',
    license: 'Open Database License (ODbL)',
    region: 'München & Metropolregion',
    regionId: 'munich-mvv',
    lastUpdated: '2026-09-13T20:25:00.000Z',
    bbox: [11.30, 48.00, 11.75, 48.28],
    junctionCount: junctionFeatures.length,
    rampCount: rampFeatures.length,
    areaCount: areaFeatures.length,
  },
  junctions: junctionFeatures,
  ramps: rampFeatures,
  areas: areaFeatures,
};

const outputPath = path.join(__dirname, '..', 'src', 'data', 'highwayData.json');
fs.writeFileSync(outputPath, JSON.stringify(outputDataset), 'utf8');
console.log(`Saved highwayData.json successfully to ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
