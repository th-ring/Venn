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

  const p1 = DEFAULT_MUNICH_PROFILES[0]; // Gilching, driving
  const p2 = DEFAULT_MUNICH_PROFILES[1]; // Domagk, transit

  const poly1 = await generateIsochrone(p1, schedule);
  const poly2 = await generateIsochrone(p2, schedule);

  const rawIntersect = calculateMultiIntersection([poly1, poly2]);
  const maskedIntersect = rawIntersect ? maskByResidentialAreas(rawIntersect) : null;

  console.log('Raw intersection area km2:', calculateAreaKm2(rawIntersect));
  console.log('Masked intersection area km2:', calculateAreaKm2(maskedIntersect));

  // The click point in Image 2:
  // Let's check if the click point in Gräfelfing is in poly1, poly2, rawIntersect, or maskedIntersect
  // Gräfelfing click point in Image 2 is: lat ~48.125, lng ~11.425 (near Gräfelfing / Lochham)
  const clickPt = turf.point([11.425, 48.125]);

  console.log('In poly1 (Gilching Driving)?', turf.booleanPointInPolygon(clickPt, poly1));
  console.log('In poly2 (Domagk Transit)?', turf.booleanPointInPolygon(clickPt, poly2));
  if (rawIntersect) {
    console.log('In rawIntersect?', turf.booleanPointInPolygon(clickPt, rawIntersect));
  }
  if (maskedIntersect) {
    console.log('In maskedIntersect?', turf.booleanPointInPolygon(clickPt, maskedIntersect));
  }
}

main();
