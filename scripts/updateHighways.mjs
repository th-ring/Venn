import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mirrors = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const query = `[out:json][timeout:60];
(
  node["highway"="motorway_junction"](48.00, 11.30, 48.28, 11.75);
  way["highway"="motorway_link"](48.00, 11.30, 48.28, 11.75);
);
out body;
>;
out skel qt;`;

async function fetchFromMirrors() {
  for (const mirror of mirrors) {
    console.log(`Connecting to Overpass mirror: ${mirror}...`);
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        body: query,
        headers: {
          'User-Agent': 'Venn-Updater/1.0 (contact: info@venn.local)',
        },
      });
      const text = await res.text();
      if (res.ok && text.trim().startsWith('{')) {
        const data = JSON.parse(text);
        console.log(`Successfully fetched from ${mirror} (${data.elements?.length} elements).`);
        return data;
      }
    } catch (e) {
      console.warn(`Mirror ${mirror} failed: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('All Overpass mirrors failed.');
}

export async function runHighwayUpdate() {
  console.log('Starting highway data update for Munich metropolitan area...');
  const rawData = await fetchFromMirrors();

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

  const junctionFeatures = [];
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

  const outputDataset = {
    metadata: {
      source: 'OpenStreetMap contributors (ODbL) via Overpass API',
      sourceUrl: 'https://www.openstreetmap.org',
      license: 'Open Database License (ODbL)',
      region: 'München & Metropolregion',
      regionId: 'munich-mvv',
      lastUpdated: new Date().toISOString(),
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
  console.log(`Updated highwayData.json successfully (${outputPath})`);
  return outputDataset;
}

if (process.argv[1] && process.argv[1].endsWith('updateHighways.mjs')) {
  runHighwayUpdate().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
