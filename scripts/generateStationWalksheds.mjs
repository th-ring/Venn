import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_PATH = path.resolve(__dirname, '../public/transit-packages/munich.json');
const OUTPUT_DIR = path.resolve(__dirname, '../public/transit-packages/walksheds');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'munich-mvv.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Munich geographic barrier corridors (approximate polyline segments)
// 1. Isar river segments: [[lat, lng], [lat, lng]]
const ISAR_SEGMENTS = [
  [[48.068, 11.538], [48.095, 11.545]],
  [[48.095, 11.545], [48.115, 11.560]],
  [[48.115, 11.560], [48.132, 11.587]],
  [[48.132, 11.587], [48.152, 11.600]],
  [[48.152, 11.600], [48.181, 11.628]],
  [[48.181, 11.628], [48.220, 11.660]],
];

// Major Isar pedestrian crossing points (bridges): [lat, lng]
const ISAR_BRIDGES = [
  [48.075, 11.540], // Großhesseloher Brücke
  [48.106, 11.552], // Marienklausensteg
  [48.112, 11.557], // Thalkirchner Brücke
  [48.119, 11.565], // Brudermühlbrücke
  [48.125, 11.575], // Wittelsbacherbrücke
  [48.128, 11.581], // Reichenbachbrücke
  [48.132, 11.587], // Ludwigsbrücke / Zweibrückenstr
  [48.137, 11.593], // Maximiliansbrücke
  [48.145, 11.597], // Luitpoldbrücke / Prinzregentenstr
  [48.152, 11.600], // Max-Joseph-Brücke
  [48.163, 11.611], // John-F.-Kennedy-Brücke
  [48.181, 11.628], // St. Emmeram Steg
];

// 2. Trunk Rail Corridor Pasing - Donnersbergerbrücke - Hauptbahnhof
const RAIL_SEGMENTS = [
  [[48.150, 11.460], [48.144, 11.503]], // Pasing to Laim
  [[48.144, 11.503], [48.142, 11.536]], // Laim to Donnersbergerbrücke
  [[48.142, 11.536], [48.140, 11.560]], // Donnersbergerbrücke to Hbf
];

// Major Rail Pedestrian Underpasses / Bridges: [lat, lng]
const RAIL_CROSSINGS = [
  [48.150, 11.462], // Pasing Nord/Süd Unterführung
  [48.144, 11.503], // Laimer Unterführung
  [48.143, 11.516], // Friedenheimer Brücke
  [48.142, 11.536], // Donnersbergerbrücke
  [48.141, 11.549], // Hackerbrücke
  [48.140, 11.556], // Paul-Heyse-Unterführung
];

// Helper: Fast distance in km
function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

// Ray-segment intersection check
function rayIntersectsSegment(pLat, pLng, rayLat, rayLng, aLat, aLng, bLat, bLng) {
  const p = { x: pLng, y: pLat };
  const r = { x: rayLng - pLng, y: rayLat - pLat };
  const q = { x: aLng, y: aLat };
  const s = { x: bLng - aLng, y: bLat - aLat };

  const rxs = r.x * s.y - r.y * s.x;
  if (Math.abs(rxs) < 1e-9) return null; // Parallel

  const q_p = { x: q.x - p.x, y: q.y - p.y };
  const t = (q_p.x * s.y - q_p.y * s.x) / rxs;
  const u = (q_p.x * r.y - q_p.y * r.x) / rxs;

  if (t > 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      t, // Fraction along ray
      lat: pLat + t * (rayLat - pLat),
      lng: pLng + t * (rayLng - pLng),
    };
  }
  return null;
}

/**
 * Computes a realistic, obstacle-aware pedestrian walkshed polygon ring for a station.
 * @param {number} stLat
 * @param {number} stLng
 * @param {number} minutes (e.g. 5, 10, 15)
 * @param {number} baseSpeedKmh (default 4.0)
 * @returns {Array<[number, number]>} [lng, lat] coordinate array forming a closed ring
 */
function generateWalkshedContour(stLat, stLng, minutes, baseSpeedKmh = 4.0) {
  const walkSpeedKmPerMin = baseSpeedKmh / 60;
  const theoreticalReachKm = minutes * walkSpeedKmPerMin;

  const numSectors = 24; // 15-degree sectors for smooth, realistic polygon
  const coords = [];

  // Street grid bias based on Munich's typical arterial orientation (~25 degrees offset from cardinal)
  const gridOrientationRad = (25 * Math.PI) / 180;

  for (let i = 0; i < numSectors; i++) {
    const angleRad = (i * 2 * Math.PI) / numSectors;

    // Pedestrian street network detour factor:
    // Walking directly along streets (0, 90, 180, 270 deg relative to grid) has detour ~1.18.
    // Diagonal / cut-through has detour ~1.42.
    const relAngle = Math.abs(Math.cos(2 * (angleRad - gridOrientationRad)));
    const detourFactor = 1.38 - 0.18 * relAngle;

    let sectorDistanceKm = theoreticalReachKm / detourFactor;

    // Destination ray point before obstacle test
    // 1 deg lat ≈ 111.32 km, 1 deg lng ≈ 111.32 * cos(lat) km
    const dLat = (sectorDistanceKm * Math.cos(angleRad)) / 111.32;
    const dLng =
      (sectorDistanceKm * Math.sin(angleRad)) /
      (111.32 * Math.cos((stLat * Math.PI) / 180));

    const targetLat = stLat + dLat;
    const targetLng = stLng + dLng;

    // Check if ray intersects the Isar river
    let effectiveDistKm = sectorDistanceKm;
    for (const seg of ISAR_SEGMENTS) {
      const hit = rayIntersectsSegment(
        stLat,
        stLng,
        targetLat,
        targetLng,
        seg[0][0],
        seg[0][1],
        seg[1][0],
        seg[1][1]
      );
      if (hit) {
        // Find nearest bridge to the hit point
        let minBridgeDist = Infinity;
        for (const bridge of ISAR_BRIDGES) {
          const d = distanceKm(hit.lat, hit.lng, bridge[0], bridge[1]);
          if (d < minBridgeDist) minBridgeDist = d;
        }

        // Extra detour required to cross via bridge: 2 * bridge distance
        const detourOverheadKm = minBridgeDist * 1.8;
        const distToRiverKm = distanceKm(stLat, stLng, hit.lat, hit.lng);

        if (distToRiverKm + detourOverheadKm > theoreticalReachKm) {
          // River cannot be crossed in time: limit reach strictly to the riverbank
          const riverBarrierDist = Math.max(0.04, distToRiverKm * 0.95);
          if (riverBarrierDist < effectiveDistKm) {
            effectiveDistKm = riverBarrierDist;
          }
        }
      }
    }

    // Check if ray intersects the main rail corridor
    for (const seg of RAIL_SEGMENTS) {
      const hit = rayIntersectsSegment(
        stLat,
        stLng,
        targetLat,
        targetLng,
        seg[0][0],
        seg[0][1],
        seg[1][0],
        seg[1][1]
      );
      if (hit) {
        let minCrossingDist = Infinity;
        for (const crossing of RAIL_CROSSINGS) {
          const d = distanceKm(hit.lat, hit.lng, crossing[0], crossing[1]);
          if (d < minCrossingDist) minCrossingDist = d;
        }

        const detourOverheadKm = minCrossingDist * 1.7;
        const distToTracksKm = distanceKm(stLat, stLng, hit.lat, hit.lng);

        if (distToTracksKm + detourOverheadKm > theoreticalReachKm) {
          // Rail corridor cannot be crossed: limit reach to track edge
          const railBarrierDist = Math.max(0.04, distToTracksKm * 0.92);
          if (railBarrierDist < effectiveDistKm) {
            effectiveDistKm = railBarrierDist;
          }
        }
      }
    }

    // Compute final vertex coordinate
    const finalLat =
      stLat + (effectiveDistKm * Math.cos(angleRad)) / 111.32;
    const finalLng =
      stLng +
      (effectiveDistKm * Math.sin(angleRad)) /
        (111.32 * Math.cos((stLat * Math.PI) / 180));

    coords.push([
      Number(finalLng.toFixed(5)),
      Number(finalLat.toFixed(5)),
    ]);
  }

  // Close ring
  coords.push([coords[0][0], coords[0][1]]);

  // Verify non-zero area with turf
  try {
    const poly = turf.polygon([coords]);
    const area = turf.area(poly);
    if (area <= 0) {
      throw new Error('Degenerate polygon');
    }
  } catch {
    // If self-intersecting or invalid, create simplified circle buffer
    const circle = turf.circle([stLng, stLat], (minutes * walkSpeedKmPerMin) / 1.35, {
      steps: 20,
      units: 'kilometers',
    });
    return circle.geometry.coordinates[0].map(([lng, lat]) => [
      Number(lng.toFixed(5)),
      Number(lat.toFixed(5)),
    ]);
  }

  return coords;
}

export async function generateMunichStationWalksheds() {
  console.log(`Reading stations from ${INPUT_PATH}...`);
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`File not found: ${INPUT_PATH}`);
  }

  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  const dataset = JSON.parse(raw);
  const stations = dataset.stations || [];

  console.log(`Found ${stations.length} stations. Generating 5, 10, 15 min walksheds...`);

  const walkshedStations = {};

  for (const st of stations) {
    const contour5 = generateWalkshedContour(st.lat, st.lng, 5, 4.0);
    const contour10 = generateWalkshedContour(st.lat, st.lng, 10, 4.0);
    const contour15 = generateWalkshedContour(st.lat, st.lng, 15, 4.0);

    walkshedStations[st.id] = {
      5: contour5,
      10: contour10,
      15: contour15,
    };
  }

  const result = {
    regionId: 'munich-mvv',
    version: '2026.1',
    baseWalkingSpeedKmh: 4.0,
    stationCount: stations.length,
    stations: walkshedStations,
  };

  const jsonStr = JSON.stringify(result);
  fs.writeFileSync(OUTPUT_FILE, jsonStr, 'utf-8');

  const stats = fs.statSync(OUTPUT_FILE);
  const kbSize = (stats.size / 1024).toFixed(1);
  console.log(`✓ Successfully generated walksheds for ${stations.length} stations!`);
  console.log(`✓ Output saved to ${OUTPUT_FILE} (${kbSize} KB).`);
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('generateStationWalksheds.mjs')) {
  generateMunichStationWalksheds().catch((err) => {
    console.error('Failed to generate station walksheds:', err);
    process.exit(1);
  });
}
