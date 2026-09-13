import { CityDataPackage } from '../types';
import { getHighwayMetadata } from '../services/highwayService';
import { getMvvDatasetMetadata } from '../services/mvvMatrixService';

/**
 * Returns the centralized packages catalog for all cities/regions.
 * Dynamically includes current timestamps and counts for active datasets.
 */
export function getCityDataPackagesCatalog(activeRegionId: string = 'munich-mvv'): CityDataPackage[] {
  const highwayMeta = getHighwayMetadata();
  const mvvMeta = getMvvDatasetMetadata();

  const formattedHighwayDate = (() => {
    try {
      const d = new Date(highwayMeta.lastUpdated);
      return isNaN(d.getTime())
        ? highwayMeta.lastUpdated
        : `${d.toLocaleDateString('de-DE')} (${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr)`;
    } catch {
      return highwayMeta.lastUpdated;
    }
  })();

  const formattedMvvDate = mvvMeta.lastUpdated || '2026-09-13';

  return [
    {
      id: 'munich-mvv',
      cityName: 'München',
      name: 'München & Metropolregion (MVV Gesamt)',
      isCurrentActive: activeRegionId === 'munich-mvv',
      bbox: [11.03, 47.88, 12.02, 48.41],
      description:
        'Vollständiges metropolitan-Paket für München: Alle S-Bahnen, U-Bahnen, Trams & Busse, das gesamte Autobahnnetz (A99, A9, A8, A96, A95, A94, B2R) sowie amtliche Wohnlagen und Mietspiegel.',
      artifacts: [
        {
          id: 'highway',
          title: 'Autobahnanschlussstellen & Auffahrtsrampen',
          category: 'Autobahn & Auffahrten',
          source: highwayMeta.source || 'OpenStreetMap contributors (ODbL) via Overpass API',
          sourceUrl: highwayMeta.sourceUrl || 'https://www.openstreetmap.org',
          license: 'Open Database License (ODbL)',
          lastUpdated: formattedHighwayDate,
          status: 'available',
          itemCountSummary: `${highwayMeta.junctionCount} Anschlussstellen, ${highwayMeta.rampCount} Rampen-Vektoren`,
          canSync: true,
          syncLabel: 'Aus OSM aktualisieren',
        },
        {
          id: 'transit',
          title: 'ÖPNV-Fahrplan & Verkehrsnetz (MVV / DELFI)',
          category: 'Öffentlicher Nahverkehr',
          source: mvvMeta.source || 'DELFI Bundesfeed & MVV/MVG Open Data Soll-Fahrplan',
          sourceUrl: 'https://www.delfi.de',
          license: 'Open Data / dl-de/zero-2-0',
          lastUpdated: formattedMvvDate,
          status: 'available',
          itemCountSummary: `${mvvMeta.stationCount} Stationen, ${mvvMeta.connectionCount} Verbindungen (S, U, Tram, Bus)`,
          canSync: true,
          syncLabel: 'Fahrplan aktualisieren',
        },
        {
          id: 'rental',
          title: 'Amtlicher Mietspiegel & Wohnlagen',
          category: 'Mietspiegel & Wohnlagen',
          source: 'Landeshauptstadt München Open Data (GeodatenService & Sozialreferat)',
          sourceUrl: 'https://opendata.muenchen.de',
          license: 'Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0)',
          lastUpdated: '2025/2026',
          status: 'available',
          itemCountSummary: '25 Stadtbezirke mit Durchschnittskaltmieten (€/m²)',
          canSync: false,
          syncLabel: 'Amtliche Open Data',
        },
      ],
    },
    {
      id: 'berlin-vbb',
      cityName: 'Berlin',
      name: 'Berlin & Brandenburg (VBB)',
      isCurrentActive: activeRegionId === 'berlin-vbb',
      bbox: [12.8, 52.2, 13.8, 52.8],
      description:
        'Hauptstadt-Netzwerk: S-Bahn Berlin, alle U-Bahn-Linien (U1–U9), Straßenbahnen sowie Vorbereitung für Stadtautobahnen (A100, A111, A113) und Berliner Wohnlagen.',
      artifacts: [
        {
          id: 'highway',
          title: 'Berliner Stadtautobahnen (A100, A10, A111, A113, A115)',
          category: 'Autobahn & Auffahrten',
          source: 'OpenStreetMap (ODbL) via Overpass API',
          sourceUrl: 'https://www.openstreetmap.org',
          license: 'ODbL',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung (ca. 120 Anschlussstellen)',
          canSync: false,
        },
        {
          id: 'transit',
          title: 'VBB Nahverkehrsnetz (S-Bahn, U-Bahn, Tram, Bus)',
          category: 'Öffentlicher Nahverkehr',
          source: 'DELFI Bundesfeed & VBB Open Data',
          sourceUrl: 'https://www.vbb.de',
          license: 'dl-de/by-2-0',
          lastUpdated: '2026.3',
          status: 'available',
          itemCountSummary: '7.850 Stationen, 18.200 Verbindungen',
          canSync: true,
          syncLabel: 'Paket laden',
        },
        {
          id: 'rental',
          title: 'Berliner Mietspiegel & LOR-Planungsräume',
          category: 'Mietspiegel & Wohnlagen',
          source: 'Geoportal Berlin (FIS-Broker) & Berliner Mietspiegel',
          sourceUrl: 'https://fbinter.stadt-berlin.de',
          license: 'dl-de/by-2-0',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung für zukünftige Version',
          canSync: false,
        },
      ],
    },
    {
      id: 'hamburg-hvv',
      cityName: 'Hamburg',
      name: 'Hamburg & Metropolregion (HVV)',
      isCurrentActive: activeRegionId === 'hamburg-hvv',
      bbox: [9.5, 53.3, 10.4, 53.8],
      description:
        'Hansestadt-Netzwerk: U-Bahnen (U1–U4), S-Bahnen (S1–S5), MetroBusse, HADAG-Fähren sowie Vorbereitung für Elbtunnel/A7 und Hamburger Stadtteile.',
      artifacts: [
        {
          id: 'highway',
          title: 'Hamburger Autobahnnetz (A7, A1, A23, A24, A25)',
          category: 'Autobahn & Auffahrten',
          source: 'OpenStreetMap (ODbL) via Overpass API',
          sourceUrl: 'https://www.openstreetmap.org',
          license: 'ODbL',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung (ca. 85 Anschlussstellen)',
          canSync: false,
        },
        {
          id: 'transit',
          title: 'HVV Nahverkehrsnetz (U-Bahn, S-Bahn, Bus, Fähren)',
          category: 'Öffentlicher Nahverkehr',
          source: 'DELFI Bundesfeed & HVV Open Data',
          sourceUrl: 'https://www.hvv.de',
          license: 'dl-de/by-2-0',
          lastUpdated: '2026.3',
          status: 'available',
          itemCountSummary: '4.620 Stationen, 10.400 Verbindungen',
          canSync: true,
          syncLabel: 'Paket laden',
        },
        {
          id: 'rental',
          title: 'Hamburger Stadtteile & Mietenspiegel',
          category: 'Mietspiegel & Wohnlagen',
          source: 'Transparenzportal Hamburg & Hamburger Mietenspiegel',
          sourceUrl: 'https://transparenz.hamburg.de',
          license: 'dl-de/by-2-0',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung für zukünftige Version',
          canSync: false,
        },
      ],
    },
    {
      id: 'nuernberg-vgn',
      cityName: 'Nürnberg',
      name: 'Nürnberg & Franken (VGN)',
      isCurrentActive: activeRegionId === 'nuernberg-vgn',
      bbox: [10.8, 49.3, 11.3, 49.6],
      description:
        'Franken-Netzwerk: U-Bahn Nürnberg (U1–U3), S-Bahnen (S1–S6), Straßenbahnen sowie Kreuz Nürnberg (A3, A6, A9, A73).',
      artifacts: [
        {
          id: 'highway',
          title: 'Fränkisches Autobahnnetz (A3, A6, A9, A73)',
          category: 'Autobahn & Auffahrten',
          source: 'OpenStreetMap (ODbL)',
          license: 'ODbL',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung',
          canSync: false,
        },
        {
          id: 'transit',
          title: 'VGN Nahverkehrsnetz (U-Bahn, S-Bahn, Tram, Bus)',
          category: 'Öffentlicher Nahverkehr',
          source: 'DELFI Bundesfeed & VGN Open Data',
          license: 'dl-de/by-2-0',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung',
          canSync: false,
        },
        {
          id: 'rental',
          title: 'Amtliche Wohnlagen Stadt Nürnberg',
          category: 'Mietspiegel & Wohnlagen',
          source: 'Open Data Nürnberg & Nürnberger Mietspiegel',
          license: 'dl-de/by-2-0',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung',
          canSync: false,
        },
      ],
    },
    {
      id: 'frankfurt-rmv',
      cityName: 'Frankfurt',
      name: 'Frankfurt am Main (RMV)',
      isCurrentActive: activeRegionId === 'frankfurt-rmv',
      bbox: [8.5, 49.95, 8.85, 50.2],
      description:
        'Rhein-Main-Netzwerk: S-Bahn Rhein-Main (S1–S9), Frankfurter U-Bahn (U1–U9), Frankfurter Kreuz (A3, A5) und Stadtteile.',
      artifacts: [
        {
          id: 'highway',
          title: 'Frankfurter Autobahnnetz & Frankfurter Kreuz (A3, A5, A66)',
          category: 'Autobahn & Auffahrten',
          source: 'OpenStreetMap (ODbL)',
          license: 'ODbL',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung',
          canSync: false,
        },
        {
          id: 'transit',
          title: 'RMV Nahverkehrsnetz (S-Bahn, U-Bahn, Tram, Bus)',
          category: 'Öffentlicher Nahverkehr',
          source: 'DELFI Bundesfeed & RMV Open Data',
          license: 'dl-de/by-2-0',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung',
          canSync: false,
        },
        {
          id: 'rental',
          title: 'Frankfurter Mietspiegel & Ortsbezirke',
          category: 'Mietspiegel & Wohnlagen',
          source: 'Geoportal Frankfurt & Frankfurter Mietspiegel',
          license: 'dl-de/by-2-0',
          lastUpdated: 'Geplant',
          status: 'planned',
          itemCountSummary: 'In Vorbereitung',
          canSync: false,
        },
      ],
    },
  ];
}
