import React from 'react';
import { HeatmapSettings, PriorityHeatmapItem, PriorityHeatmapMode } from '../../../types';
import { Flame, Car, TrainFrontTunnel, TrainFront, Info } from 'lucide-react';
import { getHighwayMetadata } from '../../../services/highwayService';
import { SettingsCard } from '../ui/SettingsCard';
import { SettingsRow } from '../ui/SettingsRow';
import { SettingsSwitch } from '../ui/SettingsSwitch';
import { SettingsSlider } from '../ui/SettingsSlider';

interface PriorityHeatmapTabProps {
  heatmap: HeatmapSettings;
  onUpdateHeatmap: (updated: Partial<HeatmapSettings>) => void;
}

export const PriorityHeatmapTab: React.FC<PriorityHeatmapTabProps> = ({
  heatmap,
  onUpdateHeatmap,
}) => {
  const highwayMeta = getHighwayMetadata();
  const activeItems: PriorityHeatmapItem[] =
    heatmap.selectedItems && heatmap.selectedItems.length > 0
      ? heatmap.selectedItems
      : heatmap.mode && heatmap.mode !== 'none'
      ? [heatmap.mode as PriorityHeatmapItem]
      : [];

  const isActive = activeItems.length > 0;

  const handleToggleItem = (item: PriorityHeatmapItem) => {
    let next: PriorityHeatmapItem[];
    if (activeItems.includes(item)) {
      next = activeItems.filter((i) => i !== item);
    } else {
      next = [...activeItems, item];
    }
    const nextMode: PriorityHeatmapMode = next.length > 0 ? next[0] : 'none';
    onUpdateHeatmap({
      mode: nextMode,
      selectedItems: next,
    });
  };

  const handleToggleActive = (checked: boolean) => {
    if (!checked) {
      onUpdateHeatmap({ mode: 'none', selectedItems: [] });
    } else {
      onUpdateHeatmap({ mode: 'ubahn', selectedItems: ['ubahn', 'sbahn'] });
    }
  };

  const infrastructureOptions = [
    {
      id: 'ubahn' as PriorityHeatmapItem,
      label: 'U-Bahn-Stationen',
      sub: 'Münchner U-Bahn Linien U1–U8',
      icon: TrainFrontTunnel,
    },
    {
      id: 'sbahn' as PriorityHeatmapItem,
      label: 'S-Bahn-Stationen',
      sub: 'Stammstrecke & Außenäste S1–S8',
      icon: TrainFront,
    },
    {
      id: 'highway' as PriorityHeatmapItem,
      label: 'Autobahnanschlussstellen',
      sub: `${highwayMeta.junctionCount} Anschlüsse & Rampen (A99, A8, A96)`,
      icon: Car,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
          Prioritäts-Heatmap
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
          Hebt bevorzugte Wohnlagen innerhalb des gemeinsamen Treffbereichs anhand ihrer Nähe zu Bahn- und Verkehrsnetzen hervor.
        </p>
      </div>

      {/* Main Activation Card */}
      <SettingsCard title="Heatmap-Steuerung">
        <SettingsRow
          icon={Flame}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          title="Prioritäts-Heatmap aktivieren"
          description="Visualisiert farbige Reichweiten-Puffer für ausgewählte Verkehrsknotenpunkte direkt im Treffbereich."
          control={
            <SettingsSwitch
              checked={isActive}
              onChange={handleToggleActive}
              ariaLabel="Prioritäts-Heatmap aktivieren"
            />
          }
        />
      </SettingsCard>

      {/* Configuration when active */}
      {isActive && (
        <>
          {/* Target Selection Card */}
          <SettingsCard
            title="Infrastruktur-Ziele"
            subtitle="Wähle die Verkehrsträger aus, für die Pufferzonen generiert werden sollen"
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {infrastructureOptions.map((opt) => {
                const checked = activeItems.includes(opt.id);
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleItem(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer select-none ${
                      checked
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-2 border-blue-600 dark:border-[#8ab4f8] shadow-xs'
                        : 'bg-white dark:bg-[#1e1f20] border-slate-200/90 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        checked
                          ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314]'
                          : 'bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-900 dark:text-[#e3e3e3]">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-tight mt-0.5">
                        {opt.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingsCard>

          {/* Slider Controls Card */}
          <SettingsCard title="Reichweite & Puffer-Parameter">
            <div className="p-4 space-y-4">
              <SettingsSlider
                id="heatmap-radius-slider"
                label="Suchradius / Fußdistanz zur Station"
                value={heatmap.radiusKm}
                min={0.5}
                max={3.5}
                step={0.25}
                formatValue={(v) =>
                  v >= 1
                    ? `${v.toFixed(1)} km (ca. ${Math.round(v * 12)} Min Fußweg)`
                    : `${Math.round(v * 1000)} m (ca. ${Math.round(v * 12)} Min Fußweg)`
                }
                minLabel="500 m (Unmittelbare Nähe)"
                maxLabel="3.5 km (Erweiterter Korridor)"
                onChange={(radiusKm) => onUpdateHeatmap({ radiusKm })}
              />

              <div className="pt-2 border-t border-slate-100 dark:border-[#2d2f31]">
                <SettingsSlider
                  id="heatmap-intensity-slider"
                  label="Deckkraft & Farbintensität"
                  value={heatmap.intensity}
                  min={0.2}
                  max={0.95}
                  step={0.05}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                  minLabel="20% (Dezent)"
                  maxLabel="95% (Signalstark)"
                  onChange={(intensity) => onUpdateHeatmap({ intensity })}
                />
              </div>
            </div>
          </SettingsCard>
        </>
      )}
    </div>
  );
};
