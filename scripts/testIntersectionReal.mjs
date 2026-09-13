import * as turf from '@turf/turf';
import { generateIsochrone } from '../src/services/isochroneEngine.ts';
import { calculateMultiIntersection, calculateAreaKm2 } from '../src/services/geometry.ts';
import { DEFAULT_MUNICH_PROFILES } from '../src/data/presets.ts';
import { maskByResidentialAreas } from '../src/data/residentialZones.ts';

async function main() {
  const schedule = {
    direction: 'to_work',
    dayOfWeek: 'workday',
    time: '08:30',
    options: {
      liveTraffic: false,
      enableSmoothing: true,
      fidelity: 'AUTOMATIC',
    },
  };

  const p1 = DEFAULT_MUNICH_PROFILES[0]; // BMW Vierzylinder, driving
  const p2 = DEFAULT_MUNICH_PROFILES[1]; // Marienplatz, transit

  const poly1 = await generateIsochrone(p1, schedule);
  const poly2 = await generateIsochrone(p2, schedule);

  const rawIntersect = calculateMultiIntersection([poly1, poly2]);
  const maskedIntersect = rawIntersect ? maskByResidentialAreas(rawIntersect) : null;

  console.log('Raw intersection area km2:', calculateAreaKm2(rawIntersect));
  console.log('Masked intersection area km2:', calculateAreaKm2(maskedIntersect));

  // Test point in Schwabing / Maxvorstadt (between BMW and Marienplatz)
  const clickPt = turf.point([11.565, 48.155]);

  console.log('In poly1 (BMW Driving)?', turf.booleanPointInPolygon(clickPt, poly1));
  console.log('In poly2 (Marienplatz Transit)?', turf.booleanPointInPolygon(clickPt, poly2));
  if (rawIntersect) {
    console.log('In rawIntersect?', turf.booleanPointInPolygon(clickPt, rawIntersect));
  }
  if (maskedIntersect) {
    console.log('In maskedIntersect?', turf.booleanPointInPolygon(clickPt, maskedIntersect));
  }
}

main();
