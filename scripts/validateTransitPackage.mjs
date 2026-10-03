/**
 * scripts/validateTransitPackage.mjs
 *
 * Timetable Ground-Truth Validator using Connection Scan Algorithm (CSA) on raw GTFS.
 * Compares exact timetable arrivals against the compiled transit package and routing engine.
 *
 * Usage:
 *   node scripts/validateTransitPackage.mjs --region munich-mvv --feed data/gtfs/mvv-gesamt.zip
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readZipTextFiles, streamZipFile } from './gtfs/zip.mjs';
import { parseCsvString, createCsvStreamParser } from './gtfs/csv.mjs';
import { REGIONS_CONFIG } from './gtfs/regions.config.mjs';
import { findShortestTransitTrip, setTransitRegion } from '../src/services/mvvMatrixService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    region: 'munich-mvv',
    feed: path.join(ROOT_DIR, 'data', 'gtfs', 'mvv-gesamt.zip'),
    date: '2026-10-13',
    numSamples: 50,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--region' && args[i + 1]) options.region = args[++i];
    else if (args[i] === '--feed' && args[i + 1]) options.feed = args[++i];
    else if (args[i] === '--date' && args[i + 1]) options.date = args[++i];
    else if (args[i] === '--samples' && args[i + 1]) options.numSamples = parseInt(args[++i], 10);
  }

  return options;
}

function parseTimeToSec(t) {
  if (!t) return null;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + (parts[2] ? parseInt(parts[2], 10) : 0);
}

function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Pseudo-random number generator with fixed seed for deterministic validation
function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export async function validateTransitPackage() {
  const options = parseArgs();
  const regionConfig = REGIONS_CONFIG[options.region];
  const pkgPath = path.join(ROOT_DIR, 'public', 'transit-packages', regionConfig.outputFileName);

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`Compiled package not found at ${pkgPath}. Run processGtfsRegion.mjs first.`);
  }

  console.log(`\n======================================================`);
  console.log(` Timetable Ground-Truth Validator: ${regionConfig.name}`);
  console.log(` Date: ${options.date} | Samples: ${options.numSamples}`);
  console.log(`======================================================\n`);

  // Load compiled package into engine
  const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
  const transitDataset = JSON.parse(pkgRaw);
  setTransitRegion(transitDataset);

  const stations = transitDataset.stations;
  const stationsById = new Map(stations.map((s) => [s.id, s]));

  // 1. Identify active weekday trips from feed
  const targetDateStr = options.date.replace(/-/g, '');
  const textFiles = await readZipTextFiles(options.feed, ['calendar.txt', 'calendar_dates.txt', 'trips.txt', 'stops.txt']);

  const calendar = parseCsvString(textFiles['calendar.txt'] || '');
  const calendarDates = parseCsvString(textFiles['calendar_dates.txt'] || '');

  const activeServices = new Set();
  const d = new Date(Date.UTC(
    parseInt(targetDateStr.slice(0, 4), 10),
    parseInt(targetDateStr.slice(4, 6), 10) - 1,
    parseInt(targetDateStr.slice(6, 8), 10)
  ));
  const dayOfWeek = d.getUTCDay();
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDayKey = dayKeys[dayOfWeek];

  for (const c of calendar) {
    if (c[targetDayKey] === '1' && targetDateStr >= c.start_date && targetDateStr <= c.end_date) {
      activeServices.add(c.service_id);
    }
  }
  for (const cd of calendarDates) {
    if (cd.date === targetDateStr) {
      if (cd.exception_type === '1') activeServices.add(cd.service_id);
      if (cd.exception_type === '2') activeServices.delete(cd.service_id);
    }
  }

  const trips = parseCsvString(textFiles['trips.txt'] || '');
  const activeTripIds = new Set();
  for (const tr of trips) {
    if (activeServices.has(tr.service_id)) {
      activeTripIds.add(tr.trip_id);
    }
  }

  console.log(`Indexing raw stops and clustering map...`);
  const rawStops = parseCsvString(textFiles['stops.txt'] || '');
  const rawStopMap = new Map(rawStops.map((s) => [s.stop_id, s]));
  const stopToStation = new Map();

  for (const s of rawStops) {
    if (s.parent_station && stationsById.has(s.parent_station)) {
      stopToStation.set(s.stop_id, s.parent_station);
    } else {
      const dhidMatch = s.stop_id.match(/^(de:[0-9]+:[0-9]+)/i);
      if (dhidMatch && stationsById.has(dhidMatch[1].toLowerCase())) {
        stopToStation.set(s.stop_id, dhidMatch[1].toLowerCase());
      } else {
        const normName = (s.stop_name || '')
          .toLowerCase()
          .replace(/[^a-z0-9äöüß]/g, '')
          .slice(0, 20);
        const geoKey = `${normName}_${parseFloat(s.stop_lat).toFixed(3)}_${parseFloat(s.stop_lon).toFixed(3)}`;
        if (stationsById.has(geoKey)) {
          stopToStation.set(s.stop_id, geoKey);
        }
      }
    }
  }

  // 2. Stream and collect timetable connections for the morning peak (06:30 - 09:30)
  console.log(`Streaming GTFS timetable connections for peak hours (06:30 - 09:30)...`);
  const timetableConnections = [];
  let currTrip = null;
  let currActive = false;
  let prevStation = null;
  let prevDepSec = null;

  const parser = createCsvStreamParser({
    onRow: (vals) => {
      const tripId = vals[0];
      const arrTimeStr = vals[1];
      const depTimeStr = vals[2];
      const stopId = vals[3];

      if (tripId !== currTrip) {
        currTrip = tripId;
        currActive = activeTripIds.has(tripId);
        prevStation = null;
        prevDepSec = null;
      }
      if (!currActive) return;

      const stationId = stopToStation.get(stopId);
      if (!stationId) {
        prevStation = null;
        prevDepSec = null;
        return;
      }

      const depSec = parseTimeToSec(depTimeStr);
      const arrSec = parseTimeToSec(arrTimeStr);

      if (prevStation && prevDepSec !== null && arrSec !== null && prevStation !== stationId) {
        // Collect if in range 06:00 to 10:30
        if (prevDepSec >= 21600 && arrSec <= 37800) {
          timetableConnections.push({
            from: prevStation,
            to: stationId,
            depSec: prevDepSec,
            arrSec: arrSec,
            tripId,
          });
        }
      }

      prevStation = stationId;
      prevDepSec = depSec ?? arrSec;
    },
  });

  await streamZipFile(options.feed, 'stop_times.txt', (chunk, isFinal) => {
    parser.push(chunk);
    if (isFinal) parser.end();
  });

  console.log(`Collected ${timetableConnections.length} peak timetable connections.`);
  timetableConnections.sort((a, b) => a.depSec - b.depSec);

  // Build footpaths map for CSA transfers
  const footpathsByStation = new Map();
  if (transitDataset.footpaths) {
    for (const fp of transitDataset.footpaths) {
      if (!footpathsByStation.has(fp.from)) footpathsByStation.set(fp.from, []);
      footpathsByStation.get(fp.from).push({ to: fp.to, durationSec: Math.round(fp.minutes * 60) });
    }
  }

  // Exact CSA query function
  function queryCsaEarliestArrival(startStationId, targetStationId, depTimeSec) {
    const arrivalTime = new Map();
    arrivalTime.set(startStationId, depTimeSec);

    // Footpaths from origin
    const directFps = footpathsByStation.get(startStationId) || [];
    for (const fp of directFps) {
      arrivalTime.set(fp.to, depTimeSec + fp.durationSec);
    }

    const tripBoarded = new Map();

    for (const conn of timetableConnections) {
      if (conn.depSec < depTimeSec) continue;

      const targetBest = arrivalTime.get(targetStationId);
      if (targetBest && conn.depSec > targetBest) {
        break; // Destination cannot be reached earlier
      }

      const prevArr = arrivalTime.get(conn.from);
      const isBoarded = tripBoarded.get(conn.tripId);

      if (isBoarded || (prevArr !== undefined && prevArr <= conn.depSec)) {
        tripBoarded.set(conn.tripId, true);
        const currBest = arrivalTime.get(conn.to);
        if (currBest === undefined || conn.arrSec < currBest) {
          arrivalTime.set(conn.to, conn.arrSec);

          // Relax outgoing footpaths
          const fps = footpathsByStation.get(conn.to) || [];
          for (const fp of fps) {
            const walkArr = conn.arrSec + fp.durationSec;
            const fpBest = arrivalTime.get(fp.to);
            if (fpBest === undefined || walkArr < fpBest) {
              arrivalTime.set(fp.to, walkArr);
            }
          }
        }
      }
    }

    return arrivalTime.get(targetStationId) ?? Infinity;
  }

  // 3. Select 10 diverse target work centers
  const targetNames = ['Marienplatz', 'Hauptbahnhof', 'Garching-Forschungszentrum', 'Pasing', 'Messestadt Ost', 'Ostbahnhof', 'Moosach', 'Neuperlach Süd', 'München Flughafen', 'Sendlinger Tor'];
  const targets = [];
  for (const name of targetNames) {
    const found = stations.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));
    if (found) targets.push(found);
  }

  console.log(`Benchmarking against ${targets.length} key employment hubs...`);

  // Generate deterministic test pairs
  const rng = pseudoRandom(42);
  const testPairs = [];
  for (let i = 0; i < options.numSamples; i++) {
    const origin = stations[Math.floor(rng() * stations.length)];
    const target = targets[Math.floor(rng() * targets.length)];
    if (origin.id !== target.id) {
      testPairs.push({ origin, target });
    }
  }

  // Sample across 07:30 to 08:30 (step 10 min) -> average ground truth travel time
  const sampleDeparturesSec = [27000, 27600, 28200, 28800, 29400, 30000, 30600]; // 07:30 - 08:30
  const deviations = [];
  let reachableMatches = 0;
  let falseReachable = 0;
  let falseUnreachable = 0;

  console.log(`Running CSA ground truth comparison over ${testPairs.length} OD pairs...`);

  for (const pair of testPairs) {
    const timetableTimes = [];
    for (const depSec of sampleDeparturesSec) {
      const arrSec = queryCsaEarliestArrival(pair.origin.id, pair.target.id, depSec);
      if (arrSec !== Infinity && arrSec > depSec) {
        timetableTimes.push((arrSec - depSec) / 60);
      }
    }

    if (timetableTimes.length === 0) {
      // Unreachable in timetable
      continue;
    }

    const groundTruthMedianMin = calculateMedian(timetableTimes);

    // Query our Venn routing engine
    const engineResult = findShortestTransitTrip(
      { lat: pair.origin.lat, lng: pair.origin.lng },
      { lat: pair.target.lat, lng: pair.target.lng },
      {
        id: 'val-test',
        name: 'Validator',
        color: '#000',
        visible: true,
        lat: pair.target.lat,
        lng: pair.target.lng,
        travelTimeMinutes: 120,
        mode: 'transit',
        maxTransfers: 3,
        maxWalkToStationMin: 15,
        maxWalkFromStationMin: 15,
      },
      ['sbahn', 'ubahn', 'tram', 'bus', 'train'],
      {},
      { time: '08:00', dayOfWeek: 'workday', direction: 'to_work' }
    );

    if (engineResult && engineResult.routeFound) {
      const engineTimeMin = engineResult.travelTimeMinutes;
      const diff = engineTimeMin - groundTruthMedianMin;
      deviations.push(diff);

      // Check 45-min budget reachability agreement
      const csaReachable = groundTruthMedianMin <= 45;
      const engReachable = engineTimeMin <= 45;
      if (csaReachable === engReachable) {
        reachableMatches++;
      } else if (engReachable && !csaReachable) {
        falseReachable++;
      } else {
        falseUnreachable++;
      }
    } else {
      if (groundTruthMedianMin <= 45) {
        falseUnreachable++;
      } else {
        reachableMatches++;
      }
    }
  }

  // Calculate statistics
  const absDeviations = deviations.map((d) => Math.abs(d));
  const medianAbsDiff = calculateMedian(absDeviations);
  const sortedAbs = [...absDeviations].sort((a, b) => a - b);
  const p90AbsDiff = sortedAbs[Math.floor(sortedAbs.length * 0.9)] ?? 0;
  const within5MinPct = Number(((absDeviations.filter((d) => d <= 5.0).length / Math.max(1, absDeviations.length)) * 100).toFixed(1));
  const totalEvaluated = reachableMatches + falseReachable + falseUnreachable;
  const reachabilityAccuracyPct = Number(((reachableMatches / Math.max(1, totalEvaluated)) * 100).toFixed(1));

  console.log(`\n======================================================`);
  console.log(` VALIDATION RESULTS vs. EXACT TIMETABLE GROUND TRUTH`);
  console.log(`------------------------------------------------------`);
  console.log(`  Evaluated OD Pairs:        ${deviations.length}`);
  console.log(`  Median |Deviation|:         ${medianAbsDiff.toFixed(1)} min (Target: <= 3.0 min: ${medianAbsDiff <= 3.0 ? 'PASSED ✓' : 'EXCEEDED'})`);
  console.log(`  P90 |Deviation|:            ${p90AbsDiff.toFixed(1)} min (Target: <= 8.0 min: ${p90AbsDiff <= 8.0 ? 'PASSED ✓' : 'EXCEEDED'})`);
  console.log(`  Within ±5 Min Window:       ${within5MinPct} %`);
  console.log(`  45-Min Reachability Acc:    ${reachabilityAccuracyPct} %`);
  console.log(`  False Reachable:            ${falseReachable}`);
  console.log(`  False Unreachable:          ${falseUnreachable}`);
  console.log(`======================================================\n`);

  return {
    medianAbsDiff,
    p90AbsDiff,
    within5MinPct,
    reachabilityAccuracyPct,
  };
}

if (process.argv[1] && process.argv[1].endsWith('validateTransitPackage.mjs')) {
  validateTransitPackage().catch((err) => {
    console.error('Validation failed:', err);
    process.exit(1);
  });
}
