/**
 * Generates sample packages for Berlin, Hamburg, Nürnberg, Frankfurt
 * to allow testing the download, caching, and switching mechanism.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'transit-packages');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. BERLIN & BRANDENBURG (VBB)
const berlinPackage = {
  id: 'berlin-vbb',
  name: 'Berlin & Brandenburg (VBB)',
  version: '2026.3',
  lastUpdated: '2026-08-20',
  source: 'DELFI Bundesfeed & VBB Open Data',
  bbox: [12.8, 52.2, 13.8, 52.8],
  stationCount: 68,
  connectionCount: 142,
  downloadSizeApprox: '45 KB',
  isBuiltIn: false,
  stations: [
    { id: 'ber_hbf', name: 'Berlin Hauptbahnhof', lat: 52.5251, lng: 13.3694, lines: ['S3', 'S5', 'S7', 'S9', 'U5', 'RE1', 'RE2'], types: ['sbahn', 'ubahn', 'train'] },
    { id: 'ber_alex', name: 'Alexanderplatz', lat: 52.5215, lng: 13.4115, lines: ['S3', 'S5', 'S7', 'S9', 'U2', 'U5', 'U8', 'Tram M4'], types: ['sbahn', 'ubahn', 'tram'] },
    { id: 'ber_friedrich', name: 'Friedrichstraße', lat: 52.5202, lng: 13.3869, lines: ['S1', 'S2', 'S3', 'S5', 'S7', 'U6'], types: ['sbahn', 'ubahn'] },
    { id: 'ber_zoo', name: 'Zoologischer Garten', lat: 52.5073, lng: 13.3325, lines: ['S3', 'S5', 'S7', 'S9', 'U2', 'U9'], types: ['sbahn', 'ubahn'] },
    { id: 'ber_ostkreuz', name: 'Ostkreuz', lat: 52.5031, lng: 13.4691, lines: ['S3', 'S5', 'S7', 'S8', 'S41', 'S42'], types: ['sbahn'] },
    { id: 'ber_westkreuz', name: 'Westkreuz', lat: 52.5011, lng: 13.2835, lines: ['S3', 'S5', 'S7', 'S41', 'S42'], types: ['sbahn'] },
    { id: 'ber_suedkreuz', name: 'Südkreuz', lat: 52.4756, lng: 13.3653, lines: ['S2', 'S25', 'S41', 'S42', 'S45'], types: ['sbahn'] },
    { id: 'ber_gesundbrunnen', name: 'Gesundbrunnen', lat: 52.5489, lng: 13.3894, lines: ['S1', 'S2', 'S41', 'S42', 'U8'], types: ['sbahn', 'ubahn'] },
    { id: 'ber_potsdamer', name: 'Potsdamer Platz', lat: 52.5096, lng: 13.3759, lines: ['S1', 'S2', 'U2'], types: ['sbahn', 'ubahn'] },
    { id: 'ber_spandau', name: 'Spandau Bf.', lat: 52.5344, lng: 13.1975, lines: ['S3', 'S9', 'U7', 'RE'], types: ['sbahn', 'ubahn', 'train'] },
    { id: 'ber_potsdam_hbf', name: 'Potsdam Hauptbahnhof', lat: 52.3918, lng: 13.0671, lines: ['S7', 'RE1'], types: ['sbahn', 'train'] },
    { id: 'ber_ber_airport', name: 'Flughafen BER', lat: 52.3649, lng: 13.5098, lines: ['S9', 'S45', 'FEX'], types: ['sbahn', 'train'] },
  ],
  connections: [
    { from: 'ber_zoo', to: 'ber_hbf', minutes: 5, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_hbf', to: 'ber_zoo', minutes: 5, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_hbf', to: 'ber_friedrich', minutes: 2, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_friedrich', to: 'ber_hbf', minutes: 2, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_friedrich', to: 'ber_alex', minutes: 4, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_alex', to: 'ber_friedrich', minutes: 4, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_alex', to: 'ber_ostkreuz', minutes: 7, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_ostkreuz', to: 'ber_alex', minutes: 7, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_westkreuz', to: 'ber_zoo', minutes: 6, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_zoo', to: 'ber_westkreuz', minutes: 6, lines: ['S3', 'S5', 'S7', 'S9'], type: 'sbahn' },
    { from: 'ber_westkreuz', to: 'ber_potsdam_hbf', minutes: 18, lines: ['S7'], type: 'sbahn' },
    { from: 'ber_potsdam_hbf', to: 'ber_westkreuz', minutes: 18, lines: ['S7'], type: 'sbahn' },
    { from: 'ber_ostkreuz', to: 'ber_ber_airport', minutes: 15, lines: ['S9', 'FEX'], type: 'sbahn' },
    { from: 'ber_ber_airport', to: 'ber_ostkreuz', minutes: 15, lines: ['S9', 'FEX'], type: 'sbahn' },
    { from: 'ber_hbf', to: 'ber_potsdamer', minutes: 4, lines: ['U5'], type: 'ubahn' },
    { from: 'ber_potsdamer', to: 'ber_hbf', minutes: 4, lines: ['U5'], type: 'ubahn' },
  ],
};

// 2. HAMBURG & METROPOLREGION (HVV)
const hamburgPackage = {
  id: 'hamburg-hvv',
  name: 'Hamburg & Metropolregion (HVV)',
  version: '2026.3',
  lastUpdated: '2026-08-15',
  source: 'DELFI Bundesfeed & HVV Open Data',
  bbox: [9.5, 53.3, 10.4, 53.8],
  stationCount: 54,
  connectionCount: 110,
  downloadSizeApprox: '38 KB',
  isBuiltIn: false,
  stations: [
    { id: 'hh_hbf', name: 'Hamburg Hauptbahnhof', lat: 53.5531, lng: 10.0067, lines: ['S1', 'S2', 'S3', 'S5', 'U1', 'U2', 'U3', 'U4'], types: ['sbahn', 'ubahn'] },
    { id: 'hh_dammtor', name: 'Dammtor (Messe/CCH)', lat: 53.5608, lng: 9.9897, lines: ['S2', 'S5', 'RE'], types: ['sbahn', 'train'] },
    { id: 'hh_altona', name: 'Altona Bf.', lat: 53.5528, lng: 9.9351, lines: ['S1', 'S2', 'S3', 'Bus 15'], types: ['sbahn', 'bus'] },
    { id: 'hh_jungfernstieg', name: 'Jungfernstieg', lat: 53.5536, lng: 9.9922, lines: ['S1', 'S3', 'U1', 'U2', 'U4'], types: ['sbahn', 'ubahn'] },
    { id: 'hh_landungsbruecken', name: 'Landungsbrücken', lat: 53.5458, lng: 9.9675, lines: ['S1', 'S3', 'U3', 'Fähre 62'], types: ['sbahn', 'ubahn'] },
    { id: 'hh_airport', name: 'Hamburg Airport (Flughafen)', lat: 53.6325, lng: 10.0067, lines: ['S1'], types: ['sbahn'] },
    { id: 'hh_harburg', name: 'Harburg Bf.', lat: 53.4561, lng: 9.9917, lines: ['S3', 'S5', 'RE'], types: ['sbahn', 'train'] },
    { id: 'hh_bergedorf', name: 'Bergedorf Bf.', lat: 53.4894, lng: 10.2064, lines: ['S2', 'RE'], types: ['sbahn', 'train'] },
  ],
  connections: [
    { from: 'hh_hbf', to: 'hh_jungfernstieg', minutes: 2, lines: ['S1', 'S3', 'U1'], type: 'sbahn' },
    { from: 'hh_jungfernstieg', to: 'hh_hbf', minutes: 2, lines: ['S1', 'S3', 'U1'], type: 'sbahn' },
    { from: 'hh_jungfernstieg', to: 'hh_landungsbruecken', minutes: 4, lines: ['S1', 'S3'], type: 'sbahn' },
    { from: 'hh_landungsbruecken', to: 'hh_jungfernstieg', minutes: 4, lines: ['S1', 'S3'], type: 'sbahn' },
    { from: 'hh_landungsbruecken', to: 'hh_altona', minutes: 5, lines: ['S1', 'S3'], type: 'sbahn' },
    { from: 'hh_altona', to: 'hh_landungsbruecken', minutes: 5, lines: ['S1', 'S3'], type: 'sbahn' },
    { from: 'hh_hbf', to: 'hh_airport', minutes: 25, lines: ['S1'], type: 'sbahn' },
    { from: 'hh_airport', to: 'hh_hbf', minutes: 25, lines: ['S1'], type: 'sbahn' },
    { from: 'hh_hbf', to: 'hh_harburg', minutes: 12, lines: ['S3', 'S5'], type: 'sbahn' },
    { from: 'hh_harburg', to: 'hh_hbf', minutes: 12, lines: ['S3', 'S5'], type: 'sbahn' },
    { from: 'hh_hbf', to: 'hh_dammtor', minutes: 2, lines: ['S2', 'S5'], type: 'sbahn' },
    { from: 'hh_dammtor', to: 'hh_hbf', minutes: 2, lines: ['S2', 'S5'], type: 'sbahn' },
  ],
};

// 3. NÜRNBERG & FRANKEN (VGN)
const nuernbergPackage = {
  id: 'nuernberg-vgn',
  name: 'Nürnberg & Franken (VGN)',
  version: '2026.2',
  lastUpdated: '2026-07-30',
  source: 'DELFI Bundesfeed & VGN Open Data',
  bbox: [10.6, 49.2, 11.6, 49.7],
  stationCount: 42,
  connectionCount: 88,
  downloadSizeApprox: '32 KB',
  isBuiltIn: false,
  stations: [
    { id: 'nue_hbf', name: 'Nürnberg Hauptbahnhof', lat: 49.4456, lng: 11.0825, lines: ['U1', 'U2', 'U3', 'S1', 'S2', 'S3', 'Tram 5'], types: ['sbahn', 'ubahn', 'tram'] },
    { id: 'nue_plarrer', name: 'Plärrer', lat: 49.4481, lng: 11.0642, lines: ['U1', 'U2', 'U3', 'Tram 4', 'Tram 6'], types: ['ubahn', 'tram'] },
    { id: 'nue_fuerth_hbf', name: 'Fürth (Bay) Hauptbahnhof', lat: 49.4703, lng: 10.9903, lines: ['U1', 'S1', 'R1'], types: ['ubahn', 'sbahn', 'train'] },
    { id: 'nue_erlangen_hbf', name: 'Erlangen Hauptbahnhof', lat: 49.5961, lng: 11.0028, lines: ['S1', 'RE'], types: ['sbahn', 'train'] },
    { id: 'nue_airport', name: 'Flughafen Nürnberg', lat: 49.4936, lng: 11.0778, lines: ['U2'], types: ['ubahn'] },
  ],
  connections: [
    { from: 'nue_hbf', to: 'nue_plarrer', minutes: 2, lines: ['U1', 'U2', 'U3'], type: 'ubahn' },
    { from: 'nue_plarrer', to: 'nue_hbf', minutes: 2, lines: ['U1', 'U2', 'U3'], type: 'ubahn' },
    { from: 'nue_plarrer', to: 'nue_fuerth_hbf', minutes: 12, lines: ['U1'], type: 'ubahn' },
    { from: 'nue_fuerth_hbf', to: 'nue_plarrer', minutes: 12, lines: ['U1'], type: 'ubahn' },
    { from: 'nue_fuerth_hbf', to: 'nue_erlangen_hbf', minutes: 15, lines: ['S1'], type: 'sbahn' },
    { from: 'nue_erlangen_hbf', to: 'nue_fuerth_hbf', minutes: 15, lines: ['S1'], type: 'sbahn' },
    { from: 'nue_hbf', to: 'nue_airport', minutes: 12, lines: ['U2'], type: 'ubahn' },
    { from: 'nue_airport', to: 'nue_hbf', minutes: 12, lines: ['U2'], type: 'ubahn' },
  ],
};

// 4. FRANKFURT / RHEIN-MAIN (RMV)
const frankfurtPackage = {
  id: 'frankfurt-rmv',
  name: 'Frankfurt / Rhein-Main (RMV)',
  version: '2026.2',
  lastUpdated: '2026-07-15',
  source: 'DELFI Bundesfeed & RMV Open Data',
  bbox: [8.3, 49.9, 9.1, 50.3],
  stationCount: 50,
  connectionCount: 104,
  downloadSizeApprox: '36 KB',
  isBuiltIn: false,
  stations: [
    { id: 'fra_hbf', name: 'Frankfurt (Main) Hauptbahnhof', lat: 50.1071, lng: 8.6638, lines: ['S1-S9', 'U4', 'U5', 'Tram 11-21'], types: ['sbahn', 'ubahn', 'tram'] },
    { id: 'fra_hauptwache', name: 'Hauptwache', lat: 50.1139, lng: 8.6789, lines: ['S1-S9', 'U1-U3', 'U6-U8'], types: ['sbahn', 'ubahn'] },
    { id: 'fra_konstabler', name: 'Konstablerwache', lat: 50.1147, lng: 8.6872, lines: ['S1-S9', 'U4-U7', 'Tram 12'], types: ['sbahn', 'ubahn', 'tram'] },
    { id: 'fra_suedbf', name: 'Frankfurt (Main) Süd', lat: 50.0997, lng: 8.6864, lines: ['S3-S6', 'U1-U3', 'U8'], types: ['sbahn', 'ubahn'] },
    { id: 'fra_airport', name: 'Frankfurt Flughafen Regionalbf', lat: 50.0511, lng: 8.5719, lines: ['S8', 'S9'], types: ['sbahn'] },
    { id: 'fra_wiesbaden', name: 'Wiesbaden Hauptbahnhof', lat: 50.0711, lng: 8.2436, lines: ['S1', 'S8', 'S9'], types: ['sbahn'] },
    { id: 'fra_mainz', name: 'Mainz Hauptbahnhof', lat: 50.0011, lng: 8.2589, lines: ['S8'], types: ['sbahn'] },
  ],
  connections: [
    { from: 'fra_hbf', to: 'fra_hauptwache', minutes: 3, lines: ['S1-S9'], type: 'sbahn' },
    { from: 'fra_hauptwache', to: 'fra_hbf', minutes: 3, lines: ['S1-S9'], type: 'sbahn' },
    { from: 'fra_hauptwache', to: 'fra_konstabler', minutes: 2, lines: ['S1-S9'], type: 'sbahn' },
    { from: 'fra_konstabler', to: 'fra_hauptwache', minutes: 2, lines: ['S1-S9'], type: 'sbahn' },
    { from: 'fra_hbf', to: 'fra_airport', minutes: 11, lines: ['S8', 'S9'], type: 'sbahn' },
    { from: 'fra_airport', to: 'fra_hbf', minutes: 11, lines: ['S8', 'S9'], type: 'sbahn' },
    { from: 'fra_airport', to: 'fra_mainz', minutes: 18, lines: ['S8'], type: 'sbahn' },
    { from: 'fra_mainz', to: 'fra_airport', minutes: 18, lines: ['S8'], type: 'sbahn' },
    { from: 'fra_hbf', to: 'fra_suedbf', minutes: 5, lines: ['S3-S6'], type: 'sbahn' },
    { from: 'fra_suedbf', to: 'fra_hbf', minutes: 5, lines: ['S3-S6'], type: 'sbahn' },
  ],
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'berlin.json'), JSON.stringify(berlinPackage, null, 2), 'utf-8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'hamburg.json'), JSON.stringify(hamburgPackage, null, 2), 'utf-8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'nuernberg.json'), JSON.stringify(nuernbergPackage, null, 2), 'utf-8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'frankfurt.json'), JSON.stringify(frankfurtPackage, null, 2), 'utf-8');

console.log('[All Packages] Successfully wrote berlin.json, hamburg.json, nuernberg.json, frankfurt.json to public/transit-packages/');
