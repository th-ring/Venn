import React from 'react';
import {
  HeatmapSettings,
  PriorityHeatmapItem,
  PriorityHeatmapMode,
} from '../../../types';
import { Flame, Car } from 'lucide-react';
import { getHighwayMetadata } from '../../../services/highwayService';

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

  const handleToggleActive = () => {
    if (isActive) {
      onUpdateHeatmap({ mode: 'none', selectedItems: [] });
    } else {
      onUpdateHeatmap({ mode: 'ubahn', selectedItems: ['ubahn', 'sbahn'] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-600 dark:text-[#9aa0a6] leading-relaxed">
        Die Prioritäts-Heatmap blendet innerhalb des gemeinsamen Treffbereichs farbige Reichweiten-Puffer ein (z. B. unmittelbare Fußdistanz zu U-Bahn, S-Bahn oder Autobahnanschlussstellen).
      </div>

      <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3]">
                Heatmap aktivieren
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">
                Färbt beste Lagen im Treffbereich hervor
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={handleToggleActive}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              isActive ? 'bg-amber-500' : 'bg-slate-200 dark:bg-[#3c4043]'
            }`}
          >
            <div
              className={`bg-white dark:bg-[#1e1f20] w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isActive && (
          <div className="space-y-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
            <div>
              <div className="text-[11px] font-bold text-slate-700 dark:text-[#e3e3e3] mb-1.5">
                Infrastruktur-Ziele:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'ubahn' as PriorityHeatmapItem, label: '🚇 U-Bahn', desc: 'Haltestellen U1–U8' },
                  { id: 'sbahn' as PriorityHeatmapItem, label: '🚆 S-Bahn', desc: 'Stammstrecke & Äste' },
                  { id: 'highway' as PriorityHeatmapItem, label: '🚗 Autobahn', desc: 'A99, A8, A96 etc.' },
                ].map((item) => {
                  const checked = activeItems.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                        checked
                          ? 'bg-white dark:bg-[#282a2c] border-amber-300 dark:border-amber-700 shadow-2xs font-semibold text-slate-900 dark:text-[#e3e3e3]'
                          : 'bg-amber-50/50 dark:bg-[#1e1f20]/50 border-amber-200/60 dark:border-[#3c4043] text-slate-600 dark:text-[#9aa0a6] opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleItem(item.id)}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-[#3c4043] cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-normal">{item.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-[#282a2c] p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-[#e3e3e3]">Suchradius / Fußdistanz:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {heatmap.radiusKm >= 1
                    ? `${heatmap.radiusKm.toFixed(1)} km`
                    : `${(heatmap.radiusKm * 1000).toFixed(0)} m`} (ca. {Math.round(heatmap.radiusKm * 12)} Min)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.25"
                value={heatmap.radiusKm}
                onChange={(e) => onUpdateHeatmap({ radiusKm: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 h-1.5 bg-amber-100 dark:bg-[#3c4043] rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-[#3c4043]">
                <span className="font-semibold text-slate-700 dark:text-[#e3e3e3]">Deckkraft & Intensität:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {Math.round(heatmap.intensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={heatmap.intensity}
                onChange={(e) => onUpdateHeatmap({ intensity: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 h-1.5 bg-amber-100 dark:bg-[#3c4043] rounded-lg cursor-pointer"
              />
            </div>

            {/* Autobahn OSM Data Source Info Badge */}
            {activeItems.includes('highway') && (
              <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 rounded-xl p-2.5 text-[11px] text-orange-950 dark:text-orange-200 flex items-start gap-2 animate-in fade-in">
                <Car className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Datenbasis Autobahn: OpenStreetMap (ODbL)</span>
                    <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300">
                      Stand: {(() => {
                        try {
                          const d = new Date(highwayMeta.lastUpdated);
                          return isNaN(d.getTime()) ? highwayMeta.lastUpdated : d.toLocaleDateString('de-DE');
                        } catch {
                          return highwayMeta.lastUpdated;
                        }
                      })()}
                    </span>
                  </div>
                  <p className="text-orange-900/80 dark:text-orange-300/80 text-[10px] leading-tight">
                    Enthält {highwayMeta.junctionCount} Anschlussstellen und {highwayMeta.rampCount} Auffahrts- & Abfahrtsrampen. Die Heatmap puffert entlang der echten Rampenkorridore. Aktualisierung zentral in Tab „4. Datenpakete & Regionen“.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
