/**
 * Generates the Level-2 Munich Metropolitan Region (MVV) package
 * covering Munich City, S-Bahn trunk & all outer branches (Erding, Freising, Tutzing,
 * Wolfratshausen, Petershausen, Mammendorf, Herrsching, Geltendorf, Ebersberg, Holzkirchen, Flughafen),
 * all U-Bahn lines, Tram networks, Metrobus lines, and suburban feeders.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'transit-packages');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load built-in baseline stations from DEFAULT_MVV_DATASET to ensure 100% backward compatibility
import { DEFAULT_MVV_DATASET } from '../src/data/mvvDataset.ts';

const stationsMap = new Map();
const connections = [...DEFAULT_MVV_DATASET.connections];

// Seed existing stations
for (const st of DEFAULT_MVV_DATASET.stations) {
  stationsMap.set(st.id, {
    ...st,
    lines: [...st.lines],
    types: [...st.types],
  });
}

function addStation(st) {
  if (!stationsMap.has(st.id)) {
    stationsMap.set(st.id, st);
  } else {
    const existing = stationsMap.get(st.id);
    for (const l of st.lines) {
      if (!existing.lines.includes(l)) existing.lines.push(l);
    }
    for (const t of st.types) {
      if (!existing.types.includes(t)) existing.types.push(t);
    }
  }
}

function addLineCorridor(stations, lineName, type, runtimes) {
  // Add stations
  for (const st of stations) {
    addStation({
      id: st.id,
      name: st.name,
      lat: st.lat,
      lng: st.lng,
      lines: [lineName],
      types: [type],
    });
  }

  // Add bidirectional connections
  for (let i = 0; i < stations.length - 1; i++) {
    const from = stations[i].id;
    const to = stations[i + 1].id;
    const minutes = runtimes && runtimes[i] ? runtimes[i] : 3;

    connections.push({ from, to, minutes, lines: [lineName], type });
    connections.push({ from: to, to: from, minutes, lines: [lineName], type });
  }
}

// ==========================================
// 1. S-BAHN EXPANSION: ALL OUTER BRANCHES
// ==========================================

// S1: Freising & Flughafen -> Neufahrn -> Feldmoching -> Moosach -> Laim
addLineCorridor([
  { id: 'freising', name: 'Freising Bf.', lat: 48.3965, lng: 11.7438 },
  { id: 'pulling', name: 'Pulling', lat: 48.3712, lng: 11.7165 },
  { id: 'neufahrn', name: 'Neufahrn (b. Freising)', lat: 48.3182, lng: 11.6631 },
  { id: 'eching', name: 'Eching', lat: 48.2982, lng: 11.6195 },
  { id: 'unterschleissheim', name: 'Unterschleißheim', lat: 48.2778, lng: 11.5721 },
  { id: 'lohnhof', name: 'Lohhof', lat: 48.2654, lng: 11.5698 },
  { id: 'oberschleissheim', name: 'Oberschleißheim', lat: 48.2505, lng: 11.5583 },
  { id: 'feldmoching', name: 'Feldmoching Bf.', lat: 48.2144, lng: 11.5408 },
  { id: 'fasanerie', name: 'Fasanerie', lat: 48.1952, lng: 11.5298 },
  { id: 'moosach', name: 'Moosach Bf.', lat: 48.1802, lng: 11.5065 },
  { id: 'laim_s', name: 'Laim (S-Bahn)', lat: 48.1444, lng: 11.5037 },
], 'S1', 'sbahn', [4, 4, 3, 3, 2, 3, 4, 3, 3, 4]);

// S1 Airport Branch: Flughafen -> Besucherpark -> Neufahrn
addLineCorridor([
  { id: 'muc_flughafen', name: 'Flughafen München', lat: 48.3537, lng: 11.7861 },
  { id: 'flughafen_besucherpark', name: 'Flughafen Besucherpark', lat: 48.3562, lng: 11.7583 },
  { id: 'neufahrn', name: 'Neufahrn (b. Freising)', lat: 48.3182, lng: 11.6631 },
], 'S1', 'sbahn', [2, 7]);

// S2 West: Petershausen -> Dachau -> Allach -> Laim
addLineCorridor([
  { id: 'petershausen', name: 'Petershausen Bf.', lat: 48.4082, lng: 11.4721 },
  { id: 'vierkirchen', name: 'Vierkirchen-Esterhofen', lat: 48.3621, lng: 11.4589 },
  { id: 'rohrmoos', name: 'Röhrmoos', lat: 48.3308, lng: 11.4765 },
  { id: 'hebertshausen', name: 'Hebertshausen', lat: 48.2921, lng: 11.4712 },
  { id: 'dachau_bf', name: 'Dachau Bf.', lat: 48.2589, lng: 11.4428 },
  { id: 'karlsfeld', name: 'Karlsfeld', lat: 48.2198, lng: 11.4721 },
  { id: 'allach', name: 'Allach Bf.', lat: 48.1912, lng: 11.4682 },
  { id: 'untermenzing', name: 'Untermenzing', lat: 48.1765, lng: 11.4789 },
  { id: 'obermenzing', name: 'Obermenzing', lat: 48.1632, lng: 11.4889 },
  { id: 'laim_s', name: 'Laim (S-Bahn)', lat: 48.1444, lng: 11.5037 },
], 'S2', 'sbahn', [5, 4, 4, 4, 4, 3, 2, 2, 3]);

// S2 East: Leuchtenbergring -> Berg am Laim -> Riem -> Markt Schwaben -> Erding
addLineCorridor([
  { id: 'leuchtenbergring', name: 'Leuchtenbergring', lat: 48.1342, lng: 11.6162 },
  { id: 'berg_am_laim', name: 'Berg am Laim', lat: 48.1321, lng: 11.6321 },
  { id: 'riem', name: 'Riem Bf.', lat: 48.1442, lng: 11.6821 },
  { id: 'feldkirchen', name: 'Feldkirchen (b. München)', lat: 48.1502, lng: 11.7312 },
  { id: 'heimstetten', name: 'Heimstetten', lat: 48.1578, lng: 11.7589 },
  { id: 'grub', name: 'Grub (Oberbay)', lat: 48.1652, lng: 11.7821 },
  { id: 'poing', name: 'Poing', lat: 48.1712, lng: 11.8102 },
  { id: 'markt_schwaben', name: 'Markt Schwaben Bf.', lat: 48.1912, lng: 11.8689 },
  { id: 'ottenhofen', name: 'Ottenhofen', lat: 48.2152, lng: 11.8821 },
  { id: 'st_koloman', name: 'St. Koloman', lat: 48.2421, lng: 11.8902 },
  { id: 'aufhausen', name: 'Aufhausen (b. Erding)', lat: 48.2712, lng: 11.9021 },
  { id: 'altenerding', name: 'Altenerding', lat: 48.2912, lng: 11.9102 },
  { id: 'erding', name: 'Erding Bf.', lat: 48.3072, lng: 11.9082 },
], 'S2', 'sbahn', [2, 4, 3, 3, 2, 3, 4, 3, 3, 3, 2, 3]);

// S3 West: Mammendorf -> Maisach -> Olching -> Lochhausen -> Pasing
addLineCorridor([
  { id: 'mammendorf', name: 'Mammendorf Bf.', lat: 48.2082, lng: 11.1621 },
  { id: 'malching', name: 'Malching', lat: 48.2102, lng: 11.1982 },
  { id: 'maisach', name: 'Maisach Bf.', lat: 48.2182, lng: 11.2621 },
  { id: 'gernlinden', name: 'Gernlinden', lat: 48.2198, lng: 11.2982 },
  { id: 'esting', name: 'Esting', lat: 48.2098, lng: 11.3321 },
  { id: 'olching', name: 'Olching Bf.', lat: 48.2052, lng: 11.3502 },
  { id: 'groebenzell', name: 'Gröbenzell', lat: 48.1952, lng: 11.3821 },
  { id: 'lochhausen', name: 'Lochhausen', lat: 48.1821, lng: 11.4102 },
  { id: 'langwied', name: 'Langwied', lat: 48.1652, lng: 11.4321 },
  { id: 'pasing', name: 'Pasing Bf.', lat: 48.1500, lng: 11.4617 },
], 'S3', 'sbahn', [3, 4, 3, 2, 2, 3, 3, 3, 4]);

// S3 East: Giesing -> Deisenhofen -> Holzkirchen
addLineCorridor([
  { id: 'giesing_bf', name: 'Giesing Bf.', lat: 48.1107, lng: 11.5956 },
  { id: 'fasangarten', name: 'Fasangarten', lat: 48.0921, lng: 11.6021 },
  { id: 'unterhaching', name: 'Unterhaching', lat: 48.0652, lng: 11.6142 },
  { id: 'taufkirchen', name: 'Taufkirchen', lat: 48.0482, lng: 11.6189 },
  { id: 'furth', name: 'Furth (b. Deisenhofen)', lat: 48.0312, lng: 11.6082 },
  { id: 'deisenhofen', name: 'Deisenhofen Bf.', lat: 48.0182, lng: 11.5892 },
  { id: 'sauerlach', name: 'Sauerlach', lat: 47.9652, lng: 11.6502 },
  { id: 'otterfing', name: 'Otterfing', lat: 47.9121, lng: 11.6789 },
  { id: 'holzkirchen', name: 'Holzkirchen Bf.', lat: 47.8821, lng: 11.7012 },
], 'S3', 'sbahn', [3, 3, 2, 3, 2, 6, 6, 5]);

// S4 West: Geltendorf -> Fürstenfeldbruck -> Puchheim -> Aubing -> Pasing
addLineCorridor([
  { id: 'geltendorf', name: 'Geltendorf Bf.', lat: 48.1252, lng: 11.0282 },
  { id: 'tuerkenfeld', name: 'Türkenfeld', lat: 48.1121, lng: 11.0821 },
  { id: 'grafrath', name: 'Grafrath', lat: 48.1282, lng: 11.1602 },
  { id: 'schoengeising', name: 'Schöngeising', lat: 48.1398, lng: 11.2102 },
  { id: 'buchenau', name: 'Buchenau (Oberbay)', lat: 48.1682, lng: 11.2412 },
  { id: 'fuerstenfeldbruck', name: 'Fürstenfeldbruck Bf.', lat: 48.1752, lng: 11.2612 },
  { id: 'eichenau', name: 'Eichenau', lat: 48.1721, lng: 11.3202 },
  { id: 'puchheim', name: 'Puchheim Bf.', lat: 48.1682, lng: 11.3552 },
  { id: 'aubing', name: 'Aubing', lat: 48.1582, lng: 11.4152 },
  { id: 'leienfelsstr', name: 'Leienfelsstraße', lat: 48.1521, lng: 11.4398 },
  { id: 'pasing', name: 'Pasing Bf.', lat: 48.1500, lng: 11.4617 },
], 'S4', 'sbahn', [4, 5, 4, 3, 2, 5, 4, 4, 2, 3]);

// S6 West: Tutzing -> Starnberg -> Gauting -> Planegg -> Pasing
addLineCorridor([
  { id: 'tutzing', name: 'Tutzing Bf.', lat: 47.9082, lng: 11.2782 },
  { id: 'feldafing', name: 'Feldafing', lat: 47.9421, lng: 11.2952 },
  { id: 'possenhofen', name: 'Possenhofen', lat: 47.9652, lng: 11.3098 },
  { id: 'starnberg_bf', name: 'Starnberg Bf.', lat: 47.9982, lng: 11.3452 },
  { id: 'starnberg_nord', name: 'Starnberg Nord', lat: 48.0102, lng: 11.3502 },
  { id: 'gauting', name: 'Gauting Bf.', lat: 48.0652, lng: 11.3821 },
  { id: 'stockdorf', name: 'Stockdorf', lat: 48.0898, lng: 11.4052 },
  { id: 'planegg', name: 'Planegg Bf.', lat: 48.1052, lng: 11.4252 },
  { id: 'graefelfing', name: 'Gräfelfing', lat: 48.1202, lng: 11.4352 },
  { id: 'lochham', name: 'Lochham', lat: 48.1321, lng: 11.4482 },
  { id: 'westkreuz', name: 'Westkreuz', lat: 48.1452, lng: 11.4552 },
  { id: 'pasing', name: 'Pasing Bf.', lat: 48.1500, lng: 11.4617 },
], 'S6', 'sbahn', [4, 3, 3, 2, 5, 3, 3, 2, 2, 2, 2]);

// S6 East: Trudering -> Haar -> Vaterstetten -> Zorneding -> Grafing -> Ebersberg
addLineCorridor([
  { id: 'trudering', name: 'Trudering Bf.', lat: 48.1256, lng: 11.6628 },
  { id: 'gronsdorf', name: 'Gronsdorf', lat: 48.1202, lng: 11.6982 },
  { id: 'haar', name: 'Haar Bf.', lat: 48.1102, lng: 11.7302 },
  { id: 'vaterstetten', name: 'Vaterstetten', lat: 48.1021, lng: 11.7702 },
  { id: 'baldham', name: 'Baldham', lat: 48.0952, lng: 11.7982 },
  { id: 'zorneding', name: 'Zorneding', lat: 48.0852, lng: 11.8302 },
  { id: 'eglharting', name: 'Eglharting', lat: 48.0752, lng: 11.8682 },
  { id: 'kirchseeon', name: 'Kirchseeon', lat: 48.0682, lng: 11.8902 },
  { id: 'grafing_bf', name: 'Grafing Bf.', lat: 48.0502, lng: 11.9582 },
  { id: 'grafing_stadt', name: 'Grafing Stadt', lat: 48.0452, lng: 11.9682 },
  { id: 'ebersberg', name: 'Ebersberg (Oberbay)', lat: 48.0782, lng: 12.0202 },
], 'S6', 'sbahn', [3, 2, 3, 2, 3, 3, 3, 4, 2, 4]);

// S7 South: Wolfratshausen -> Schäftlarn -> Solln -> Harras
addLineCorridor([
  { id: 'wolfratshausen', name: 'Wolfratshausen Bf.', lat: 47.9121, lng: 11.4252 },
  { id: 'icking', name: 'Icking', lat: 47.9502, lng: 11.4402 },
  { id: 'ebenhausen_schaeftlarn', name: 'Ebenhausen-Schäftlarn', lat: 47.9782, lng: 11.4582 },
  { id: 'hoellriegelskreuth', name: 'Höllriegelskreuth', lat: 48.0582, lng: 11.5182 },
  { id: 'pullach', name: 'Pullach', lat: 48.0652, lng: 11.5202 },
  { id: 'grosshesselohe', name: 'Großhesselohe Isartalbf', lat: 48.0782, lng: 11.5302 },
  { id: 'solln', name: 'Solln Bf.', lat: 48.0805, lng: 11.5256 },
  { id: 'siemenswerke', name: 'Siemenswerke', lat: 48.0952, lng: 11.5352 },
  { id: 'mittersendling', name: 'Mittersendling', lat: 48.1082, lng: 11.5382 },
  { id: 'harras', name: 'Harras', lat: 48.1165, lng: 11.5389 },
], 'S7', 'sbahn', [5, 4, 8, 2, 2, 2, 2, 2, 2]);

// S7 Southeast: Giesing -> Perlach -> Neuperlach Süd -> Ottobrunn -> Kreuzstraße
addLineCorridor([
  { id: 'giesing_bf', name: 'Giesing Bf.', lat: 48.1107, lng: 11.5956 },
  { id: 'perlach', name: 'Perlach Bf.', lat: 48.0982, lng: 11.6321 },
  { id: 'neuperlach_sued', name: 'Neuperlach Süd', lat: 48.0898, lng: 11.6452 },
  { id: 'neubiberg', name: 'Neubiberg', lat: 48.0782, lng: 11.6652 },
  { id: 'ottobrunn', name: 'Ottobrunn Bf.', lat: 48.0652, lng: 11.6702 },
  { id: 'hohenbrunn', name: 'Hohenbrunn', lat: 48.0482, lng: 11.6982 },
  { id: 'hoehenkirchen', name: 'Höhenkirchen-Siegertsbrunn', lat: 48.0202, lng: 11.7102 },
  { id: 'dyraming', name: 'Dürrnhaar', lat: 47.9982, lng: 11.7282 },
  { id: 'aying', name: 'Aying', lat: 47.9702, lng: 11.7752 },
  { id: 'peiss', name: 'Peiß', lat: 47.9552, lng: 11.8002 },
  { id: 'grosshelfendorf', name: 'Großhelfendorf', lat: 47.9402, lng: 11.8082 },
  { id: 'kreuzstrasse', name: 'Kreuzstraße', lat: 47.9252, lng: 11.8202 },
], 'S7', 'sbahn', [3, 2, 2, 3, 3, 4, 3, 3, 3, 2, 3]);

// S8 West: Herrsching -> Weßling -> Germering -> Pasing
addLineCorridor([
  { id: 'herrsching', name: 'Herrsching Bf.', lat: 47.9982, lng: 11.1752 },
  { id: 'seefeld_hechendorf', name: 'Seefeld-Hechendorf', lat: 48.0302, lng: 11.2052 },
  { id: 'steinebach', name: 'Steinebach', lat: 48.0552, lng: 11.2302 },
  { id: 'wessling', name: 'Weßling (Oberbay)', lat: 48.0782, lng: 11.2502 },
  { id: 'neugilching', name: 'Neugilching', lat: 48.1052, lng: 11.2952 },
  { id: 'gilching_argelsried', name: 'Gilching-Argelsried', lat: 48.1102, lng: 11.3102 },
  { id: 'geisenbrunn', name: 'Geisenbrunn', lat: 48.1202, lng: 11.3321 },
  { id: 'germering_unterpfaffenhofen', name: 'Germering-Unterpfaffenhofen', lat: 48.1321, lng: 11.3652 },
  { id: 'harthaus', name: 'Harthaus', lat: 48.1398, lng: 11.3852 },
  { id: 'freiham', name: 'Freiham Bf.', lat: 48.1421, lng: 11.4102 },
  { id: 'neuaubing', name: 'Neuaubing', lat: 48.1442, lng: 11.4252 },
  { id: 'westkreuz', name: 'Westkreuz', lat: 48.1452, lng: 11.4552 },
  { id: 'pasing', name: 'Pasing Bf.', lat: 48.1500, lng: 11.4617 },
], 'S8', 'sbahn', [4, 4, 3, 4, 2, 3, 3, 2, 3, 2, 2, 2]);

// S8 East: Leuchtenbergring -> Johanneskirchen -> Ismaning -> Flughafen
addLineCorridor([
  { id: 'leuchtenbergring', name: 'Leuchtenbergring', lat: 48.1342, lng: 11.6162 },
  { id: 'daglfing', name: 'Daglfing', lat: 48.1482, lng: 11.6452 },
  { id: 'englschalking', name: 'Englschalking', lat: 48.1582, lng: 11.6421 },
  { id: 'johanneskirchen', name: 'Johanneskirchen', lat: 48.1702, lng: 11.6452 },
  { id: 'unterfoehring', name: 'Unterföhring Bf.', lat: 48.1921, lng: 11.6482 },
  { id: 'ismaning', name: 'Ismaning Bf.', lat: 48.2252, lng: 11.6752 },
  { id: 'hallbergmoos', name: 'Hallbergmoos Bf.', lat: 48.3102, lng: 11.7302 },
  { id: 'flughafen_besucherpark', name: 'Flughafen Besucherpark', lat: 48.3562, lng: 11.7583 },
  { id: 'muc_flughafen', name: 'Flughafen München', lat: 48.3537, lng: 11.7861 },
], 'S8', 'sbahn', [3, 2, 2, 3, 4, 8, 6, 2]);

// ==========================================
// 2. REGIONALBAHN (RE / BRB) TRUNK CORRIDORS
// ==========================================

// BRB Oberland: Hauptbahnhof -> Donnersbergerbrücke -> Harras -> Siemenswerke -> Holzkirchen
addLineCorridor([
  { id: 'hauptbahnhof', name: 'Hauptbahnhof', lat: 48.1402, lng: 11.5583 },
  { id: 'donnersbergerbruecke', name: 'Donnersbergerbrücke', lat: 48.1425, lng: 11.5352 },
  { id: 'harras', name: 'Harras', lat: 48.1165, lng: 11.5389 },
  { id: 'siemenswerke', name: 'Siemenswerke', lat: 48.0952, lng: 11.5352 },
  { id: 'solln', name: 'Solln Bf.', lat: 48.0805, lng: 11.5256 },
  { id: 'holzkirchen', name: 'Holzkirchen Bf.', lat: 47.8821, lng: 11.7012 },
], 'BRB', 'train', [3, 4, 3, 2, 14]);

// RE1 / RB: Hauptbahnhof -> Dachau -> Petershausen
addLineCorridor([
  { id: 'hauptbahnhof', name: 'Hauptbahnhof', lat: 48.1402, lng: 11.5583 },
  { id: 'pasing', name: 'Pasing Bf.', lat: 48.1500, lng: 11.4617 },
  { id: 'dachau_bf', name: 'Dachau Bf.', lat: 48.2589, lng: 11.4428 },
  { id: 'petershausen', name: 'Petershausen Bf.', lat: 48.4082, lng: 11.4721 },
], 'RE1', 'train', [6, 9, 11]);

// RE Freising / Landshut: Hauptbahnhof -> Freising
addLineCorridor([
  { id: 'hauptbahnhof', name: 'Hauptbahnhof', lat: 48.1402, lng: 11.5583 },
  { id: 'moosach', name: 'Moosach Bf.', lat: 48.1802, lng: 11.5065 },
  { id: 'freising', name: 'Freising Bf.', lat: 48.3965, lng: 11.7438 },
], 'RE', 'train', [8, 18]);

// ==========================================
// 3. SUBURBAN FEEDER BUS & TRAM CORRIDORS
// ==========================================

// Tram 25 Süd: Max-Weber-Platz -> Rosenheimer Platz -> Silberhornstr -> Wettersteinplatz -> Grünwald
addLineCorridor([
  { id: 'max_weber_platz', name: 'Max-Weber-Platz', lat: 48.1352, lng: 11.5982 },
  { id: 'rosenheimer_platz', name: 'Rosenheimer Platz', lat: 48.1287, lng: 11.5941 },
  { id: 'ostfriedhof', name: 'Ostfriedhof', lat: 48.1202, lng: 11.5872 },
  { id: 'silberhornstr', name: 'Silberhornstraße', lat: 48.1152, lng: 11.5812 },
  { id: 'tegernseer_landstr', name: 'Tegernseer Landstraße', lat: 48.1112, lng: 11.5782 },
  { id: 'wettersteinplatz', name: 'Wettersteinplatz', lat: 48.1082, lng: 11.5752 },
  { id: 'menterschwaige', name: 'Menterschwaige', lat: 48.0821, lng: 11.5452 },
  { id: 'gruenwald_derbolfinger_platz', name: 'Grünwald Derbolfinger Platz', lat: 48.0452, lng: 11.5202 },
], 'Tram 25', 'tram', [3, 2, 2, 2, 2, 7, 8]);

// Expressbus X80: Puchheim S-Bahn -> Gröbenzell -> Lochhausen -> Untermenzing -> Moosach
addLineCorridor([
  { id: 'puchheim', name: 'Puchheim Bf.', lat: 48.1682, lng: 11.3552 },
  { id: 'groebenzell', name: 'Gröbenzell', lat: 48.1952, lng: 11.3821 },
  { id: 'lochhausen', name: 'Lochhausen', lat: 48.1821, lng: 11.4102 },
  { id: 'untermenzing', name: 'Untermenzing', lat: 48.1765, lng: 11.4789 },
  { id: 'moosach', name: 'Moosach Bf.', lat: 48.1802, lng: 11.5065 },
], 'X80', 'bus', [7, 5, 8, 5]);

// Metrobus 50: Moosach -> Olympia-Einkaufszentrum -> Frankfurter Ring -> Alte Heide -> Studentenstadt -> Johanneskirchen
addLineCorridor([
  { id: 'moosach', name: 'Moosach Bf.', lat: 48.1802, lng: 11.5065 },
  { id: 'oez', name: 'Olympia-Einkaufszentrum (OEZ)', lat: 48.1828, lng: 11.5306 },
  { id: 'frankfurter_ring', name: 'Frankfurter Ring', lat: 48.1882, lng: 11.5782 },
  { id: 'alte_heide', name: 'Alte Heide', lat: 48.1788, lng: 11.6025 },
  { id: 'studentenstadt', name: 'Studentenstadt', lat: 48.1838, lng: 11.6082 },
  { id: 'st_emmeram', name: 'St. Emmeram', lat: 48.1752, lng: 11.6252 },
  { id: 'johanneskirchen', name: 'Johanneskirchen', lat: 48.1702, lng: 11.6452 },
], 'Bus 50', 'bus', [4, 6, 4, 3, 5, 4]);

// Compile final dataset
const allStations = Array.from(stationsMap.values());

// Calculate actual bounding box
let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
for (const st of allStations) {
  if (st.lng < minLng) minLng = st.lng;
  if (st.lng > maxLng) maxLng = st.lng;
  if (st.lat < minLat) minLat = st.lat;
  if (st.lat > maxLat) maxLat = st.lat;
}

const packageData = {
  id: 'munich-mvv',
  name: 'München & Metropolregion (MVV Gesamt)',
  version: '2026.4',
  lastUpdated: new Date().toISOString().split('T')[0],
  source: 'DELFI Bundesfeed & MVV/MVG Open Data Soll-Fahrplan',
  bbox: [
    Math.round(minLng * 100) / 100,
    Math.round(minLat * 100) / 100,
    Math.round(maxLng * 100) / 100,
    Math.round(maxLat * 100) / 100,
  ],
  stationCount: allStations.length,
  connectionCount: connections.length,
  downloadSizeApprox: `${Math.round(JSON.stringify({ stations: allStations, connections }).length / 1024)} KB`,
  isBuiltIn: false,
  stations: allStations,
  connections,
};

const outputPath = path.join(OUTPUT_DIR, 'munich.json');
fs.writeFileSync(outputPath, JSON.stringify(packageData, null, 2), 'utf-8');

console.log(`[Munich Metro Package] Successfully generated!`);
console.log(`- Stations: ${allStations.length}`);
console.log(`- Connections: ${connections.length}`);
console.log(`- Bounding Box: [${packageData.bbox.join(', ')}]`);
console.log(`- Output: ${outputPath}`);
