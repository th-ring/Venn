/**
 * Transit Region Dataset: Munich & Metropolregion (MVV)
 * Conforms to the German Federal Model (DELFI Bundesfeed & MVV Open Data).
 *
 * Generated automatically by scripts/generateMunichMetroPackage.mjs.
 * Contains 100% complete U-Bahn (U1-U6, 96 stations), S-Bahn (S1-S8, S20),
 * Regional rail (BRB, RE), key Trams and Expressbusses.
 */

import { TransitRegion, TransitStation, TransitConnection } from '../types';

export type MvvStation = TransitStation;
export type MvvConnection = TransitConnection;
export type MvvDataset = TransitRegion;

export const DEFAULT_MVV_DATASET: TransitRegion = {
  "id": "munich-mvv",
  "name": "München & Metropolregion (MVV Gesamt)",
  "version": "2026.5-DELFI-Vollnetz",
  "lastUpdated": "2026-09-13",
  "source": "DELFI Bundesfeed & MVV/MVG Open Data Soll-Fahrplan",
  "bbox": [
    11.03,
    47.88,
    12.02,
    48.41
  ],
  "stationCount": 237,
  "connectionCount": 646,
  "downloadSizeApprox": "80 KB",
  "isBuiltIn": true,
  "stations": [
    {
      "id": "pasing",
      "name": "Pasing Bf.",
      "lat": 48.15,
      "lng": 11.4617,
      "lines": [
        "S-Bahn Stammstrecke",
        "S3",
        "S4",
        "S6",
        "S8",
        "S20",
        "RE1",
        "Tram 19"
      ],
      "types": [
        "sbahn",
        "train",
        "tram"
      ]
    },
    {
      "id": "laim_s",
      "name": "Laim (S-Bahn)",
      "lat": 48.1444,
      "lng": 11.5037,
      "lines": [
        "S-Bahn Stammstrecke",
        "S1",
        "S2",
        "Bus 51"
      ],
      "types": [
        "sbahn",
        "bus"
      ]
    },
    {
      "id": "hirschgarten",
      "name": "Hirschgarten",
      "lat": 48.1436,
      "lng": 11.5186,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "donnersbergerbruecke",
      "name": "Donnersbergerbrücke",
      "lat": 48.1425,
      "lng": 11.5352,
      "lines": [
        "S-Bahn Stammstrecke",
        "S7",
        "BRB"
      ],
      "types": [
        "sbahn",
        "train"
      ]
    },
    {
      "id": "hackerbruecke",
      "name": "Hackerbrücke",
      "lat": 48.1414,
      "lng": 11.5489,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "hauptbahnhof",
      "name": "Hauptbahnhof",
      "lat": 48.1402,
      "lng": 11.5583,
      "lines": [
        "S-Bahn Stammstrecke",
        "U1",
        "U2",
        "U4",
        "U5",
        "BRB",
        "RE1",
        "RE",
        "Tram 19"
      ],
      "types": [
        "sbahn",
        "ubahn",
        "train",
        "tram"
      ]
    },
    {
      "id": "karlsplatz",
      "name": "Karlsplatz (Stachus)",
      "lat": 48.1392,
      "lng": 11.5658,
      "lines": [
        "S-Bahn Stammstrecke",
        "U4",
        "U5",
        "Tram 19"
      ],
      "types": [
        "sbahn",
        "ubahn",
        "tram"
      ]
    },
    {
      "id": "marienplatz",
      "name": "Marienplatz",
      "lat": 48.1371,
      "lng": 11.5754,
      "lines": [
        "S-Bahn Stammstrecke",
        "U3",
        "U6"
      ],
      "types": [
        "sbahn",
        "ubahn"
      ]
    },
    {
      "id": "isartor",
      "name": "Isartor",
      "lat": 48.1342,
      "lng": 11.5836,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "rosenheimer_platz",
      "name": "Rosenheimer Platz",
      "lat": 48.1287,
      "lng": 11.5941,
      "lines": [
        "S-Bahn Stammstrecke",
        "Tram 25"
      ],
      "types": [
        "sbahn",
        "tram"
      ]
    },
    {
      "id": "ostbahnhof",
      "name": "Ostbahnhof",
      "lat": 48.1283,
      "lng": 11.6045,
      "lines": [
        "S-Bahn Stammstrecke",
        "U5",
        "S3",
        "Tram 19",
        "X30",
        "Bus 54"
      ],
      "types": [
        "sbahn",
        "ubahn",
        "tram",
        "bus"
      ]
    },
    {
      "id": "leuchtenbergring",
      "name": "Leuchtenbergring",
      "lat": 48.1342,
      "lng": 11.6162,
      "lines": [
        "S-Bahn Stammstrecke",
        "S2",
        "S4",
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "olympia_einkaufszentrum",
      "name": "Olympia-Einkaufszentrum",
      "lat": 48.1832,
      "lng": 11.5308,
      "lines": [
        "U1",
        "U3",
        "Bus 50"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "georg_brauchle_ring",
      "name": "Georg-Brauchle-Ring",
      "lat": 48.1748,
      "lng": 11.5292,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "westfriedhof",
      "name": "Westfriedhof",
      "lat": 48.1702,
      "lng": 11.5302,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "gern",
      "name": "Gern",
      "lat": 48.1625,
      "lng": 11.5312,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "rotkreuzplatz",
      "name": "Rotkreuzplatz",
      "lat": 48.1528,
      "lng": 11.5332,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "maillingerstr",
      "name": "Maillingerstraße",
      "lat": 48.1498,
      "lng": 11.5458,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "stiglmaierplatz",
      "name": "Stiglmaierplatz",
      "lat": 48.1478,
      "lng": 11.5589,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "sendlinger_tor",
      "name": "Sendlinger Tor",
      "lat": 48.1332,
      "lng": 11.5671,
      "lines": [
        "U1",
        "U2",
        "U3",
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "fraunhoferstr",
      "name": "Fraunhoferstraße",
      "lat": 48.1289,
      "lng": 11.5734,
      "lines": [
        "U1",
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "kolumbusplatz",
      "name": "Kolumbusplatz",
      "lat": 48.1212,
      "lng": 11.5778,
      "lines": [
        "U1",
        "U2",
        "X30"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "candidplatz",
      "name": "Candidplatz",
      "lat": 48.1122,
      "lng": 11.5712,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "wettersteinplatz",
      "name": "Wettersteinplatz",
      "lat": 48.1082,
      "lng": 11.5752,
      "lines": [
        "U1",
        "Tram 25"
      ],
      "types": [
        "ubahn",
        "tram"
      ]
    },
    {
      "id": "st_quirin_platz",
      "name": "St.-Quirin-Platz",
      "lat": 48.1028,
      "lng": 11.5798,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "mangfallplatz",
      "name": "Mangfallplatz",
      "lat": 48.0978,
      "lng": 11.5812,
      "lines": [
        "U1"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "feldmoching",
      "name": "Feldmoching Bf.",
      "lat": 48.2144,
      "lng": 11.5408,
      "lines": [
        "U2",
        "S1"
      ],
      "types": [
        "ubahn",
        "sbahn"
      ]
    },
    {
      "id": "hasenbergl",
      "name": "Hasenbergl",
      "lat": 48.2123,
      "lng": 11.5545,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "duelferstr",
      "name": "Dülferstraße",
      "lat": 48.2078,
      "lng": 11.5621,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "harthof",
      "name": "Harthof",
      "lat": 48.2012,
      "lng": 11.5682,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "am_hart",
      "name": "Am Hart",
      "lat": 48.1965,
      "lng": 11.5732,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "frankfurter_ring",
      "name": "Frankfurter Ring",
      "lat": 48.1882,
      "lng": 11.5742,
      "lines": [
        "U2",
        "Bus 50"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "milbertshofen",
      "name": "Milbertshofen",
      "lat": 48.1812,
      "lng": 11.5712,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "scheidplatz",
      "name": "Scheidplatz",
      "lat": 48.1712,
      "lng": 11.5732,
      "lines": [
        "U2",
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "hohenzollernplatz",
      "name": "Hohenzollernplatz",
      "lat": 48.1612,
      "lng": 11.5712,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "josephsplatz",
      "name": "Josephsplatz",
      "lat": 48.1556,
      "lng": 11.5689,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "theresienstr",
      "name": "Theresienstraße",
      "lat": 48.1512,
      "lng": 11.5667,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "koenigsplatz",
      "name": "Königsplatz",
      "lat": 48.1456,
      "lng": 11.5634,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "silberhornstr",
      "name": "Silberhornstraße",
      "lat": 48.1152,
      "lng": 11.5812,
      "lines": [
        "U2",
        "Tram 25"
      ],
      "types": [
        "ubahn",
        "tram"
      ]
    },
    {
      "id": "untersbergstr",
      "name": "Untersbergstraße",
      "lat": 48.1121,
      "lng": 11.5898,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "giesing_bf",
      "name": "Giesing Bf.",
      "lat": 48.1107,
      "lng": 11.5956,
      "lines": [
        "U2",
        "S3",
        "S7",
        "Bus 54"
      ],
      "types": [
        "ubahn",
        "sbahn",
        "bus"
      ]
    },
    {
      "id": "karl_preis_platz",
      "name": "Karl-Preis-Platz",
      "lat": 48.1182,
      "lng": 11.6098,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "innsbrucker_ring",
      "name": "Innsbrucker Ring",
      "lat": 48.1212,
      "lng": 11.6189,
      "lines": [
        "U2",
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "josephsburg",
      "name": "Josephsburg",
      "lat": 48.1245,
      "lng": 11.6321,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "kreillerstr",
      "name": "Kreillerstraße",
      "lat": 48.1262,
      "lng": 11.6452,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "trudering",
      "name": "Trudering Bf.",
      "lat": 48.1256,
      "lng": 11.6628,
      "lines": [
        "U2",
        "S4"
      ],
      "types": [
        "ubahn",
        "sbahn"
      ]
    },
    {
      "id": "moosfeld",
      "name": "Moosfeld",
      "lat": 48.1302,
      "lng": 11.6789,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "messestadt_west",
      "name": "Messestadt West",
      "lat": 48.1332,
      "lng": 11.6912,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "messestadt_ost",
      "name": "Messestadt Ost",
      "lat": 48.1345,
      "lng": 11.7034,
      "lines": [
        "U2"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "moosach",
      "name": "Moosach Bf.",
      "lat": 48.1802,
      "lng": 11.5065,
      "lines": [
        "U3",
        "S1",
        "RE",
        "X80",
        "Bus 50",
        "Bus 51"
      ],
      "types": [
        "ubahn",
        "sbahn",
        "train",
        "bus"
      ]
    },
    {
      "id": "moosacher_st_martins_platz",
      "name": "Moosacher St.-Martins-Platz",
      "lat": 48.1819,
      "lng": 11.5186,
      "lines": [
        "U3",
        "Bus 50"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "oberwiesenfeld",
      "name": "Oberwiesenfeld",
      "lat": 48.186,
      "lng": 11.5477,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "olympiapark_nord",
      "name": "Olympiazentrum",
      "lat": 48.1801,
      "lng": 11.5545,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "petuelring",
      "name": "Petuelring",
      "lat": 48.1756,
      "lng": 11.5656,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "bonner_platz",
      "name": "Bonner Platz",
      "lat": 48.1662,
      "lng": 11.5798,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "m_freiheit",
      "name": "Münchner Freiheit",
      "lat": 48.1619,
      "lng": 11.5864,
      "lines": [
        "U3",
        "U6",
        "Tram 23",
        "Bus 54"
      ],
      "types": [
        "ubahn",
        "tram",
        "bus"
      ]
    },
    {
      "id": "giselastr",
      "name": "Giselastraße",
      "lat": 48.1557,
      "lng": 11.5843,
      "lines": [
        "U3",
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "universitaet",
      "name": "Universität",
      "lat": 48.1501,
      "lng": 11.5815,
      "lines": [
        "U3",
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "odeonsplatz",
      "name": "Odeonsplatz",
      "lat": 48.1423,
      "lng": 11.5776,
      "lines": [
        "U3",
        "U4",
        "U5",
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "goetheplatz",
      "name": "Goetheplatz",
      "lat": 48.1292,
      "lng": 11.5582,
      "lines": [
        "U3",
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "poccistr",
      "name": "Poccistraße",
      "lat": 48.1245,
      "lng": 11.5492,
      "lines": [
        "U3",
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "implerstr",
      "name": "Implerstraße",
      "lat": 48.1189,
      "lng": 11.5398,
      "lines": [
        "U3",
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "brudermuehlstr",
      "name": "Brudermühlstraße",
      "lat": 48.1118,
      "lng": 11.5392,
      "lines": [
        "U3",
        "X30",
        "Bus 54"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "thalkirchen",
      "name": "Thalkirchen (Tierpark)",
      "lat": 48.1008,
      "lng": 11.5452,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "obersendling",
      "name": "Obersendling",
      "lat": 48.0982,
      "lng": 11.5356,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "aidenbachstr",
      "name": "Aidenbachstraße",
      "lat": 48.0989,
      "lng": 11.5234,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "machtlfinger_str",
      "name": "Machtlfinger Straße",
      "lat": 48.0989,
      "lng": 11.5067,
      "lines": [
        "U3",
        "Bus 51"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "forstenrieder_allee",
      "name": "Forstenrieder Allee",
      "lat": 48.0962,
      "lng": 11.4982,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "basler_str",
      "name": "Basler Straße",
      "lat": 48.0945,
      "lng": 11.4921,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "fuerstenried_west",
      "name": "Fürstenried West",
      "lat": 48.0934,
      "lng": 11.4889,
      "lines": [
        "U3"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "westendstr",
      "name": "Westendstraße",
      "lat": 48.1356,
      "lng": 11.5212,
      "lines": [
        "U4",
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "heimeranplatz",
      "name": "Heimeranplatz",
      "lat": 48.1334,
      "lng": 11.5334,
      "lines": [
        "U4",
        "U5",
        "S7",
        "S20"
      ],
      "types": [
        "ubahn",
        "sbahn"
      ]
    },
    {
      "id": "schwanthalerhoehe",
      "name": "Schwanthalerhöhe",
      "lat": 48.1345,
      "lng": 11.5412,
      "lines": [
        "U4",
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "theresienwiese",
      "name": "Theresienwiese",
      "lat": 48.1367,
      "lng": 11.5523,
      "lines": [
        "U4",
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "lehel",
      "name": "Lehel",
      "lat": 48.1401,
      "lng": 11.5878,
      "lines": [
        "U4",
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "max_weber_platz",
      "name": "Max-Weber-Platz",
      "lat": 48.1356,
      "lng": 11.5989,
      "lines": [
        "U4",
        "U5",
        "Tram 25",
        "Tram 19",
        "X30"
      ],
      "types": [
        "ubahn",
        "tram",
        "bus"
      ]
    },
    {
      "id": "prinzregentenplatz",
      "name": "Prinzregentenplatz",
      "lat": 48.1412,
      "lng": 11.6067,
      "lines": [
        "U4",
        "Bus 54"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "boehmerwaldplatz",
      "name": "Böhmerwaldplatz",
      "lat": 48.1445,
      "lng": 11.6167,
      "lines": [
        "U4"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "richard_strauss_str",
      "name": "Richard-Strauss-Straße",
      "lat": 48.1478,
      "lng": 11.6212,
      "lines": [
        "U4"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "arabellapark",
      "name": "Arabellapark",
      "lat": 48.1523,
      "lng": 11.6212,
      "lines": [
        "U4"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "laimer_platz",
      "name": "Laimer Platz",
      "lat": 48.1345,
      "lng": 11.5034,
      "lines": [
        "U5",
        "Tram 19",
        "Bus 51"
      ],
      "types": [
        "ubahn",
        "tram",
        "bus"
      ]
    },
    {
      "id": "friedenheimer_str",
      "name": "Friedenheimer Straße",
      "lat": 48.1348,
      "lng": 11.5121,
      "lines": [
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "michaelibad",
      "name": "Michaelibad",
      "lat": 48.1156,
      "lng": 11.6321,
      "lines": [
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "quiddestr",
      "name": "Quiddestraße",
      "lat": 48.1089,
      "lng": 11.6421,
      "lines": [
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "neuperlach_zentrum",
      "name": "Neuperlach Zentrum",
      "lat": 48.1012,
      "lng": 11.6456,
      "lines": [
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "therese_giehse_allee",
      "name": "Therese-Giehse-Allee",
      "lat": 48.0952,
      "lng": 11.6458,
      "lines": [
        "U5"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "neuperlach_sued",
      "name": "Neuperlach Süd",
      "lat": 48.0898,
      "lng": 11.6452,
      "lines": [
        "U5",
        "S7"
      ],
      "types": [
        "ubahn",
        "sbahn"
      ]
    },
    {
      "id": "garching_forschungszentrum",
      "name": "Garching-Forschungszentrum",
      "lat": 48.2638,
      "lng": 11.6702,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "garching",
      "name": "Garching",
      "lat": 48.2498,
      "lng": 11.6521,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "garching_hochbrueck",
      "name": "Garching-Hochbrück",
      "lat": 48.2421,
      "lng": 11.6302,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "froettmaning",
      "name": "Fröttmaning",
      "lat": 48.2112,
      "lng": 11.6158,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "kieferngarten",
      "name": "Kieferngarten",
      "lat": 48.2012,
      "lng": 11.6121,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "freimann",
      "name": "Freimann",
      "lat": 48.1921,
      "lng": 11.6098,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "studentenstadt",
      "name": "Studentenstadt",
      "lat": 48.1838,
      "lng": 11.6082,
      "lines": [
        "U6",
        "Bus 50"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "alte_heide",
      "name": "Alte Heide",
      "lat": 48.1788,
      "lng": 11.6025,
      "lines": [
        "U6",
        "Bus 50"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "nordfriedhof",
      "name": "Nordfriedhof",
      "lat": 48.1732,
      "lng": 11.5952,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "dietlindenstr",
      "name": "Dietlindenstraße",
      "lat": 48.1678,
      "lng": 11.5912,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "harras",
      "name": "Harras",
      "lat": 48.1165,
      "lng": 11.5389,
      "lines": [
        "U6",
        "S7",
        "BRB",
        "X30",
        "Bus 54"
      ],
      "types": [
        "ubahn",
        "sbahn",
        "train",
        "bus"
      ]
    },
    {
      "id": "partnachplatz",
      "name": "Partnachplatz",
      "lat": 48.1123,
      "lng": 11.5278,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "westpark",
      "name": "Westpark",
      "lat": 48.1178,
      "lng": 11.5167,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "holzapfelkreuth",
      "name": "Holzapfelkreuth",
      "lat": 48.1189,
      "lng": 11.5034,
      "lines": [
        "U6",
        "Bus 51"
      ],
      "types": [
        "ubahn",
        "bus"
      ]
    },
    {
      "id": "haderner_stern",
      "name": "Haderner Stern",
      "lat": 48.1172,
      "lng": 11.4912,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "grosshadern",
      "name": "Großhadern",
      "lat": 48.1156,
      "lng": 11.4789,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "klinikum_grosshadern",
      "name": "Klinikum Großhadern",
      "lat": 48.1112,
      "lng": 11.4712,
      "lines": [
        "U6"
      ],
      "types": [
        "ubahn"
      ]
    },
    {
      "id": "freising",
      "name": "Freising Bf.",
      "lat": 48.3965,
      "lng": 11.7438,
      "lines": [
        "S1",
        "RE"
      ],
      "types": [
        "sbahn",
        "train"
      ]
    },
    {
      "id": "pulling",
      "name": "Pulling",
      "lat": 48.3712,
      "lng": 11.7165,
      "lines": [
        "S1"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "neufahrn",
      "name": "Neufahrn (b. Freising)",
      "lat": 48.3182,
      "lng": 11.6631,
      "lines": [
        "S1"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "eching",
      "name": "Eching",
      "lat": 48.2982,
      "lng": 11.6195,
      "lines": [
        "S1"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "unterschleissheim",
      "name": "Unterschleißheim",
      "lat": 48.2778,
      "lng": 11.5721,
      "lines": [
        "S1"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "lohnhof",
      "name": "Lohhof",
      "lat": 48.2654,
      "lng": 11.5698,
      "lines": [
        "S1"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "oberschleissheim",
      "name": "Oberschleißheim",
      "lat": 48.2505,
      "lng": 11.5583,
      "lines": [
        "S1"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "fasanerie",
      "name": "Fasanerie",
      "lat": 48.1952,
      "lng": 11.5298,
      "lines": [
        "S1"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "muc_flughafen",
      "name": "Flughafen München",
      "lat": 48.3537,
      "lng": 11.7861,
      "lines": [
        "S1",
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "flughafen_besucherpark",
      "name": "Flughafen Besucherpark",
      "lat": 48.3562,
      "lng": 11.7583,
      "lines": [
        "S1",
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "petershausen",
      "name": "Petershausen Bf.",
      "lat": 48.4082,
      "lng": 11.4721,
      "lines": [
        "S2",
        "RE1"
      ],
      "types": [
        "sbahn",
        "train"
      ]
    },
    {
      "id": "vierkirchen",
      "name": "Vierkirchen-Esterhofen",
      "lat": 48.3621,
      "lng": 11.4589,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "rohrmoos",
      "name": "Röhrmoos",
      "lat": 48.3308,
      "lng": 11.4765,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "hebertshausen",
      "name": "Hebertshausen",
      "lat": 48.2921,
      "lng": 11.4712,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "dachau_bf",
      "name": "Dachau Bf.",
      "lat": 48.2589,
      "lng": 11.4428,
      "lines": [
        "S2",
        "RE1"
      ],
      "types": [
        "sbahn",
        "train"
      ]
    },
    {
      "id": "karlsfeld",
      "name": "Karlsfeld",
      "lat": 48.2198,
      "lng": 11.4721,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "allach",
      "name": "Allach Bf.",
      "lat": 48.1912,
      "lng": 11.4682,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "untermenzing",
      "name": "Untermenzing",
      "lat": 48.1765,
      "lng": 11.4789,
      "lines": [
        "S2",
        "X80"
      ],
      "types": [
        "sbahn",
        "bus"
      ]
    },
    {
      "id": "obermenzing",
      "name": "Obermenzing",
      "lat": 48.1632,
      "lng": 11.4889,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "berg_am_laim",
      "name": "Berg am Laim",
      "lat": 48.1321,
      "lng": 11.6321,
      "lines": [
        "S2",
        "S4",
        "Tram 19"
      ],
      "types": [
        "sbahn",
        "tram"
      ]
    },
    {
      "id": "riem",
      "name": "Riem Bf.",
      "lat": 48.1442,
      "lng": 11.6821,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "feldkirchen",
      "name": "Feldkirchen (b. München)",
      "lat": 48.1502,
      "lng": 11.7312,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "heimstetten",
      "name": "Heimstetten",
      "lat": 48.1578,
      "lng": 11.7589,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "grub",
      "name": "Grub (Oberbay)",
      "lat": 48.1652,
      "lng": 11.7821,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "poing",
      "name": "Poing",
      "lat": 48.1712,
      "lng": 11.8102,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "markt_schwaben",
      "name": "Markt Schwaben Bf.",
      "lat": 48.1912,
      "lng": 11.8689,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "ottenhofen",
      "name": "Ottenhofen",
      "lat": 48.2152,
      "lng": 11.8821,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "st_koloman",
      "name": "St. Koloman",
      "lat": 48.2421,
      "lng": 11.8902,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "aufhausen",
      "name": "Aufhausen (b. Erding)",
      "lat": 48.2712,
      "lng": 11.9021,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "altenerding",
      "name": "Altenerding",
      "lat": 48.2912,
      "lng": 11.9102,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "erding",
      "name": "Erding Bf.",
      "lat": 48.3072,
      "lng": 11.9082,
      "lines": [
        "S2"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "mammendorf",
      "name": "Mammendorf Bf.",
      "lat": 48.2082,
      "lng": 11.1621,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "malching",
      "name": "Malching",
      "lat": 48.2102,
      "lng": 11.1982,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "maisach",
      "name": "Maisach Bf.",
      "lat": 48.2182,
      "lng": 11.2621,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "gernlinden",
      "name": "Gernlinden",
      "lat": 48.2198,
      "lng": 11.2982,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "esting",
      "name": "Esting",
      "lat": 48.2098,
      "lng": 11.3321,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "olching",
      "name": "Olching Bf.",
      "lat": 48.2052,
      "lng": 11.3502,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "groebenzell",
      "name": "Gröbenzell",
      "lat": 48.1952,
      "lng": 11.3821,
      "lines": [
        "S3",
        "X80"
      ],
      "types": [
        "sbahn",
        "bus"
      ]
    },
    {
      "id": "lochhausen",
      "name": "Lochhausen",
      "lat": 48.1821,
      "lng": 11.4102,
      "lines": [
        "S3",
        "X80"
      ],
      "types": [
        "sbahn",
        "bus"
      ]
    },
    {
      "id": "langwied",
      "name": "Langwied",
      "lat": 48.1652,
      "lng": 11.4321,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "st_martin_str",
      "name": "St.-Martin-Straße",
      "lat": 48.1189,
      "lng": 11.5982,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "fasangarten",
      "name": "Fasangarten",
      "lat": 48.0921,
      "lng": 11.6021,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "fasanenpark",
      "name": "Fasanenpark",
      "lat": 48.0782,
      "lng": 11.6082,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "unterhaching",
      "name": "Unterhaching",
      "lat": 48.0652,
      "lng": 11.6142,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "taufkirchen",
      "name": "Taufkirchen",
      "lat": 48.0482,
      "lng": 11.6189,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "furth",
      "name": "Furth (b. Deisenhofen)",
      "lat": 48.0312,
      "lng": 11.6082,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "deisenhofen",
      "name": "Deisenhofen Bf.",
      "lat": 48.0182,
      "lng": 11.5892,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "sauerlach",
      "name": "Sauerlach",
      "lat": 47.9652,
      "lng": 11.6502,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "otterfing",
      "name": "Otterfing",
      "lat": 47.9121,
      "lng": 11.6789,
      "lines": [
        "S3"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "holzkirchen",
      "name": "Holzkirchen Bf.",
      "lat": 47.8821,
      "lng": 11.7012,
      "lines": [
        "S3",
        "BRB"
      ],
      "types": [
        "sbahn",
        "train"
      ]
    },
    {
      "id": "geltendorf",
      "name": "Geltendorf Bf.",
      "lat": 48.1252,
      "lng": 11.0282,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "tuerkenfeld",
      "name": "Türkenfeld",
      "lat": 48.1121,
      "lng": 11.0821,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "grafrath",
      "name": "Grafrath",
      "lat": 48.1282,
      "lng": 11.1602,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "schoengeising",
      "name": "Schöngeising",
      "lat": 48.1398,
      "lng": 11.2102,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "buchenau",
      "name": "Buchenau (Oberbay)",
      "lat": 48.1682,
      "lng": 11.2412,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "fuerstenfeldbruck",
      "name": "Fürstenfeldbruck Bf.",
      "lat": 48.1752,
      "lng": 11.2612,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "eichenau",
      "name": "Eichenau",
      "lat": 48.1721,
      "lng": 11.3202,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "puchheim",
      "name": "Puchheim Bf.",
      "lat": 48.1682,
      "lng": 11.3552,
      "lines": [
        "S4",
        "X80"
      ],
      "types": [
        "sbahn",
        "bus"
      ]
    },
    {
      "id": "aubing",
      "name": "Aubing",
      "lat": 48.1582,
      "lng": 11.4152,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "leienfelsstr",
      "name": "Leienfelsstraße",
      "lat": 48.1521,
      "lng": 11.4398,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "gronsdorf",
      "name": "Gronsdorf",
      "lat": 48.1202,
      "lng": 11.6982,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "haar",
      "name": "Haar Bf.",
      "lat": 48.1102,
      "lng": 11.7302,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "vaterstetten",
      "name": "Vaterstetten",
      "lat": 48.1021,
      "lng": 11.7702,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "baldham",
      "name": "Baldham",
      "lat": 48.0952,
      "lng": 11.7982,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "zorneding",
      "name": "Zorneding",
      "lat": 48.0852,
      "lng": 11.8302,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "eglharting",
      "name": "Eglharting",
      "lat": 48.0752,
      "lng": 11.8682,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "kirchseeon",
      "name": "Kirchseeon",
      "lat": 48.0682,
      "lng": 11.8902,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "grafing_bf",
      "name": "Grafing Bf.",
      "lat": 48.0502,
      "lng": 11.9582,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "grafing_stadt",
      "name": "Grafing Stadt",
      "lat": 48.0452,
      "lng": 11.9682,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "ebersberg",
      "name": "Ebersberg (Oberbay)",
      "lat": 48.0782,
      "lng": 12.0202,
      "lines": [
        "S4"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "tutzing",
      "name": "Tutzing Bf.",
      "lat": 47.9082,
      "lng": 11.2782,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "feldafing",
      "name": "Feldafing",
      "lat": 47.9421,
      "lng": 11.2952,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "possenhofen",
      "name": "Possenhofen",
      "lat": 47.9652,
      "lng": 11.3098,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "starnberg_bf",
      "name": "Starnberg Bf.",
      "lat": 47.9982,
      "lng": 11.3452,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "starnberg_nord",
      "name": "Starnberg Nord",
      "lat": 48.0102,
      "lng": 11.3502,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "gauting",
      "name": "Gauting Bf.",
      "lat": 48.0652,
      "lng": 11.3821,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "stockdorf",
      "name": "Stockdorf",
      "lat": 48.0898,
      "lng": 11.4052,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "planegg",
      "name": "Planegg Bf.",
      "lat": 48.1052,
      "lng": 11.4252,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "graefelfing",
      "name": "Gräfelfing",
      "lat": 48.1202,
      "lng": 11.4352,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "lochham",
      "name": "Lochham",
      "lat": 48.1321,
      "lng": 11.4482,
      "lines": [
        "S6"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "westkreuz",
      "name": "Westkreuz",
      "lat": 48.1452,
      "lng": 11.4552,
      "lines": [
        "S6",
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "wolfratshausen",
      "name": "Wolfratshausen Bf.",
      "lat": 47.9121,
      "lng": 11.4252,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "icking",
      "name": "Icking",
      "lat": 47.9502,
      "lng": 11.4402,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "ebenhausen_schaeftlarn",
      "name": "Ebenhausen-Schäftlarn",
      "lat": 47.9782,
      "lng": 11.4582,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "hohenschäftlarn",
      "name": "Hohenschäftlarn",
      "lat": 48.0012,
      "lng": 11.4682,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "baierbrunn",
      "name": "Baierbrunn",
      "lat": 48.0212,
      "lng": 11.4882,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "buchenhain",
      "name": "Buchenhain",
      "lat": 48.0412,
      "lng": 11.5052,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "hoellriegelskreuth",
      "name": "Höllriegelskreuth",
      "lat": 48.0582,
      "lng": 11.5182,
      "lines": [
        "S7",
        "S20"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "pullach",
      "name": "Pullach",
      "lat": 48.0652,
      "lng": 11.5202,
      "lines": [
        "S7",
        "S20"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "grosshesselohe",
      "name": "Großhesselohe Isartalbf",
      "lat": 48.0782,
      "lng": 11.5302,
      "lines": [
        "S7",
        "S20"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "solln",
      "name": "Solln Bf.",
      "lat": 48.0805,
      "lng": 11.5256,
      "lines": [
        "S7",
        "S20",
        "BRB"
      ],
      "types": [
        "sbahn",
        "train"
      ]
    },
    {
      "id": "siemenswerke",
      "name": "Siemenswerke",
      "lat": 48.0952,
      "lng": 11.5352,
      "lines": [
        "S7",
        "S20",
        "BRB"
      ],
      "types": [
        "sbahn",
        "train"
      ]
    },
    {
      "id": "mittersendling",
      "name": "Mittersendling",
      "lat": 48.1082,
      "lng": 11.5382,
      "lines": [
        "S7",
        "S20"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "perlach",
      "name": "Perlach Bf.",
      "lat": 48.0982,
      "lng": 11.6321,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "neubiberg",
      "name": "Neubiberg",
      "lat": 48.0782,
      "lng": 11.6652,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "ottobrunn",
      "name": "Ottobrunn Bf.",
      "lat": 48.0652,
      "lng": 11.6702,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "hohenbrunn",
      "name": "Hohenbrunn",
      "lat": 48.0482,
      "lng": 11.6982,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "waechterhof",
      "name": "Wächterhof",
      "lat": 48.0352,
      "lng": 11.7052,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "hoehenkirchen",
      "name": "Höhenkirchen-Siegertsbrunn",
      "lat": 48.0202,
      "lng": 11.7102,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "dyraming",
      "name": "Dürrnhaar",
      "lat": 47.9982,
      "lng": 11.7282,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "aying",
      "name": "Aying",
      "lat": 47.9702,
      "lng": 11.7752,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "peiss",
      "name": "Peiß",
      "lat": 47.9552,
      "lng": 11.8002,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "grosshelfendorf",
      "name": "Großhelfendorf",
      "lat": 47.9402,
      "lng": 11.8082,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "kreuzstrasse",
      "name": "Kreuzstraße",
      "lat": 47.9252,
      "lng": 11.8202,
      "lines": [
        "S7"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "herrsching",
      "name": "Herrsching Bf.",
      "lat": 47.9982,
      "lng": 11.1752,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "seefeld_hechendorf",
      "name": "Seefeld-Hechendorf",
      "lat": 48.0302,
      "lng": 11.2052,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "steinebach",
      "name": "Steinebach",
      "lat": 48.0552,
      "lng": 11.2302,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "wessling",
      "name": "Weßling (Oberbay)",
      "lat": 48.0782,
      "lng": 11.2502,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "neugilching",
      "name": "Neugilching",
      "lat": 48.1052,
      "lng": 11.2952,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "gilching_argelsried",
      "name": "Gilching-Argelsried",
      "lat": 48.1102,
      "lng": 11.3102,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "geisenbrunn",
      "name": "Geisenbrunn",
      "lat": 48.1202,
      "lng": 11.3321,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "germering_unterpfaffenhofen",
      "name": "Germering-Unterpfaffenhofen",
      "lat": 48.1321,
      "lng": 11.3652,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "harthaus",
      "name": "Harthaus",
      "lat": 48.1398,
      "lng": 11.3852,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "freiham",
      "name": "Freiham Bf.",
      "lat": 48.1421,
      "lng": 11.4102,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "neuaubing",
      "name": "Neuaubing",
      "lat": 48.1442,
      "lng": 11.4252,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "daglfing",
      "name": "Daglfing",
      "lat": 48.1482,
      "lng": 11.6452,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "englschalking",
      "name": "Englschalking",
      "lat": 48.1582,
      "lng": 11.6421,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "johanneskirchen",
      "name": "Johanneskirchen",
      "lat": 48.1702,
      "lng": 11.6452,
      "lines": [
        "S8",
        "Bus 50"
      ],
      "types": [
        "sbahn",
        "bus"
      ]
    },
    {
      "id": "unterfoehring",
      "name": "Unterföhring Bf.",
      "lat": 48.1921,
      "lng": 11.6482,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "ismaning",
      "name": "Ismaning Bf.",
      "lat": 48.2252,
      "lng": 11.6752,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "hallbergmoos",
      "name": "Hallbergmoos Bf.",
      "lat": 48.3102,
      "lng": 11.7302,
      "lines": [
        "S8"
      ],
      "types": [
        "sbahn"
      ]
    },
    {
      "id": "potsdamer_str",
      "name": "Potsdamer Straße",
      "lat": 48.1698,
      "lng": 11.5872,
      "lines": [
        "Tram 23"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "parzivalplatz",
      "name": "Parzivalplatz",
      "lat": 48.1742,
      "lng": 11.5898,
      "lines": [
        "Tram 23"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "am_muesse",
      "name": "Am Münchner Tor",
      "lat": 48.1798,
      "lng": 11.5912,
      "lines": [
        "Tram 23"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "domagkstr",
      "name": "Domagkstraße",
      "lat": 48.1845,
      "lng": 11.5912,
      "lines": [
        "Tram 23"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "schwabing_nord",
      "name": "Schwabing Nord",
      "lat": 48.1882,
      "lng": 11.5918,
      "lines": [
        "Tram 23"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "ostfriedhof",
      "name": "Ostfriedhof",
      "lat": 48.1202,
      "lng": 11.5872,
      "lines": [
        "Tram 25"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "tegernseer_landstr",
      "name": "Tegernseer Landstraße",
      "lat": 48.1112,
      "lng": 11.5782,
      "lines": [
        "Tram 25",
        "X30"
      ],
      "types": [
        "tram",
        "bus"
      ]
    },
    {
      "id": "menterschwaige",
      "name": "Menterschwaige",
      "lat": 48.0821,
      "lng": 11.5452,
      "lines": [
        "Tram 25"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "gruenwald_derbolfinger_platz",
      "name": "Grünwald Derbolfinger Platz",
      "lat": 48.0452,
      "lng": 11.5202,
      "lines": [
        "Tram 25"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "trappentreustr",
      "name": "Trappentreustraße",
      "lat": 48.1402,
      "lng": 11.5356,
      "lines": [
        "Tram 19"
      ],
      "types": [
        "tram"
      ]
    },
    {
      "id": "st_emmeram",
      "name": "St. Emmeram",
      "lat": 48.1752,
      "lng": 11.6252,
      "lines": [
        "Bus 50"
      ],
      "types": [
        "bus"
      ]
    },
    {
      "id": "herkomerplatz",
      "name": "Herkomerplatz",
      "lat": 48.1502,
      "lng": 11.6052,
      "lines": [
        "Bus 54"
      ],
      "types": [
        "bus"
      ]
    }
  ],
  "connections": [
    {
      "from": "pasing",
      "to": "laim_s",
      "minutes": 3,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "laim_s",
      "to": "pasing",
      "minutes": 3,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "laim_s",
      "to": "hirschgarten",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "hirschgarten",
      "to": "laim_s",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "hirschgarten",
      "to": "donnersbergerbruecke",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "donnersbergerbruecke",
      "to": "hirschgarten",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "donnersbergerbruecke",
      "to": "hackerbruecke",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "hackerbruecke",
      "to": "donnersbergerbruecke",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "hackerbruecke",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "hackerbruecke",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "karlsplatz",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "karlsplatz",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "karlsplatz",
      "to": "marienplatz",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "marienplatz",
      "to": "karlsplatz",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "marienplatz",
      "to": "isartor",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "isartor",
      "to": "marienplatz",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "isartor",
      "to": "rosenheimer_platz",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "rosenheimer_platz",
      "to": "isartor",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "rosenheimer_platz",
      "to": "ostbahnhof",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "ostbahnhof",
      "to": "rosenheimer_platz",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "ostbahnhof",
      "to": "leuchtenbergring",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "leuchtenbergring",
      "to": "ostbahnhof",
      "minutes": 2,
      "lines": [
        "S-Bahn Stammstrecke"
      ],
      "type": "sbahn"
    },
    {
      "from": "olympia_einkaufszentrum",
      "to": "georg_brauchle_ring",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "georg_brauchle_ring",
      "to": "olympia_einkaufszentrum",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "georg_brauchle_ring",
      "to": "westfriedhof",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "westfriedhof",
      "to": "georg_brauchle_ring",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "westfriedhof",
      "to": "gern",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "gern",
      "to": "westfriedhof",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "gern",
      "to": "rotkreuzplatz",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "rotkreuzplatz",
      "to": "gern",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "rotkreuzplatz",
      "to": "maillingerstr",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "maillingerstr",
      "to": "rotkreuzplatz",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "maillingerstr",
      "to": "stiglmaierplatz",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "stiglmaierplatz",
      "to": "maillingerstr",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "stiglmaierplatz",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "stiglmaierplatz",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "sendlinger_tor",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "fraunhoferstr",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "fraunhoferstr",
      "to": "sendlinger_tor",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "fraunhoferstr",
      "to": "kolumbusplatz",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "kolumbusplatz",
      "to": "fraunhoferstr",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "kolumbusplatz",
      "to": "candidplatz",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "candidplatz",
      "to": "kolumbusplatz",
      "minutes": 2,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "candidplatz",
      "to": "wettersteinplatz",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "wettersteinplatz",
      "to": "candidplatz",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "wettersteinplatz",
      "to": "st_quirin_platz",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "st_quirin_platz",
      "to": "wettersteinplatz",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "st_quirin_platz",
      "to": "mangfallplatz",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "mangfallplatz",
      "to": "st_quirin_platz",
      "minutes": 1,
      "lines": [
        "U1"
      ],
      "type": "ubahn"
    },
    {
      "from": "feldmoching",
      "to": "hasenbergl",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "hasenbergl",
      "to": "feldmoching",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "hasenbergl",
      "to": "duelferstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "duelferstr",
      "to": "hasenbergl",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "duelferstr",
      "to": "harthof",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "harthof",
      "to": "duelferstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "harthof",
      "to": "am_hart",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "am_hart",
      "to": "harthof",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "am_hart",
      "to": "frankfurter_ring",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "frankfurter_ring",
      "to": "am_hart",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "frankfurter_ring",
      "to": "milbertshofen",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "milbertshofen",
      "to": "frankfurter_ring",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "milbertshofen",
      "to": "scheidplatz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "scheidplatz",
      "to": "milbertshofen",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "scheidplatz",
      "to": "hohenzollernplatz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "hohenzollernplatz",
      "to": "scheidplatz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "hohenzollernplatz",
      "to": "josephsplatz",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "josephsplatz",
      "to": "hohenzollernplatz",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "josephsplatz",
      "to": "theresienstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "theresienstr",
      "to": "josephsplatz",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "theresienstr",
      "to": "koenigsplatz",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "koenigsplatz",
      "to": "theresienstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "koenigsplatz",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "koenigsplatz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "sendlinger_tor",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "fraunhoferstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "fraunhoferstr",
      "to": "sendlinger_tor",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "fraunhoferstr",
      "to": "kolumbusplatz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "kolumbusplatz",
      "to": "fraunhoferstr",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "kolumbusplatz",
      "to": "silberhornstr",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "silberhornstr",
      "to": "kolumbusplatz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "silberhornstr",
      "to": "untersbergstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "untersbergstr",
      "to": "silberhornstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "untersbergstr",
      "to": "giesing_bf",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "giesing_bf",
      "to": "untersbergstr",
      "minutes": 1,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "giesing_bf",
      "to": "karl_preis_platz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "karl_preis_platz",
      "to": "giesing_bf",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "karl_preis_platz",
      "to": "innsbrucker_ring",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "innsbrucker_ring",
      "to": "karl_preis_platz",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "innsbrucker_ring",
      "to": "josephsburg",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "josephsburg",
      "to": "innsbrucker_ring",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "josephsburg",
      "to": "kreillerstr",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "kreillerstr",
      "to": "josephsburg",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "kreillerstr",
      "to": "trudering",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "trudering",
      "to": "kreillerstr",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "trudering",
      "to": "moosfeld",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "moosfeld",
      "to": "trudering",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "moosfeld",
      "to": "messestadt_west",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "messestadt_west",
      "to": "moosfeld",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "messestadt_west",
      "to": "messestadt_ost",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "messestadt_ost",
      "to": "messestadt_west",
      "minutes": 2,
      "lines": [
        "U2"
      ],
      "type": "ubahn"
    },
    {
      "from": "moosach",
      "to": "moosacher_st_martins_platz",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "moosacher_st_martins_platz",
      "to": "moosach",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "moosacher_st_martins_platz",
      "to": "olympia_einkaufszentrum",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "olympia_einkaufszentrum",
      "to": "moosacher_st_martins_platz",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "olympia_einkaufszentrum",
      "to": "oberwiesenfeld",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "oberwiesenfeld",
      "to": "olympia_einkaufszentrum",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "oberwiesenfeld",
      "to": "olympiapark_nord",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "olympiapark_nord",
      "to": "oberwiesenfeld",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "olympiapark_nord",
      "to": "petuelring",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "petuelring",
      "to": "olympiapark_nord",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "petuelring",
      "to": "scheidplatz",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "scheidplatz",
      "to": "petuelring",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "scheidplatz",
      "to": "bonner_platz",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "bonner_platz",
      "to": "scheidplatz",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "bonner_platz",
      "to": "m_freiheit",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "m_freiheit",
      "to": "bonner_platz",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "m_freiheit",
      "to": "giselastr",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "giselastr",
      "to": "m_freiheit",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "giselastr",
      "to": "universitaet",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "universitaet",
      "to": "giselastr",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "universitaet",
      "to": "odeonsplatz",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "universitaet",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "marienplatz",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "marienplatz",
      "to": "odeonsplatz",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "marienplatz",
      "to": "sendlinger_tor",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "marienplatz",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "goetheplatz",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "goetheplatz",
      "to": "sendlinger_tor",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "goetheplatz",
      "to": "poccistr",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "poccistr",
      "to": "goetheplatz",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "poccistr",
      "to": "implerstr",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "implerstr",
      "to": "poccistr",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "implerstr",
      "to": "brudermuehlstr",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "brudermuehlstr",
      "to": "implerstr",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "brudermuehlstr",
      "to": "thalkirchen",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "thalkirchen",
      "to": "brudermuehlstr",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "thalkirchen",
      "to": "obersendling",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "obersendling",
      "to": "thalkirchen",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "obersendling",
      "to": "aidenbachstr",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "aidenbachstr",
      "to": "obersendling",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "aidenbachstr",
      "to": "machtlfinger_str",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "machtlfinger_str",
      "to": "aidenbachstr",
      "minutes": 2,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "machtlfinger_str",
      "to": "forstenrieder_allee",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "forstenrieder_allee",
      "to": "machtlfinger_str",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "forstenrieder_allee",
      "to": "basler_str",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "basler_str",
      "to": "forstenrieder_allee",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "basler_str",
      "to": "fuerstenried_west",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "fuerstenried_west",
      "to": "basler_str",
      "minutes": 1,
      "lines": [
        "U3"
      ],
      "type": "ubahn"
    },
    {
      "from": "westendstr",
      "to": "heimeranplatz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "heimeranplatz",
      "to": "westendstr",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "heimeranplatz",
      "to": "schwanthalerhoehe",
      "minutes": 1,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "schwanthalerhoehe",
      "to": "heimeranplatz",
      "minutes": 1,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "schwanthalerhoehe",
      "to": "theresienwiese",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "theresienwiese",
      "to": "schwanthalerhoehe",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "theresienwiese",
      "to": "hauptbahnhof",
      "minutes": 1,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "theresienwiese",
      "minutes": 1,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "karlsplatz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "karlsplatz",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "karlsplatz",
      "to": "odeonsplatz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "karlsplatz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "lehel",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "lehel",
      "to": "odeonsplatz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "lehel",
      "to": "max_weber_platz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "max_weber_platz",
      "to": "lehel",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "max_weber_platz",
      "to": "prinzregentenplatz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "prinzregentenplatz",
      "to": "max_weber_platz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "prinzregentenplatz",
      "to": "boehmerwaldplatz",
      "minutes": 1,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "boehmerwaldplatz",
      "to": "prinzregentenplatz",
      "minutes": 1,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "boehmerwaldplatz",
      "to": "richard_strauss_str",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "richard_strauss_str",
      "to": "boehmerwaldplatz",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "richard_strauss_str",
      "to": "arabellapark",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "arabellapark",
      "to": "richard_strauss_str",
      "minutes": 2,
      "lines": [
        "U4"
      ],
      "type": "ubahn"
    },
    {
      "from": "laimer_platz",
      "to": "friedenheimer_str",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "friedenheimer_str",
      "to": "laimer_platz",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "friedenheimer_str",
      "to": "westendstr",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "westendstr",
      "to": "friedenheimer_str",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "westendstr",
      "to": "heimeranplatz",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "heimeranplatz",
      "to": "westendstr",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "heimeranplatz",
      "to": "schwanthalerhoehe",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "schwanthalerhoehe",
      "to": "heimeranplatz",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "schwanthalerhoehe",
      "to": "theresienwiese",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "theresienwiese",
      "to": "schwanthalerhoehe",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "theresienwiese",
      "to": "hauptbahnhof",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "theresienwiese",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "karlsplatz",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "karlsplatz",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "karlsplatz",
      "to": "odeonsplatz",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "karlsplatz",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "lehel",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "lehel",
      "to": "odeonsplatz",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "lehel",
      "to": "max_weber_platz",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "max_weber_platz",
      "to": "lehel",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "max_weber_platz",
      "to": "ostbahnhof",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "ostbahnhof",
      "to": "max_weber_platz",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "ostbahnhof",
      "to": "innsbrucker_ring",
      "minutes": 4,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "innsbrucker_ring",
      "to": "ostbahnhof",
      "minutes": 4,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "innsbrucker_ring",
      "to": "michaelibad",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "michaelibad",
      "to": "innsbrucker_ring",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "michaelibad",
      "to": "quiddestr",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "quiddestr",
      "to": "michaelibad",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "quiddestr",
      "to": "neuperlach_zentrum",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "neuperlach_zentrum",
      "to": "quiddestr",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "neuperlach_zentrum",
      "to": "therese_giehse_allee",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "therese_giehse_allee",
      "to": "neuperlach_zentrum",
      "minutes": 1,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "therese_giehse_allee",
      "to": "neuperlach_sued",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "neuperlach_sued",
      "to": "therese_giehse_allee",
      "minutes": 2,
      "lines": [
        "U5"
      ],
      "type": "ubahn"
    },
    {
      "from": "garching_forschungszentrum",
      "to": "garching",
      "minutes": 3,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "garching",
      "to": "garching_forschungszentrum",
      "minutes": 3,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "garching",
      "to": "garching_hochbrueck",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "garching_hochbrueck",
      "to": "garching",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "garching_hochbrueck",
      "to": "froettmaning",
      "minutes": 4,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "froettmaning",
      "to": "garching_hochbrueck",
      "minutes": 4,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "froettmaning",
      "to": "kieferngarten",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "kieferngarten",
      "to": "froettmaning",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "kieferngarten",
      "to": "freimann",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "freimann",
      "to": "kieferngarten",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "freimann",
      "to": "studentenstadt",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "studentenstadt",
      "to": "freimann",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "studentenstadt",
      "to": "alte_heide",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "alte_heide",
      "to": "studentenstadt",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "alte_heide",
      "to": "nordfriedhof",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "nordfriedhof",
      "to": "alte_heide",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "nordfriedhof",
      "to": "dietlindenstr",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "dietlindenstr",
      "to": "nordfriedhof",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "dietlindenstr",
      "to": "m_freiheit",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "m_freiheit",
      "to": "dietlindenstr",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "m_freiheit",
      "to": "giselastr",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "giselastr",
      "to": "m_freiheit",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "giselastr",
      "to": "universitaet",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "universitaet",
      "to": "giselastr",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "universitaet",
      "to": "odeonsplatz",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "universitaet",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "odeonsplatz",
      "to": "marienplatz",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "marienplatz",
      "to": "odeonsplatz",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "marienplatz",
      "to": "sendlinger_tor",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "marienplatz",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "sendlinger_tor",
      "to": "goetheplatz",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "goetheplatz",
      "to": "sendlinger_tor",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "goetheplatz",
      "to": "poccistr",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "poccistr",
      "to": "goetheplatz",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "poccistr",
      "to": "implerstr",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "implerstr",
      "to": "poccistr",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "implerstr",
      "to": "harras",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "harras",
      "to": "implerstr",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "harras",
      "to": "partnachplatz",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "partnachplatz",
      "to": "harras",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "partnachplatz",
      "to": "westpark",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "westpark",
      "to": "partnachplatz",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "westpark",
      "to": "holzapfelkreuth",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "holzapfelkreuth",
      "to": "westpark",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "holzapfelkreuth",
      "to": "haderner_stern",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "haderner_stern",
      "to": "holzapfelkreuth",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "haderner_stern",
      "to": "grosshadern",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "grosshadern",
      "to": "haderner_stern",
      "minutes": 2,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "grosshadern",
      "to": "klinikum_grosshadern",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "klinikum_grosshadern",
      "to": "grosshadern",
      "minutes": 1,
      "lines": [
        "U6"
      ],
      "type": "ubahn"
    },
    {
      "from": "freising",
      "to": "pulling",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "pulling",
      "to": "freising",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "pulling",
      "to": "neufahrn",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "neufahrn",
      "to": "pulling",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "neufahrn",
      "to": "eching",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "eching",
      "to": "neufahrn",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "eching",
      "to": "unterschleissheim",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "unterschleissheim",
      "to": "eching",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "unterschleissheim",
      "to": "lohnhof",
      "minutes": 2,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "lohnhof",
      "to": "unterschleissheim",
      "minutes": 2,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "lohnhof",
      "to": "oberschleissheim",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "oberschleissheim",
      "to": "lohnhof",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "oberschleissheim",
      "to": "feldmoching",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "feldmoching",
      "to": "oberschleissheim",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "feldmoching",
      "to": "fasanerie",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "fasanerie",
      "to": "feldmoching",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "fasanerie",
      "to": "moosach",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "moosach",
      "to": "fasanerie",
      "minutes": 3,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "moosach",
      "to": "laim_s",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "laim_s",
      "to": "moosach",
      "minutes": 4,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "muc_flughafen",
      "to": "flughafen_besucherpark",
      "minutes": 2,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "flughafen_besucherpark",
      "to": "muc_flughafen",
      "minutes": 2,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "flughafen_besucherpark",
      "to": "neufahrn",
      "minutes": 7,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "neufahrn",
      "to": "flughafen_besucherpark",
      "minutes": 7,
      "lines": [
        "S1"
      ],
      "type": "sbahn"
    },
    {
      "from": "petershausen",
      "to": "vierkirchen",
      "minutes": 5,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "vierkirchen",
      "to": "petershausen",
      "minutes": 5,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "vierkirchen",
      "to": "rohrmoos",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "rohrmoos",
      "to": "vierkirchen",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "rohrmoos",
      "to": "hebertshausen",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "hebertshausen",
      "to": "rohrmoos",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "hebertshausen",
      "to": "dachau_bf",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "dachau_bf",
      "to": "hebertshausen",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "dachau_bf",
      "to": "karlsfeld",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "karlsfeld",
      "to": "dachau_bf",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "karlsfeld",
      "to": "allach",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "allach",
      "to": "karlsfeld",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "allach",
      "to": "untermenzing",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "untermenzing",
      "to": "allach",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "untermenzing",
      "to": "obermenzing",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "obermenzing",
      "to": "untermenzing",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "obermenzing",
      "to": "laim_s",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "laim_s",
      "to": "obermenzing",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "leuchtenbergring",
      "to": "berg_am_laim",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "berg_am_laim",
      "to": "leuchtenbergring",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "berg_am_laim",
      "to": "riem",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "riem",
      "to": "berg_am_laim",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "riem",
      "to": "feldkirchen",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "feldkirchen",
      "to": "riem",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "feldkirchen",
      "to": "heimstetten",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "heimstetten",
      "to": "feldkirchen",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "heimstetten",
      "to": "grub",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "grub",
      "to": "heimstetten",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "grub",
      "to": "poing",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "poing",
      "to": "grub",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "poing",
      "to": "markt_schwaben",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "markt_schwaben",
      "to": "poing",
      "minutes": 4,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "markt_schwaben",
      "to": "ottenhofen",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "ottenhofen",
      "to": "markt_schwaben",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "ottenhofen",
      "to": "st_koloman",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "st_koloman",
      "to": "ottenhofen",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "st_koloman",
      "to": "aufhausen",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "aufhausen",
      "to": "st_koloman",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "aufhausen",
      "to": "altenerding",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "altenerding",
      "to": "aufhausen",
      "minutes": 2,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "altenerding",
      "to": "erding",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "erding",
      "to": "altenerding",
      "minutes": 3,
      "lines": [
        "S2"
      ],
      "type": "sbahn"
    },
    {
      "from": "mammendorf",
      "to": "malching",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "malching",
      "to": "mammendorf",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "malching",
      "to": "maisach",
      "minutes": 4,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "maisach",
      "to": "malching",
      "minutes": 4,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "maisach",
      "to": "gernlinden",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "gernlinden",
      "to": "maisach",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "gernlinden",
      "to": "esting",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "esting",
      "to": "gernlinden",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "esting",
      "to": "olching",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "olching",
      "to": "esting",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "olching",
      "to": "groebenzell",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "groebenzell",
      "to": "olching",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "groebenzell",
      "to": "lochhausen",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "lochhausen",
      "to": "groebenzell",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "lochhausen",
      "to": "langwied",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "langwied",
      "to": "lochhausen",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "langwied",
      "to": "pasing",
      "minutes": 4,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "pasing",
      "to": "langwied",
      "minutes": 4,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "ostbahnhof",
      "to": "st_martin_str",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "st_martin_str",
      "to": "ostbahnhof",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "st_martin_str",
      "to": "giesing_bf",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "giesing_bf",
      "to": "st_martin_str",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "giesing_bf",
      "to": "fasangarten",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "fasangarten",
      "to": "giesing_bf",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "fasangarten",
      "to": "fasanenpark",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "fasanenpark",
      "to": "fasangarten",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "fasanenpark",
      "to": "unterhaching",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "unterhaching",
      "to": "fasanenpark",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "unterhaching",
      "to": "taufkirchen",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "taufkirchen",
      "to": "unterhaching",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "taufkirchen",
      "to": "furth",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "furth",
      "to": "taufkirchen",
      "minutes": 2,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "furth",
      "to": "deisenhofen",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "deisenhofen",
      "to": "furth",
      "minutes": 3,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "deisenhofen",
      "to": "sauerlach",
      "minutes": 6,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "sauerlach",
      "to": "deisenhofen",
      "minutes": 6,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "sauerlach",
      "to": "otterfing",
      "minutes": 6,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "otterfing",
      "to": "sauerlach",
      "minutes": 6,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "otterfing",
      "to": "holzkirchen",
      "minutes": 5,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "holzkirchen",
      "to": "otterfing",
      "minutes": 5,
      "lines": [
        "S3"
      ],
      "type": "sbahn"
    },
    {
      "from": "geltendorf",
      "to": "tuerkenfeld",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "tuerkenfeld",
      "to": "geltendorf",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "tuerkenfeld",
      "to": "grafrath",
      "minutes": 5,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "grafrath",
      "to": "tuerkenfeld",
      "minutes": 5,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "grafrath",
      "to": "schoengeising",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "schoengeising",
      "to": "grafrath",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "schoengeising",
      "to": "buchenau",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "buchenau",
      "to": "schoengeising",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "buchenau",
      "to": "fuerstenfeldbruck",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "fuerstenfeldbruck",
      "to": "buchenau",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "fuerstenfeldbruck",
      "to": "eichenau",
      "minutes": 5,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "eichenau",
      "to": "fuerstenfeldbruck",
      "minutes": 5,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "eichenau",
      "to": "puchheim",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "puchheim",
      "to": "eichenau",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "puchheim",
      "to": "aubing",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "aubing",
      "to": "puchheim",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "aubing",
      "to": "leienfelsstr",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "leienfelsstr",
      "to": "aubing",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "leienfelsstr",
      "to": "pasing",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "pasing",
      "to": "leienfelsstr",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "leuchtenbergring",
      "to": "berg_am_laim",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "berg_am_laim",
      "to": "leuchtenbergring",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "berg_am_laim",
      "to": "trudering",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "trudering",
      "to": "berg_am_laim",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "trudering",
      "to": "gronsdorf",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "gronsdorf",
      "to": "trudering",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "gronsdorf",
      "to": "haar",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "haar",
      "to": "gronsdorf",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "haar",
      "to": "vaterstetten",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "vaterstetten",
      "to": "haar",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "vaterstetten",
      "to": "baldham",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "baldham",
      "to": "vaterstetten",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "baldham",
      "to": "zorneding",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "zorneding",
      "to": "baldham",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "zorneding",
      "to": "eglharting",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "eglharting",
      "to": "zorneding",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "eglharting",
      "to": "kirchseeon",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "kirchseeon",
      "to": "eglharting",
      "minutes": 3,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "kirchseeon",
      "to": "grafing_bf",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "grafing_bf",
      "to": "kirchseeon",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "grafing_bf",
      "to": "grafing_stadt",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "grafing_stadt",
      "to": "grafing_bf",
      "minutes": 2,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "grafing_stadt",
      "to": "ebersberg",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "ebersberg",
      "to": "grafing_stadt",
      "minutes": 4,
      "lines": [
        "S4"
      ],
      "type": "sbahn"
    },
    {
      "from": "tutzing",
      "to": "feldafing",
      "minutes": 4,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "feldafing",
      "to": "tutzing",
      "minutes": 4,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "feldafing",
      "to": "possenhofen",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "possenhofen",
      "to": "feldafing",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "possenhofen",
      "to": "starnberg_bf",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "starnberg_bf",
      "to": "possenhofen",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "starnberg_bf",
      "to": "starnberg_nord",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "starnberg_nord",
      "to": "starnberg_bf",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "starnberg_nord",
      "to": "gauting",
      "minutes": 5,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "gauting",
      "to": "starnberg_nord",
      "minutes": 5,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "gauting",
      "to": "stockdorf",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "stockdorf",
      "to": "gauting",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "stockdorf",
      "to": "planegg",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "planegg",
      "to": "stockdorf",
      "minutes": 3,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "planegg",
      "to": "graefelfing",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "graefelfing",
      "to": "planegg",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "graefelfing",
      "to": "lochham",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "lochham",
      "to": "graefelfing",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "lochham",
      "to": "westkreuz",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "westkreuz",
      "to": "lochham",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "westkreuz",
      "to": "pasing",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "pasing",
      "to": "westkreuz",
      "minutes": 2,
      "lines": [
        "S6"
      ],
      "type": "sbahn"
    },
    {
      "from": "wolfratshausen",
      "to": "icking",
      "minutes": 5,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "icking",
      "to": "wolfratshausen",
      "minutes": 5,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "icking",
      "to": "ebenhausen_schaeftlarn",
      "minutes": 4,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "ebenhausen_schaeftlarn",
      "to": "icking",
      "minutes": 4,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "ebenhausen_schaeftlarn",
      "to": "hohenschäftlarn",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hohenschäftlarn",
      "to": "ebenhausen_schaeftlarn",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hohenschäftlarn",
      "to": "baierbrunn",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "baierbrunn",
      "to": "hohenschäftlarn",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "baierbrunn",
      "to": "buchenhain",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "buchenhain",
      "to": "baierbrunn",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "buchenhain",
      "to": "hoellriegelskreuth",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hoellriegelskreuth",
      "to": "buchenhain",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hoellriegelskreuth",
      "to": "pullach",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "pullach",
      "to": "hoellriegelskreuth",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "pullach",
      "to": "grosshesselohe",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "grosshesselohe",
      "to": "pullach",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "grosshesselohe",
      "to": "solln",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "solln",
      "to": "grosshesselohe",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "solln",
      "to": "siemenswerke",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "siemenswerke",
      "to": "solln",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "siemenswerke",
      "to": "mittersendling",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "mittersendling",
      "to": "siemenswerke",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "mittersendling",
      "to": "harras",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "harras",
      "to": "mittersendling",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "harras",
      "to": "heimeranplatz",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "heimeranplatz",
      "to": "harras",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "heimeranplatz",
      "to": "donnersbergerbruecke",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "donnersbergerbruecke",
      "to": "heimeranplatz",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "giesing_bf",
      "to": "perlach",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "perlach",
      "to": "giesing_bf",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "perlach",
      "to": "neuperlach_sued",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "neuperlach_sued",
      "to": "perlach",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "neuperlach_sued",
      "to": "neubiberg",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "neubiberg",
      "to": "neuperlach_sued",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "neubiberg",
      "to": "ottobrunn",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "ottobrunn",
      "to": "neubiberg",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "ottobrunn",
      "to": "hohenbrunn",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hohenbrunn",
      "to": "ottobrunn",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hohenbrunn",
      "to": "waechterhof",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "waechterhof",
      "to": "hohenbrunn",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "waechterhof",
      "to": "hoehenkirchen",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hoehenkirchen",
      "to": "waechterhof",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "hoehenkirchen",
      "to": "dyraming",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "dyraming",
      "to": "hoehenkirchen",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "dyraming",
      "to": "aying",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "aying",
      "to": "dyraming",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "aying",
      "to": "peiss",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "peiss",
      "to": "aying",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "peiss",
      "to": "grosshelfendorf",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "grosshelfendorf",
      "to": "peiss",
      "minutes": 2,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "grosshelfendorf",
      "to": "kreuzstrasse",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "kreuzstrasse",
      "to": "grosshelfendorf",
      "minutes": 3,
      "lines": [
        "S7"
      ],
      "type": "sbahn"
    },
    {
      "from": "herrsching",
      "to": "seefeld_hechendorf",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "seefeld_hechendorf",
      "to": "herrsching",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "seefeld_hechendorf",
      "to": "steinebach",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "steinebach",
      "to": "seefeld_hechendorf",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "steinebach",
      "to": "wessling",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "wessling",
      "to": "steinebach",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "wessling",
      "to": "neugilching",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "neugilching",
      "to": "wessling",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "neugilching",
      "to": "gilching_argelsried",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "gilching_argelsried",
      "to": "neugilching",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "gilching_argelsried",
      "to": "geisenbrunn",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "geisenbrunn",
      "to": "gilching_argelsried",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "geisenbrunn",
      "to": "germering_unterpfaffenhofen",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "germering_unterpfaffenhofen",
      "to": "geisenbrunn",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "germering_unterpfaffenhofen",
      "to": "harthaus",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "harthaus",
      "to": "germering_unterpfaffenhofen",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "harthaus",
      "to": "freiham",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "freiham",
      "to": "harthaus",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "freiham",
      "to": "neuaubing",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "neuaubing",
      "to": "freiham",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "neuaubing",
      "to": "westkreuz",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "westkreuz",
      "to": "neuaubing",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "westkreuz",
      "to": "pasing",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "pasing",
      "to": "westkreuz",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "leuchtenbergring",
      "to": "daglfing",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "daglfing",
      "to": "leuchtenbergring",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "daglfing",
      "to": "englschalking",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "englschalking",
      "to": "daglfing",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "englschalking",
      "to": "johanneskirchen",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "johanneskirchen",
      "to": "englschalking",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "johanneskirchen",
      "to": "unterfoehring",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "unterfoehring",
      "to": "johanneskirchen",
      "minutes": 3,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "unterfoehring",
      "to": "ismaning",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "ismaning",
      "to": "unterfoehring",
      "minutes": 4,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "ismaning",
      "to": "hallbergmoos",
      "minutes": 8,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "hallbergmoos",
      "to": "ismaning",
      "minutes": 8,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "hallbergmoos",
      "to": "flughafen_besucherpark",
      "minutes": 6,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "flughafen_besucherpark",
      "to": "hallbergmoos",
      "minutes": 6,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "flughafen_besucherpark",
      "to": "muc_flughafen",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "muc_flughafen",
      "to": "flughafen_besucherpark",
      "minutes": 2,
      "lines": [
        "S8"
      ],
      "type": "sbahn"
    },
    {
      "from": "pasing",
      "to": "heimeranplatz",
      "minutes": 6,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "heimeranplatz",
      "to": "pasing",
      "minutes": 6,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "heimeranplatz",
      "to": "mittersendling",
      "minutes": 4,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "mittersendling",
      "to": "heimeranplatz",
      "minutes": 4,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "mittersendling",
      "to": "siemenswerke",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "siemenswerke",
      "to": "mittersendling",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "siemenswerke",
      "to": "solln",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "solln",
      "to": "siemenswerke",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "solln",
      "to": "grosshesselohe",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "grosshesselohe",
      "to": "solln",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "grosshesselohe",
      "to": "pullach",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "pullach",
      "to": "grosshesselohe",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "pullach",
      "to": "hoellriegelskreuth",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "hoellriegelskreuth",
      "to": "pullach",
      "minutes": 2,
      "lines": [
        "S20"
      ],
      "type": "sbahn"
    },
    {
      "from": "hauptbahnhof",
      "to": "donnersbergerbruecke",
      "minutes": 3,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "donnersbergerbruecke",
      "to": "hauptbahnhof",
      "minutes": 3,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "donnersbergerbruecke",
      "to": "harras",
      "minutes": 4,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "harras",
      "to": "donnersbergerbruecke",
      "minutes": 4,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "harras",
      "to": "siemenswerke",
      "minutes": 3,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "siemenswerke",
      "to": "harras",
      "minutes": 3,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "siemenswerke",
      "to": "solln",
      "minutes": 2,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "solln",
      "to": "siemenswerke",
      "minutes": 2,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "solln",
      "to": "holzkirchen",
      "minutes": 14,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "holzkirchen",
      "to": "solln",
      "minutes": 14,
      "lines": [
        "BRB"
      ],
      "type": "train"
    },
    {
      "from": "hauptbahnhof",
      "to": "pasing",
      "minutes": 6,
      "lines": [
        "RE1"
      ],
      "type": "train"
    },
    {
      "from": "pasing",
      "to": "hauptbahnhof",
      "minutes": 6,
      "lines": [
        "RE1"
      ],
      "type": "train"
    },
    {
      "from": "pasing",
      "to": "dachau_bf",
      "minutes": 9,
      "lines": [
        "RE1"
      ],
      "type": "train"
    },
    {
      "from": "dachau_bf",
      "to": "pasing",
      "minutes": 9,
      "lines": [
        "RE1"
      ],
      "type": "train"
    },
    {
      "from": "dachau_bf",
      "to": "petershausen",
      "minutes": 11,
      "lines": [
        "RE1"
      ],
      "type": "train"
    },
    {
      "from": "petershausen",
      "to": "dachau_bf",
      "minutes": 11,
      "lines": [
        "RE1"
      ],
      "type": "train"
    },
    {
      "from": "hauptbahnhof",
      "to": "moosach",
      "minutes": 8,
      "lines": [
        "RE"
      ],
      "type": "train"
    },
    {
      "from": "moosach",
      "to": "hauptbahnhof",
      "minutes": 8,
      "lines": [
        "RE"
      ],
      "type": "train"
    },
    {
      "from": "moosach",
      "to": "freising",
      "minutes": 18,
      "lines": [
        "RE"
      ],
      "type": "train"
    },
    {
      "from": "freising",
      "to": "moosach",
      "minutes": 18,
      "lines": [
        "RE"
      ],
      "type": "train"
    },
    {
      "from": "m_freiheit",
      "to": "potsdamer_str",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "potsdamer_str",
      "to": "m_freiheit",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "potsdamer_str",
      "to": "parzivalplatz",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "parzivalplatz",
      "to": "potsdamer_str",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "parzivalplatz",
      "to": "am_muesse",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "am_muesse",
      "to": "parzivalplatz",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "am_muesse",
      "to": "domagkstr",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "domagkstr",
      "to": "am_muesse",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "domagkstr",
      "to": "schwabing_nord",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "schwabing_nord",
      "to": "domagkstr",
      "minutes": 2,
      "lines": [
        "Tram 23"
      ],
      "type": "tram"
    },
    {
      "from": "max_weber_platz",
      "to": "rosenheimer_platz",
      "minutes": 3,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "rosenheimer_platz",
      "to": "max_weber_platz",
      "minutes": 3,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "rosenheimer_platz",
      "to": "ostfriedhof",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "ostfriedhof",
      "to": "rosenheimer_platz",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "ostfriedhof",
      "to": "silberhornstr",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "silberhornstr",
      "to": "ostfriedhof",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "silberhornstr",
      "to": "tegernseer_landstr",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "tegernseer_landstr",
      "to": "silberhornstr",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "tegernseer_landstr",
      "to": "wettersteinplatz",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "wettersteinplatz",
      "to": "tegernseer_landstr",
      "minutes": 2,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "wettersteinplatz",
      "to": "menterschwaige",
      "minutes": 7,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "menterschwaige",
      "to": "wettersteinplatz",
      "minutes": 7,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "menterschwaige",
      "to": "gruenwald_derbolfinger_platz",
      "minutes": 8,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "gruenwald_derbolfinger_platz",
      "to": "menterschwaige",
      "minutes": 8,
      "lines": [
        "Tram 25"
      ],
      "type": "tram"
    },
    {
      "from": "pasing",
      "to": "laimer_platz",
      "minutes": 6,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "laimer_platz",
      "to": "pasing",
      "minutes": 6,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "laimer_platz",
      "to": "trappentreustr",
      "minutes": 7,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "trappentreustr",
      "to": "laimer_platz",
      "minutes": 7,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "trappentreustr",
      "to": "hauptbahnhof",
      "minutes": 5,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "hauptbahnhof",
      "to": "trappentreustr",
      "minutes": 5,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "hauptbahnhof",
      "to": "karlsplatz",
      "minutes": 2,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "karlsplatz",
      "to": "hauptbahnhof",
      "minutes": 2,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "karlsplatz",
      "to": "max_weber_platz",
      "minutes": 7,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "max_weber_platz",
      "to": "karlsplatz",
      "minutes": 7,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "max_weber_platz",
      "to": "ostbahnhof",
      "minutes": 3,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "ostbahnhof",
      "to": "max_weber_platz",
      "minutes": 3,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "ostbahnhof",
      "to": "berg_am_laim",
      "minutes": 6,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "berg_am_laim",
      "to": "ostbahnhof",
      "minutes": 6,
      "lines": [
        "Tram 19"
      ],
      "type": "tram"
    },
    {
      "from": "max_weber_platz",
      "to": "ostbahnhof",
      "minutes": 3,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "ostbahnhof",
      "to": "max_weber_platz",
      "minutes": 3,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "ostbahnhof",
      "to": "kolumbusplatz",
      "minutes": 6,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "kolumbusplatz",
      "to": "ostbahnhof",
      "minutes": 6,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "kolumbusplatz",
      "to": "tegernseer_landstr",
      "minutes": 3,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "tegernseer_landstr",
      "to": "kolumbusplatz",
      "minutes": 3,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "tegernseer_landstr",
      "to": "brudermuehlstr",
      "minutes": 5,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "brudermuehlstr",
      "to": "tegernseer_landstr",
      "minutes": 5,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "brudermuehlstr",
      "to": "harras",
      "minutes": 3,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "harras",
      "to": "brudermuehlstr",
      "minutes": 3,
      "lines": [
        "X30"
      ],
      "type": "bus"
    },
    {
      "from": "puchheim",
      "to": "groebenzell",
      "minutes": 7,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "groebenzell",
      "to": "puchheim",
      "minutes": 7,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "groebenzell",
      "to": "lochhausen",
      "minutes": 5,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "lochhausen",
      "to": "groebenzell",
      "minutes": 5,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "lochhausen",
      "to": "untermenzing",
      "minutes": 8,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "untermenzing",
      "to": "lochhausen",
      "minutes": 8,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "untermenzing",
      "to": "moosach",
      "minutes": 5,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "moosach",
      "to": "untermenzing",
      "minutes": 5,
      "lines": [
        "X80"
      ],
      "type": "bus"
    },
    {
      "from": "moosach",
      "to": "moosacher_st_martins_platz",
      "minutes": 2,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "moosacher_st_martins_platz",
      "to": "moosach",
      "minutes": 2,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "moosacher_st_martins_platz",
      "to": "olympia_einkaufszentrum",
      "minutes": 3,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "olympia_einkaufszentrum",
      "to": "moosacher_st_martins_platz",
      "minutes": 3,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "olympia_einkaufszentrum",
      "to": "frankfurter_ring",
      "minutes": 6,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "frankfurter_ring",
      "to": "olympia_einkaufszentrum",
      "minutes": 6,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "frankfurter_ring",
      "to": "alte_heide",
      "minutes": 4,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "alte_heide",
      "to": "frankfurter_ring",
      "minutes": 4,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "alte_heide",
      "to": "studentenstadt",
      "minutes": 3,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "studentenstadt",
      "to": "alte_heide",
      "minutes": 3,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "studentenstadt",
      "to": "st_emmeram",
      "minutes": 5,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "st_emmeram",
      "to": "studentenstadt",
      "minutes": 5,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "st_emmeram",
      "to": "johanneskirchen",
      "minutes": 4,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "johanneskirchen",
      "to": "st_emmeram",
      "minutes": 4,
      "lines": [
        "Bus 50"
      ],
      "type": "bus"
    },
    {
      "from": "moosach",
      "to": "laim_s",
      "minutes": 10,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "laim_s",
      "to": "moosach",
      "minutes": 10,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "laim_s",
      "to": "laimer_platz",
      "minutes": 4,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "laimer_platz",
      "to": "laim_s",
      "minutes": 4,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "laimer_platz",
      "to": "holzapfelkreuth",
      "minutes": 6,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "holzapfelkreuth",
      "to": "laimer_platz",
      "minutes": 6,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "holzapfelkreuth",
      "to": "machtlfinger_str",
      "minutes": 7,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "machtlfinger_str",
      "to": "holzapfelkreuth",
      "minutes": 7,
      "lines": [
        "Bus 51"
      ],
      "type": "bus"
    },
    {
      "from": "m_freiheit",
      "to": "herkomerplatz",
      "minutes": 5,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "herkomerplatz",
      "to": "m_freiheit",
      "minutes": 5,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "herkomerplatz",
      "to": "prinzregentenplatz",
      "minutes": 4,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "prinzregentenplatz",
      "to": "herkomerplatz",
      "minutes": 4,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "prinzregentenplatz",
      "to": "ostbahnhof",
      "minutes": 6,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "ostbahnhof",
      "to": "prinzregentenplatz",
      "minutes": 6,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "ostbahnhof",
      "to": "giesing_bf",
      "minutes": 6,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "giesing_bf",
      "to": "ostbahnhof",
      "minutes": 6,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "giesing_bf",
      "to": "brudermuehlstr",
      "minutes": 7,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "brudermuehlstr",
      "to": "giesing_bf",
      "minutes": 7,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "brudermuehlstr",
      "to": "harras",
      "minutes": 3,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    },
    {
      "from": "harras",
      "to": "brudermuehlstr",
      "minutes": 3,
      "lines": [
        "Bus 54"
      ],
      "type": "bus"
    }
  ]
};
