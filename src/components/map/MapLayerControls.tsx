import React, { useState, useRef, useEffect } from 'react';
import {
  BasemapPlatform,
  MapVariant,
  BasemapProvider,
  HeatmapSettings,
  PersonProfile,
  RentalOverlaySettings,
} from '../../types';
import { getGoogleMapsApiKey, getOrsApiKey } from '../../services/isochroneEngine';
import { RENTAL_LEGEND_TIERS } from '../../services/rentalService';
import {
  Layers,
  Map as MapIcon,
  Satellite,
  Navigation,
  Train,
  ChevronDown,
  Globe,
  Check,
  Focus,
  Eye,
  EyeOff,
  Key,
  Home,
  Flame,
  Crosshair,
  Euro,
} from 'lucide-react';

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
}

export const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  activePlatform,
  activeVariant,
  onSelectPlatform,
  onSelectVariant,
  isBasemapLoading = false,
  profiles,
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
}) => {
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const layerMenuRef = useRef<HTMLDivElement>(null);

  const isOnlyIntersectionActive =
    showOnlyIntersection !== undefined
      ? showOnlyIntersection
      : !showIndividualIsochrones && showIntersectionLayer;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentVariantInfo =
    MAP_VARIANTS.find((v) => v.id === activeVariant) || MAP_VARIANTS[0];

  return (
    <>
      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {/* Basemap Switcher Dropdown */}
        <div className="relative" ref={layerMenuRef}>
          <button
            id="btn-basemap-switcher"
            type="button"
            onClick={() => setShowLayerMenu((prev) => !prev)}
            title="Kartendienst & Kartentyp wählen"
            className="bg-white/95 hover:bg-white text-slate-800 p-2 sm:px-3 sm:py-2 rounded-xl shadow-md border border-slate-200/90 transition-all flex items-center gap-2 backdrop-blur-xs text-xs font-semibold hover:shadow-lg cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">
              {activePlatform === 'google' ? 'Google Maps' : 'OpenStreetMap'} •{' '}
              {currentVariantInfo.label}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 z-30 animate-in fade-in zoom-in-95 duration-150">
              {/* STUFE 1: KARTENDIENST WÄHLEN */}
              <div className="mb-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>1. Kartendienst (Dienst)</span>
                  <div className="flex items-center gap-1">
                    {getGoogleMapsApiKey() && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full" title="Google Maps API-Key aktiv">
                        Google ✔
                      </span>
                    )}
                    {getOrsApiKey() && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full" title="OpenRouteService API-Key aktiv">
                        ORS ✔
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {/* Option OSM */}
                  <button
                    type="button"
                    onClick={() => onSelectPlatform('osm')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      activePlatform === 'osm'
                        ? 'bg-white text-blue-900 shadow-xs border border-blue-200 ring-1 ring-blue-400/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-700" />
                      <span>OpenStreetMap</span>
                    </div>
                    <span className="text-[9px] font-normal text-slate-500">
                      {getOrsApiKey() ? 'ORS API aktiv' : 'Offline-Modell'}
                    </span>
                  </button>

                  {/* Option Google Maps */}
                  <button
                    type="button"
                    onClick={() => onSelectPlatform('google')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      activePlatform === 'google'
                        ? 'bg-white text-blue-900 shadow-xs border border-blue-200 ring-1 ring-blue-400/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Google Maps</span>
                    </div>
                    <span className={`text-[9px] font-normal ${getGoogleMapsApiKey() ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {getGoogleMapsApiKey() ? 'Google API aktiv' : 'Key erforderlich'}
                    </span>
                  </button>
                </div>

                {activePlatform === 'google' && !getGoogleMapsApiKey() && (
                  <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg flex items-center justify-between">
                    <span>Google Maps Key erforderlich</span>
                    {onOpenApiKeySettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowLayerMenu(false);
                          onOpenApiKeySettings();
                        }}
                        className="text-amber-900 underline font-semibold text-[10px]"
                      >
                        Eingeben
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* STUFE 2: KARTENTYP WÄHLEN */}
              <div className="pt-2.5 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  2. Kartentyp ({activePlatform === 'google' ? 'Google' : 'OSM'})
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {MAP_VARIANTS.map((variant) => {
                    const Icon = variant.icon;
                    const isSelected = activeVariant === variant.id;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => onSelectVariant(variant.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{variant.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5 line-clamp-1">
                            {variant.subLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STUFE 3: KARTEN-EBENEN */}
              <div className="pt-2.5 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  3. Ebenen & Überlagerung
                </div>
                <div className="space-y-1.5">
                  {onToggleOnlyIntersection && (
                    <div
                      onClick={onToggleOnlyIntersection}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isOnlyIntersectionActive
                          ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Focus
                          className={`w-4 h-4 ${
                            isOnlyIntersectionActive ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs">Nur überlagerter Treffbereich (Grün)</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isOnlyIntersectionActive
                            ? 'bg-emerald-200/90 text-emerald-900'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isOnlyIntersectionActive ? 'Aktiv' : 'Aus'}
                      </span>
                    </div>
                  )}

                  {onToggleIndividualIsochrones && (
                    <div
                      onClick={onToggleIndividualIsochrones}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        showIndividualIsochrones
                          ? 'bg-blue-50/60 border-blue-300 text-blue-950 font-semibold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers
                          className={`w-4 h-4 ${
                            showIndividualIsochrones ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs">Einzel-Isochronen ({profiles.length} Orte)</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          showIndividualIsochrones
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {showIndividualIsochrones ? 'Sichtbar' : 'Versteckt'}
                      </span>
                    </div>
                  )}

                  <div
                    onClick={onToggleIntersectionLayer}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      showIntersectionLayer
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-semibold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {showIntersectionLayer ? (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-xs">Gemeinsamer Treffbereich</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        showIntersectionLayer
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {showIntersectionLayer ? 'Sichtbar' : 'Versteckt'}
                    </span>
                  </div>

                  {onUpdateRentalOverlay && (
                    <div className="rounded-xl border border-slate-200 bg-white p-2 transition-all">
                      <div
                        onClick={() =>
                          onUpdateRentalOverlay({
                            enabled: !rentalSettings?.enabled,
                          })
                        }
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Euro
                            className={`w-4 h-4 ${
                              rentalSettings?.enabled ? 'text-purple-600' : 'text-slate-400'
                            }`}
                          />
                          <div>
                            <span className="text-xs font-semibold block text-slate-800">
                              Mietspiegel (München)
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Ø Kaltmiete je Stadtbezirk
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            rentalSettings?.enabled
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {rentalSettings?.enabled ? 'Aktiv' : 'Aus'}
                        </span>
                      </div>

                      {rentalSettings?.enabled && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500 font-medium">
                            Deckkraft: {Math.round((rentalSettings.opacity ?? 0.35) * 100)}%
                          </span>
                          <input
                            type="range"
                            min="0.15"
                            max="0.75"
                            step="0.05"
                            value={rentalSettings.opacity ?? 0.35}
                            onChange={(e) =>
                              onUpdateRentalOverlay({
                                opacity: parseFloat(e.target.value),
                              })
                            }
                            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {onOpenApiKeySettings && (
                <div className="mt-3 pt-2 border-t border-slate-100 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLayerMenu(false);
                      onOpenApiKeySettings();
                    }}
                    className="w-full py-1.5 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/70 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>API-Keys & Einstellungen verwalten</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls Column */}
        <div className="flex flex-col gap-2">
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

          {/* Quick-Toggle: Nur überlagerten Treffbereich anzeigen */}
          {onToggleOnlyIntersection && hasIntersection && (
            <button
              id="btn-toggle-only-intersection"
              type="button"
              onClick={onToggleOnlyIntersection}
              title={
                isOnlyIntersectionActive
                  ? 'Nur überlagerter Treffbereich aktiv (Klicken, um Einzel-Isochronen wieder einzublenden)'
                  : 'Nur überlagerten Treffbereich anzeigen (Einzel-Isochronen der Personen ausblenden)'
              }
              className={`p-2.5 rounded-xl shadow-md border transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer ${
                isOnlyIntersectionActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 ring-2 ring-emerald-400/50'
                  : 'bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80'
              }`}
            >
              <Focus className="w-5 h-5" />
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

          {/* Toggle Intersection Layer */}
          <button
            id="btn-toggle-intersection-layer"
            type="button"
            onClick={onToggleIntersectionLayer}
            title={showIntersectionLayer ? 'Schnittmenge ausblenden' : 'Schnittmenge einblenden'}
            className={`p-2.5 rounded-xl shadow-md border transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer ${
              showIntersectionLayer
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                : 'bg-white/95 hover:bg-white text-slate-500 border-slate-200/80'
            }`}
          >
            {showIntersectionLayer ? (
              <Eye className="w-5 h-5 text-white" />
            ) : (
              <EyeOff className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

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
