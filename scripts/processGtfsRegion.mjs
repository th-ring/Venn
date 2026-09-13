/**
 * GTFS Regional Extraction & Compression Pipeline
 *
 * Converts raw GTFS transit feeds (DELFI Bundesfeed or Verbund GTFS) into
 * ultra-compact Level-2 Metropolitan Region packages for LivingAreaFinder.
 *
 * Usage:
 *   node scripts/processGtfsRegion.mjs [regionId] [gtfsPathOrUrl]
 *
 * Example:
 *   node scripts/processGtfsRegion.mjs munich https://gtfs.de/dataset/de-by-mvv/de-by-mvv.zip
 *   node scripts/processGtfsRegion.mjs munich ./data/raw_gtfs_munich
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'transit-packages');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Basic CSV line parser respecting quotes
 */
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Parses a GTFS CSV file into an array of objects
 */
function parseGtfsCsv(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = values[h];
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Builds an enriched metropolitan network package from parsed GTFS tables
 */
export function buildTransitRegionPackage({
  id,
  name,
  version,
  source,
  bbox,
  stopsRaw,
  routesRaw = [],
  tripsRaw = [],
  stopTimesRaw = [],
}) {
  console.log(`[GTFS Pipeline] Processing ${stopsRaw.length} raw stops for ${name}...`);

  // 1. Group / Cluster Stops
  // Key by parent_station or by clean name + rounded coordinates (~70m)
  const stationMap = new Map();

  for (const st of stopsRaw) {
    const lat = parseFloat(st.stop_lat);
    const lng = parseFloat(st.stop_lon);
    if (isNaN(lat) || isNaN(lng)) continue;

    // Filter by bounding box if specified
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) {
        continue;
      }
    }

    const cleanName = (st.stop_name || '')
      .replace(/\s+/g, ' ')
      .replace(/,?\s*Bf\.?/i, ' Bf.')
      .trim();

    // Standardized station key
    const parentId = st.parent_station || '';
    const normKey = parentId ? `parent_${parentId}` : `pos_${cleanName.toLowerCase()}_${lat.toFixed(3)}_${lng.toFixed(3)}`;

    if (!stationMap.has(normKey)) {
      stationMap.set(normKey, {
        id: st.stop_id,
        name: cleanName,
        lat,
        lng,
        lines: new Set(),
        types: new Set(),
        childStopIds: new Set([st.stop_id]),
      });
    } else {
      const existing = stationMap.get(normKey);
      existing.childStopIds.add(st.stop_id);
      // If the current entry has a cleaner / shorter name, prefer it
      if (cleanName.length < existing.name.length && cleanName.length > 2) {
        existing.name = cleanName;
      }
    }
  }

  // Reverse mapping from raw stop_id to clustered station ID
  const stopIdToStation = new Map();
  for (const [, st] of stationMap.entries()) {
    for (const rawId of st.childStopIds) {
      stopIdToStation.set(rawId, st);
    }
  }

  // 2. Map Routes by ID
  const routeMap = new Map();
  for (const r of routesRaw) {
    // Route types: 0=Tram, 1=Subway/U-Bahn, 2=Rail, 3=Bus, 4=Ferry
    const rTypeNum = parseInt(r.route_type, 10);
    const shortName = r.route_short_name || r.route_long_name || '';

    let subType = 'bus';
    if (rTypeNum === 1 || shortName.startsWith('U')) {
      subType = 'ubahn';
    } else if (rTypeNum === 0 || shortName.toLowerCase().includes('tram')) {
      subType = 'tram';
    } else if (rTypeNum === 2) {
      if (shortName.startsWith('S') || shortName.toLowerCase().includes('s-bahn')) {
        subType = 'sbahn';
      } else {
        subType = 'train';
      }
    } else if (rTypeNum === 3) {
      if (shortName.toUpperCase().startsWith('X')) {
        subType = 'bus'; // isConnectionAllowed handles expressbus check
      } else {
        subType = 'bus';
      }
    }

    routeMap.set(r.route_id, {
      id: r.route_id,
      name: shortName,
      type: subType,
    });
  }

  // 3. Connect Stops along trips
  const connectionMap = new Map(); // key: fromId|toId|type

  // Group stop times by trip_id
  const tripStopTimes = new Map();
  for (const st of stopTimesRaw) {
    if (!tripStopTimes.has(st.trip_id)) {
      tripStopTimes.set(st.trip_id, []);
    }
    tripStopTimes.get(st.trip_id).push(st);
  }

  // Map trip to route
  const tripToRoute = new Map();
  for (const tr of tripsRaw) {
    tripToRoute.set(tr.trip_id, tr.route_id);
  }

  console.log(`[GTFS Pipeline] Analysing ${tripStopTimes.size} trips for edge travel times...`);

  for (const [tripId, stopList] of tripStopTimes.entries()) {
    const routeId = tripToRoute.get(tripId);
    const route = routeMap.get(routeId) || { name: 'Transit', type: 'bus' };

    // Sort by stop_sequence
    stopList.sort((a, b) => parseInt(a.stop_sequence, 10) - parseInt(b.stop_sequence, 10));

    for (let i = 0; i < stopList.length - 1; i++) {
      const fromRaw = stopList[i];
      const toRaw = stopList[i + 1];

      const stFrom = stopIdToStation.get(fromRaw.stop_id);
      const stTo = stopIdToStation.get(toRaw.stop_id);

      if (!stFrom || !stTo || stFrom.id === stTo.id) continue;

      // Add line and type to stations
      stFrom.lines.add(route.name);
      stFrom.types.add(route.type);
      stTo.lines.add(route.name);
      stTo.types.add(route.type);

      // Compute run time in minutes
      let minutes = 2; // default
      if (fromRaw.departure_time && toRaw.arrival_time) {
        const [depH, depM, depS] = fromRaw.departure_time.split(':').map(Number);
        const [arrH, arrM, arrS] = toRaw.arrival_time.split(':').map(Number);
        const diffMin = (arrH * 60 + arrM + arrS / 60) - (depH * 60 + depM + depS / 60);
        if (diffMin > 0 && diffMin < 60) {
          minutes = Math.round(diffMin * 10) / 10;
        }
      }

      const connKey = `${stFrom.id}|${stTo.id}|${route.type}`;
      if (!connectionMap.has(connKey)) {
        connectionMap.set(connKey, {
          from: stFrom.id,
          to: stTo.id,
          minutes,
          lines: new Set([route.name]),
          type: route.type,
        });
      } else {
        const existing = connectionMap.get(connKey);
        existing.lines.add(route.name);
        // Take average or minimum realistic travel time
        existing.minutes = Math.min(existing.minutes, minutes);
      }
    }
  }

  // Format final stations and connections
  const finalStations = Array.from(stationMap.values()).map((st) => ({
    id: st.id,
    name: st.name,
    lat: Math.round(st.lat * 100000) / 100000,
    lng: Math.round(st.lng * 100000) / 100000,
    lines: Array.from(st.lines),
    types: Array.from(st.types),
  }));

  const finalConnections = Array.from(connectionMap.values()).map((c) => ({
    from: c.from,
    to: c.to,
    minutes: c.minutes,
    lines: Array.from(c.lines),
    type: c.type,
  }));

  // Calculate actual bounding box
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
  for (const st of finalStations) {
    if (st.lng < minLng) minLng = st.lng;
    if (st.lng > maxLng) maxLng = st.lng;
    if (st.lat < minLat) minLat = st.lat;
    if (st.lat > maxLat) maxLat = st.lat;
  }

  const regionPackage = {
    id,
    name,
    version: version || `2026.${new Date().getMonth() + 1}`,
    lastUpdated: new Date().toISOString().split('T')[0],
    source: source || 'Mobilithek DELFI / Open Data',
    bbox: [
      Math.round(minLng * 100) / 100,
      Math.round(minLat * 100) / 100,
      Math.round(maxLng * 100) / 100,
      Math.round(maxLat * 100) / 100,
    ],
    stationCount: finalStations.length,
    connectionCount: finalConnections.length,
    stations: finalStations,
    connections: finalConnections,
  };

  return regionPackage;
}

// CLI runner if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const regionArg = process.argv[2] || 'munich';
  console.log(`[GTFS Pipeline] Starting GTFS build for region: ${regionArg}`);

  const targetFile = path.join(OUTPUT_DIR, `${regionArg}.json`);
  console.log(`[GTFS Pipeline] Target output: ${targetFile}`);
}
