import React, { useState } from 'react';
import {
  HeatmapSettings,
  PriorityHeatmapItem,
  PriorityHeatmapMode,
} from '../../types';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';

interface PriorityHeatmapWidgetProps {
  heatmap?: HeatmapSettings;
  onUpdateHeatmap: (updated: Partial<HeatmapSettings>) => void;
}

export const PriorityHeatmapWidget: React.FC<PriorityHeatmapWidgetProps> = ({
  heatmap: incomingHeatmap,
  onUpdateHeatmap,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const heatmap: HeatmapSettings = incomingHeatmap ?? {
    mode: 'none',
    selectedItems: [],
    radiusKm: 1.5,
    intensity: 0.65,
  };

  const activeHeatmapItems: PriorityHeatmapItem[] =
    heatmap.selectedItems && heatmap.selectedItems.length > 0
      ? heatmap.selectedItems
      : heatmap.mode && heatmap.mode !== 'none'
      ? [heatmap.mode as PriorityHeatmapItem]
      : [];

  const isHeatmapActive = activeHeatmapItems.length > 0;

  // Determine current dropdown selection key
  const currentSelectValue = React.useMemo(() => {
    if (!isHeatmapActive) return 'none';
    if (activeHeatmapItems.length === 3) return 'all';
    if (activeHeatmapItems.length === 2 && activeHeatmapItems.includes('ubahn') && activeHeatmapItems.includes('sbahn')) {
      return 'combo';
    }
    if (activeHeatmapItems.length === 1) return activeHeatmapItems[0];
    return 'custom';
  }, [isHeatmapActive, activeHeatmapItems]);

  const handleSelectHeatmapMode = (modeKey: string) => {
    if (modeKey === 'none') {
      onUpdateHeatmap({
        mode: 'none',
        selectedItems: [],
      });
    } else if (modeKey === 'ubahn') {
      onUpdateHeatmap({
        mode: 'ubahn',
        selectedItems: ['ubahn'],
      });
    } else if (modeKey === 'sbahn') {
      onUpdateHeatmap({
        mode: 'sbahn',
        selectedItems: ['sbahn'],
      });
    } else if (modeKey === 'highway') {
      onUpdateHeatmap({
        mode: 'highway',
        selectedItems: ['highway'],
      });
    } else if (modeKey === 'combo') {
      onUpdateHeatmap({
        mode: 'ubahn',
        selectedItems: ['ubahn', 'sbahn'],
      });
    } else if (modeKey === 'all') {
      onUpdateHeatmap({
        mode: 'ubahn',
        selectedItems: ['ubahn', 'sbahn', 'highway'],
      });
    }
  };

  const currentRadius = heatmap.radiusKm ?? 1.5;

  return (
    <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-slate-200/90 dark:border-[#2f3336] shadow-2xs overflow-hidden transition-all text-xs">
      {/* Header / Toggle */}
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-[#25262a]/70 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isHeatmapActive
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-[#121315] text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 dark:text-[#e8eaed] truncate">
            Prioritäts-Heatmap
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Active status indicator badge */}
          {isHeatmapActive ? (
            <span className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
              {currentRadius.toFixed(1)} km
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#25262a]">
              Aus
            </span>
          )}

          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Aufklappen' : 'Einklappen'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Streamlined Body: Mode dropdown & optional radius slider */}
      {!isCollapsed && (
        <div className="p-2.5 pt-0 border-t border-slate-100 dark:border-[#2f3336] mt-0.5 space-y-2">
          <div className="pt-1.5">
            <select
              id="select-heatmap-mode"
              value={currentSelectValue}
              onChange={(e) => handleSelectHeatmapMode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#121315] hover:bg-slate-100/80 dark:hover:bg-[#25262a] border border-slate-200/80 dark:border-[#2f3336] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-[#e8eaed] cursor-pointer focus:ring-1 focus:ring-amber-500 transition-colors"
            >
              <option value="none">Keine Heatmap (Aus)</option>
              <option value="ubahn">🚇 U-Bahn Stationen</option>
              <option value="sbahn">🚆 S-Bahn Stationen</option>
              <option value="highway">🛣️ Autobahnanschlüsse</option>
              <option value="combo">★ U- + S-Bahn (Kombi)</option>
              <option value="all">★ Alle (U, S & Autobahn)</option>
              {currentSelectValue === 'custom' && (
                <option value="custom">Benutzerdefiniert</option>
              )}
            </select>
          </div>

          {/* Radius Slider when active */}
          {isHeatmapActive && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Radius:</span>
              <input
                id="slider-heatmap-radius"
                type="range"
                min="0.5"
                max="3.0"
                step="0.25"
                value={currentRadius}
                onChange={(e) => onUpdateHeatmap({ radiusKm: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 dark:accent-amber-400 h-1.5 bg-slate-200 dark:bg-[#2f3336] rounded-lg cursor-pointer"
                title={`Radius: ${currentRadius.toFixed(2)} km`}
              />
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 shrink-0">
                {currentRadius.toFixed(1)}km
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
