import React, { useState, useRef, useEffect } from 'react';
import {
  BasemapPlatform,
  MapVariant,
  HeatmapSettings,
  PersonProfile,
  RentalOverlaySettings,
  LayerId,
  PoiIconSettings,
} from '../../types';
import { getGoogleMapsApiKey, getOrsApiKey } from '../../services/isochroneEngine';
import { RENTAL_LEGEND_TIERS } from '../../services/rentalService';
import {
  Layers,
  Map as MapIcon,
  Satellite,
  Navigation,
  Train,
  Home,
  Flame,
  Crosshair,
  Euro,
  Mountain,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { LayerManagerPanel } from './LayerManagerPanel';

export interface MapVariantOption {
  id: MapVariant;
  label: string;
  subLabel: string;
  icon: typeof MapIcon;
}

export const OSM_VARIANTS: MapVariantOption[] = [
  {
    id: 'normal',
    label: 'Standard',
    subLabel: 'Klassische OpenStreetMap Kartografie',
    icon: MapIcon,
  },
  {
    id: 'satellite',
    label: 'Satellit',
    subLabel: 'ESRI World Imagery Luftbilder',
    icon: Satellite,
  },
  {
    id: 'streets',
    label: 'Straße',
    subLabel: 'ESRI World Street Map',
    icon: Navigation,
  },
  {
    id: 'transit',
    label: 'ÖPNV & Rad',
    subLabel: 'CyclOSM mit Bahn, Tram & Radwegen',
    icon: Train,
  },
  {
    id: 'topo',
    label: 'Topografie',
    subLabel: 'OpenTopoMap mit Höhenlinien & Relief',
    icon: Mountain,
  },
];

export const MEMOMAPS_VARIANTS: MapVariantOption[] = [
  {
    id: 'memomaps',
    label: 'ÖPNVkarte',
    subLabel: 'memomaps.de – Reines Liniennetz mit Bus, Tram & Bahn',
    icon: Train,
  },
];

export const OPNV_VARIANTS = MEMOMAPS_VARIANTS;

export const CARTO_VARIANTS: MapVariantOption[] = [
  {
    id: 'carto_light',
    label: 'Positron (Hell)',
    subLabel: 'Minimalistisch & dezent (optimal für Daten)',
    icon: Sun,
  },
  {
    id: 'carto_dark',
    label: 'Dark Matter',
    subLabel: 'Eleganter Kontrast-Dunkelmodus',
    icon: Moon,
  },
  {
    id: 'carto_voyager',
    label: 'Voyager',
    subLabel: 'Pastell-Stadtansicht & Parks',
    icon: Palette,
  },
];

export const GOOGLE_VARIANTS: MapVariantOption[] = [
  {
    id: 'normal',
    label: 'Standard',
    subLabel: 'Offizielle Google Roadmap',
    icon: MapIcon,
  },
  {
    id: 'satellite',
    label: 'Satellit',
    subLabel: 'Google Hybrid-Luftbilder mit Straßen',
    icon: Satellite,
  },
  {
    id: 'streets',
    label: 'Straße',
    subLabel: 'Fokussiertes Google Straßennetz',
    icon: Navigation,
  },
  {
    id: 'transit',
    label: 'ÖPNV',
    subLabel: 'Google TransitLayer (U/S-Bahn, Tram)',
    icon: Train,
  },
];

export const MAP_VARIANTS: MapVariantOption[] = [
  ...OSM_VARIANTS,
  ...OPNV_VARIANTS,
  ...CARTO_VARIANTS,
];

interface MapLayerControlsProps {
  activePlatform: BasemapPlatform;
  activeVariant: MapVariant;
  onSelectPlatform: (platform: BasemapPlatform) => void;
  onSelectVariant: (variant: MapVariant) => void;
  isBasemapLoading?: boolean;
  profiles: PersonProfile[];
  onToggleProfileVisibility?: (id: string) => void;
  hasIntersection: boolean;
  showIntersectionLayer: boolean;
  onToggleIntersectionLayer: () => void;
  showIndividualIsochrones?: boolean;
  onToggleIndividualIsochrones?: () => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  onlyResidential?: boolean;
  onToggleOnlyResidential?: () => void;
  heatmapSettings?: HeatmapSettings;
  onUpdateHeatmap?: (settings: Partial<HeatmapSettings>) => void;
  rentalSettings?: RentalOverlaySettings;
  onUpdateRentalOverlay?: (settings: Partial<RentalOverlaySettings>) => void;
  onFitBounds: () => void;
  onOpenApiKeySettings?: () => void;
  layerOrder: LayerId[];
  onReorderLayer: (fromIndex: number, toIndex: number) => void;
  onResetLayerOrder: () => void;
  hiddenLayers: Set<LayerId>;
  onToggleLayerVisibility: (layerId: LayerId) => void;
  poiIconSettings: PoiIconSettings;
  onUpdatePoiIcons: (settings: Partial<PoiIconSettings>) => void;
  intersectionAreaKm2?: number;
  showRailwayOverlay?: boolean;
  onToggleRailwayOverlay?: () => void;
}

export const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  activePlatform,
  activeVariant,
  onSelectPlatform,
  onSelectVariant,
  showRailwayOverlay = false,
  onToggleRailwayOverlay,
  isBasemapLoading = false,
  profiles,
  onToggleProfileVisibility,
  hasIntersection,
  showIntersectionLayer,
  onToggleIntersectionLayer,
  showIndividualIsochrones = true,
  onToggleIndividualIsochrones,
  showOnlyIntersection,
  onToggleOnlyIntersection,
  onlyResidential = false,
  onToggleOnlyResidential,
  heatmapSettings,
  onUpdateHeatmap,
  rentalSettings,
  onUpdateRentalOverlay,
  onFitBounds,
  onOpenApiKeySettings,
  layerOrder,
  onReorderLayer,
  onResetLayerOrder,
  hiddenLayers,
  onToggleLayerVisibility,
  poiIconSettings,
  onUpdatePoiIcons,
  intersectionAreaKm2,
}) => {
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isOnlyIntersectionActive =
    showOnlyIntersection !== undefined
      ? showOnlyIntersection
      : !showIndividualIsochrones && showIntersectionLayer;

  // Calculate active layers count
  const activeLayersCount = [
    !hiddenLayers.has('inspection'),
    !hiddenLayers.has('persons'),
    poiIconSettings.visible && !hiddenLayers.has('poi_icons'),
    showIntersectionLayer && !hiddenLayers.has('intersection'),
    heatmapSettings && heatmapSettings.mode !== 'none' && !hiddenLayers.has('heatmap'),
    showIndividualIsochrones && !hiddenLayers.has('isochrones'),
    rentalSettings?.enabled && !hiddenLayers.has('rental'),
    !hiddenLayers.has('basemap'),
  ].filter(Boolean).length;

  return (
    <>
      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5">
        {/* Main Layer Panel Trigger Button (Google M3 Pill) */}
        <div className="relative">
          <button
            id="btn-layer-manager-toggle"
            type="button"
            onClick={() => setIsLayerPanelOpen((prev) => !prev)}
            title="Karten-Ebenen, Reihenfolge & Filter anpassen"
            className={`px-3 py-2 rounded-full shadow-md border transition-colors flex items-center gap-2 backdrop-blur-md text-xs font-medium cursor-pointer ${
              isLayerPanelOpen
                ? 'bg-blue-600 text-white border-blue-600 dark:bg-[#8ab4f8] dark:text-[#131314] dark:border-[#8ab4f8]'
                : 'bg-white/95 dark:bg-[#1e1f20]/95 hover:bg-slate-50 dark:hover:bg-[#282a2c] text-slate-800 dark:text-[#e8eaed] border-slate-200/90 dark:border-[#3c4043]'
            }`}
          >
            <Layers className={`w-4 h-4 ${isLayerPanelOpen ? 'text-white dark:text-[#131314]' : 'text-blue-600 dark:text-[#8ab4f8]'}`} />
            <span className="hidden sm:inline">Ebenen & Filter</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                isLayerPanelOpen
                  ? 'bg-white/20 text-white dark:bg-[#131314]/20 dark:text-[#131314]'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#8ab4f8]'
              }`}
            >
              {activeLayersCount}
            </span>
          </button>
        </div>

        {/* Action Controls Column (Google Maps Unified Floating Dock) */}
        {!isLayerPanelOpen && (
          <div className="bg-white/95 dark:bg-[#1e1f20]/95 rounded-2xl shadow-md border border-slate-200/80 dark:border-[#3c4043] flex flex-col divide-y divide-slate-100 dark:divide-[#3c4043] overflow-hidden backdrop-blur-md animate-in fade-in duration-150">
            {/* Quick-Toggle: Wohnbereich-Filter */}
            {onToggleOnlyResidential && hasIntersection && (
              <button
                id="btn-toggle-residential"
                type="button"
                onClick={onToggleOnlyResidential}
                title={
                  onlyResidential
                    ? 'Wohngebiets-Filter aktiv (Klicken für gesamte Fläche)'
                    : 'Auf Wohnbereich reduzieren (Forste, Seen & Industrie ausfiltern)'
                }
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                  onlyResidential
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#282a2c] hover:text-slate-900 dark:hover:text-[#e8eaed]'
                }`}
              >
                <Home className="w-4 h-4" />
              </button>
            )}

            {/* Quick-Toggle: Prioritäts-Heatmap Zyklus */}
            {onUpdateHeatmap && hasIntersection && (
              <button
                id="btn-toggle-heatmap"
                type="button"
                onClick={() => {
                  const current = heatmapSettings?.mode || 'none';
                  const nextMode =
                    current === 'none'
                      ? 'ubahn'
                      : current === 'ubahn'
                      ? 'sbahn'
                      : current === 'sbahn'
                      ? 'highway'
                      : 'none';
                  onUpdateHeatmap({ mode: nextMode });
                }}
                title={
                  heatmapSettings && heatmapSettings.mode !== 'none'
                    ? `Treff-Heatmap: ${
                        heatmapSettings.mode === 'ubahn'
                          ? 'U-Bahn'
                          : heatmapSettings.mode === 'sbahn'
                          ? 'S-Bahn'
                          : 'Autobahn'
                      } aktiv (Klicken zum Durchschalten)`
                    : 'Prioritäts-Heatmap aktivieren (U-Bahn / S-Bahn / Autobahn)'
                }
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                  heatmapSettings && heatmapSettings.mode !== 'none'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#282a2c] hover:text-slate-900 dark:hover:text-[#e8eaed]'
                }`}
              >
                <Flame className="w-4 h-4" />
              </button>
            )}

            {/* Quick-Toggle: Mietspiegel Overlay */}
            {onUpdateRentalOverlay && (
              <button
                id="btn-toggle-rental-overlay"
                type="button"
                onClick={() =>
                  onUpdateRentalOverlay({
                    enabled: !rentalSettings?.enabled,
                  })
                }
                title={
                  rentalSettings?.enabled
                    ? 'Mietspiegel-Choropleth ausblenden (München)'
                    : 'Mietspiegel & Kaltmiete (€/m²) einblenden (München Open Data)'
                }
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                  rentalSettings?.enabled
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#8ab4f8]'
                    : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#282a2c] hover:text-slate-900 dark:hover:text-[#e8eaed]'
                }`}
              >
                <Euro className="w-4 h-4" />
              </button>
            )}

            {/* Fit Bounds */}
            <button
              id="btn-fit-bounds"
              type="button"
              onClick={onFitBounds}
              title="Gesamten Suchbereich zentrieren"
              className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#282a2c] hover:text-slate-900 dark:hover:text-[#e8eaed] transition-colors cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Layer Management Drawer / Panel */}
      <LayerManagerPanel
        isOpen={isLayerPanelOpen}
        onClose={() => setIsLayerPanelOpen(false)}
        layerOrder={layerOrder}
        onReorderLayer={onReorderLayer}
        onResetLayerOrder={onResetLayerOrder}
        hiddenLayers={hiddenLayers}
        onToggleLayerVisibility={onToggleLayerVisibility}
        profiles={profiles}
        onToggleProfileVisibility={onToggleProfileVisibility}
        hasIntersection={hasIntersection}
        showIntersectionLayer={showIntersectionLayer}
        onToggleIntersectionLayer={onToggleIntersectionLayer}
        showIndividualIsochrones={showIndividualIsochrones}
        onToggleIndividualIsochrones={onToggleIndividualIsochrones || (() => {})}
        showOnlyIntersection={isOnlyIntersectionActive}
        onToggleOnlyIntersection={onToggleOnlyIntersection || (() => {})}
        onlyResidential={onlyResidential}
        onToggleOnlyResidential={onToggleOnlyResidential || (() => {})}
        heatmapSettings={heatmapSettings}
        onUpdateHeatmap={onUpdateHeatmap}
        rentalSettings={rentalSettings}
        onUpdateRentalOverlay={onUpdateRentalOverlay}
        poiIconSettings={poiIconSettings}
        onUpdatePoiIcons={onUpdatePoiIcons}
        activePlatform={activePlatform}
        activeVariant={activeVariant}
        onSelectPlatform={onSelectPlatform}
        onSelectVariant={onSelectVariant}
        hasGoogleMapsKey={!!getGoogleMapsApiKey()}
        hasOrsKey={!!getOrsApiKey()}
        onOpenApiKeySettings={onOpenApiKeySettings}
        intersectionAreaKm2={intersectionAreaKm2}
        showRailwayOverlay={showRailwayOverlay}
        onToggleRailwayOverlay={onToggleRailwayOverlay}
      />

      {/* Active "Nur überlagerter Treffbereich" Floating Banner */}
      {isOnlyIntersectionActive && hasIntersection && onToggleOnlyIntersection && (
        <div className="absolute bottom-6 left-4 z-20 bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-emerald-300 dark:border-emerald-700 flex items-center gap-2.5 text-xs text-emerald-950 dark:text-emerald-300 animate-in fade-in duration-150">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700" />
          <span className="font-semibold">Nur überlagerter Treffbereich (Grün)</span>
          <button
            type="button"
            onClick={onToggleOnlyIntersection}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 underline cursor-pointer ml-1"
          >
            Alle Bereiche einblenden
          </button>
        </div>
      )}

      {/* Active Mietspiegel Legend Floating Banner */}
      {rentalSettings?.enabled && (
        <div
          className={`absolute ${
            isOnlyIntersectionActive && hasIntersection && onToggleOnlyIntersection
              ? 'bottom-20'
              : 'bottom-6'
          } left-4 z-20 bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200/90 dark:border-[#3c4043] flex flex-col gap-1.5 text-xs text-slate-800 dark:text-[#e3e3e3] animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-xs`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-[#3c4043] pb-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-[#e3e3e3] text-[11px]">
              <Euro className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
              <span>Mietspiegel München</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6]">Ø Kaltmiete</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-[9px] font-semibold text-center">
            {RENTAL_LEGEND_TIERS.map((tier) => (
              <div key={tier.label} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-full h-2 rounded-full shadow-2xs"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="text-slate-600 dark:text-[#9aa0a6] leading-tight truncate w-full" title={tier.label}>
                  {tier.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
