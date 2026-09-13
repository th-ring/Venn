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
} from 'lucide-react';
import { LayerManagerPanel } from './LayerManagerPanel';

export const MAP_VARIANTS: Array<{
  id: MapVariant;
  label: string;
  subLabel: string;
  icon: typeof MapIcon;
}> = [
  {
    id: 'normal',
    label: 'Normal',
    subLabel: 'Standard-Karte mit Ortschaften & Flächen',
    icon: MapIcon,
  },
  {
    id: 'satellite',
    label: 'Satellit',
    subLabel: 'Echte Luftbilder & Satellitenaufnahmen',
    icon: Satellite,
  },
  {
    id: 'streets',
    label: 'Straße',
    subLabel: 'Fokus auf Straßennetz, Autobahnen & Trassen',
    icon: Navigation,
  },
  {
    id: 'transit',
    label: 'ÖPNV',
    subLabel: 'Bahnlinien, Tram, Bus & Haltestellen',
    icon: Train,
  },
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
}

export const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  activePlatform,
  activeVariant,
  onSelectPlatform,
  onSelectVariant,
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
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {/* Main Layer Panel Trigger Button */}
        <div className="relative">
          <button
            id="btn-layer-manager-toggle"
            type="button"
            onClick={() => setIsLayerPanelOpen((prev) => !prev)}
            title="Karten-Ebenen, Reihenfolge & Filter anpassen"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl shadow-md border transition-all flex items-center gap-2 backdrop-blur-xs text-xs font-bold cursor-pointer ${
              isLayerPanelOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 ring-2 ring-blue-400/40'
                : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:shadow-lg'
            }`}
          >
            <Layers className={`w-4 h-4 ${isLayerPanelOpen ? 'text-white' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">Ebenen & Filter</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isLayerPanelOpen
                  ? 'bg-white text-blue-700'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {activeLayersCount}
            </span>
          </button>
        </div>

        {/* Action Controls Column (Quick Actions) */}
        {!isLayerPanelOpen && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-150">
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
                className={`p-2.5 rounded-xl shadow-md border transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer ${
                  onlyResidential
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600 ring-2 ring-emerald-400/50'
                    : 'bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
                }`}
              >
                <Home className="w-5 h-5" />
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
                className={`p-2.5 rounded-xl shadow-md border transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer ${
                  heatmapSettings && heatmapSettings.mode !== 'none'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300/50'
                    : 'bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
                }`}
              >
                <Flame className="w-5 h-5" />
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
                className={`p-2.5 rounded-xl shadow-md border transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer ${
                  rentalSettings?.enabled
                    ? 'bg-purple-700 hover:bg-purple-800 text-white border-purple-600 ring-2 ring-purple-400/50'
                    : 'bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
                }`}
              >
                <Euro className="w-5 h-5" />
              </button>
            )}

            {/* Fit Bounds */}
            <button
              id="btn-fit-bounds"
              type="button"
              onClick={onFitBounds}
              title="Gesamten Suchbereich zentrieren"
              className="bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 p-2.5 rounded-xl shadow-md border border-slate-200/80 transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer"
            >
              <Crosshair className="w-5 h-5 text-slate-700" />
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
      />

      {/* Active "Nur überlagerter Treffbereich" Floating Banner */}
      {isOnlyIntersectionActive && hasIntersection && onToggleOnlyIntersection && (
        <div className="absolute bottom-6 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-emerald-300 flex items-center gap-2.5 text-xs text-emerald-950 animate-in fade-in duration-150">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
          <span className="font-semibold">Nur überlagerter Treffbereich (Grün)</span>
          <button
            type="button"
            onClick={onToggleOnlyIntersection}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-950 underline cursor-pointer ml-1"
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
          } left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200/90 flex flex-col gap-1.5 text-xs text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-xs`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
              <Euro className="w-3.5 h-3.5 text-purple-600" />
              <span>Mietspiegel München</span>
            </div>
            <span className="text-[10px] text-slate-400">Ø Kaltmiete</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-[9px] font-semibold text-center">
            {RENTAL_LEGEND_TIERS.map((tier) => (
              <div key={tier.label} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-full h-2 rounded-full shadow-2xs"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="text-slate-600 leading-tight truncate w-full" title={tier.label}>
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
