import React from 'react';
import { PolygonFidelity, IsochroneOptions } from '../../../types';
import {
  IsochroneProvider,
  hasGoogleMapsApiKey,
  hasOrsApiKey,
} from '../../../services/isochroneEngine';
import { ExternalLink } from 'lucide-react';

interface IsochroneEngineTabProps {
  activeProvider: IsochroneProvider;
  onSelectProvider: (provider: IsochroneProvider) => void;
  options: IsochroneOptions;
  onSelectFidelity: (fidelity: PolygonFidelity) => void;
  onToggleOption: (key: 'liveTraffic' | 'enableSmoothing' | 'fillHoles') => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
}

export const IsochroneEngineTab: React.FC<IsochroneEngineTabProps> = ({
  activeProvider,
  onSelectProvider,
  options,
  onSelectFidelity,
  onToggleOption,
  showOnlyIntersection,
  onToggleOnlyIntersection,
}) => {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-600 dark:text-[#9aa0a6] leading-relaxed">
        Wähle, welche Berechnungs-Engine die Erreichbarkeits-Polygone (Fahrzeit-Zonen) berechnen soll.
      </div>

      {/* Option 1: Google Maps Isochrones API */}
      <div
        onClick={() => onSelectProvider('google')}
        className={`p-3 rounded-xl border cursor-pointer transition-all ${
          activeProvider === 'google'
            ? 'border-blue-500 dark:border-[#8ab4f8] bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-400 dark:ring-blue-500/50'
            : 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="provider"
              checked={activeProvider === 'google'}
              onChange={() => onSelectProvider('google')}
              className="text-blue-600 dark:text-[#8ab4f8]"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3]">
                Google Maps Isochrones API
              </span>
              <span className="ml-2 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                Public Preview
              </span>
              {hasGoogleMapsApiKey() ? (
                <span className="ml-1.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                  Aktiv
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] font-semibold bg-slate-100 dark:bg-[#303134] text-slate-600 dark:text-[#9aa0a6] px-1.5 py-0.5 rounded-full">
                  Nicht konfiguriert
                </span>
              )}
            </div>
          </div>
          <a
            href="https://developers.google.com/maps/documentation/isochrones"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Doku</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-[#9aa0a6] mt-1 pl-5 leading-relaxed">
          Offizielle Google Maps Erreichbarkeits-Polygone für <strong>Pkw, Fahrrad und Fußwege</strong>.
          <span className="text-slate-500 dark:text-[#9aa0a6] block mt-0.5">
            (Hinweis: Für ÖPNV wird die MVV/MVG-Haltestellenmatrix genutzt, da Google Maps keine ÖPNV-Isochronen bereitstellt.)
          </span>
        </p>
      </div>

      {/* Option 2: Integrierte Offline Simulation */}
      <div
        onClick={() => onSelectProvider('calibrated')}
        className={`p-3 rounded-xl border cursor-pointer transition-all ${
          activeProvider === 'calibrated'
            ? 'border-blue-500 dark:border-[#8ab4f8] bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-400 dark:ring-blue-500/50'
            : 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="provider"
            checked={activeProvider === 'calibrated'}
            onChange={() => onSelectProvider('calibrated')}
            className="text-blue-600 dark:text-[#8ab4f8]"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3]">
              Integrierte Multimodale Engine (Standard)
            </span>
            <span className="ml-2 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
              Lokal • Ohne API-Key
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-[#9aa0a6] mt-1 pl-5 leading-relaxed">
          Mathematisch kalibriertes Modell mit schnellen radialen Transit-Fingern (S-Bahn/U-Bahn),
          lokalem Bus-Netz, Autobahn-Korridoren und Tageszeit-/Rush-Hour-Faktoren.
        </p>
      </div>

      {/* Option 3: OpenRouteService (ORS) */}
      <div
        onClick={() => onSelectProvider('ors')}
        className={`p-3 rounded-xl border cursor-pointer transition-all ${
          activeProvider === 'ors'
            ? 'border-blue-500 dark:border-[#8ab4f8] bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-400 dark:ring-blue-500/50'
            : 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="provider"
              checked={activeProvider === 'ors'}
              onChange={() => onSelectProvider('ors')}
              className="text-blue-600 dark:text-[#8ab4f8]"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3]">
                OpenRouteService (ORS)
              </span>
              <span className="ml-2 text-[10px] font-semibold bg-slate-100 dark:bg-[#303134] text-slate-700 dark:text-[#e3e3e3] px-1.5 py-0.5 rounded-full">
                Open Source API
              </span>
              {hasOrsApiKey() ? (
                <span className="ml-1.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                  Aktiv
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] font-semibold bg-slate-100 dark:bg-[#303134] text-slate-600 dark:text-[#9aa0a6] px-1.5 py-0.5 rounded-full">
                  Nicht konfiguriert
                </span>
              )}
            </div>
          </div>
          <a
            href="https://openrouteservice.org"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span>openrouteservice.org</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-[#9aa0a6] mt-1 pl-5 leading-relaxed">
          OpenStreetMap-basierte Isochronen für Auto, Fahrrad und Fußgänger (kostenloser API-Key erforderlich).
        </p>
      </div>

      {/* Berechnungsparameter: Detailgrad, Live-Verkehr & Glättung */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-[#3c4043] space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-[#e3e3e3]">
          Berechnungs- & Darstellungs-Parameter
        </div>

        {/* Detailgenauigkeit / Fidelity */}
        <div className="bg-slate-50 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-[#e3e3e3]">Detailgrad der Isochronen:</span>
            <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">
              {options.fidelity === 'HIGH'
                ? 'Sehr präzise Berechnungsraster'
                : options.fidelity === 'LOW'
                ? 'Grob & maximal schnell'
                : 'Ausgewogen'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-white dark:bg-[#1e1f20] p-1 rounded-lg border border-slate-200 dark:border-[#3c4043]">
            {[
              { id: 'AUTOMATIC' as PolygonFidelity, label: 'Auto' },
              { id: 'LOW' as PolygonFidelity, label: 'Grob' },
              { id: 'MEDIUM' as PolygonFidelity, label: 'Mittel' },
              { id: 'HIGH' as PolygonFidelity, label: 'Präzise' },
            ].map((item) => {
              const isSelected = (options.fidelity || 'AUTOMATIC') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectFidelity(item.id)}
                  className={`py-1.5 text-center rounded-md transition-all text-xs font-medium cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 dark:bg-[#8ab4f8] text-white dark:text-[#131314] shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Switches for Live-Traffic, Smoothing, and Only Intersection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Live-Verkehr Switch */}
          <div className="bg-slate-50 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">Live-Verkehr & Stau</div>
              <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">Rush-Hour Berücksichtigung</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={options.liveTraffic}
              onClick={() => onToggleOption('liveTraffic')}
              className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                options.liveTraffic ? 'bg-blue-600 dark:bg-[#8ab4f8]' : 'bg-slate-200 dark:bg-[#3c4043]'
              }`}
            >
              <div
                className={`bg-white dark:bg-[#1e1f20] w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                  options.liveTraffic ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Glatte Kanten Switch */}
          <div className="bg-slate-50 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">Glatte Kanten</div>
              <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">B-Spline Konturen-Glättung</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={options.enableSmoothing}
              onClick={() => onToggleOption('enableSmoothing')}
              className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                options.enableSmoothing ? 'bg-blue-600 dark:bg-[#8ab4f8]' : 'bg-slate-200 dark:bg-[#3c4043]'
              }`}
            >
              <div
                className={`bg-white dark:bg-[#1e1f20] w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                  options.enableSmoothing ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Hole-Filling Switch: Schließt künstliche Netzlöcher */}
          <div className="bg-slate-50 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl p-3 flex items-center justify-between sm:col-span-2">
            <div className="pr-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">
                Künstliche Netzlöcher schließen (Hole-Filling)
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] leading-tight mt-0.5">
                Füllt unbegründete Hohlräume und Artefakte in dichten Stadtgebieten (z. B. Moosach) für ein konsistentes Erreichbarkeitspolygon.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={options.fillHoles !== false}
              onClick={() => onToggleOption('fillHoles')}
              className={`w-8 h-4.5 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                options.fillHoles !== false ? 'bg-blue-600 dark:bg-[#8ab4f8]' : 'bg-slate-200 dark:bg-[#3c4043]'
              }`}
            >
              <div
                className={`bg-white dark:bg-[#1e1f20] w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                  options.fillHoles !== false ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Nur überlagerten Treffbereich anzeigen Switch */}
          {onToggleOnlyIntersection && (
            <div className="bg-slate-50 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl p-3 flex items-center justify-between sm:col-span-2">
              <div className="pr-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">
                  Nur überlagerten Treffbereich anzeigen
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] leading-tight mt-0.5">
                  Blendet die individuellen Personen-Isochronen aus und zeigt nur den gemeinsamen grünen Treffbereich.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showOnlyIntersection}
                onClick={onToggleOnlyIntersection}
                className={`w-8 h-4.5 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  showOnlyIntersection ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-200 dark:bg-[#3c4043]'
                }`}
              >
                <div
                  className={`bg-white dark:bg-[#1e1f20] w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                    showOnlyIntersection ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
