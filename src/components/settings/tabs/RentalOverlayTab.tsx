import React from 'react';
import { CommuteSchedule, RentalOverlaySettings } from '../../../types';
import {
  RENTAL_LEGEND_TIERS,
  getRentalRegionsCatalog,
  saveRentalOverlaySettings,
} from '../../../services/rentalService';
import { Euro, Building2, Info, ExternalLink, Sliders } from 'lucide-react';
import { SettingsCard } from '../ui/SettingsCard';
import { SettingsRow } from '../ui/SettingsRow';
import { SettingsSwitch } from '../ui/SettingsSwitch';
import { SettingsSlider } from '../ui/SettingsSlider';

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
        <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
          Mietspiegel & Wohnlagen
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
          Choroplethen-Ebene der amtlichen durchschnittlichen Nettokaltmieten (€/m²) nach Stadtbezirken.
        </p>
      </div>

      {/* Main Activation Card */}
      <SettingsCard title="Kartendarstellung">
        <SettingsRow
          icon={Euro}
          iconColor="text-blue-600 dark:text-[#8ab4f8]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          title="Mietspiegel-Ebene anzeigen"
          description="Überlagert die Karte mit farbigen Stadtbezirks-Zonen nach durchschnittlicher Nettokaltmiete."
          control={
            <SettingsSwitch
              checked={rentalSettings.enabled}
              onChange={(enabled) => handleUpdate({ enabled })}
              ariaLabel="Mietspiegel-Ebene anzeigen"
            />
          }
        />

        {rentalSettings.enabled && (
          <div className="p-4 bg-slate-50/50 dark:bg-[#1a1b1d]/50 border-t border-slate-100 dark:border-[#2d2f31]">
            <SettingsSlider
              id="rental-opacity-slider"
              label="Deckkraft & Transparenz der Farbzonen"
              value={rentalSettings.opacity ?? 0.35}
              min={0.15}
              max={0.75}
              step={0.05}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              minLabel="15% (Dezent)"
              maxLabel="75% (Kräftig)"
              onChange={(opacity) => handleUpdate({ opacity })}
            />
          </div>
        )}
      </SettingsCard>

      {/* Price Legend Card */}
      <SettingsCard
        title="Farbskala & Mietpreis-Klassen"
        subtitle="Durchschnittliche Nettokaltmiete in € pro Quadratmeter Wohnfläche"
      >
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RENTAL_LEGEND_TIERS.map((tier) => (
              <div
                key={tier.label}
                className="p-2.5 rounded-xl border border-slate-200/70 dark:border-[#3c4043] bg-slate-50/40 dark:bg-[#252628] flex items-center gap-3"
              >
                <div
                  className="w-4 h-4 rounded-md shrink-0 shadow-2xs"
                  style={{ backgroundColor: tier.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-900 dark:text-[#e3e3e3]">
                    {tier.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] truncate">
                    {tier.subLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>

      {/* Data Source & Municipal Transparency Card */}
      <SettingsCard title="Datenbasis & Einordnung">
        <div className="p-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-[#9aa0a6]">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-900 dark:text-[#e3e3e3] block">
                Amtlicher qualifizierter Mietspiegel (§ 558c BGB)
              </span>
              <p className="mt-0.5">
                Die Werte basieren auf dem amtlichen Mietspiegel der Landeshauptstadt München (Open Data GeodatenService).
                Dieser erfasst Bestandsmieten und Neuabschlüsse der letzten 6 Jahre.
                Aktuelle Inserate auf gewerblichen Portalen liegen in Ballungsräumen meist 15–30 % über diesen Werten.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#2d2f31] flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-[#747775]">
              Lizenz: dl-de/by-2-0 • Stand 2025/2026
            </span>
            <a
              href="https://opendata.muenchen.de"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 dark:text-[#8ab4f8] hover:underline inline-flex items-center gap-1"
            >
              <span>München Open Data</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};
