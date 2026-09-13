import React, { useState } from 'react';
import {
  LayerId,
  PoiIconSettings,
  HeatmapSettings,
  RentalOverlaySettings,
  PersonProfile,
  BasemapPlatform,
  MapVariant,
} from '../../types';
import {
  MAP_VARIANTS,
  OSM_VARIANTS,
  MEMOMAPS_VARIANTS,
  CARTO_VARIANTS,
  GOOGLE_VARIANTS,
} from './MapLayerControls';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  X,
  MapPin,
  Users,
  Train,
  Focus,
  Flame,
  Euro,
  Map as MapIcon,
  Globe,
  Home,
  Palette,
} from 'lucide-react';

interface LayerManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layerOrder: LayerId[];
  onReorderLayer: (fromIndex: number, toIndex: number) => void;
  onResetLayerOrder: () => void;
  hiddenLayers: Set<LayerId>;
  onToggleLayerVisibility: (layerId: LayerId) => void;
  profiles: PersonProfile[];
  onToggleProfileVisibility?: (id: string) => void;
  hasIntersection: boolean;
  showIntersectionLayer: boolean;
  onToggleIntersectionLayer: () => void;
  showIndividualIsochrones: boolean;
  onToggleIndividualIsochrones: () => void;
  showOnlyIntersection: boolean;
  onToggleOnlyIntersection: () => void;
  onlyResidential: boolean;
  onToggleOnlyResidential: () => void;
  heatmapSettings?: HeatmapSettings;
  onUpdateHeatmap?: (settings: Partial<HeatmapSettings>) => void;
  rentalSettings?: RentalOverlaySettings;
  onUpdateRentalOverlay?: (settings: Partial<RentalOverlaySettings>) => void;
  poiIconSettings: PoiIconSettings;
  onUpdatePoiIcons: (settings: Partial<PoiIconSettings>) => void;
  activePlatform: BasemapPlatform;
  activeVariant: MapVariant;
  onSelectPlatform: (platform: BasemapPlatform) => void;
  onSelectVariant: (variant: MapVariant) => void;
  hasGoogleMapsKey: boolean;
  hasOrsKey: boolean;
  onOpenApiKeySettings?: () => void;
  intersectionAreaKm2?: number;
  showRailwayOverlay?: boolean;
  onToggleRailwayOverlay?: () => void;
}

export const LayerManagerPanel: React.FC<LayerManagerPanelProps> = ({
  isOpen,
  onClose,
  layerOrder,
  onReorderLayer,
  onResetLayerOrder,
  hiddenLayers,
  onToggleLayerVisibility,
  profiles,
  onToggleProfileVisibility,
  hasIntersection,
  showIntersectionLayer,
  onToggleIntersectionLayer,
  showIndividualIsochrones,
  onToggleIndividualIsochrones,
  showOnlyIntersection,
  onToggleOnlyIntersection,
  onlyResidential,
  onToggleOnlyResidential,
  heatmapSettings,
  onUpdateHeatmap,
  rentalSettings,
  onUpdateRentalOverlay,
  poiIconSettings,
  onUpdatePoiIcons,
  activePlatform,
  activeVariant,
  onSelectPlatform,
  onSelectVariant,
  hasGoogleMapsKey,
  onOpenApiKeySettings,
  intersectionAreaKm2,
  showRailwayOverlay = false,
  onToggleRailwayOverlay,
}) => {
  const [expandedLayer, setExpandedLayer] = useState<LayerId | null>('heatmap');

  if (!isOpen) return null;

  const toggleExpand = (id: LayerId) => {
    setExpandedLayer((prev) => (prev === id ? null : id));
  };

  const getLayerMeta = (id: LayerId) => {
    switch (id) {
      case 'inspection':
        return {
          title: 'Prüfpunkt & Fahrzeiten',
          subtitle: 'Klick-Inspektor für Wohnortprüfung',
          icon: MapPin,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          canMove: false,
        };
      case 'persons':
        return {
          title: 'Referenzorte (Personen-Pins)',
          subtitle: `${profiles.filter((p) => p.visible).length} von ${profiles.length} Pins sichtbar`,
          icon: Users,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          canMove: true,
        };
      case 'poi_icons':
        return {
          title: 'Haltestellen & Knoten (Icons)',
          subtitle: poiIconSettings.visible
            ? [
                poiIconSettings.showUbahn ? 'U-Bahn' : '',
                poiIconSettings.showSbahn ? 'S-Bahn' : '',
                poiIconSettings.showHighway ? 'Autobahn' : '',
              ]
                .filter(Boolean)
                .join(', ') || 'Keine ausgewählt'
            : 'Icons ausgeblendet',
          icon: Train,
          color: 'text-sky-600 bg-sky-50 border-sky-200',
          canMove: true,
        };
      case 'intersection':
        return {
          title: 'Gemeinsamer Treffbereich',
          subtitle: hasIntersection
            ? `${onlyResidential ? 'Wohnbereich' : 'Schnittmenge'} (~${intersectionAreaKm2 ?? 0} km²)`
            : 'Keine Schnittmenge',
          icon: Focus,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          canMove: true,
        };
      case 'heatmap': {
        const mode = heatmapSettings?.mode || 'none';
        const modeName =
          mode === 'none'
            ? 'Inaktiv'
            : mode === 'ubahn'
            ? 'U-Bahn Nähe'
            : mode === 'sbahn'
            ? 'S-Bahn Nähe'
            : 'Autobahn-Knoten';
        return {
          title: 'Prioritäts-Heatmap',
          subtitle: modeName,
          icon: Flame,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          canMove: true,
        };
      }
      case 'isochrones':
        return {
          title: 'Einzel-Isochronen',
          subtitle: `${profiles.length} Fahrzeit-Polygone`,
          icon: Layers,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          canMove: true,
        };
      case 'rental':
        return {
          title: 'Mietspiegel München',
          subtitle: rentalSettings?.enabled
            ? `Ø Kaltmiete (${Math.round((rentalSettings.opacity ?? 0.35) * 100)}% Deckkraft)`
            : 'Mietdaten inaktiv',
          icon: Euro,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          canMove: true,
        };
      case 'basemap': {
        const platformLabel =
          activePlatform === 'google'
            ? 'Google Maps'
            : activePlatform === 'carto'
            ? 'CARTO'
            : activePlatform === 'memomaps' || activePlatform === 'opnv'
            ? 'MemoMaps'
            : 'OpenStreetMap';

        const currentVariants =
          activePlatform === 'google'
            ? GOOGLE_VARIANTS
            : activePlatform === 'carto'
            ? CARTO_VARIANTS
            : activePlatform === 'memomaps' || activePlatform === 'opnv'
            ? MEMOMAPS_VARIANTS
            : OSM_VARIANTS;

        const variantLabel =
          currentVariants.find((v) => v.id === activeVariant)?.label || 'Standard';

        const railwaySuffix = showRailwayOverlay ? ' + Bahnnetz' : '';

        return {
          title: 'Hintergrundkarte',
          subtitle: `${platformLabel} • ${variantLabel}${railwaySuffix}`,
          icon: MapIcon,
          color: 'text-slate-600 bg-slate-100 border-slate-200',
          canMove: false,
        };
      }
    }
  };

  const isLayerVisible = (id: LayerId) => {
    if (hiddenLayers.has(id)) return false;
    if (id === 'intersection') return showIntersectionLayer;
    if (id === 'isochrones') return showIndividualIsochrones;
    if (id === 'rental') return !!rentalSettings?.enabled;
    if (id === 'poi_icons') return poiIconSettings.visible;
    return true;
  };

  const handleToggleVisibility = (id: LayerId) => {
    if (id === 'intersection') {
      onToggleIntersectionLayer();
    } else if (id === 'isochrones') {
      onToggleIndividualIsochrones();
    } else if (id === 'rental') {
      onUpdateRentalOverlay?.({ enabled: !rentalSettings?.enabled });
    } else if (id === 'poi_icons') {
      onUpdatePoiIcons({ visible: !poiIconSettings.visible });
    } else {
      onToggleLayerVisibility(id);
    }
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 z-40 w-88 sm:w-96 bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-[#3c4043] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-[#3c4043] bg-white/80 dark:bg-[#1e1f20]/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-600 dark:bg-[#8ab4f8] text-white dark:text-[#131314] shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3] leading-tight">
              Karten-Ebenen & Filter
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">
              Reihenfolge (Z-Index), Sichtbarkeit & Feineinstellungen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onResetLayerOrder}
            title="Standard-Schichtenreihenfolge wiederherstellen"
            className="p-1.5 text-slate-400 dark:text-[#9aa0a6] hover:text-slate-700 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Schließen"
            className="p-1.5 text-slate-400 dark:text-[#9aa0a6] hover:text-slate-700 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Notice about Z-Order */}
      <div className="px-3.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 text-[10px] text-blue-900 dark:text-[#8ab4f8] flex items-center justify-between">
        <span className="font-medium">Obere Ebenen liegen im Vordergrund</span>
        <span className="text-[9px] text-blue-700 dark:text-[#a8c7fa] font-semibold">Hover-Priorität</span>
      </div>

      {/* Scrollable Layer Stack List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {layerOrder.map((layerId, index) => {
          const meta = getLayerMeta(layerId);
          const Icon = meta.icon;
          const isVisible = isLayerVisible(layerId);
          const isExpanded = expandedLayer === layerId;
          const canMoveUp = meta.canMove && index > 1; // Don't move above inspection pin
          const canMoveDown = meta.canMove && index < layerOrder.length - 2; // Don't move below basemap

          return (
            <div
              key={layerId}
              className={`rounded-xl border transition-all ${
                isVisible
                  ? 'bg-white dark:bg-[#282a2c] border-slate-200/90 dark:border-[#3c4043] shadow-2xs'
                  : 'bg-slate-50/70 dark:bg-[#131314]/70 border-slate-200/60 dark:border-[#3c4043]/60 opacity-60'
              }`}
            >
              {/* Layer Title Row */}
              <div className="p-2.5 flex items-center justify-between gap-2 select-none">
                {/* Reorder Buttons (Up / Down) */}
                <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                  {meta.canMove ? (
                    <>
                      <button
                        type="button"
                        disabled={!canMoveUp}
                        onClick={() => canMoveUp && onReorderLayer(index, index - 1)}
                        title="Nach oben verschieben (höhere Ebene)"
                        className={`p-0.5 rounded transition-colors ${
                          canMoveUp
                            ? 'text-slate-400 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#3c4043] cursor-pointer'
                            : 'text-slate-200 dark:text-[#3c4043] cursor-not-allowed'
                        }`}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveDown}
                        onClick={() => canMoveDown && onReorderLayer(index, index + 1)}
                        title="Nach unten verschieben (tiefere Ebene)"
                        className={`p-0.5 rounded transition-colors ${
                          canMoveDown
                            ? 'text-slate-400 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#3c4043] cursor-pointer'
                            : 'text-slate-200 dark:text-[#3c4043] cursor-not-allowed'
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-3.5 h-7" />
                  )}
                </div>

                {/* Layer Icon & Labels */}
                <div
                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleExpand(layerId)}
                >
                  <div
                    className={`p-1.5 rounded-lg border shrink-0 ${meta.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3] truncate">
                      {meta.title}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] truncate">
                      {meta.subtitle}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Visibility & Expand Settings */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(layerId)}
                    title={isVisible ? 'Ebene ausblenden' : 'Ebene einblenden'}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isVisible
                        ? 'text-blue-600 dark:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#3c4043]'
                        : 'text-slate-400 dark:text-[#9aa0a6] hover:bg-slate-200/60 dark:hover:bg-[#3c4043]'
                    }`}
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(layerId)}
                    title={isExpanded ? 'Einstellungen einklappen' : 'Einstellungen aufklappen'}
                    className="p-1.5 text-slate-400 dark:text-[#9aa0a6] hover:text-slate-700 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-lg transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Layer-Specific Settings Pane */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-[#3c4043] bg-slate-50/50 dark:bg-[#131314]/50 rounded-b-xl text-xs space-y-2.5 animate-in fade-in duration-150">
                  {/* 1. HEATMAP SETTINGS */}
                  {layerId === 'heatmap' && onUpdateHeatmap && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-[#e3e3e3]">
                        <span>Ziel-Infrastruktur</span>
                      </div>

                      {/* Mode Pills */}
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            { id: 'none', label: 'Aus' },
                            { id: 'ubahn', label: 'U-Bahn' },
                            { id: 'sbahn', label: 'S-Bahn' },
                            { id: 'highway', label: 'Autobahn' },
                          ] as const
                        ).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => onUpdateHeatmap({ mode: m.id })}
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                              (heatmapSettings?.mode || 'none') === m.id
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-white dark:bg-[#1e1f20] text-slate-600 dark:text-[#c4c7c5] border border-slate-200 dark:border-[#3c4043] hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {heatmapSettings && heatmapSettings.mode !== 'none' && (
                        <>
                          {/* Radius Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-[#9aa0a6]">
                              <span>Maximaler Fußweg / Puffer-Radius:</span>
                              <span className="font-bold text-amber-700 dark:text-amber-400">
                                {heatmapSettings.radiusKm || 1.5} km
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="4.0"
                              step="0.25"
                              value={heatmapSettings.radiusKm || 1.5}
                              onChange={(e) =>
                                onUpdateHeatmap({ radiusKm: parseFloat(e.target.value) })
                              }
                              className="w-full h-1.5 bg-slate-200 dark:bg-[#3c4043] rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                          </div>

                          {/* Intensity Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-[#9aa0a6]">
                              <span>Heatmap-Deckkraft:</span>
                              <span className="font-bold text-amber-700 dark:text-amber-400">
                                {Math.round((heatmapSettings.intensity ?? 0.65) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="1.0"
                              step="0.05"
                              value={heatmapSettings.intensity ?? 0.65}
                              onChange={(e) =>
                                onUpdateHeatmap({ intensity: parseFloat(e.target.value) })
                              }
                              className="w-full h-1.5 bg-slate-200 dark:bg-[#3c4043] rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* 2. POI ICONS SETTINGS */}
                  {layerId === 'poi_icons' && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-[#c4c7c5]">
                        Angezeigte Haltestellen- & Knoten-Typen
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePoiIcons({ showUbahn: !poiIconSettings.showUbahn })
                          }
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            poiIconSettings.showUbahn
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300'
                              : 'bg-white dark:bg-[#1e1f20] border-slate-200 dark:border-[#3c4043] text-slate-400 dark:text-[#9aa0a6]'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span>U-Bahn (U)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePoiIcons({ showSbahn: !poiIconSettings.showSbahn })
                          }
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            poiIconSettings.showSbahn
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                              : 'bg-white dark:bg-[#1e1f20] border-slate-200 dark:border-[#3c4043] text-slate-400 dark:text-[#9aa0a6]'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span>S-Bahn (S)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePoiIcons({ showHighway: !poiIconSettings.showHighway })
                          }
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            poiIconSettings.showHighway
                              ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300'
                              : 'bg-white dark:bg-[#1e1f20] border-slate-200 dark:border-[#3c4043] text-slate-400 dark:text-[#9aa0a6]'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-orange-600" />
                          <span>Autobahn (A)</span>
                        </button>
                      </div>

                      {poiIconSettings.showHighway && (
                        <div className="pt-2 pb-1 border-t border-slate-100 dark:border-[#3c4043] space-y-1.5 pl-0.5">
                          <label className="flex items-center gap-2 text-[10px] text-slate-700 dark:text-[#c4c7c5] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={poiIconSettings.showHighwayRamps !== false}
                              onChange={(e) =>
                                onUpdatePoiIcons({
                                  showHighwayRamps: e.target.checked,
                                })
                              }
                              className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                            <span>🚗 Rampen als Straßenlinien</span>
                          </label>

                          <label className="flex items-center gap-2 text-[10px] text-slate-700 dark:text-[#c4c7c5] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={poiIconSettings.showHighwayAreas !== false}
                              onChange={(e) =>
                                onUpdatePoiIcons({
                                  showHighwayAreas: e.target.checked,
                                })
                              }
                              className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                            <span>⭕ Knotenpunkte umkreisen</span>
                          </label>
                        </div>
                      )}

                      <label className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-[#9aa0a6] cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={poiIconSettings.onlyWithinIntersection}
                          onChange={(e) =>
                            onUpdatePoiIcons({
                              onlyWithinIntersection: e.target.checked,
                            })
                          }
                          className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>Nur Knoten im oder nahe am Treffbereich anzeigen</span>
                      </label>
                    </div>
                  )}

                  {/* 3. INTERSECTION SETTINGS */}
                  {layerId === 'intersection' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-[#c4c7c5]">
                        <span>Treffbereichs-Modus</span>
                        {intersectionAreaKm2 !== undefined && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            ca. {intersectionAreaKm2} km²
                          </span>
                        )}
                      </div>

                      {/* Residential Filter Toggle */}
                      <button
                        type="button"
                        onClick={onToggleOnlyResidential}
                        className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          onlyResidential
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-300 dark:ring-emerald-700'
                            : 'bg-white dark:bg-[#1e1f20] border-slate-200 dark:border-[#3c4043] text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-50 dark:hover:bg-[#282a2c]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-emerald-600" />
                          <div>
                            <div className="text-[11px] font-bold">Auf Wohnbereiche begrenzen</div>
                            <div className="text-[9px] text-slate-500 dark:text-[#9aa0a6]">
                              Filtert Forste, Seen & reine Industriegebiete aus
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            onlyResidential ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200' : 'bg-slate-100 dark:bg-[#282a2c] text-slate-500 dark:text-[#9aa0a6]'
                          }`}
                        >
                          {onlyResidential ? 'Aktiv' : 'Aus'}
                        </span>
                      </button>

                      {/* Only Intersection Toggle */}
                      <button
                        type="button"
                        onClick={onToggleOnlyIntersection}
                        className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          showOnlyIntersection
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-semibold ring-1 ring-blue-300 dark:ring-blue-700'
                            : 'bg-white dark:bg-[#1e1f20] border-slate-200 dark:border-[#3c4043] text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-50 dark:hover:bg-[#282a2c]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Focus className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-[11px] font-bold">Fokus: Nur Treffbereich</div>
                            <div className="text-[9px] text-slate-500 dark:text-[#9aa0a6]">
                              Blendet Einzel-Isochronen vorübergehend aus
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            showOnlyIntersection ? 'bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200' : 'bg-slate-100 dark:bg-[#282a2c] text-slate-500 dark:text-[#9aa0a6]'
                          }`}
                        >
                          {showOnlyIntersection ? 'Aktiv' : 'Aus'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* 4. RENTAL SETTINGS */}
                  {layerId === 'rental' && onUpdateRentalOverlay && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-[#c4c7c5]">
                        <span>Mietspiegel München (Open Data)</span>
                        <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">
                          Ø {Math.round((rentalSettings?.opacity ?? 0.35) * 100)}% Deckkraft
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0.15"
                        max="0.75"
                        step="0.05"
                        value={rentalSettings?.opacity ?? 0.35}
                        onChange={(e) =>
                          onUpdateRentalOverlay({ opacity: parseFloat(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-200 dark:bg-[#3c4043] rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />

                      <div className="p-2 bg-white dark:bg-[#1e1f20] rounded-lg border border-slate-200 dark:border-[#3c4043] text-[10px] text-slate-600 dark:text-[#9aa0a6] flex items-center justify-between">
                        <span>Datensatz:</span>
                        <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">25 Münchner Stadtbezirke</span>
                      </div>
                    </div>
                  )}

                  {/* 5. ISOCHRONES (INDIVIDUAL) */}
                  {layerId === 'isochrones' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-[#c4c7c5] mb-1">
                        Sichtbarkeit je Person ({profiles.length})
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {profiles.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => onToggleProfileVisibility?.(p.id)}
                            className="flex items-center justify-between p-1.5 bg-white dark:bg-[#1e1f20] rounded-lg border border-slate-200 dark:border-[#3c4043] hover:bg-slate-50 dark:hover:bg-[#282a2c] cursor-pointer"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="font-medium text-slate-800 dark:text-[#e3e3e3] truncate">
                                {p.name}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-[#9aa0a6] shrink-0 font-medium">
                              {p.travelTimeMinutes} Min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. PERSONS PINS */}
                  {layerId === 'persons' && (
                    <div className="p-2 bg-white dark:bg-[#1e1f20] rounded-lg border border-slate-200 dark:border-[#3c4043] text-[10px] text-slate-600 dark:text-[#9aa0a6] space-y-1">
                      <p className="font-medium text-slate-800 dark:text-[#e3e3e3]">
                        📍 Draggable Pins auf der Karte
                      </p>
                      <p className="text-slate-500 dark:text-[#9aa0a6]">
                        Jeder Pin kann per Drag & Drop verschoben werden, um sofort eine neue Isochrone zu berechnen.
                      </p>
                    </div>
                  )}

                  {/* 7. INSPECTION PIN */}
                  {layerId === 'inspection' && (
                    <div className="p-2 bg-white dark:bg-[#1e1f20] rounded-lg border border-slate-200 dark:border-[#3c4043] text-[10px] text-slate-600 dark:text-[#9aa0a6] space-y-1">
                      <p className="font-medium text-slate-800 dark:text-[#e3e3e3]">
                        🎯 Klick-Inspektor für jeden Ort
                      </p>
                      <p className="text-slate-500 dark:text-[#9aa0a6]">
                        Klicke an eine beliebige Stelle auf der Karte, um die exakten Fahrzeiten aller Personen und die Kaltmiete dort anzuzeigen.
                      </p>
                    </div>
                  )}

                  {/* 8. BASEMAP SETTINGS */}
                  {layerId === 'basemap' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-[#c4c7c5]">
                        <span>Anbieter (Hintergrundkarte)</span>
                        <span className="text-[9px] text-slate-400 dark:text-[#9aa0a6] font-normal">
                          {activePlatform === 'google' ? 'Maps JS API' : '100% Kostenlos'}
                        </span>
                      </div>

                      {/* 4-way Provider Tabs */}
                      <div className="grid grid-cols-4 gap-1 bg-slate-200/70 dark:bg-[#131314] p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => onSelectPlatform('osm')}
                          className={`py-1.5 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            activePlatform === 'osm'
                              ? 'bg-white dark:bg-[#282a2c] text-blue-900 dark:text-blue-300 shadow-2xs'
                              : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
                          }`}
                        >
                          <Globe className="w-3 h-3 shrink-0 text-blue-600" />
                          <span className="truncate">OSM</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectPlatform('memomaps')}
                          className={`py-1.5 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            activePlatform === 'memomaps' || activePlatform === 'opnv'
                              ? 'bg-white dark:bg-[#282a2c] text-emerald-900 dark:text-emerald-300 shadow-2xs'
                              : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
                          }`}
                        >
                          <Train className="w-3 h-3 shrink-0 text-emerald-600" />
                          <span className="truncate">MemoMaps</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectPlatform('carto')}
                          className={`py-1.5 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            activePlatform === 'carto'
                              ? 'bg-white dark:bg-[#282a2c] text-purple-900 dark:text-purple-300 shadow-2xs'
                              : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
                          }`}
                        >
                          <Palette className="w-3 h-3 shrink-0 text-purple-600" />
                          <span className="truncate">CARTO</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectPlatform('google')}
                          className={`py-1.5 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            activePlatform === 'google'
                              ? 'bg-white dark:bg-[#282a2c] text-blue-900 dark:text-blue-300 shadow-2xs'
                              : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
                          }`}
                        >
                          <MapIcon className="w-3 h-3 shrink-0 text-amber-600" />
                          <span className="truncate">Google</span>
                        </button>
                      </div>

                      {/* Map Variant Selection tailored to activePlatform */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#9aa0a6] font-medium">
                          <span>
                            Optionen für{' '}
                            <strong>
                              {activePlatform === 'google'
                                ? 'Google Maps'
                                : activePlatform === 'carto'
                                ? 'CARTO'
                                : activePlatform === 'memomaps' || activePlatform === 'opnv'
                                ? 'MemoMaps (ÖPNV)'
                                : 'OpenStreetMap'}
                            </strong>
                          </span>
                          {activePlatform !== 'google' && (
                            <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-800">
                              Ohne API-Key
                            </span>
                          )}
                        </div>

                        <div className={`grid ${activePlatform === 'memomaps' || activePlatform === 'opnv' ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
                          {(activePlatform === 'google'
                            ? GOOGLE_VARIANTS
                            : activePlatform === 'carto'
                            ? CARTO_VARIANTS
                            : activePlatform === 'memomaps' || activePlatform === 'opnv'
                            ? MEMOMAPS_VARIANTS
                            : OSM_VARIANTS
                          ).map((v) => {
                            const VIcon = v.icon;
                            const isSel = activeVariant === v.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => onSelectVariant(v.id)}
                                title={v.subLabel}
                                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSel
                                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 font-bold ring-1 ring-blue-300 dark:ring-blue-800'
                                    : 'bg-white dark:bg-[#1e1f20] border-slate-200 dark:border-[#3c4043] text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-50 dark:hover:bg-[#282a2c]'
                                }`}
                              >
                                <VIcon className="w-3 h-3 shrink-0 text-slate-600 dark:text-[#9aa0a6]" />
                                <span className="text-[10px] truncate">{v.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* OpenRailwayMap Overlay Toggle */}
                      {onToggleRailwayOverlay && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-[#3c4043]">
                          <button
                            type="button"
                            onClick={onToggleRailwayOverlay}
                            className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                              showRailwayOverlay
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 ring-1 ring-amber-300 dark:ring-amber-700'
                                : 'bg-white dark:bg-[#1e1f20] border-slate-200 dark:border-[#3c4043] text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-50 dark:hover:bg-[#282a2c]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Train className="w-4 h-4 text-amber-600 shrink-0" />
                              <div>
                                <div className="text-[11px] font-bold flex items-center gap-1.5">
                                  <span>Schienennetz-Overlay</span>
                                  <span className="text-[9px] font-normal text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1 py-0.2 rounded">
                                    OpenRailwayMap
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-500 dark:text-[#9aa0a6]">
                                  Gleise, S-/U-Bahn & Tram über jede Basemap legen
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                showRailwayOverlay
                                  ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                                  : 'bg-slate-100 dark:bg-[#282a2c] text-slate-500 dark:text-[#9aa0a6]'
                              }`}
                            >
                              {showRailwayOverlay ? 'Aktiv' : 'Aus'}
                            </span>
                          </button>
                        </div>
                      )}

                      {activePlatform === 'google' && !hasGoogleMapsKey && onOpenApiKeySettings && (
                        <div className="pt-1 flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                          <span>Google Key fehlt</span>
                          <button
                            type="button"
                            onClick={onOpenApiKeySettings}
                            className="underline font-bold text-amber-900 dark:text-amber-200 cursor-pointer"
                          >
                            Eintragen
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info bar */}
      <div className="px-3.5 py-2 border-t border-slate-200/80 dark:border-[#3c4043] bg-white/90 dark:bg-[#1e1f20]/90 text-[10px] text-slate-500 dark:text-[#9aa0a6] flex items-center justify-between shrink-0">
        <span>Karten-Schichten frei sortierbar</span>
        {onOpenApiKeySettings && (
          <button
            type="button"
            onClick={onOpenApiKeySettings}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold cursor-pointer"
          >
            Einstellungen ⚙
          </button>
        )}
      </div>
    </div>
  );
};
