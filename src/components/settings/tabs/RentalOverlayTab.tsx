import React from 'react';
import { CommuteSchedule, RentalOverlaySettings } from '../../../types';
import {
  RENTAL_LEGEND_TIERS,
  getRentalRegionsCatalog,
  saveRentalOverlaySettings,
} from '../../../services/rentalService';
import { Euro, Building2, CheckCircle2, Clock, ExternalLink, Sliders } from 'lucide-react';

interface RentalOverlayTabProps {
  schedule: CommuteSchedule;
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
}

export const RentalOverlayTab: React.FC<RentalOverlayTabProps> = ({
  schedule,
  onChangeSchedule,
}) => {
  const rentalSettings = schedule.options?.rentalOverlay || {
    enabled: false,
    opacity: 0.35,
    selectedRegionId: 'munich-mvv',
  };

  const catalog = getRentalRegionsCatalog();

  const handleUpdate = (updated: Partial<RentalOverlaySettings>) => {
    const merged = { ...rentalSettings, ...updated };
    saveRentalOverlaySettings(merged);
    onChangeSchedule({
      options: {
        ...(schedule.options || { liveTraffic: false, enableSmoothing: true, fidelity: 'AUTOMATIC' }),
        rentalOverlay: merged,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-2">
          <Euro className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Mietspiegel & Kaltquadratmeterpreise</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-1">
          Choroplethen-Überlagerung der durchschnittlichen Nettokaltmieten (€/m²) und Wohnlagen
          auf Basis amtlicher kommunaler Open-Data-Portale.
        </p>
      </div>

      {/* Main Activation Card */}
      <div className="bg-white dark:bg-[#282a2c] border border-slate-200 dark:border-[#3c4043] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                rentalSettings.enabled
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                  : 'bg-slate-100 dark:bg-[#303134] text-slate-500 dark:text-[#9aa0a6]'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-[#e3e3e3]">
                Mietspiegel-Ebene auf Karte anzeigen
              </div>
              <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                Färbt die Stadtbezirke nach dem durchschnittlichen Quadratmeterpreis ein.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rentalSettings.enabled}
              onChange={(e) => handleUpdate({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-[#3c4043] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500" />
          </label>
        </div>

        {/* Opacity Slider */}
        {rentalSettings.enabled && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#3c4043] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-400 dark:text-[#747775]" />
              <span className="text-xs font-semibold text-slate-700 dark:text-[#e3e3e3]">
                Transparenz / Deckkraft: {Math.round((rentalSettings.opacity ?? 0.35) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.75"
              step="0.05"
              value={rentalSettings.opacity ?? 0.35}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-44 h-2 bg-slate-200 dark:bg-[#3c4043] rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400"
            />
          </div>
        )}
      </div>

      {/* Legend & Price Range Scale */}
      <div className="bg-slate-50/80 dark:bg-[#202124] border border-slate-200/80 dark:border-[#3c4043] rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-700 dark:text-[#e3e3e3] uppercase tracking-wider mb-3">
          Legende: Farbskala Kaltmiete (€/m²)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RENTAL_LEGEND_TIERS.map((tier) => (
            <div
              key={tier.label}
              className="bg-white dark:bg-[#282a2c] border border-slate-200/80 dark:border-[#3c4043] rounded-xl p-2.5 flex items-center gap-3 shadow-2xs"
            >
              <div
                className="w-4 h-4 rounded-md shrink-0 shadow-xs ring-1 ring-black/10"
                style={{ backgroundColor: tier.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3]">{tier.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] truncate">{tier.subLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Municipal Open Data Regions Catalog */}
      <div>
        <div className="text-xs font-bold text-slate-700 dark:text-[#e3e3e3] uppercase tracking-wider mb-2">
          Städtische Open-Data-Quellen & Regionen
        </div>
        <div className="space-y-2.5">
          {catalog.map((entry) => (
            <div
              key={entry.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                entry.available
                  ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 shadow-2xs'
                  : 'bg-white dark:bg-[#282a2c] border-slate-200 dark:border-[#3c4043] opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-[#e3e3e3]">{entry.name}</span>
                    {entry.available ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktiv integriert</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#303134] text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Roadmap / In Vorbereitung</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#9aa0a6] mt-1">{entry.description}</p>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-[#9aa0a6]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-[#e3e3e3]">Quelle:</span>
                  <span>{entry.source}</span>
                </div>
                {entry.sourceUrl && (
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 font-semibold flex items-center gap-1 underline"
                  >
                    <span>Portal öffnen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
