import { RentalRegionCatalogEntry } from '../../types';

export const RENTAL_REGIONS_CATALOG: RentalRegionCatalogEntry[] = [
  {
    id: 'munich-mvv',
    name: 'München (25 Stadtbezirke)',
    cityName: 'München',
    available: true,
    source: 'Landeshauptstadt München Open Data (GeodatenService & Sozialreferat)',
    sourceUrl: 'https://opendata.muenchen.de',
    license: 'Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0)',
    lastUpdated: '2025/2026',
    unit: '€/m² Nettokaltmiete',
    description:
      'Amtliche Stadtbezirksgrenzen des GeodatenService München mit m²-Kaltmieten und Wohnlagen nach dem qualifizierten Münchner Mietspiegel.',
  },
  {
    id: 'berlin-vbb',
    name: 'Berlin (Bezirke & LOR-Planungsräume)',
    cityName: 'Berlin',
    available: false,
    source: 'Geoportal Berlin (FIS-Broker) & Berliner Mietspiegel',
    sourceUrl: 'https://fbinter.stadt-berlin.de',
    license: 'dl-de/by-2-0',
    lastUpdated: 'Geplant',
    unit: '€/m² Nettokaltmiete',
    description:
      'In Vorbereitung für zukünftiges Update: Berliner Wohnlagen und LOR-Lebensweltlich orientierte Räume.',
  },
  {
    id: 'hamburg-hvv',
    name: 'Hamburg (Stadtteile & Mietenspiegel)',
    cityName: 'Hamburg',
    available: false,
    source: 'Transparenzportal Hamburg & Hamburger Mietenspiegel',
    sourceUrl: 'https://transparenz.hamburg.de',
    license: 'dl-de/by-2-0',
    lastUpdated: 'Geplant',
    unit: '€/m² Nettokaltmiete',
    description:
      'In Vorbereitung für zukünftiges Update: Hamburger Stadtteile und Mietspiegel-Kategorien.',
  },
  {
    id: 'nuernberg-vgn',
    name: 'Nürnberg & Franken (Statistische Bezirke)',
    cityName: 'Nürnberg',
    available: false,
    source: 'Open Data Nürnberg & Nürnberger Mietspiegel',
    sourceUrl: 'https://opendata.nuernberg.de',
    license: 'dl-de/by-2-0',
    lastUpdated: 'Geplant',
    unit: '€/m² Nettokaltmiete',
    description:
      'In Vorbereitung für zukünftiges Update: Amtliche Wohnlagen der Stadt Nürnberg.',
  },
  {
    id: 'frankfurt-rmv',
    name: 'Frankfurt am Main (Ortsbezirke)',
    cityName: 'Frankfurt am Main',
    available: false,
    source: 'Geoportal Frankfurt & Frankfurter Mietspiegel',
    sourceUrl: 'https://geoportal.frankfurt.de',
    license: 'dl-de/by-2-0',
    lastUpdated: 'Geplant',
    unit: '€/m² Nettokaltmiete',
    description:
      'In Vorbereitung für zukünftiges Update: Frankfurter Stadtteile und Wohnlagen.',
  },
];
