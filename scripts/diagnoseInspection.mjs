import * as turf from '@turf/turf';
import { generateMvvTransitIsochrone, calculateReachableStations, findShortestTransitTrip } from '../src/services/mvvMatrixService.ts';

const profileDomagk = {
  id: 'p-muc-domagk',
  name: 'Marienplatz, München',
  address: 'Marienplatz 1, 80331 München',
  lat: 48.1845,
  lng: 11.5852,
  travelTimeMinutes: 35,
  mode: 'transit',
  color: '#10B981',
  visible: true,
  maxTransfers: 3,
  maxWalkToStationMin: 10,
};

const domagkIsochrone = generateMvvTransitIsochrone(profileDomagk);

// Pin from Image 2: Gräfelfing, near Ruffiniallee / Wandlhamerstr / Großhaderner Str.
// Let's test a few candidate coordinates around Gräfelfing:
const candidates = [
  { name: 'Graefelfing Station', lat: 48.1202, lng: 11.4352 },
  { name: 'Lochham Station', lat: 48.1321, lng: 11.4482 },
  { name: 'North Graefelfing / Ruffiniallee', lat: 48.125, lng: 11.425 },
  { name: 'West Graefelfing', lat: 48.121, lng: 11.415 },
];

for (const c of candidates) {
  const pt = turf.point([c.lng, c.lat]);
  let inDomagk = false;
  try {
    inDomagk = turf.booleanPointInPolygon(pt, domagkIsochrone);
  } catch (e) {
    inDomagk = false;
  }
  const trip = findShortestTransitTrip({ lat: c.lat, lng: c.lng }, { lat: profileDomagk.lat, lng: profileDomagk.lng }, profileDomagk);
  console.log(`${c.name} [${c.lat}, ${c.lng}]:`);
  console.log(`  Inside Domagk Isochrone? ${inDomagk}`);
  console.log(`  Trip calculation: ${trip ? trip.travelTimeMinutes + ' min' : 'no route'}`);
}
