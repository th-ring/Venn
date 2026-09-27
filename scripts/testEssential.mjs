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
  getPolygonCenter,
  samplePolygonPoints,
} from '../src/services/geometry.ts';
import { getProfileLineSignature } from '../src/services/mapPatterns.ts';
import {
  validateApartmentListing,
  validateApartmentDataset,
  filterApartmentsInPolygon,
  calculateApartmentCommute,
  extractIntersectionSubAreas,
  getPortalSearchLinks,
} from '../src/services/apartmentService.ts';

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

// Group 4b: Polygon Center & Spatial Sampling
console.log('\n4b. Polygon Center & Area Sampling:');

test('calculates interior center coordinate inside polygon', () => {
  const poly = turf.polygon([[[11.0, 48.0], [11.0, 49.0], [12.0, 49.0], [12.0, 48.0], [11.0, 48.0]]]);
  const center = getPolygonCenter(poly);
  assert.ok(center !== null, 'Center must not be null');
  assert.ok(isPointInPolygon(center, poly), 'Center point must be inside polygon');
});

test('samples representative points along polygon perimeter and center', () => {
  const poly = turf.polygon([[[11.0, 48.0], [11.0, 49.0], [12.0, 49.0], [12.0, 48.0], [11.0, 48.0]]]);
  const samples = samplePolygonPoints(poly, 10);
  assert.ok(samples.length >= 2, 'Must sample at least 2 points');
  assert.ok(samples.length <= 10, 'Must not exceed maxPoints');
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

// Group 7: Apartment Data Models, Validation & Commute Scoring
console.log('\n7. Apartment Data Models, Validation & Commute Scoring:');

test('validates and sanitizes a complete apartment listing', () => {
  const raw = {
    id: 'apt-test-1',
    title: 'Helle Altbauwohnung mit Südbalkon',
    address: 'Theresienstraße 12',
    district: 'Maxvorstadt',
    city: 'München',
    lat: 48.1501,
    lng: 11.5712,
    priceCold: 1450,
    priceWarm: 1680,
    sizeSqm: 65,
    rooms: 2,
    features: ['Balkon', 'Einbauküche', ''],
    thumbnailUrl: 'https://images.unsplash.com/photo-123?w=800',
    source: 'immoscout24',
  };

  const validated = validateApartmentListing(raw);
  assert.ok(validated !== null, 'Listing should be valid');
  assert.equal(validated.id, 'apt-test-1');
  assert.equal(validated.title, 'Helle Altbauwohnung mit Südbalkon');
  assert.equal(validated.priceCold, 1450);
  assert.equal(validated.priceWarm, 1680);
  assert.equal(validated.currency, 'EUR');
  assert.equal(validated.features.length, 2, 'Empty feature strings must be filtered out');
});

test('rejects malformed apartment listings with missing coordinates or price', () => {
  assert.equal(validateApartmentListing(null), null);
  assert.equal(validateApartmentListing({ title: 'No coords', priceCold: 1000, sizeSqm: 50, rooms: 2 }), null);
  assert.equal(validateApartmentListing({ title: 'Bad lat', lat: 95.0, lng: 11.5, priceCold: 1000, sizeSqm: 50, rooms: 2 }), null);
  assert.equal(validateApartmentListing({ title: 'Negative price', lat: 48.1, lng: 11.5, priceCold: -100, sizeSqm: 50, rooms: 2 }), null);
  assert.equal(validateApartmentListing({ title: 'Zero rooms', lat: 48.1, lng: 11.5, priceCold: 1000, sizeSqm: 50, rooms: 0 }), null);
});

test('validates dataset with valid and invalid entries', () => {
  const dataset = {
    version: '1.0.0',
    listings: [
      { id: '1', title: 'Apt 1', lat: 48.15, lng: 11.57, priceCold: 1200, sizeSqm: 55, rooms: 2 },
      { id: '2', title: 'Invalid', lat: 200, lng: 11.57, priceCold: 1200, sizeSqm: 55, rooms: 2 },
    ],
  };

  const res = validateApartmentDataset(dataset);
  assert.equal(res.valid, true);
  assert.equal(res.listings.length, 1);
  assert.equal(res.errors.length, 1);
});

test('filters apartments inside common intersection polygon', () => {
  // Polygon covering area around lng: [11.55, 11.60], lat: [48.14, 48.18]
  const poly = turf.polygon([[
    [11.55, 48.14],
    [11.60, 48.14],
    [11.60, 48.18],
    [11.55, 48.18],
    [11.55, 48.14],
  ]]);

  const listings = [
    { id: 'inside', title: 'Inside', lat: 48.16, lng: 11.57, priceCold: 1000, sizeSqm: 50, rooms: 2, features: [], city: 'München', address: 'A', source: 'custom' },
    { id: 'outside', title: 'Outside', lat: 48.25, lng: 11.75, priceCold: 1000, sizeSqm: 50, rooms: 2, features: [], city: 'München', address: 'B', source: 'custom' },
  ];

  const filtered = filterApartmentsInPolygon(listings, poly);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'inside');
});

test('calculates commute fairness score and balance across multiple profiles', () => {
  const apt = {
    id: 'apt-schwabing',
    title: 'Schwabing Apt',
    lat: 48.16,
    lng: 11.57,
    priceCold: 1500,
    sizeSqm: 70,
    rooms: 2.5,
    features: [],
    city: 'München',
    address: 'Teststraße 1',
    source: 'custom',
  };

  const profiles = [
    {
      id: 'p1',
      name: 'BMW (Norden)',
      lat: 48.1772,
      lng: 11.5595,
      travelTimeMinutes: 30,
      mode: 'driving',
      color: '#3B82F6',
      visible: true,
    },
    {
      id: 'p2',
      name: 'Marienplatz (Zentrum)',
      lat: 48.1371,
      lng: 11.5754,
      travelTimeMinutes: 30,
      mode: 'transit',
      color: '#8B5CF6',
      visible: true,
    },
  ];

  const schedule = {
    direction: 'to_work',
    dayOfWeek: 'workday',
    time: '07:00',
    options: { liveTraffic: false, enableSmoothing: true, fidelity: 'AUTOMATIC' },
  };

  const score = calculateApartmentCommute(apt, profiles, schedule);
  assert.equal(score.apartmentId, 'apt-schwabing');
  assert.equal(score.personCommutes.length, 2);
  assert.ok(score.avgCommuteMinutes > 0 && score.avgCommuteMinutes < 30);
  assert.ok(typeof score.commuteSpreadMinutes === 'number');
  assert.equal(score.allWithinLimit, true);
});

test('extracts disjoint sub-areas from MultiPolygon intersection with labels and BBOX', () => {
  // Construct a MultiPolygon representing 2 disjoint islands (e.g. transit corridor north vs highway west)
  const polyA = [
    [[11.55, 48.15], [11.55, 48.17], [11.57, 48.17], [11.57, 48.15], [11.55, 48.15]]
  ];
  const polyB = [
    [[11.60, 48.18], [11.60, 48.20], [11.62, 48.20], [11.62, 48.18], [11.60, 48.18]]
  ];
  const multiPoly = turf.multiPolygon([polyA, polyB]);

  const subAreas = extractIntersectionSubAreas(multiPoly, [
    { id: '1', title: 'A', lat: 48.16, lng: 11.56, priceCold: 1000, sizeSqm: 50, rooms: 2, city: 'München', address: 'A', source: 'immoscout24' }
  ]);

  assert.equal(subAreas.length, 2, 'Should detect exactly 2 disjoint sub-areas');
  assert.ok(subAreas[0].areaKm2 > 0, 'Sub-area 1 should have positive area');
  assert.ok(subAreas[1].areaKm2 > 0, 'Sub-area 2 should have positive area');
  assert.equal(subAreas[0].portalLinks.length, 4, 'Each sub-area should have 4 portal deep-links');
  assert.ok(subAreas.some(sa => sa.listingsCount === 1), 'Sub-area covering [11.56, 48.16] should contain 1 listing');
});

test('generates valid portal search deep-links with radius and coordinate attributes', () => {
  const links = getPortalSearchLinks({ lat: 48.1582, lng: 11.5741 }, [11.55, 48.15, 11.58, 48.18], 2, 'München');
  assert.equal(links.length, 4);

  const is24 = links.find((l) => l.portal === 'immoscout24');
  assert.ok(is24, 'ImmoScout24 link must be present');
  assert.ok(is24.url.includes('centerlat=48.1582') && is24.url.includes('centerlon=11.5741'));

  const iw = links.find((l) => l.portal === 'immowelt');
  assert.ok(iw, 'Immowelt link must be present');
  assert.ok(iw.url.includes('lat=48.1582') && iw.url.includes('lon=11.5741'));

  const wg = links.find((l) => l.portal === 'wg-gesucht');
  assert.ok(wg, 'WG-Gesucht link must be present');
  assert.ok(wg.url.includes('wohnungen-in-M%C3%BCnchen.html'));

  const ka = links.find((l) => l.portal === 'kleinanzeigen');
  assert.ok(ka, 'Kleinanzeigen link must be present');
  assert.ok(ka.url.includes('latitude=48.1582') && ka.url.includes('longitude=11.5741'));
});

console.log(`\n========================================`);
console.log(`All ${passCount}/${totalCount} essential tests passed successfully!`);
console.log(`========================================\n`);
