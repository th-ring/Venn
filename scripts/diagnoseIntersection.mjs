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

  const polyBmw = await generateIsochrone(DEFAULT_MUNICH_PROFILES[0], schedule);
  const polyMarienplatz = await generateIsochrone(DEFAULT_MUNICH_PROFILES[1], schedule);

  const intersection = calculateMultiIntersection([polyBmw, polyMarienplatz]);

  console.log('BMW poly valid?', !!polyBmw);
  console.log('Marienplatz poly valid?', !!polyMarienplatz);
  console.log('Intersection valid?', !!intersection);

  // Check coordinates in Munich area
  for (let lat = 48.140; lat <= 48.165; lat += 0.005) {
    for (let lng = 11.540; lng <= 11.580; lng += 0.01) {
      const pt = turf.point([lng, lat]);
      const inBmw = turf.booleanPointInPolygon(pt, polyBmw);
      const inMarienplatz = turf.booleanPointInPolygon(pt, polyMarienplatz);
      const inIntersection = intersection ? turf.booleanPointInPolygon(pt, intersection) : false;
      console.log(`Pt [${lat.toFixed(3)}, ${lng.toFixed(3)}]: BMW=${inBmw}, Marienplatz=${inMarienplatz}, Intersect=${inIntersection}`);
    }
  }
}

run();
