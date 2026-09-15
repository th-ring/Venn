import React from 'react';
import { Search, X } from 'lucide-react';
import { SettingsTabId } from '../SettingsModal';

export interface SearchResultItem {
  id: string;
  tabId: SettingsTabId;
  title: string;
  category: string;
  description: string;
  keywords: string[];
}

export const SETTINGS_SEARCH_INDEX: SearchResultItem[] = [
  // Appearance
  {
    id: 'theme-system',
    tabId: 'appearance',
    title: 'Erscheinungsbild & Theme',
    category: 'Darstellung & Karte',
    description: 'Systemmodus, Dunkel- und Hell-Design auswählen',
    keywords: ['theme', 'dark', 'light', 'system', 'dunkel', 'hell', 'design', 'farbe', 'aussehen'],
  },
  // Basemap
  {
    id: 'basemap-platform',
    tabId: 'basemap',
    title: 'Kartenanbieter (OSM, CARTO, MemoMaps, Google)',
    category: 'Darstellung & Karte',
    description: 'OpenStreetMap, MemoMaps ÖPNV, CARTO oder Google Maps auswählen',
    keywords: ['karte', 'basemap', 'osm', 'carto', 'google maps', 'memomaps', 'satellit', 'positron'],
  },
  {
    id: 'basemap-railway',
    tabId: 'basemap',
    title: 'Schienennetz-Overlay (OpenRailwayMap)',
    category: 'Darstellung & Karte',
    description: 'Gleise, Bahnhöfe, S-Bahn und U-Bahn über die Basiskarte legen',
    keywords: ['schienen', 'gleise', 'bahn', 'railway', 'overlay', 'tram', 'u-bahn', 's-bahn'],
  },
  // Isochrones
  {
    id: 'isochrone-engine',
    tabId: 'isochrones',
    title: 'Isochronen-Engine (Google API, Offline, ORS)',
    category: 'Berechnung & Routing',
    description: 'Berechnungs-Engine für Erreichbarkeits-Polygone festlegen',
    keywords: ['engine', 'isochrone', 'google maps api', 'openrouteservice', 'offline', 'kalibriert'],
  },
  {
    id: 'isochrone-fidelity',
    tabId: 'isochrones',
    title: 'Detailgrad & Berechnungsqualität (Fidelity)',
    category: 'Berechnung & Routing',
    description: 'Rasterdichte der Isochronen (Auto, Grob, Mittel, Präzise)',
    keywords: ['fidelity', 'detail', 'präzision', 'genauigkeit', 'raster', 'qualität', 'schnelligkeit'],
  },
  {
    id: 'isochrone-smoothing',
    tabId: 'isochrones',
    title: 'Glatte Kanten (B-Spline Glättung)',
    category: 'Berechnung & Routing',
    description: 'Konturen der Fahrzeit-Zonen harmonisch glätten',
    keywords: ['glättung', 'smoothing', 'kanten', 'b-spline', 'kontur'],
  },
  {
    id: 'isochrone-holes',
    tabId: 'isochrones',
    title: 'Künstliche Netzlöcher schließen (Hole-Filling)',
    category: 'Berechnung & Routing',
    description: 'Füllt unbegründete Hohlräume in dichten Stadtgebieten',
    keywords: ['hole', 'löcher', 'hohlraum', 'netzlöcher', 'filling', 'artefakte'],
  },
  {
    id: 'isochrone-intersection',
    tabId: 'isochrones',
    title: 'Nur gemeinsamen Treffbereich anzeigen',
    category: 'Berechnung & Routing',
    description: 'Individuelle Personen-Polygone ausblenden und nur die Schnittmenge zeigen',
    keywords: ['schnittmenge', 'treffbereich', 'intersection', 'nur treffbereich', 'gemeinsam'],
  },
  // Routing Parameters
  {
    id: 'routing-walking',
    tabId: 'routing',
    title: 'Fußgänger-Geschwindigkeit & Gehzeiten',
    category: 'Berechnung & Routing',
    description: 'Gehtempo für Erste & Letzte Meile zur Haltestelle festlegen',
    keywords: ['fußgänger', 'gehen', 'walking', 'kmh', 'geschwindigkeit', 'tempo', 'haltestelle'],
  },
  {
    id: 'routing-detour',
    tabId: 'routing',
    title: 'Städtischer Umwegfaktor (Detour-Faktor)',
    category: 'Berechnung & Routing',
    description: 'Verhältnis von Straßen- und Gehwegnetz zur Luftlinie',
    keywords: ['detour', 'umweg', 'faktor', 'luftlinie', 'straßennetz', 'fußweg'],
  },
  {
    id: 'routing-headway',
    tabId: 'routing',
    title: 'Taktzeit-Malus (Headway / 2)',
    category: 'Berechnung & Routing',
    description: 'Dichte Takte gegenüber seltenen Fahrten bevorzugen',
    keywords: ['takt', 'taktzeit', 'headway', 'malus', 'wartezeit', 'intervall'],
  },
  {
    id: 'routing-transfers',
    tabId: 'routing',
    title: 'Mindest-Umsteigepuffer & Verspätungsrisiko',
    category: 'Berechnung & Routing',
    description: 'Puffer für Umstiege und unzuverlässige Verbindungen',
    keywords: ['umstieg', 'puffer', 'transfer', 'verspätung', 'gleiswechsel', 'risiko'],
  },
  {
    id: 'routing-cycling',
    tabId: 'routing',
    title: 'Fahrrad-Durchschnittsgeschwindigkeit',
    category: 'Berechnung & Routing',
    description: 'Tempo für Rad-Pendelwege (Standard: 16.5 km/h)',
    keywords: ['fahrrad', 'rad', 'bike', 'cycling', 'e-bike', 'geschwindigkeit'],
  },
  {
    id: 'routing-parking',
    tabId: 'routing',
    title: 'Pkw-Parkplatzsuche & Rüstzeitpuffer',
    category: 'Berechnung & Routing',
    description: 'Aufschlag für Garagenausfahrt und Parkplatzsuche in der Innenstadt',
    keywords: ['auto', 'pkw', 'parkplatz', 'rüstzeit', 'fahren', 'car', 'garage'],
  },
  // Data Packages
  {
    id: 'data-munich',
    tabId: 'mvv',
    title: 'Metropolregion München & MVV-Fahrplan',
    category: 'Daten & Schnittstellen',
    description: 'Lokale Haltestellenmatrix und DELFI-Verbindungen synchronisieren',
    keywords: ['münchen', 'mvv', 'mvg', 'fahrplan', 'haltestellen', 'datenpaket', 'delfi'],
  },
  {
    id: 'data-highways',
    tabId: 'mvv',
    title: 'Autobahn-Netz & Rampen (OpenStreetMap)',
    category: 'Daten & Schnittstellen',
    description: 'Anschlussstellen und Auf-/Abfahrten aus OpenStreetMap aktualisieren',
    keywords: ['autobahn', 'rampen', 'anschlussstelle', 'highway', 'osm', 'overpass'],
  },
  {
    id: 'data-modes',
    tabId: 'mvv',
    title: 'ÖPNV-Verkehrsmittel (S-Bahn, U-Bahn, Tram, Bus)',
    category: 'Daten & Schnittstellen',
    description: 'Aktive Verkehrsträger für die Reisezeitberechnung filtern',
    keywords: ['verkehrsmittel', 's-bahn', 'u-bahn', 'tram', 'bus', 'expressbus'],
  },
  // API Keys
  {
    id: 'keys-google',
    tabId: 'keys',
    title: 'Google Maps Platform API-Key',
    category: 'Daten & Schnittstellen',
    description: 'API-Schlüssel für Google Maps und Google Isochrones API verwalten',
    keywords: ['google', 'api', 'key', 'schlüssel', 'gcp', 'credentials', 'token', 'cloud'],
  },
  {
    id: 'keys-ors',
    tabId: 'keys',
    title: 'OpenRouteService API-Token',
    category: 'Daten & Schnittstellen',
    description: 'Kostenlosen Token für OpenRouteService Isochronen hinterlegen',
    keywords: ['ors', 'openrouteservice', 'token', 'key', 'schlüssel', 'heigit'],
  },
  // Priority Heatmap
  {
    id: 'heatmap-priority',
    tabId: 'heatmap',
    title: 'Prioritäts-Heatmap (U-Bahn, S-Bahn, Autobahn)',
    category: 'Karten-Ebenen & Analyse',
    description: 'Infrastruktur-Puffer und Nähe-Ebenen im Treffbereich visualisieren',
    keywords: ['heatmap', 'priorität', 'puffer', 'infrastruktur', 'u-bahn nähe', 's-bahn nähe', 'autobahn nähe'],
  },
  // Rental Overlay
  {
    id: 'rental-overlay',
    tabId: 'rental',
    title: 'Amtlicher Mietspiegel & Kaltmieten (€/m²)',
    category: 'Karten-Ebenen & Analyse',
    description: 'Choroplethen-Ebene der durchschnittlichen Nettokaltmieten nach Stadtbezirken',
    keywords: ['miete', 'mietspiegel', 'kaltmiete', 'wohnlage', 'quadratmeterpreis', 'euro', 'bezirke'],
  },
];

interface SettingsSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectResult: (tabId: SettingsTabId) => void;
}

export const SettingsSearch: React.FC<SettingsSearchProps> = ({
  searchQuery,
  onSearchChange,
  onSelectResult,
}) => {
  const trimmed = searchQuery.trim().toLowerCase();
  const results = trimmed
    ? SETTINGS_SEARCH_INDEX.filter((item) => {
        return (
          item.title.toLowerCase().includes(trimmed) ||
          item.description.toLowerCase().includes(trimmed) ||
          item.category.toLowerCase().includes(trimmed) ||
          item.keywords.some((k) => k.toLowerCase().includes(trimmed))
        );
      })
    : [];

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 dark:text-[#9aa0a6] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Einstellungen durchsuchen..."
          className="w-full text-xs pl-9 pr-8 py-2 rounded-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white dark:bg-[#282a2c] dark:hover:bg-[#303134] dark:focus:bg-[#1e1f20] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#9aa0a6] border border-transparent focus:border-blue-500 dark:focus:border-[#8ab4f8] focus:outline-none transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] cursor-pointer"
            title="Suche zurücksetzen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating search dropdown if results exist */}
      {trimmed && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#1e1f20] rounded-2xl shadow-xl border border-slate-200 dark:border-[#3c4043] p-1.5 z-50 max-h-72 overflow-y-auto space-y-0.5">
          {results.length > 0 ? (
            results.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => {
                  onSelectResult(res.tabId);
                  onSearchChange('');
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer flex flex-col group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3] group-hover:text-blue-600 dark:group-hover:text-[#8ab4f8]">
                    {res.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#747775]">
                    {res.category}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6] line-clamp-1 mt-0.5">
                  {res.description}
                </span>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-slate-500 dark:text-[#9aa0a6]">
              Keine Einstellungen für „{searchQuery}“ gefunden.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
