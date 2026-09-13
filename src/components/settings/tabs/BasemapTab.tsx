import React from 'react';
import { BasemapPlatform, MapVariant } from '../../../types';
import { Globe, Map as MapIcon, Satellite, Navigation, Train, Check, AlertCircle } from 'lucide-react';

interface BasemapTabProps {
  platform: BasemapPlatform;
  variant: MapVariant;
  onSelectPlatform: (platform: BasemapPlatform) => void;
  onSelectVariant: (variant: MapVariant) => void;
  hasGoogleKey: boolean;
  onOpenKeysTab: () => void;
}

export const BasemapTab: React.FC<BasemapTabProps> = ({
  platform,
  variant,
  onSelectPlatform,
  onSelectVariant,
  hasGoogleKey,
  onOpenKeysTab,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-600 leading-relaxed">
        Hier kannst du zentral zwischen <strong>OpenStreetMap</strong> und <strong>Google Maps</strong> wählen. In beiden Varianten kannst du den <strong>Kartentyp</strong> (Normal, Satellit, Straße, ÖPNV) flexibel festlegen.
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

        <div className="grid grid-cols-2 gap-2.5">
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
              <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  OpenStreetMap
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  100% kostenfrei, Open-Source & ohne Key.
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
              Kostenlos
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
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                <MapIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Google Maps
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Offizielle Google Vektor- & Satellitendaten.
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full shrink-0">
              Google Key
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
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          2. Kartentyp auswählen ({platform === 'google' ? 'Google Maps' : 'OpenStreetMap'})
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Normal */}
          <div
            onClick={() => onSelectVariant('normal')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              variant === 'normal'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    variant === 'normal' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Normal</span>
              </div>
              {variant === 'normal' && <Check className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {platform === 'google'
                ? 'Klassische Google Roadmap mit Standardfarben'
                : 'Standard OpenStreetMap Kartografie'}
            </p>
          </div>

          {/* Satellit */}
          <div
            onClick={() => onSelectVariant('satellite')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              variant === 'satellite'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    variant === 'satellite' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Satellite className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Satellit</span>
              </div>
              {variant === 'satellite' && <Check className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {platform === 'google'
                ? 'Fotorealistische Google Hybrid-Luftbilder mit Straßennamen'
                : 'Hochauflösende weltweite Satelliten-Luftbilder'}
            </p>
          </div>

          {/* Straße */}
          <div
            onClick={() => onSelectVariant('streets')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              variant === 'streets'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    variant === 'streets' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Straße</span>
              </div>
              {variant === 'streets' && <Check className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {platform === 'google'
                ? 'Fokussierte Google Straßenkarte mit Autobahnen & Trassen'
                : 'Detailliertes Straßen- und Verkehrsnetzwerk'}
            </p>
          </div>

          {/* ÖPNV */}
          <div
            onClick={() => onSelectVariant('transit')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              variant === 'transit'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    variant === 'transit' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Train className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">ÖPNV</span>
              </div>
              {variant === 'transit' && <Check className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {platform === 'google'
                ? 'Google TransitLayer mit S-Bahn, U-Bahn, Tram & Bahnhöfen'
                : 'CyclOSM / Transit Layer für Bahn-, Tram- & Busverbindungen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
