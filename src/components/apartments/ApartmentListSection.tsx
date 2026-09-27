import React, { useState, useMemo } from 'react';
import * as turf from '@turf/turf';
import {
  ApartmentListing,
  ApartmentFilterSettings,
  DEFAULT_APARTMENT_FILTER,
  PersonProfile,
  CommuteSchedule,
  IntersectionSubArea,
} from '../../types';
import {
  filterAndRankApartments,
  extractIntersectionSubAreas,
  getPortalSearchLinks,
} from '../../services/apartmentService';
import { ApartmentCard } from './ApartmentCard';
import {
  Home,
  SlidersHorizontal,
  Search,
  ArrowUpDown,
  FolderUp,
  X,
  AlertCircle,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Compass,
} from 'lucide-react';

interface ApartmentListSectionProps {
  listings: ApartmentListing[];
  intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  profiles: PersonProfile[];
  schedule: CommuteSchedule;
  selectedApartmentId?: string;
  onSelectApartment: (apartment: ApartmentListing) => void;
  onOpenImportModal?: () => void;
}

export const ApartmentListSection: React.FC<ApartmentListSectionProps> = ({
  listings,
  intersection,
  profiles,
  schedule,
  selectedApartmentId,
  onSelectApartment,
  onOpenImportModal,
}) => {
  const [filters, setFilters] = useState<ApartmentFilterSettings>(DEFAULT_APARTMENT_FILTER);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Extract individual sub-areas / islands from the intersection
  const subAreas = useMemo(() => {
    return extractIntersectionSubAreas(intersection, listings);
  }, [intersection, listings]);

  const activeSubArea = useMemo<IntersectionSubArea | null>(() => {
    if (!selectedSubAreaId) return null;
    return subAreas.find((sa) => sa.id === selectedSubAreaId) || null;
  }, [subAreas, selectedSubAreaId]);

  // Compute portal links for active sub-area or full intersection
  const portalLinks = useMemo(() => {
    if (activeSubArea) {
      return activeSubArea.portalLinks;
    }
    if (intersection) {
      try {
        const bbox = turf.bbox(intersection as any) as [number, number, number, number];
        const center = { lat: (bbox[1] + bbox[3]) / 2, lng: (bbox[0] + bbox[2]) / 2 };
        const areaM2 = turf.area(intersection as any);
        const radiusKm = Math.max(1, Math.round(Math.sqrt(areaM2 / Math.PI / 1_000_000) * 10) / 10);
        return getPortalSearchLinks(center, bbox, radiusKm);
      } catch {}
    }
    return getPortalSearchLinks({ lat: 48.155, lng: 11.565 }, [11.535, 48.140, 11.595, 48.175], 2);
  }, [activeSubArea, intersection]);

  // Compute filtered & ranked items
  const rankedItems = useMemo(() => {
    return filterAndRankApartments(listings, intersection, filters, profiles, schedule, activeSubArea);
  }, [listings, intersection, filters, profiles, schedule, activeSubArea]);

  const handleSortChange = (sortBy: ApartmentFilterSettings['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const handleMaxPriceQuickFilter = (price?: number) => {
    setFilters((prev) => ({ ...prev, maxPriceWarm: price }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_APARTMENT_FILTER);
    setSelectedSubAreaId(null);
  };

  const handleCopySubAreaCommand = async () => {
    if (!activeSubArea) return;
    const cmd = `node scripts/scrapeApartments.mjs --bbox ${activeSubArea.bbox.map((n) => n.toFixed(4)).join(',')} --limit 15`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Wohnungsangebote im Treffbereich
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                {rankedItems.length} Treffer
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">
              {activeSubArea
                ? `Eingegrenzt auf ${activeSubArea.label}`
                : filters.onlyWithinIntersection
                ? 'Geometrisch gefiltert auf die gemeinsame Schnittmenge'
                : 'Alle verfügbaren Wohnungsdaten'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              showFilters || filters.maxPriceWarm || filters.searchQuery
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-[#1e1f20] text-slate-600 dark:text-[#9aa0a6] border-slate-200 dark:border-[#3c4043] hover:bg-slate-50'
            }`}
            title="Filter und Sortierung anpassen"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-50 dark:hover:bg-[#282a2c] text-xs transition-colors cursor-pointer"
              title="JSON-Datei importieren / Scraper steuern"
            >
              <FolderUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Area Switcher (Trigger per Überlappungsfeld) */}
      {subAreas.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-0.5 touch-scroll-x">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-[#9aa0a6] whitespace-nowrap pl-1 pr-0.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Bereiche:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedSubAreaId(null)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubAreaId === null
                ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500'
                : 'bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#c4c7c5] border-slate-200 dark:border-[#3c4043] hover:bg-slate-100'
            }`}
          >
            Alle Felder ({listings.length})
          </button>
          {subAreas.map((sa) => (
            <button
              key={sa.id}
              type="button"
              onClick={() => setSelectedSubAreaId(sa.id)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                selectedSubAreaId === sa.id
                  ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500'
                  : 'bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#c4c7c5] border-slate-200 dark:border-[#3c4043] hover:bg-slate-100'
              }`}
            >
              {sa.label}
            </button>
          ))}
        </div>
      )}

      {/* Live Portal Search Links (Always visible for the area) */}
      <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-[#151617] border border-slate-200/90 dark:border-[#3c4043] space-y-2">
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            <span>Portal-Direktsuche ({activeSubArea ? activeSubArea.label.split('(')[0].trim() : 'Gesamter Treffbereich'}):</span>
          </span>
          {activeSubArea && (
            <button
              type="button"
              onClick={handleCopySubAreaCommand}
              className="text-[10px] text-blue-600 dark:text-[#8ab4f8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              title="CLI-Scraper Befehl für dieses Feld kopieren"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Kopiert!' : 'CLI-Befehl'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {portalLinks.map((link) => (
            <a
              key={link.portal}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] hover:bg-slate-100 dark:hover:bg-[#282a2c] flex items-center justify-between text-left transition-colors group cursor-pointer"
              title={link.description}
            >
              <div className="min-w-0 pr-1">
                <div className="text-[11px] font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-[#8ab4f8]">
                  {link.name}
                </div>
                <div className="text-[9px] text-slate-400 truncate">{link.badge}</div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* Filter & Sort Drawer (collapsible) */}
      {showFilters && (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#131314] border border-slate-200/80 dark:border-[#3c4043] space-y-2 text-xs animate-in fade-in duration-150">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Straße, Stadtteil, Balkon, EBK..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] text-xs text-slate-900 dark:text-[#e3e3e3] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Price Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-medium">Max. Warmmiete:</span>
            {[undefined, 1500, 1800, 2200, 2500].map((val) => (
              <button
                key={val || 'all'}
                type="button"
                onClick={() => handleMaxPriceQuickFilter(val)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  filters.maxPriceWarm === val
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-[#8ab4f8] dark:text-[#131314]'
                    : 'bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#c4c7c5] border-slate-200 dark:border-[#3c4043] hover:bg-slate-100'
                }`}
              >
                {val ? `< ${val} €` : 'Alle'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-[#3c4043]">
            <span className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              Sortierung:
            </span>
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as any)}
              className="text-[11px] font-semibold bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#3c4043] rounded-lg px-2 py-1 text-slate-800 dark:text-[#e3e3e3]"
            >
              <option value="commute_balance">Fahrzeit-Balance (Ø & Differenz)</option>
              <option value="price_asc">Günstigste zuerst (Miete)</option>
              <option value="price_desc">Teuerste zuerst</option>
              <option value="size_desc">Größte Fläche zuerst</option>
              <option value="rent_sqm_asc">Niedrigster €/m² Preis</option>
            </select>
          </div>
        </div>
      )}

      {/* Apartment Cards List */}
      {rankedItems.length > 0 ? (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5 touch-scroll-y">
          {rankedItems.map(({ listing, score }) => (
            <ApartmentCard
              key={listing.id}
              listing={listing}
              commuteScore={score}
              isSelected={selectedApartmentId === listing.id}
              onSelect={onSelectApartment}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-[#3c4043] text-center space-y-2 bg-slate-50/50 dark:bg-[#131314]/50">
          <AlertCircle className="w-5 h-5 mx-auto text-amber-500" />
          <div className="text-xs font-semibold text-slate-700 dark:text-[#e3e3e3]">
            Keine Inserate in der Datenbank für diesen Teilbereich
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] max-w-xs mx-auto">
            Kommerzielle Immobilienportale schützen ihre Daten per Bot-Schutz vor automatisiertem Auslesen.
            Nutze die Direktlinks oben, um aktuelle Live-Inserate für dieses Feld direkt auf den Portalen zu öffnen.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#3c4043] text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-100 cursor-pointer"
            >
              Filter zurücksetzen
            </button>
            {onOpenImportModal && (
              <button
                type="button"
                onClick={onOpenImportModal}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314] hover:bg-blue-700 cursor-pointer"
              >
                Manager / Import öffnen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
