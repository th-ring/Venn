/**
 * testEssential.mjs
 * Essential test suite for Venn's core computational engine:
 * 1. Multi-polygon intersection calculation (Turf v7)
 * 2. Hole-filling geometry transformation
 * 3. Area and geodesic distance calculations
 * 4. Point-in-polygon containment checks
 * 5. ISO 9241-110 empty-state fallback suggestions heuristic
 * 6. WCAG 2.2 accessible line signatures and pattern assignments
 */

import assert from 'node:assert/strict';
import * as turf from '@turf/turf';
import {
  calculateMultiIntersection,
  fillPolygonHoles,
  calculateAreaKm2,
  calculateDistanceKm,
  isPointInPolygon,
  generateEmptyIntersectionSuggestions,
} from '../src/services/geometry.ts';
import { getProfileLineSignature } from '../src/services/mapPatterns.ts';

let passCount = 0;
let totalCount = 0;

function test(description, fn) {
  totalCount++;
  try {
    fn();
    passCount++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('\n--- Venn Essential Test Suite ---\n');

// Group 1: Geometric Multi-Intersection
console.log('1. Geometric Multi-Intersection:');

test('returns null for empty polygon array', () => {
  assert.equal(calculateMultiIntersection([]), null);
});

test('returns the polygon unchanged when single polygon provided', () => {
  const poly = turf.polygon([[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]]);
  const res = calculateMultiIntersection([poly]);
  assert.equal(res, poly);
});

test('computes intersection of two overlapping polygons', () => {
  const p1 = turf.polygon([[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]]);
  const p2 = turf.polygon([[[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]]]);
  const res = calculateMultiIntersection([p1, p2]);
  assert.ok(res !== null, 'Intersection should not be null');
  assert.ok(res.geometry.type === 'Polygon', 'Result should be a Polygon');
  // Check overlapping region bounds [1,1] to [2,2]
  assert.ok(isPointInPolygon([1.5, 1.5], res), 'Center of overlap [1.5, 1.5] must be inside');
  assert.ok(!isPointInPolygon([0.5, 0.5], res), 'Non-overlapping point [0.5, 0.5] must not be inside');
});

test('computes intersection of three mutually overlapping polygons', () => {
  const p1 = turf.polygon([[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]]);
  const p2 = turf.polygon([[[1, 1], [1, 5], [5, 5], [5, 1], [1, 1]]]);
  const p3 = turf.polygon([[[2, 2], [2, 6], [6, 6], [6, 2], [2, 2]]]);
  const res = calculateMultiIntersection([p1, p2, p3]);
  assert.ok(res !== null, 'Three-way intersection should not be null');
  assert.ok(isPointInPolygon([2.5, 2.5], res), 'Point [2.5, 2.5] is in all three polygons');
  assert.ok(!isPointInPolygon([1.5, 1.5], res), 'Point [1.5, 1.5] is not in p3');
});

test('returns null for disjoint (non-overlapping) polygons', () => {
  const p1 = turf.polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
  const p2 = turf.polygon([[[10, 10], [10, 11], [11, 11], [11, 10], [10, 10]]]);
  const res = calculateMultiIntersection([p1, p2]);
  assert.equal(res, null, 'Disjoint polygons must return null');
});

// Group 2: Hole-Filling Geometry
console.log('\n2. Hole-Filling Geometry (Google Maps Isochrone cleanup):');

test('removes interior hole rings from a single Polygon', () => {
  // Outer ring from (0,0) to (10,10), inner hole from (2,2) to (8,8)
  const polyWithHole = turf.polygon([
    [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
    [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]],
  ]);
  assert.equal(polyWithHole.geometry.coordinates.length, 2, 'Original has 2 coordinate rings (outer + hole)');

  const filled = fillPolygonHoles(polyWithHole);
  assert.equal(filled.geometry.coordinates.length, 1, 'Filled polygon has only 1 coordinate ring (outer)');
  assert.deepEqual(filled.geometry.coordinates[0], polyWithHole.geometry.coordinates[0], 'Outer ring is preserved');
});

test('removes interior hole rings across MultiPolygon parts', () => {
  const multiPolyWithHole = turf.multiPolygon([
    [
      [[0, 0], [0, 5], [5, 5], [5, 0], [0, 0]],
      [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]],
    ],
    [
      [[10, 10], [10, 15], [15, 15], [15, 10], [10, 10]],
    ],
  ]);

  const filled = fillPolygonHoles(multiPolyWithHole);
  assert.equal(filled.geometry.coordinates[0].length, 1, 'Part 0 hole was removed');
  assert.equal(filled.geometry.coordinates[1].length, 1, 'Part 1 remains intact');
});

// Group 3: Area and Distance Calculations
console.log('\n3. Area and Distance Calculations:');

test('calculates area in km2 correctly', () => {
  // Approx 0.1 deg lat x 0.1 deg lng at 48N is approx 11km x 7.4km ≈ 80-90 km2
  const poly = turf.polygon([
    [[11.5, 48.1], [11.5, 48.2], [11.6, 48.2], [11.6, 48.1], [11.5, 48.1]],
  ]);
  const area = calculateAreaKm2(poly);
  assert.ok(area > 80 && area < 95, `Area ${area} km2 should be between 80 and 95 km2`);
  assert.equal(calculateAreaKm2(null), 0, 'Null feature returns 0 km2');
});

test('calculates geodesic distance in km between two coordinates', () => {
  // Distance Marienplatz (48.1371, 11.5754) to BMW Vierzylinder (48.1772, 11.5593) is ~4.6 km
  const dist = calculateDistanceKm(48.1371, 11.5754, 48.1772, 11.5593);
  assert.ok(dist >= 4.4 && dist <= 4.8, `Calculated distance ${dist} km must be ~4.6 km`);
});

// Group 4: Point-In-Polygon Containment
console.log('\n4. Point-In-Polygon Containment:');

test('correctly identifies interior and exterior points', () => {
  const poly = turf.polygon([[[11.0, 48.0], [11.0, 49.0], [12.0, 49.0], [12.0, 48.0], [11.0, 48.0]]]);
  assert.equal(isPointInPolygon([11.5, 48.5], poly), true, 'Point inside boundary returns true');
  assert.equal(isPointInPolygon([10.5, 48.5], poly), false, 'Point outside boundary returns false');
  assert.equal(isPointInPolygon([11.5, 48.5], null), false, 'Null polygon returns false');
});

// Group 5: ISO 9241-110 Fallback Suggestions Heuristic
console.log('\n5. ISO 9241-110 Fallback Suggestions:');

test('generates smart suggestions when intersection is empty', () => {
  const profiles = [
    {
      id: 'p1',
      name: 'Person 1',
      address: 'Marienplatz',
      lat: 48.1371,
      lng: 11.5754,
      travelTimeMinutes: 20,
      mode: 'walking',
      color: '#2563EB',
      visible: true,
    },
    {
      id: 'p2',
      name: 'Person 2',
      address: 'Garching Forschungszentrum',
      lat: 48.2625,
      lng: 11.6678,
      travelTimeMinutes: 25,
      mode: 'transit',
      color: '#F97316',
      visible: true,
    },
  ];

  const suggestions = generateEmptyIntersectionSuggestions(profiles);
  assert.ok(suggestions.length >= 2, 'Must generate at least 2 suggestions');

  // Must have a time-bump suggestion for the lowest travel time
  const bump = suggestions.find((s) => s.type === 'increase_time');
  assert.ok(bump !== undefined, 'Must provide an increase_time suggestion');
  assert.equal(bump.personId, 'p1', 'Must target person 1 with lowest budget');
  assert.equal(bump.suggestedMinutes, 35, 'Must suggest 20 + 15 = 35 minutes');

  // Must have a mode change suggestion for walking profile across 15+ km distance
  const modeChange = suggestions.find((s) => s.type === 'change_mode');
  assert.ok(modeChange !== undefined, 'Must suggest mode change for walking person at large distance');
  assert.equal(modeChange.suggestedMode, 'cycling');

  // Must have mutual bump suggestion
  const mutual = suggestions.find((s) => s.type === 'mutual_increase');
  assert.ok(mutual !== undefined, 'Must provide mutual increase option');
});

test('returns empty suggestions array when fewer than 2 active profiles', () => {
  const profiles = [
    {
      id: 'p1',
      name: 'Person 1',
      lat: 48.1371,
      lng: 11.5754,
      travelTimeMinutes: 30,
      mode: 'transit',
      color: '#2563EB',
      visible: true,
    },
  ];
  assert.deepEqual(generateEmptyIntersectionSuggestions(profiles), []);
});

// Group 6: WCAG 2.2 Accessibility Line Signatures
console.log('\n6. WCAG 2.2 Accessible Signatures & Pattern Mapping:');

test('assigns distinct line dash patterns for profiles', () => {
  const sig0 = getProfileLineSignature(0);
  const sig1 = getProfileLineSignature(1);
  const sig2 = getProfileLineSignature(2);

  // Profile 0 has solid contour (undefined dashArray for Leaflet)
  assert.equal(sig0.dashArray, undefined, 'Profile 0 should be solid');
  assert.equal(sig1.dashArray, '9, 6', 'Profile 1 should be dashed (9, 6)');
  assert.equal(sig2.dashArray, '3, 6', 'Profile 2 should be dotted (3, 6)');

  // All 3 signatures have distinct pattern IDs
  assert.notEqual(sig0.patternId, sig1.patternId);
  assert.notEqual(sig1.patternId, sig2.patternId);
});

test('assigns valid SVG pattern IDs and adjusts weight in dark mode', () => {
  const lightSig = getProfileLineSignature(0, false);
  const darkSig = getProfileLineSignature(0, true);

  assert.ok(lightSig.patternId.startsWith('venn-pat-'), 'Pattern ID must have venn-pat- prefix');
  assert.equal(darkSig.weight, lightSig.weight + 0.5, 'Dark mode enhances contour weight by 0.5px for contrast');
});

console.log(`\n========================================`);
console.log(`All ${passCount}/${totalCount} essential tests passed successfully!`);
console.log(`========================================\n`);
