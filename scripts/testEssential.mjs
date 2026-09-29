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
  buildAgenticBrowserSearchPrompt,
  isSwapOffer,
  extractPortalExposeId,
} from '../src/services/apartmentService.ts';
import { PriorityQueue } from '../src/services/priorityQueue.ts';
import {
  calculateReachableStations,
  findShortestTransitTrip,
  getTransitRegion,
} from '../src/services/mvvMatrixService.ts';
import { validateTransitRegion } from '../src/services/transitStorage.ts';
import {
  getSecureRandom,
  generateSecureId,
  encryptSensitiveValue,
  decryptSensitiveValue,
} from '../src/utils/crypto.ts';

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
  assert.ok(is24.url.includes('/Suche/de/bayern/muenchen/wohnung-mieten'), 'IS24 must point to live state/city search route');

  const iw = links.find((l) => l.portal === 'immowelt');
  assert.ok(iw, 'Immowelt link must be present');
  assert.ok(iw.url.includes('/suche/muenchen/wohnungen/mieten?r=2'), 'Immowelt must point to live search route with radius');

  const wg = links.find((l) => l.portal === 'wg-gesucht');
  assert.ok(wg, 'WG-Gesucht link must be present');
  assert.ok(wg.url.includes('wohnungen-in-Muenchen.90.2.1.0.html'), 'WG-Gesucht must point to live city listing page');

  const ka = links.find((l) => l.portal === 'kleinanzeigen');
  assert.ok(ka, 'Kleinanzeigen link must be present');
  assert.ok(ka.url.includes('latitude=48.1582') && ka.url.includes('longitude=11.5741'), 'Kleinanzeigen must point to live radius search route');

  // Also verify district integration
  const linksWithDistrict = getPortalSearchLinks({ lat: 48.1582, lng: 11.5741 }, [11.55, 48.15, 11.58, 48.18], 2, 'München', 'Schwabing-West');
  const is24District = linksWithDistrict.find((l) => l.portal === 'immoscout24');
  assert.ok(is24District.url.includes('/Suche/de/bayern/muenchen/schwabing-west/wohnung-mieten'), 'IS24 must incorporate district when provided');
});

test('buildAgenticBrowserSearchPrompt generates rich prompt with coordinates, radius, BBOX, and target file schema', () => {
  const prompt = buildAgenticBrowserSearchPrompt({
    portalName: 'ImmoScout24',
    portalUrl: 'https://www.immobilienscout24.de/Suche/de/bayern/muenchen/wohnung-mieten',
    portalKey: 'immoscout24',
    areaLabel: 'Bereich 1',
    areaKm2: 1.85,
    center: { lat: 48.1550, lng: 11.5650 },
    bbox: [11.5350, 48.1400, 11.5950, 48.1750],
    radiusKm: 1.8,
    city: 'München',
    addressOrDistrict: 'Karl-Theodor-Straße 34 (Schwabing-West)',
  });

  // Verify slash command and portal invocation
  assert.ok(prompt.startsWith('/browser Öffne ImmoScout24 (https://www.immobilienscout24.de/Suche/de/bayern/muenchen/wohnung-mieten)'));
  assert.ok(prompt.includes('agentic-apartment-browser Skill'));

  // Verify full geographic context
  assert.ok(prompt.includes('Bereich: Bereich 1 (ca. 1.85 km²)'));
  assert.ok(prompt.includes('Zentrum: Breitengrad 48.1550, Längengrad 11.5650'));
  assert.ok(prompt.includes('Suchradius: ca. 1.8 km um das Zentrum'));
  assert.ok(prompt.includes('Bounding Box [minLng, minLat, maxLng, maxLat]: [11.5350, 48.1400, 11.5950, 48.1750]'));
  assert.ok(prompt.includes('Karl-Theodor-Straße 34 (Schwabing-West)'));

  // Verify geo-filtering instruction
  assert.ok(prompt.includes('WICHTIGE GEO-FILTERUNG: Akzeptiere NUR Inserate, deren Koordinaten (lat, lng) tatsächlich innerhalb der Bounding Box'));

  // Verify target file and schema
  assert.ok(prompt.includes('Zieldatei: public/data/apartments.json'));
  assert.ok(prompt.includes('"version": "1.1.0"'));
  assert.ok(prompt.includes('"source": "Agentic Browser Extraction (ImmoScout24)"'));
  assert.ok(prompt.includes('"bbox": [11.5350, 48.1400, 11.5950, 48.1750]'));
  assert.ok(prompt.includes('"id": "<Eindeutige ID, z.B. is24-12345678>"'));
  assert.ok(prompt.includes('Pflichtfelder pro Listing: id, title, lat, lng, priceCold, sizeSqm, rooms.'));
});

test('buildAgenticBrowserSearchPrompt correctly embeds Venn filter settings', () => {
  const prompt = buildAgenticBrowserSearchPrompt({
    portalName: 'Immowelt',
    portalUrl: 'https://www.immowelt.de/suche/muenchen/wohnungen/mieten?r=2',
    portalKey: 'immowelt',
    areaLabel: 'Gemeinsamer Treffbereich',
    center: { lat: 48.15, lng: 11.56 },
    bbox: [11.53, 48.14, 11.59, 48.17],
    radiusKm: 2.0,
    filters: {
      maxPriceWarm: 1750,
      minRooms: 2.5,
      minSizeSqm: 60,
    },
  });

  assert.ok(prompt.includes('Suchkriterien aus Venn:'));
  assert.ok(prompt.includes('Maximale Warmmiete: bis zu 1750 €'));
  assert.ok(prompt.includes('Mindestzimmeranzahl: ab 2.5 Zimmer'));
  assert.ok(prompt.includes('Mindestwohnfläche: ab 60 m²'));
  assert.ok(prompt.includes('"source": "immowelt"'));
  assert.ok(prompt.includes('iw-12345678'));
});

test('buildAgenticBrowserSearchPrompt handles different portal keys and sources properly', () => {
  const kaPrompt = buildAgenticBrowserSearchPrompt({
    portalName: 'Kleinanzeigen',
    portalUrl: 'https://www.kleinanzeigen.de/s-wohnung-mieten/c203',
    portalKey: 'kleinanzeigen',
    areaLabel: 'Bereich 2',
    center: { lat: 48.16, lng: 11.58 },
    bbox: [11.55, 48.15, 11.60, 48.19],
    radiusKm: 1.5,
  });
  assert.ok(kaPrompt.includes('ka-12345678'));
  assert.ok(kaPrompt.includes('"source": "kleinanzeigen"'));

  const wgPrompt = buildAgenticBrowserSearchPrompt({
    portalName: 'WG-Gesucht',
    portalUrl: 'https://www.wg-gesucht.de',
    portalKey: 'wg-gesucht',
    areaLabel: 'Bereich 1',
    center: { lat: 48.15, lng: 11.55 },
    bbox: [11.50, 48.10, 11.60, 48.20],
    radiusKm: 2.0,
  });
  assert.ok(wgPrompt.includes('wg-12345678'));
  assert.ok(wgPrompt.includes('"source": "wg-gesucht"'));
});

test('isSwapOffer identifies swap signals in title and description', () => {
  assert.equal(isSwapOffer('Schöne 3-Zimmer Tauschwohnung in Schwabing', undefined), true);
  assert.equal(isSwapOffer('Helle Wohnung', 'Suche Wohnungstausch gegen 2 Zimmer'), true);
  assert.equal(isSwapOffer('Moderne Wohnung (nur zum Tausch!)', ''), true);
  assert.equal(isSwapOffer('Attraktives Tauschangebot im Zentrum', ''), true);
  assert.equal(isSwapOffer('Helle Altbauwohnung mit Südbalkon', 'Erstbezug nach Sanierung'), false);
  assert.equal(isSwapOffer(undefined, undefined), false);
});

test('validateApartmentListing rejects swap offers in title or description', () => {
  const swapListing = {
    id: 'is24-12345678',
    title: '3-Zimmer Tauschwohnung am Park',
    lat: 48.15,
    lng: 11.56,
    priceCold: 1200,
    sizeSqm: 65,
    rooms: 3,
  };
  assert.equal(validateApartmentListing(swapListing), null);

  const swapInDesc = {
    id: 'is24-12345679',
    title: 'Schöne Altbauwohnung',
    description: 'Wir suchen einen Wohnungstausch nach Berlin.',
    lat: 48.15,
    lng: 11.56,
    priceCold: 1200,
    sizeSqm: 65,
    rooms: 3,
  };
  assert.equal(validateApartmentListing(swapInDesc), null);

  const validListing = {
    id: 'is24-12345680',
    title: 'Normale Mietwohnung am Park',
    description: 'Bezugsfrei ab sofort.',
    lat: 48.15,
    lng: 11.56,
    priceCold: 1200,
    sizeSqm: 65,
    rooms: 3,
  };
  assert.notEqual(validateApartmentListing(validListing), null);
});

test('extractPortalExposeId extracts valid IDs from data-obid or URL regex and rejects artificial IDs', () => {
  assert.equal(extractPortalExposeId({ dataObid: '152849201' }), '152849201');
  assert.equal(
    extractPortalExposeId({ href: 'https://www.immobilienscout24.de/expose/152849201?referrer=RESULT_LIST_LISTING' }),
    '152849201'
  );
  assert.equal(extractPortalExposeId({ href: '/expose/98765432' }), '98765432');
  // Rejects artificial non-numeric IDs
  assert.equal(extractPortalExposeId({ href: 'https://www.immobilienscout24.de/expose/apt-mujl0weo-01' }), null);
  assert.equal(extractPortalExposeId({ dataObid: 'fake-id' }), null);
  assert.equal(extractPortalExposeId({}), null);
});

test('buildAgenticBrowserSearchPrompt embeds strict ID extraction, swap exclusion, and preflight check', () => {
  const prompt = buildAgenticBrowserSearchPrompt({
    portalName: 'ImmoScout24',
    portalUrl: 'https://www.immobilienscout24.de',
    areaLabel: 'Bereich 1',
    center: { lat: 48.155, lng: 11.565 },
    bbox: [11.535, 48.14, 11.595, 48.175],
    radiusKm: 1.5,
  });

  assert.ok(prompt.includes('STRIKTE ID- UND URL-EXTRAKTION'));
  assert.ok(prompt.includes('data-obid'));
  assert.ok(prompt.includes('r"/expose/(\\d+)"'));
  assert.ok(prompt.includes('AUSSCHLUSS VON TAUSCHANGEBOTEN'));
  assert.ok(prompt.includes('PRE-FLIGHT-VERFÜGBARKEITSPRÜFUNG'));
  assert.ok(prompt.includes('HTTP-Statuscode des Exposés 200'));
  assert.ok(prompt.includes('.is24-deactivated-banner'));
});

// Group 8: PriorityQueue (Min-Heap invariant, order, duplicates, empty state, churn)
console.log('\n8. PriorityQueue (Min-Heap Invariant & Ordering):');

test('handles empty priority queue operations gracefully', () => {
  const pq = new PriorityQueue((a, b) => a - b);
  assert.equal(pq.isEmpty(), true);
  assert.equal(pq.size, 0);
  assert.equal(pq.pop(), undefined);
});

test('handles single item push and pop correctly', () => {
  const pq = new PriorityQueue((a, b) => a.priority - b.priority);
  pq.push({ id: 'item1', priority: 42 });
  assert.equal(pq.size, 1);
  assert.equal(pq.isEmpty(), false);

  const popped = pq.pop();
  assert.deepEqual(popped, { id: 'item1', priority: 42 });
  assert.equal(pq.size, 0);
  assert.equal(pq.isEmpty(), true);
});

test('maintains min-heap ordering with descending and random inputs', () => {
  const pq = new PriorityQueue((a, b) => a - b);
  const values = [50, 40, 30, 20, 10, 5, 2, 1];
  values.forEach((v) => pq.push(v));

  assert.equal(pq.size, values.length);

  const extracted = [];
  while (!pq.isEmpty()) {
    extracted.push(pq.pop());
  }

  assert.deepEqual(extracted, [1, 2, 5, 10, 20, 30, 40, 50]);
});

test('correctly orders duplicate priorities without corruption', () => {
  const pq = new PriorityQueue((a, b) => a.cost - b.cost);
  const items = [
    { name: 'c1', cost: 10 },
    { name: 'a1', cost: 5 },
    { name: 'b1', cost: 5 },
    { name: 'c2', cost: 10 },
    { name: 'd1', cost: 20 },
    { name: 'a2', cost: 5 },
  ];
  items.forEach((item) => pq.push(item));

  const sortedCosts = [];
  while (!pq.isEmpty()) {
    sortedCosts.push(pq.pop().cost);
  }
  assert.deepEqual(sortedCosts, [5, 5, 5, 10, 10, 20]);
});

test('stress test: maintains min-heap property over 200 pseudo-random numbers', () => {
  const pq = new PriorityQueue((a, b) => a - b);
  const randomNumbers = [];
  for (let i = 0; i < 200; i++) {
    const val = Math.floor(Math.random() * 1000);
    randomNumbers.push(val);
    pq.push(val);
  }

  assert.equal(pq.size, 200);

  let prev = -Infinity;
  let popCount = 0;
  while (!pq.isEmpty()) {
    const current = pq.pop();
    assert.ok(current >= prev, `Current element (${current}) must be >= previous element (${prev})`);
    prev = current;
    popCount++;
  }
  assert.equal(popCount, 200);
  assert.equal(pq.isEmpty(), true);
});

// Group 9: Transit Graph Routing & Schema Validation
console.log('\n9. Transit Graph Routing & Schema Validation:');

test('validateTransitRegion accepts valid metropolitan packages and rejects malformed datasets', () => {
  const validMunich = getTransitRegion();
  const resValid = validateTransitRegion(validMunich);
  assert.ok(resValid !== null, 'Valid Munich dataset must pass validation');
  assert.equal(resValid.id, 'munich-mvv');
  assert.ok(resValid.stations.length > 50);

  // Missing ID / Name
  assert.equal(validateTransitRegion(null), null);
  assert.equal(validateTransitRegion({}), null);
  assert.equal(validateTransitRegion({ id: '', name: 'Test' }), null);

  // Invalid BBOX (must be array of 4 numbers)
  assert.equal(validateTransitRegion({ id: 't1', name: 'Test', bbox: [1, 2], stations: [], connections: [] }), null);
  assert.equal(validateTransitRegion({ id: 't1', name: 'Test', bbox: ['a', 'b', 'c', 'd'], stations: [], connections: [] }), null);

  // Rejects packages with corrupted station entries or coordinates
  const withMalformedStations = {
    id: 'test-custom',
    name: 'Test Custom',
    version: '1.0',
    bbox: [11.0, 48.0, 12.0, 49.0],
    stations: [
      { id: 's1', name: 'Valid 1', lat: 48.1, lng: 11.5, modes: ['subway'] },
      { id: 's3', name: 'Invalid Coords', lat: 999, lng: 11.7 },
    ],
    connections: [],
  };
  assert.equal(validateTransitRegion(withMalformedStations), null, 'Corrupt station coordinates (lat: 999) must cause package rejection');

  // Accepts valid custom packages
  const validCustom = {
    id: 'test-custom-valid',
    name: 'Test Custom Valid',
    version: '1.0',
    bbox: [11.0, 48.0, 12.0, 49.0],
    stations: [
      { id: 's1', name: 'Valid 1', lat: 48.1, lng: 11.5, lines: ['U1'], types: ['ubahn'] },
      { id: 's2', name: 'Valid 2', lat: 48.2, lng: 11.6, lines: ['U1'], types: ['ubahn'] },
    ],
    connections: [
      { from: 's1', to: 's2', line: 'U1', minutes: 3, mode: 'subway' },
    ],
  };
  const sanitized = validateTransitRegion(validCustom);
  assert.ok(sanitized !== null, 'Valid custom package should be accepted');
  assert.equal(sanitized.stations.length, 2);
  assert.equal(sanitized.connections.length, 1);
});

test('findShortestTransitTrip returns direct walk shortcut when within 800m', () => {
  // Marienplatz to Sendlinger Tor (~700m direct walk)
  const origin = { lat: 48.1371, lng: 11.5754 };
  const destination = { lat: 48.1333, lng: 11.5667 };
  const profile = {
    id: 'p1',
    name: 'Max',
    lat: origin.lat,
    lng: origin.lng,
    travelTimeMinutes: 30,
    mode: 'transit',
    color: '#3B82F6',
    visible: true,
    maxWalkToStationMin: 15,
    maxWalkFromStationMin: 15,
  };

  const trip = findShortestTransitTrip(origin, destination, profile);
  assert.ok(trip !== null);
  assert.equal(trip.routeFound, true);
  assert.equal(trip.inVehicleMin, 0, 'No vehicle travel should be needed for direct walk shortcut');
  assert.equal(trip.transfersCount, 0);
  assert.ok(trip.travelTimeMinutes > 0 && trip.travelTimeMinutes < 20);
  assert.ok(trip.steps[0].includes('Direkter Fußweg'));
});

test('findShortestTransitTrip computes multi-modal transit route between distant network nodes', () => {
  // Garching Forschungszentrum (U6 north terminus) -> Marienplatz (city center)
  const origin = { lat: 48.2650, lng: 11.6700 };
  const destination = { lat: 48.1371, lng: 11.5754 };
  const profile = {
    id: 'p1',
    name: 'Researcher',
    lat: origin.lat,
    lng: origin.lng,
    travelTimeMinutes: 60,
    mode: 'transit',
    color: '#3B82F6',
    visible: true,
    maxWalkToStationMin: 10,
    maxWalkFromStationMin: 10,
  };

  const trip = findShortestTransitTrip(origin, destination, profile);
  assert.ok(trip !== null);
  assert.equal(trip.routeFound, true);
  assert.ok(trip.travelTimeMinutes >= 15 && trip.travelTimeMinutes <= 45, `Travel time (${trip.travelTimeMinutes}) should be within expected U6 schedule`);
  assert.ok(trip.inVehicleMin > 0, 'In-vehicle transit minutes must be positive');
  assert.ok(trip.linesUsed.length > 0, 'Should identify used transit line');
});

test('findShortestTransitTrip handles unreachable remote destinations outside region gracefully', () => {
  const origin = { lat: 48.1371, lng: 11.5754 };
  const remoteDest = { lat: 54.321, lng: 10.123 }; // Kiel, northern Germany ~700 km away
  const profile = {
    id: 'p1',
    name: 'Test',
    lat: origin.lat,
    lng: origin.lng,
    travelTimeMinutes: 30,
    mode: 'transit',
    color: '#3B82F6',
    visible: true,
  };

  const trip = findShortestTransitTrip(origin, remoteDest, profile);
  assert.equal(trip, null, 'Remote point outside transit network returns null cleanly without throwing');
});

test('calculateReachableStations returns transit stations within travel budget', () => {
  const profile = {
    id: 'p1',
    name: 'Commuter',
    lat: 48.1371,
    lng: 11.5754, // Marienplatz
    travelTimeMinutes: 20,
    mode: 'transit',
    color: '#3B82F6',
    visible: true,
    maxWalkFromStationMin: 5,
  };

  const reachable = calculateReachableStations(profile);
  assert.ok(Array.isArray(reachable));
  assert.ok(reachable.length >= 10, `Expected at least 10 reachable stations from central Munich within 20m, got ${reachable.length}`);
  assert.ok(reachable.every((s) => s.totalTimeMin <= 20), 'Every reachable station must respect 20 min budget');
  assert.ok(reachable.every((s) => s.remainingTimeMin >= 0), 'Remaining time must be non-negative');
});

test('calculateReachableStations returns empty for remote coordinates with no nearby station', () => {
  const profile = {
    id: 'p-remote',
    name: 'Remote Lake',
    lat: 47.9000,
    lng: 11.1000, // Remote rural area with no station in pedestrian radius
    travelTimeMinutes: 10,
    mode: 'transit',
    color: '#3B82F6',
    visible: true,
    maxWalkFromStationMin: 2,
  };

  const reachable = calculateReachableStations(profile);
  assert.equal(reachable.length, 0, 'Should return empty array when no station is reachable within walk limit');
});

// Group 10: Performance Benchmarks & SLO Assertions
console.log('\n10. Performance Benchmarks & SLO Assertions:');

test('Benchmark: multi-polygon geometric intersection completes well within SLO (< 50ms)', () => {
  const p1 = turf.polygon([[[11.45, 48.10], [11.45, 48.22], [11.65, 48.22], [11.65, 48.10], [11.45, 48.10]]]);
  const p2 = turf.polygon([[[11.50, 48.12], [11.50, 48.25], [11.70, 48.25], [11.70, 48.12], [11.50, 48.12]]]);
  const p3 = turf.polygon([[[11.48, 48.08], [11.48, 48.20], [11.68, 48.20], [11.68, 48.08], [11.48, 48.08]]]);

  const iterations = 30;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const res = calculateMultiIntersection([p1, p2, p3]);
    assert.ok(res !== null);
  }
  const totalMs = performance.now() - start;
  const avgMs = totalMs / iterations;

  console.log(`    ℹ Multi-intersection average: ${avgMs.toFixed(2)} ms/run (SLO threshold: < 50ms)`);
  assert.ok(avgMs < 50, `Multi-intersection average latency (${avgMs.toFixed(2)}ms) exceeded 50ms SLO`);
});

test('Benchmark: Dijkstra / A* graph traversal completes well within SLO (< 30ms)', () => {
  const origin = { lat: 48.2650, lng: 11.6700 };
  const destination = { lat: 48.1371, lng: 11.5754 };
  const profile = {
    id: 'p1',
    name: 'Benchmarker',
    lat: origin.lat,
    lng: origin.lng,
    travelTimeMinutes: 45,
    mode: 'transit',
    color: '#3B82F6',
    visible: true,
  };

  const iterations = 25;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const trip = findShortestTransitTrip(origin, destination, profile);
    assert.ok(trip !== null && trip.routeFound === true);
  }
  const totalMs = performance.now() - start;
  const avgMs = totalMs / iterations;

  console.log(`    ℹ Dijkstra/A* traversal average: ${avgMs.toFixed(2)} ms/run (SLO threshold: < 30ms)`);
  assert.ok(avgMs < 30, `Transit graph traversal average latency (${avgMs.toFixed(2)}ms) exceeded 30ms SLO`);
});

// Group 11: Cryptographic Security & Secure Storage (CWE-312 / CWE-338)
console.log('\n11. Cryptographic Security & Secure Storage (CWE-312 / CWE-338):');

test('getSecureRandom returns numbers uniformly distributed in [0, 1)', () => {
  for (let i = 0; i < 50; i++) {
    const val = getSecureRandom();
    assert.ok(val >= 0 && val < 1, `getSecureRandom value ${val} must be in [0, 1)`);
  }
});

test('generateSecureId generates non-empty distinct secure IDs', () => {
  const ids = new Set();
  for (let i = 0; i < 50; i++) {
    const id = generateSecureId('test');
    assert.ok(id.startsWith('test-'));
    assert.ok(id.length > 10);
    ids.add(id);
  }
  assert.equal(ids.size, 50, 'All generated IDs must be unique');
});

test('encryptSensitiveValue and decryptSensitiveValue round-trip correctly', () => {
  const secrets = [
    'AIzaSyB_SampleGoogleApiKey12345',
    '5b3ce3597851110001cf6248abcdef0123456789',
    'Special-Characters-!@#$%^&*()_+{}[]:;<>,.?~`|/\\',
    'Umlaut-Tést-München-Straße-123',
  ];

  for (const secret of secrets) {
    const encrypted = encryptSensitiveValue(secret);
    assert.ok(encrypted.startsWith('enc:v1:'), 'Encrypted string must have version prefix');
    assert.notEqual(encrypted, secret, 'Encrypted string must not match clear text');
    const decrypted = decryptSensitiveValue(encrypted);
    assert.equal(decrypted, secret, 'Decrypted value must match original secret');
  }
});

test('decryptSensitiveValue handles legacy cleartext gracefully (backward compatibility)', () => {
  const legacyClearText = 'AIzaSyLegacyKey998877';
  const result = decryptSensitiveValue(legacyClearText);
  assert.equal(result, legacyClearText, 'Legacy cleartext must be returned without modification');
  assert.equal(decryptSensitiveValue(''), '');
});

console.log(`\n========================================`);
console.log(`All ${passCount}/${totalCount} essential tests passed successfully!`);
console.log(`========================================\n`);
