import * as turf from '@turf/turf';
import { generateMvvTransitIsochrone, calculateReachableStations, findShortestTransitTrip } from '../src/services/mvvMatrixService.ts';

const profileMarienplatz = {
  id: 'p-muc-marienplatz',
  name: 'Marienplatz 1, München',
  address: 'Marienplatz 1, 80331 München',
  lat: 48.1371,
  lng: 11.5754,
  travelTimeMinutes: 35,
  mode: 'transit',
  color: '#10B981',
  visible: true,
  maxTransfers: 3,
  maxWalkToStationMin: 10,
};

const marienplatzIsochrone = generateMvvTransitIsochrone(profileMarienplatz);

// Candidate coordinates for diagnosis:
const candidates = [
  { name: 'Graefelfing Station', lat: 48.1202, lng: 11.4352 },
  { name: 'Lochham Station', lat: 48.1321, lng: 11.4482 },
  { name: 'North Graefelfing / Ruffiniallee', lat: 48.125, lng: 11.425 },
  { name: 'West Graefelfing', lat: 48.121, lng: 11.415 },
];

for (const c of candidates) {
  const pt = turf.point([c.lng, c.lat]);
  let inMarienplatz = false;
  try {
    inMarienplatz = turf.booleanPointInPolygon(pt, marienplatzIsochrone);
  } catch (e) {
    inMarienplatz = false;
  }
  const trip = findShortestTransitTrip({ lat: c.lat, lng: c.lng }, { lat: profileMarienplatz.lat, lng: profileMarienplatz.lng }, profileMarienplatz);
  console.log(`${c.name} [${c.lat}, ${c.lng}]:`);
  console.log(`  Inside Marienplatz Isochrone? ${inMarienplatz}`);
  console.log(`  Trip calculation: ${trip ? trip.travelTimeMinutes + ' min' : 'no route'}`);
}
