import React from 'react';
import { BasemapPlatform, MapVariant } from '../../../types';
import {
  OSM_VARIANTS,
  MEMOMAPS_VARIANTS,
  CARTO_VARIANTS,
  GOOGLE_VARIANTS,
} from '../../map/MapLayerControls';
import { Globe, Map as MapIcon, Palette, Train, Check, AlertCircle } from 'lucide-react';

interface BasemapTabProps {
  platform: BasemapPlatform;
  variant: MapVariant;
  onSelectPlatform: (platform: BasemapPlatform) => void;
  onSelectVariant: (variant: MapVariant) => void;
  hasGoogleKey: boolean;
  onOpenKeysTab: () => void;
  showRailwayOverlay?: boolean;
  onToggleRailwayOverlay?: () => void;
}

export const BasemapTab: React.FC<BasemapTabProps> = ({
  platform,
  variant,
  onSelectPlatform,
  onSelectVariant,
  hasGoogleKey,
  onOpenKeysTab,
  showRailwayOverlay = false,
  onToggleRailwayOverlay,
}) => {
  const currentVariants =
    platform === 'google'
      ? GOOGLE_VARIANTS
      : platform === 'carto'
      ? CARTO_VARIANTS
      : platform === 'memomaps' || platform === 'opnv'
      ? MEMOMAPS_VARIANTS
      : OSM_VARIANTS;

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-600 dark:text-[#9aa0a6] leading-relaxed">
        Wähle deinen bevorzugten <strong>Kartenanbieter</strong> und den gewünschten <strong>Kartentyp</strong>.{' '}
        Karten von <em>OpenStreetMap</em>, <em>MemoMaps</em> und <em>CARTO</em> funktionieren sofort und ohne API-Key.
      </div>

      {/* Basis-Kartendienst */}
      <div>
        <div className="text-xs font-medium text-slate-600 dark:text-[#9aa0a6] mb-2 flex items-center justify-between">
          <span>Basis-Kartendienst</span>
          {hasGoogleKey && (
            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              Google Key aktiv
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Option: OpenStreetMap */}
          <div
            onClick={() => onSelectPlatform('osm')}
            className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start justify-between ${
              platform === 'osm'
                ? 'border-2 border-blue-600 dark:border-[#8ab4f8] bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                : 'border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'osm'}
                onChange={() => onSelectPlatform('osm')}
                className="mt-0.5 text-blue-600 dark:text-[#8ab4f8] cursor-pointer"
              />
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] rounded-lg shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
                  OpenStreetMap
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-snug">
                  Klassische Open-Source-Kartografie.
                </div>
              </div>
            </div>
          </div>

          {/* Option: MemoMaps */}
          <div
            onClick={() => onSelectPlatform('memomaps')}
            className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start justify-between ${
              platform === 'memomaps' || platform === 'opnv'
                ? 'border-blue-600 dark:border-[#8ab4f8] bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500/40 shadow-xs'
                : 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'memomaps' || platform === 'opnv'}
                onChange={() => onSelectPlatform('memomaps')}
                className="mt-0.5 text-blue-600 dark:text-[#8ab4f8] cursor-pointer"
              />
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] rounded-lg shrink-0">
                <Train className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
                  MemoMaps
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-snug">
                  Fokussiertes ÖPNV-Liniennetz (Bus & Bahn).
                </div>
              </div>
            </div>
          </div>

          {/* Option: CARTO */}
          <div
            onClick={() => onSelectPlatform('carto')}
            className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start justify-between ${
              platform === 'carto'
                ? 'border-blue-600 dark:border-[#8ab4f8] bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500/40 shadow-xs'
                : 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'carto'}
                onChange={() => onSelectPlatform('carto')}
                className="mt-0.5 text-blue-600 dark:text-[#8ab4f8] cursor-pointer"
              />
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] rounded-lg shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
                  CARTO
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-snug">
                  Minimalistischer Datenfokus (Hell & Dunkel).
                </div>
              </div>
            </div>
          </div>

          {/* Option: Google Maps */}
          <div
            onClick={() => onSelectPlatform('google')}
            className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start justify-between gap-2 ${
              platform === 'google'
                ? 'border-blue-600 dark:border-[#8ab4f8] bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500/40 shadow-xs'
                : 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'google'}
                onChange={() => onSelectPlatform('google')}
                className="mt-0.5 text-blue-600 dark:text-[#8ab4f8] cursor-pointer"
              />
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] rounded-lg shrink-0">
                <MapIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
                  Google Maps
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-snug">
                  Google Maps JavaScript API.
                </div>
              </div>
            </div>
            {!hasGoogleKey && (
              <span className="text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
                Key nötig
              </span>
            )}
          </div>
        </div>

        {platform === 'google' && !hasGoogleKey && (
          <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Für Google Maps ist ein API-Key erforderlich.</span>
            </div>
            <button
              type="button"
              onClick={onOpenKeysTab}
              className="text-amber-900 dark:text-amber-300 font-bold underline text-xs ml-2 cursor-pointer"
            >
              Jetzt eintragen
            </button>
          </div>
        )}
      </div>

      {/* Kartentyp */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#3c4043]">
        <div className="text-xs font-medium text-slate-600 dark:text-[#9aa0a6] mb-2 flex items-center justify-between">
          <span>
            Kartentyp ({platform === 'google' ? 'Google Maps' : platform === 'carto' ? 'CARTO' : platform === 'memomaps' || platform === 'opnv' ? 'MemoMaps' : 'OpenStreetMap'})
          </span>
          <span className="text-[10px] text-slate-400 dark:text-[#747775] font-normal">
            {currentVariants.length} Varianten verfügbar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentVariants.map((v) => {
            const VIcon = v.icon;
            const isSel = variant === v.id;
            return (
              <div
                key={v.id}
                onClick={() => onSelectVariant(v.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSel
                    ? 'border-2 border-blue-600 dark:border-[#8ab4f8] bg-blue-50/50 dark:bg-blue-950/40'
                    : 'border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSel
                          ? 'bg-blue-600 dark:bg-[#8ab4f8] text-white dark:text-[#131314]'
                          : 'bg-slate-100 dark:bg-[#303134] text-slate-600 dark:text-[#9aa0a6]'
                      }`}
                    >
                      <VIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">{v.label}</span>
                  </div>
                  {isSel && <Check className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8]" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] leading-tight pl-8">
                  {v.subLabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zusatz-Overlays */}
      {onToggleRailwayOverlay && (
        <div className="pt-2 border-t border-slate-100 dark:border-[#3c4043]">
          <div className="text-xs font-medium text-slate-600 dark:text-[#9aa0a6] mb-2">
            Zusätzliche Ebenen
          </div>

          <button
            type="button"
            onClick={onToggleRailwayOverlay}
            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              showRailwayOverlay
                ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 dark:border-amber-400 text-amber-950 dark:text-amber-200'
                : 'bg-white dark:bg-[#282a2c] border border-slate-200 dark:border-[#3c4043] text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-50 dark:hover:bg-[#303134]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Schienennetz-Overlay</span>
                  <span className="text-[9px] font-normal text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1 py-0.2 rounded">
                    OpenRailwayMap
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">
                  Detailliertes Gleisnetz (S-Bahn, U-Bahn, Tram, Bahnhöfe) transparent über die Karte legen
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                showRailwayOverlay
                  ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-100 dark:bg-[#303134] text-slate-500 dark:text-[#9aa0a6]'
              }`}
            >
              {showRailwayOverlay ? 'Aktiv' : 'Aus'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
