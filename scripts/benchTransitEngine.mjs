/**
 * scripts/benchTransitEngine.mjs
 * Performance Benchmark and SLO Assertion Suite for Venn Transit Engine.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  setTransitRegion,
  calculateReachableStations,
  findShortestTransitTrip,
  getOrCreateTransitGraph,
  generateMvvTransitIsochrone,
} from '../src/services/mvvMatrixService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function measureMedianMs(fn, iterations = 10) {
  const times = [];
  // Warmup
  fn();
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

export async function runBenchmarks() {
  console.log(`\n======================================================`);
  console.log(` Venn Transit Engine Performance Benchmark & SLOs`);
  console.log(`======================================================\n`);

  const pkgPath = path.join(ROOT_DIR, 'public', 'transit-packages', 'munich.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`Package not found at ${pkgPath}. Run transit:compile first.`);
  }

  // 1. Benchmark: Parse Package & Build Graph
  console.log(`[1/4] Benchmarking Package Parse & Adjacency Graph Construction...`);
  const rawJson = fs.readFileSync(pkgPath, 'utf-8');
  const parseAndGraphMs = measureMedianMs(() => {
    const parsed = JSON.parse(rawJson);
    const allowedModes = new Set(['sbahn', 'ubahn', 'tram', 'bus', 'train']);
    getOrCreateTransitGraph(parsed, allowedModes, false);
    getOrCreateTransitGraph(parsed, allowedModes, true);
  }, 10);
  console.log(`  Median Time: ${parseAndGraphMs.toFixed(2)} ms (SLO Budget: <= 150 ms: ${parseAndGraphMs <= 150 ? 'PASSED ✓' : 'EXCEEDED ✗'})`);

  // Load dataset into engine
  const dataset = JSON.parse(rawJson);
  setTransitRegion(dataset);

  const marienplatz = { lat: 48.1371, lng: 11.5754 };
  const garching = { lat: 48.2625, lng: 11.6678 };
  const pasing = { lat: 48.1500, lng: 11.4616 };

  // 2. Benchmark: calculateReachableStations (60 min travel budget)
  console.log(`[2/4] Benchmarking calculateReachableStations (60 min budget)...`);
  const testProfile = {
    id: 'bench-p1',
    name: 'Marienplatz Anchor',
    address: 'Marienplatz',
    lat: marienplatz.lat,
    lng: marienplatz.lng,
    travelTimeMinutes: 60,
    mode: 'transit',
    maxTransfers: 2,
    maxWalkToStationMin: 10,
    maxWalkFromStationMin: 10,
    maxTransferWaitMin: 15,
  };
  const schedule = {
    direction: 'to_work',
    dayOfWeek: 'workday',
    time: '08:00',
    options: {
      walkingSpeedKmh: 4.0,
      urbanDetourFactor: 1.35,
      minTransferBufferMin: 4.0,
      transferRiskBufferMin: 2.0,
      enableHeadwayPenalty: true,
      stationCatchmentMode: 'heuristic',
    },
  };

  const reachableMs = measureMedianMs(() => {
    calculateReachableStations(testProfile, undefined, schedule.options, schedule);
  }, 15);
  const reachableCount = calculateReachableStations(testProfile, undefined, schedule.options, schedule).length;
  console.log(`  Stations Reached: ${reachableCount}`);
  console.log(`  Median Time: ${reachableMs.toFixed(2)} ms (SLO Budget: <= 35 ms: ${reachableMs <= 35 ? 'PASSED ✓' : 'EXCEEDED ✗'})`);

  // 3. Benchmark: findShortestTransitTrip (Point-to-Point A* Inspection)
  console.log(`[3/4] Benchmarking findShortestTransitTrip (Pasing -> Garching)...`);
  const ptpMs = measureMedianMs(() => {
    findShortestTransitTrip(
      pasing,
      garching,
      testProfile,
      ['sbahn', 'ubahn', 'tram', 'bus', 'train'],
      schedule.options,
      schedule
    );
  }, 20);
  const tripResult = findShortestTransitTrip(
    pasing,
    garching,
    testProfile,
    ['sbahn', 'ubahn', 'tram', 'bus', 'train'],
    schedule.options,
    schedule
  );
  console.log(`  Trip Time: ${tripResult?.travelTimeMinutes ?? 'N/A'} min | Lines: ${tripResult?.linesUsed.join(' -> ')}`);
  console.log(`  Median Time: ${ptpMs.toFixed(2)} ms (SLO Budget: <= 30 ms: ${ptpMs <= 30 ? 'PASSED ✓' : 'EXCEEDED ✗'})`);

  // 4. Benchmark: generateMvvTransitIsochrone (Full Isochrone Geometry Union)
  console.log(`[4/4] Benchmarking generateMvvTransitIsochrone (30 min budget)...`);
  const isochrone30Profile = {
    ...testProfile,
    travelTimeMinutes: 30,
  };
  const isochroneMs = measureMedianMs(() => {
    generateMvvTransitIsochrone(isochrone30Profile, undefined, schedule.options, schedule);
  }, 5);
  console.log(`  Median Time: ${isochroneMs.toFixed(2)} ms (SLO Budget: <= 800 ms: ${isochroneMs <= 800 ? 'PASSED ✓' : 'EXCEEDED ✗'})`);

  console.log(`\n======================================================`);
  console.log(` BENCHMARK SUITE COMPLETE`);
  console.log(`======================================================\n`);

  return {
    parseAndGraphMs,
    reachableMs,
    ptpMs,
    isochroneMs,
  };
}

if (process.argv[1] && process.argv[1].endsWith('benchTransitEngine.mjs')) {
  runBenchmarks().catch((err) => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}
