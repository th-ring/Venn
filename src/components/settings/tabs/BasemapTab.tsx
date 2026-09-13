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
      <div className="text-xs text-slate-600 leading-relaxed">
        Wähle deinen bevorzugten <strong>Kartenanbieter</strong> und den gewünschten <strong>Kartentyp</strong>. 
        Karten von <em>OpenStreetMap</em>, <em>MemoMaps</em> und <em>CARTO</em> funktionieren sofort und ohne API-Key.
      </div>

      {/* STUFE 1: KARTENDIENST WÄHLEN */}
      <div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>1. Basis-Kartendienst</span>
          {hasGoogleKey && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Google Key aktiv
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Option: OpenStreetMap */}
          <div
            onClick={() => onSelectPlatform('osm')}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
              platform === 'osm'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'osm'}
                onChange={() => onSelectPlatform('osm')}
                className="mt-0.5 text-blue-600 cursor-pointer"
              />
              <div className="p-1.5 bg-slate-100 text-blue-600 rounded-lg shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  OpenStreetMap
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  100% frei, Open-Source & ohne Key.
                </div>
              </div>
            </div>
            <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
              Frei
            </span>
          </div>

          {/* Option: MemoMaps */}
          <div
            onClick={() => onSelectPlatform('memomaps')}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
              platform === 'memomaps' || platform === 'opnv'
                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'memomaps' || platform === 'opnv'}
                onChange={() => onSelectPlatform('memomaps')}
                className="mt-0.5 text-emerald-600 cursor-pointer"
              />
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  MemoMaps
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Reine ÖPNVkarte (Bus & Bahn).
                </div>
              </div>
            </div>
            <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
              Frei
            </span>
          </div>

          {/* Option: CARTO */}
          <div
            onClick={() => onSelectPlatform('carto')}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
              platform === 'carto'
                ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-400/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'carto'}
                onChange={() => onSelectPlatform('carto')}
                className="mt-0.5 text-purple-600 cursor-pointer"
              />
              <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  CARTO
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Ultra-clean (Light & Dark) ohne Key.
                </div>
              </div>
            </div>
            <span className="text-[9px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full shrink-0">
              Frei
            </span>
          </div>

          {/* Option: Google Maps */}
          <div
            onClick={() => onSelectPlatform('google')}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
              platform === 'google'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="modalPlatform"
                checked={platform === 'google'}
                onChange={() => onSelectPlatform('google')}
                className="mt-0.5 text-blue-600 cursor-pointer"
              />
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                <MapIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Google Maps
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Offizielle Google Maps JS API.
                </div>
              </div>
            </div>
            <span className="text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0">
              API-Key
            </span>
          </div>
        </div>

        {platform === 'google' && !hasGoogleKey && (
          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Für Google Maps ist ein API-Key erforderlich.</span>
            </div>
            <button
              type="button"
              onClick={onOpenKeysTab}
              className="text-amber-900 font-bold underline text-xs ml-2 cursor-pointer"
            >
              Jetzt eintragen
            </button>
          </div>
        )}
      </div>

      {/* STUFE 2: KARTENTYP SEPARAT WÄHLEN */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>
            2. Kartentyp auswählen (
            {platform === 'google'
              ? 'Google Maps'
              : platform === 'carto'
              ? 'CARTO'
              : platform === 'memomaps' || platform === 'opnv'
              ? 'MemoMaps'
              : 'OpenStreetMap'}
            )
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
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
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSel ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <VIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{v.label}</span>
                  </div>
                  {isSel && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight pl-8">
                  {v.subLabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* STUFE 3: ZUSATZ-OVERLAYS */}
      {onToggleRailwayOverlay && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            3. Zusatz-Overlays (über Basemap gelegt)
          </div>

          <button
            type="button"
            onClick={onToggleRailwayOverlay}
            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              showRailwayOverlay
                ? 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-300'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Schienennetz-Overlay</span>
                  <span className="text-[9px] font-normal text-amber-800 bg-amber-100 px-1 py-0.2 rounded">
                    OpenRailwayMap
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Detailliertes Gleisnetz (S-Bahn, U-Bahn, Tram, Bahnhöfe) transparent über die Karte legen
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                showRailwayOverlay
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-slate-100 text-slate-500'
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
