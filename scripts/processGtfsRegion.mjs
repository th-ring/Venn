/**
 * scripts/processGtfsRegion.mjs
 *
 * Full Offline GTFS Compiler for Venn Transit Packages (Schema v2).
 * Reads raw Verbund/DELFI GTFS zip feeds, clusters stops into multi-modal stations,
 * calculates median runtimes, computes edge frequencies (TPH) across 5 time bands,
 * generates pedestrian interchange footpaths, and outputs production transit packages.
 *
 * Usage:
 *   node scripts/processGtfsRegion.mjs --region munich-mvv --feed data/gtfs/mvv-gesamt.zip
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fflate from 'fflate';
import { parseCsvString, createCsvStreamParser, parseCsvLine } from './gtfs/csv.mjs';
import { readZipTextFiles, streamZipFile } from './gtfs/zip.mjs';
import { REGIONS_CONFIG } from './gtfs/regions.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'transit-packages');
const REPORT_DIR = path.join(ROOT_DIR, 'data', 'gtfs');

// Ensure output dirs exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

// Haversine geodesic distance in km
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

// Convert "HH:MM:SS" to seconds from midnight
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts[2] ? parseInt(parts[2], 10) : 0;
  if (isNaN(h) || isNaN(m)) return null;
  return h * 3600 + m * 60 + s;
}

// Calculate median of numbers array
function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

// Mode hierarchy rank for multi-line edges
const MODE_RANK = {
  train: 5,
  sbahn: 4,
  ubahn: 3,
  tram: 2,
  bus: 1,
};

// Band index constants: [peak, day, evening, night, weekend]
const BAND_HOURS = [6.0, 6.5, 5.5, 5.0, 11.0];

function getTimeBandIndex(secOfDay, isWeekend) {
  if (isWeekend) {
    // Weekend band: 09:00 - 20:00 (32400 to 72000 sec)
    if (secOfDay >= 32400 && secOfDay < 72000) {
      return 4; // weekend
    }
    return -1;
  }

  // Weekday bands:
  // Night: 00:30 - 05:30 (1800 to 19800 sec) or >= 24:30 (88200)
  if ((secOfDay >= 1800 && secOfDay < 19800) || secOfDay >= 88200) {
    return 3; // night
  }
  // Peak: 06:30 - 09:00 (23400 to 32400) OR 15:30 - 19:00 (55800 to 68400)
  if (
    (secOfDay >= 23400 && secOfDay < 32400) ||
    (secOfDay >= 55800 && secOfDay < 68400)
  ) {
    return 0; // peak
  }
  // Day: 05:30 - 06:30 (early) and 09:00 - 15:30 (32400 to 55800)
  if (
    (secOfDay >= 19800 && secOfDay < 23400) ||
    (secOfDay >= 32400 && secOfDay < 55800)
  ) {
    return 1; // day
  }
  // Evening: 19:00 - 00:30 (68400 to 88200)
  if (secOfDay >= 68400 && secOfDay < 88200) {
    return 2; // evening
  }

  return 1; // default to day
}

// Parse CLI flags
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    region: 'munich-mvv',
    feed: path.join(ROOT_DIR, 'data', 'gtfs', 'mvv-gesamt.zip'),
    date: '2026-10-13',
    weekendDate: '2026-10-17',
    output: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--region' && args[i + 1]) options.region = args[++i];
    else if (args[i] === '--feed' && args[i + 1]) options.feed = args[++i];
    else if (args[i] === '--date' && args[i + 1]) options.date = args[++i];
    else if (args[i] === '--weekend-date' && args[i + 1]) options.weekendDate = args[++i];
    else if (args[i] === '--output' && args[i + 1]) options.output = args[++i];
  }

  return options;
}

export async function processGtfsRegion(cliOptions = {}) {
  const options = { ...parseArgs(), ...cliOptions };
  const regionConfig = REGIONS_CONFIG[options.region];

  if (!regionConfig) {
    throw new Error(`Unknown region "${options.region}". Available: ${Object.keys(REGIONS_CONFIG).join(', ')}`);
  }

  console.log(`\n======================================================`);
  console.log(` Venn GTFS Compiler: ${regionConfig.name} (${regionConfig.id})`);
  console.log(` Feed: ${options.feed}`);
  console.log(` Target Dates: Weekday ${options.date}, Weekend ${options.weekendDate}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(options.feed)) {
    throw new Error(`Feed archive not found at ${options.feed}`);
  }

  // Normalize date strings: YYYYMMDD
  const weekdayDateStr = options.date.replace(/-/g, '');
  const weekendDateStr = options.weekendDate.replace(/-/g, '');

  // 1. Read small text files
  console.log(`[1/6] Extracting calendar, routes, and metadata...`);
  const textFiles = await readZipTextFiles(options.feed, [
    'feed_info.txt',
    'calendar.txt',
    'calendar_dates.txt',
    'routes.txt',
    'stops.txt',
  ]);

  const feedInfoRows = parseCsvString(textFiles['feed_info.txt'] || '');
  const feedInfo = feedInfoRows[0] || {};
  const feedVersion = feedInfo.feed_version || '2026.1';

  // Resolve active services
  const calendarRows = parseCsvString(textFiles['calendar.txt'] || '');
  const calendarDatesRows = parseCsvString(textFiles['calendar_dates.txt'] || '');

  function getActiveServicesForDate(targetDateStr) {
    const year = parseInt(targetDateStr.slice(0, 4), 10);
    const month = parseInt(targetDateStr.slice(4, 6), 10) - 1;
    const day = parseInt(targetDateStr.slice(6, 8), 10);
    const d = new Date(Date.UTC(year, month, day));
    const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayKey = dayKeys[dayOfWeek];

    const active = new Set();
    for (const row of calendarRows) {
      if (row[targetDayKey] === '1') {
        if (targetDateStr >= row.start_date && targetDateStr <= row.end_date) {
          active.add(row.service_id);
        }
      }
    }
    for (const row of calendarDatesRows) {
      if (row.date === targetDateStr) {
        if (row.exception_type === '1') active.add(row.service_id);
        else if (row.exception_type === '2') active.delete(row.service_id);
      }
    }
    return active;
  }

  const activeWeekdayServices = getActiveServicesForDate(weekdayDateStr);
  const activeWeekendServices = getActiveServicesForDate(weekendDateStr);
  console.log(`  ✓ Active weekday services (${weekdayDateStr}): ${activeWeekdayServices.size}`);
  console.log(`  ✓ Active weekend services (${weekendDateStr}): ${activeWeekendServices.size}`);

  // 2. Parse routes
  const routeRows = parseCsvString(textFiles['routes.txt'] || '');
  const routeMap = new Map();
  for (const r of routeRows) {
    const classified = regionConfig.classifyRoute(r);
    routeMap.set(r.route_id, {
      type: classified.type,
      line: classified.line,
      rawShortName: r.route_short_name || '',
      rawLongName: r.route_long_name || '',
    });
  }
  console.log(`  ✓ Classified ${routeMap.size} transit routes.`);

  // 3. Cluster stops (DHID / parent_station hierarchy within BBox)
  console.log(`[2/6] Clustering raw stops into multi-modal transit stations...`);
  const stopRows = parseCsvString(textFiles['stops.txt'] || '');
  const [minLng, minLat, maxLng, maxLat] = regionConfig.bbox;

  // First pass: identify all parent stations and map stop details
  const rawStopsById = new Map();
  for (const s of stopRows) {
    const lat = parseFloat(s.stop_lat);
    const lng = parseFloat(s.stop_lon);
    if (isNaN(lat) || isNaN(lng)) continue;
    rawStopsById.set(s.stop_id, { ...s, lat, lng });
  }

  // Second pass: cluster into stations
  const clusteredStations = new Map();
  const stopIdToStationId = new Map();
  let discardedStopsOutsideBbox = 0;

  for (const [stopId, s] of rawStopsById.entries()) {
    // Check bounding box
    if (s.lng < minLng || s.lng > maxLng || s.lat < minLat || s.lat > maxLat) {
      discardedStopsOutsideBbox++;
      continue;
    }

    // Determine cluster key
    let clusterKey;
    if (s.parent_station && rawStopsById.has(s.parent_station)) {
      clusterKey = `parent_${s.parent_station}`;
    } else {
      // Check DHID pattern e.g. "de:09162:6:0:1" -> "de:09162:6"
      const dhidMatch = s.stop_id.match(/^(de:[0-9]+:[0-9]+)/i);
      if (dhidMatch) {
        clusterKey = `dhid_${dhidMatch[1].toLowerCase()}`;
      } else {
        // Name + 70m rounding
        const normName = (s.stop_name || '')
          .toLowerCase()
          .replace(/[^a-z0-9äöüß]/g, '')
          .slice(0, 20);
        clusterKey = `geo_${normName}_${s.lat.toFixed(3)}_${s.lng.toFixed(3)}`;
      }
    }

    if (!clusteredStations.has(clusterKey)) {
      const cleanName = (s.stop_name || '')
        .replace(/\s+/g, ' ')
        .replace(/,?\s*Bf\.?/i, ' Bf.')
        .replace(/,?\s*Gleis\s*\d+/i, '')
        .trim();

      clusteredStations.set(clusterKey, {
        id: clusterKey.replace(/^(parent_|dhid_|geo_)/, ''),
        name: cleanName,
        childStops: [s],
        lines: new Set(),
        types: new Set(),
      });
    } else {
      clusteredStations.get(clusterKey).childStops.push(s);
    }

    stopIdToStationId.set(stopId, clusteredStations.get(clusterKey).id);
  }

  console.log(`  ✓ Clustered ${rawStopsById.size - discardedStopsOutsideBbox} raw stops into ${clusteredStations.size} transit stations.`);
  console.log(`  ℹ Discarded ${discardedStopsOutsideBbox} stops outside BBox.`);

  // Calculate centroid coordinates for clustered stations
  const stationMap = new Map();
  for (const cluster of clusteredStations.values()) {
    let sumLat = 0;
    let sumLng = 0;
    for (const child of cluster.childStops) {
      sumLat += child.lat;
      sumLng += child.lng;
    }
    const lat = Number((sumLat / cluster.childStops.length).toFixed(5));
    const lng = Number((sumLng / cluster.childStops.length).toFixed(5));

    stationMap.set(cluster.id, {
      id: cluster.id,
      name: cluster.name,
      lat,
      lng,
      lines: new Set(),
      types: new Set(),
    });
  }

  // 4. Stream trips.txt to find active trips
  console.log(`[3/6] Indexing active trips...`);
  const activeTrips = new Map(); // trip_id -> { route_id, isWeekday, isWeekend }
  const tripsRaw = await readZipTextFiles(options.feed, ['trips.txt']);
  const tripRows = parseCsvString(tripsRaw['trips.txt'] || '');

  for (const tr of tripRows) {
    const isWk = activeWeekdayServices.has(tr.service_id);
    const isWe = activeWeekendServices.has(tr.service_id);
    if (!isWk && !isWe) continue;

    activeTrips.set(tr.trip_id, {
      route_id: tr.route_id,
      isWeekday: isWk,
      isWeekend: isWe,
    });
  }
  console.log(`  ✓ Retained ${activeTrips.size} active trips for processing.`);

  // 5. Stream stop_times.txt and construct directed edge graph with runtimes & TPH
  console.log(`[4/6] Streaming stop_times.txt to compile runtimes and hourly frequencies...`);
  // Edge key: `${fromStationId}->${toStationId}`
  const edgeAggregator = new Map();

  let currentTripId = null;
  let currentTripInfo = null;
  let previousStationId = null;
  let previousDepartureSec = null;
  let totalStopTimesRows = 0;

  const stopTimesParser = createCsvStreamParser({
    onRow: (values) => {
      totalStopTimesRows++;
      // columns: trip_id, arrival_time, departure_time, stop_id, stop_sequence, ...
      const tripId = values[0];
      const arrTimeStr = values[1];
      const depTimeStr = values[2];
      const stopId = values[3];

      if (tripId !== currentTripId) {
        currentTripId = tripId;
        currentTripInfo = activeTrips.get(tripId) || null;
        previousStationId = null;
        previousDepartureSec = null;
      }

      if (!currentTripInfo) return;

      const stationId = stopIdToStationId.get(stopId);
      if (!stationId) {
        // Outside BBox
        previousStationId = null;
        previousDepartureSec = null;
        return;
      }

      const arrSec = parseTimeToSeconds(arrTimeStr);
      const depSec = parseTimeToSeconds(depTimeStr);

      if (previousStationId && previousDepartureSec !== null && arrSec !== null) {
        if (previousStationId !== stationId) {
          let runtimeSec = arrSec - previousDepartureSec;
          // Handle midnight wrap-around if any
          if (runtimeSec < 0 && runtimeSec > -86400) {
            runtimeSec += 86400;
          }

          const runtimeMin = Number((runtimeSec / 60).toFixed(1));

          // Sanity check: between 0.3 min and 180 min
          if (runtimeMin >= 0.3 && runtimeMin <= 180) {
            const edgeKey = `${previousStationId}->${stationId}`;
            const route = routeMap.get(currentTripInfo.route_id);
            const lineName = route ? route.line : 'Transit';
            const modeType = route ? route.type : 'bus';

            let edge = edgeAggregator.get(edgeKey);
            if (!edge) {
              edge = {
                from: previousStationId,
                to: stationId,
                runtimesWeekdayDay: [],
                allRuntimes: [],
                lines: new Set(),
                types: new Set(),
                // Counts: [peak, day, evening, night, weekend]
                counts: [0, 0, 0, 0, 0],
              };
              edgeAggregator.set(edgeKey, edge);
            }

            edge.lines.add(lineName);
            edge.types.add(modeType);
            edge.allRuntimes.push(runtimeMin);

            // Associate line & type with stations
            stationMap.get(previousStationId)?.lines.add(lineName);
            stationMap.get(previousStationId)?.types.add(modeType);
            stationMap.get(stationId)?.lines.add(lineName);
            stationMap.get(stationId)?.types.add(modeType);

            // Record time band counts
            if (currentTripInfo.isWeekday) {
              const bandIdx = getTimeBandIndex(previousDepartureSec, false);
              if (bandIdx >= 0) {
                edge.counts[bandIdx]++;
              }
              // For median calculation, prioritize weekday daytime (06:00 - 20:00)
              if (previousDepartureSec >= 21600 && previousDepartureSec <= 72000) {
                edge.runtimesWeekdayDay.push(runtimeMin);
              }
            }

            if (currentTripInfo.isWeekend) {
              const bandIdx = getTimeBandIndex(previousDepartureSec, true);
              if (bandIdx >= 0) {
                edge.counts[bandIdx]++;
              }
            }
          }
        }
      }

      previousStationId = stationId;
      previousDepartureSec = depSec ?? arrSec;
    },
  });

  await streamZipFile(options.feed, 'stop_times.txt', (chunk, isFinal) => {
    stopTimesParser.push(chunk);
    if (isFinal) stopTimesParser.end();
  });

  console.log(`  ✓ Processed ${totalStopTimesRows} stop_times rows.`);
  console.log(`  ✓ Aggregated ${edgeAggregator.size} unique directed edges.`);

  // 6. Build finalized connections array
  console.log(`[5/6] Finalizing edges and calculating TPH frequencies...`);
  const finalizedConnections = [];
  const activeStationIds = new Set();

  for (const edge of edgeAggregator.values()) {
    // Determine runtime: median of weekday daytime or all runtimes
    const primaryRuntimes = edge.runtimesWeekdayDay.length > 0 ? edge.runtimesWeekdayDay : edge.allRuntimes;
    const medianRuntime = Number(calculateMedian(primaryRuntimes).toFixed(1));

    // Determine highest ranking transit mode
    let bestType = 'bus';
    let bestRank = 0;
    for (const t of edge.types) {
      const r = MODE_RANK[t] || 1;
      if (r > bestRank) {
        bestRank = r;
        bestType = t;
      }
    }

    // Calculate TPH for each band: trips / durationHours
    const tph = edge.counts.map((cnt, idx) => {
      const hours = BAND_HOURS[idx];
      return Number((cnt / hours).toFixed(1));
    });

    finalizedConnections.push({
      from: edge.from,
      to: edge.to,
      minutes: Math.max(0.5, medianRuntime),
      lines: Array.from(edge.lines).sort(),
      type: bestType,
      tph, // [peak, day, evening, night, weekend]
    });

    activeStationIds.add(edge.from);
    activeStationIds.add(edge.to);
  }

  // 7. Generate Footpath edges between stations <= 400m
  console.log(`[6/6] Computing pedestrian interchange footpaths (<= 400m)...`);
  const activeStationsList = Array.from(activeStationIds)
    .map((id) => stationMap.get(id))
    .filter(Boolean);

  const footpaths = [];
  const maxFootpathKm = (regionConfig.maxFootpathDistanceMeters || 400) / 1000;
  const walkSpeedKmPerMin = (regionConfig.footpathWalkSpeedKmh || 4.0) / 60;
  const detourFactor = regionConfig.footpathDetourFactor || 1.25;

  // Spatial grid index for fast proximity search
  const grid = new Map();
  const cellSizeDeg = 0.005; // ~500m cells

  for (const st of activeStationsList) {
    const cellX = Math.floor(st.lng / cellSizeDeg);
    const cellY = Math.floor(st.lat / cellSizeDeg);
    const key = `${cellX}_${cellY}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(st);
  }

  const seenFootpaths = new Set();

  for (const st of activeStationsList) {
    const cellX = Math.floor(st.lng / cellSizeDeg);
    const cellY = Math.floor(st.lat / cellSizeDeg);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${cellX + dx}_${cellY + dy}`;
        const neighbors = grid.get(neighborKey);
        if (!neighbors) continue;

        for (const other of neighbors) {
          if (st.id >= other.id) continue; // Unordered pair
          const dist = distanceKm(st.lat, st.lng, other.lat, other.lng);
          if (dist > 0.01 && dist <= maxFootpathKm) {
            const minutes = Number(Math.max(0.5, (dist * detourFactor) / walkSpeedKmPerMin).toFixed(1));
            footpaths.push({ from: st.id, to: other.id, minutes });
            footpaths.push({ from: other.id, to: st.id, minutes });
          }
        }
      }
    }
  }

  console.log(`  ✓ Generated ${footpaths.length} directed inter-station footpaths.`);

  // Filter and format stations
  const finalizedStations = activeStationsList.map((st) => ({
    id: st.id,
    name: st.name,
    lat: st.lat,
    lng: st.lng,
    lines: Array.from(st.lines).sort(),
    types: Array.from(st.types).sort(),
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Construct final package
  const transitPackage = {
    schemaVersion: 2,
    id: regionConfig.id,
    name: regionConfig.name,
    version: feedVersion,
    directed: true,
    bbox: regionConfig.bbox,
    attribution: regionConfig.attribution,
    feedSourceUrl: regionConfig.feedSourceUrl,
    serviceDates: {
      weekday: options.date,
      weekend: options.weekendDate,
    },
    stationCount: finalizedStations.length,
    connectionCount: finalizedConnections.length,
    footpathCount: footpaths.length,
    stations: finalizedStations,
    connections: finalizedConnections,
    footpaths,
  };

  // Serialize and check size
  const jsonStr = JSON.stringify(transitPackage);
  const rawBytes = Buffer.byteLength(jsonStr, 'utf-8');
  const gzipBuf = fflate.gzipSync(new TextEncoder().encode(jsonStr));
  const gzipBytes = gzipBuf.length;

  const targetPath = options.output || path.join(OUTPUT_DIR, regionConfig.outputFileName);
  fs.writeFileSync(targetPath, jsonStr, 'utf-8');

  // Mode breakdown stats
  const modeCounts = {};
  for (const c of finalizedConnections) {
    modeCounts[c.type] = (modeCounts[c.type] || 0) + 1;
  }

  // Generate Report
  const report = {
    region: regionConfig.id,
    name: regionConfig.name,
    feedVersion,
    targetDates: {
      weekday: options.date,
      weekend: options.weekendDate,
    },
    counts: {
      stations: finalizedStations.length,
      connections: finalizedConnections.length,
      footpaths: footpaths.length,
      connectionsByMode: modeCounts,
    },
    size: {
      rawKB: Number((rawBytes / 1024).toFixed(1)),
      gzipKB: Number((gzipBytes / 1024).toFixed(1)),
      rawMB: Number((rawBytes / (1024 * 1024)).toFixed(2)),
      gzipMB: Number((gzipBytes / (1024 * 1024)).toFixed(2)),
    },
    generatedAt: new Date().toISOString(),
  };

  const reportPath = path.join(REPORT_DIR, `report-${regionConfig.id}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`✓ COMPILATION COMPLETE: ${targetPath}`);
  console.log(`------------------------------------------------------`);
  console.log(`  Stations:    ${finalizedStations.length}`);
  console.log(`  Edges:       ${finalizedConnections.length}`);
  console.log(`  Footpaths:   ${footpaths.length}`);
  console.log(`  Modes:       ${JSON.stringify(modeCounts)}`);
  console.log(`  Raw Size:    ${report.size.rawMB} MB (${report.size.rawKB} KB)`);
  console.log(`  Gzip Size:   ${report.size.gzipKB} KB (Budget: <= 1000 KB: ${report.size.gzipKB <= 1000 ? 'PASSED ✓' : 'EXCEEDED ✗'})`);
  console.log(`  Report:      ${reportPath}`);
  console.log(`======================================================\n`);

  return report;
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('processGtfsRegion.mjs')) {
  processGtfsRegion().catch((err) => {
    console.error('Fatal error during GTFS compilation:', err);
    process.exit(1);
  });
}
