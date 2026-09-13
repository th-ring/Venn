import * as turf from '@turf/turf';
import { generateIsochrone } from '../src/services/isochroneEngine.ts';
import { calculateMultiIntersection } from '../src/services/geometry.ts';
import { DEFAULT_MUNICH_PROFILES } from '../src/data/presets.ts';

async function run() {
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

  const polyGilching = await generateIsochrone(DEFAULT_MUNICH_PROFILES[0], schedule);
  const polyDomagk = await generateIsochrone(DEFAULT_MUNICH_PROFILES[1], schedule);

  const intersection = calculateMultiIntersection([polyGilching, polyDomagk]);

  console.log('Gilching poly valid?', !!polyGilching);
  console.log('Domagk poly valid?', !!polyDomagk);
  console.log('Intersection valid?', !!intersection);

  // Check coordinates in Gräfelfing
  // In Image 2, the pin is near Wandlhamerstraße / Ruffiniallee (approx 48.125, 11.425)
  // Let's test a grid around Gräfelfing:
  for (let lat = 48.115; lat <= 48.130; lat += 0.005) {
    for (let lng = 11.415; lng <= 11.445; lng += 0.01) {
      const pt = turf.point([lng, lat]);
      const inGilching = turf.booleanPointInPolygon(pt, polyGilching);
      const inDomagk = turf.booleanPointInPolygon(pt, polyDomagk);
      const inIntersection = intersection ? turf.booleanPointInPolygon(pt, intersection) : false;
      console.log(`Pt [${lat.toFixed(3)}, ${lng.toFixed(3)}]: Gilching=${inGilching}, Domagk=${inDomagk}, Intersect=${inIntersection}`);
    }
  }
}

run();
