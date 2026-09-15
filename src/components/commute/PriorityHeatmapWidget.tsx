import React, { useState, useRef, useEffect } from 'react';
import {
  HeatmapSettings,
  PriorityHeatmapItem,
  PriorityHeatmapMode,
  ALL_HEATMAP_ITEMS,
} from '../../types';
import { Flame, ChevronDown, ChevronUp, TrainFrontTunnel, TrainFront, Car } from 'lucide-react';
import { getHighwayMetadata } from '../../services/highwayService';

interface PriorityHeatmapWidgetProps {
  heatmap?: HeatmapSettings;
  onUpdateHeatmap: (updated: Partial<HeatmapSettings>) => void;
}

export const PriorityHeatmapWidget: React.FC<PriorityHeatmapWidgetProps> = ({
  heatmap: incomingHeatmap,
  onUpdateHeatmap,
}) => {
  const highwayMeta = getHighwayMetadata();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleHeatmapItem = (item: PriorityHeatmapItem) => {
    let nextItems: PriorityHeatmapItem[];
    if (activeHeatmapItems.includes(item)) {
      nextItems = activeHeatmapItems.filter((i) => i !== item);
    } else {
      nextItems = [...activeHeatmapItems, item];
    }
    const nextMode: PriorityHeatmapMode = nextItems.length > 0 ? nextItems[0] : 'none';
    onUpdateHeatmap({
      mode: nextMode,
      selectedItems: nextItems,
    });
  };

  const handleToggleHeatmapActive = () => {
    if (isHeatmapActive) {
      onUpdateHeatmap({
        mode: 'none',
        selectedItems: [],
      });
    } else {
      onUpdateHeatmap({
        mode: 'ubahn',
        selectedItems: ['ubahn', 'sbahn'],
      });
    }
  };

  const handleSelectAllHeatmapItems = () => {
    onUpdateHeatmap({
      mode: 'ubahn',
      selectedItems: ['ubahn', 'sbahn', 'highway'],
    });
  };

  const handleClearAllHeatmapItems = () => {
    onUpdateHeatmap({
      mode: 'none',
      selectedItems: [],
    });
  };

  return (
    <div className="bg-white dark:bg-[#1e1f20] rounded-xl border border-slate-200/90 dark:border-[#3c4043] shadow-2xs overflow-visible transition-all">
      {/* Header / Toggle */}
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#282a2c]/80 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1 rounded-lg shrink-0 ${
              isHeatmapActive
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-[#131314] text-slate-400 dark:text-[#9aa0a6]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-[#e3e3e3] truncate">
            Prioritäts-Heatmap
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status-Badge */}
          {isHeatmapActive ? (
            <span className="text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-[#8ab4f8] px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>{activeHeatmapItems.length} aktiv</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400 dark:text-[#9aa0a6] bg-slate-100 dark:bg-[#282a2c] px-2 py-0.5 rounded-full">
              Inaktiv
            </span>
          )}

          <button
            type="button"
            className="text-slate-400 dark:text-[#9aa0a6] hover:text-slate-600 dark:hover:text-[#e3e3e3] p-0.5 rounded transition-colors"
            title={isCollapsed ? 'Aufklappen' : 'Einklappen'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content Body */}
      {!isCollapsed && (
        <div className="p-3 pt-0 border-t border-slate-100 dark:border-[#3c4043] mt-1 space-y-3">
          {/* Master Switch (Google M3 Switch) */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-700 dark:text-[#e8eaed]">
              Heatmap im Treffbereich aktivieren
            </span>
            <button
              id="switch-heatmap-master"
              type="button"
              role="switch"
              aria-checked={isHeatmapActive}
              onClick={handleToggleHeatmapActive}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                isHeatmapActive ? 'bg-blue-600 dark:bg-[#8ab4f8]' : 'bg-slate-300 dark:bg-[#3c4043]'
              }`}
              title={isHeatmapActive ? 'Heatmap deaktivieren' : 'Heatmap aktivieren'}
            >
              <div
                className={`w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  isHeatmapActive ? 'translate-x-4 bg-white dark:bg-[#131314]' : 'translate-x-0 bg-white dark:bg-[#e8eaed]'
                }`}
              />
            </button>
          </div>

          {/* When active: Dropdown Multi-Select & Sliders */}
          {isHeatmapActive && (
            <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-[#3c4043]">
              {/* Multi-Select Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-[#c4c7c5]">
                    Prioritäts-Infrastruktur (Mehrfachauswahl):
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6]">
                    {activeHeatmapItems.length} von {ALL_HEATMAP_ITEMS.length} gewählt
                  </span>
                </div>

                <div ref={dropdownRef} className="relative">
                  <button
                    id="btn-heatmap-dropdown"
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#131314] hover:bg-slate-100/80 dark:hover:bg-[#282a2c] border border-slate-200 dark:border-[#3c4043] text-xs text-left shadow-2xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {activeHeatmapItems.length === 0 ? (
                        <span className="text-slate-400 dark:text-[#9aa0a6] italic">Klicke, um Kategorien zu wählen...</span>
                      ) : (
                        activeHeatmapItems.map((item) => {
                          const isUbahn = item === 'ubahn';
                          const isSbahn = item === 'sbahn';
                          return (
                            <span
                              key={item}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                isUbahn
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800'
                                  : isSbahn
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                              }`}
                            >
                              {isUbahn ? (
                                <TrainFrontTunnel className="w-3.5 h-3.5 shrink-0" />
                              ) : isSbahn ? (
                                <TrainFront className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <Car className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>{isUbahn ? 'U-Bahn' : isSbahn ? 'S-Bahn' : 'Autobahn'}</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleHeatmapItem(item);
                                }}
                                className="text-slate-400 dark:text-[#9aa0a6] hover:text-slate-700 dark:hover:text-[#e3e3e3] font-bold ml-0.5 cursor-pointer"
                                title="Abwählen"
                              >
                                ×
                              </span>
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-[#9aa0a6] shrink-0 transition-transform ${
                        isDropdownOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Floating Dropdown Card */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-[#282a2c] rounded-xl shadow-xl border border-slate-200 dark:border-[#3c4043] p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-[#e3e3e3] pb-1.5 border-b border-slate-100 dark:border-[#3c4043]">
                        <span>Kategorien wählen:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllHeatmapItems}
                            className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                          >
                            Alle
                          </button>
                          <span className="text-slate-200 dark:text-[#5f6368]">|</span>
                          <button
                            type="button"
                            onClick={handleClearAllHeatmapItems}
                            className="text-[10px] text-slate-400 dark:text-[#9aa0a6] hover:underline cursor-pointer"
                          >
                            Keine
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {[
                          {
                            id: 'ubahn' as PriorityHeatmapItem,
                            label: 'U-Bahn Stationen',
                            icon: TrainFrontTunnel,
                            desc: 'U1 – U8 Haltestellen im MVV/MVG Netz',
                          },
                          {
                            id: 'sbahn' as PriorityHeatmapItem,
                            label: 'S-Bahn Stationen',
                            icon: TrainFront,
                            desc: 'S1 – S8 Stammstrecke und Außenäste',
                          },
                          {
                            id: 'highway' as PriorityHeatmapItem,
                            label: 'Autobahn-Anschlussstellen',
                            icon: Car,
                            desc: `${highwayMeta.junctionCount} AS & ${highwayMeta.rampCount} Rampen`,
                          },
                        ].map((opt) => {
                          const isChecked = activeHeatmapItems.includes(opt.id);
                          const OptIcon = opt.icon;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-semibold'
                                  : 'text-slate-600 dark:text-[#c4c7c5] hover:bg-slate-50 dark:hover:bg-[#3c4043]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleHeatmapItem(opt.id)}
                                className="rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-[#5f6368] cursor-pointer"
                              />
                              <OptIcon className="w-4 h-4 text-slate-500 dark:text-[#9aa0a6] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs">{opt.label}</div>
                                <div className="text-[10px] text-slate-400 dark:text-[#9aa0a6] font-normal truncate">
                                  {opt.desc}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {activeHeatmapItems.includes('highway') && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#3c4043] flex items-center justify-between text-[10px] text-amber-900/80 dark:text-amber-300/80 px-1">
                          <span>Stand: {(() => {
                            try {
                              const d = new Date(highwayMeta.lastUpdated);
                              return isNaN(d.getTime()) ? highwayMeta.lastUpdated : d.toLocaleDateString('de-DE');
                            } catch {
                              return highwayMeta.lastUpdated;
                            }
                          })()} (OSM)</span>
                          <span className="font-semibold text-amber-800 dark:text-amber-400">Echte Rampen-Puffer</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Range Sliders */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-900 dark:text-amber-200 font-medium">Suchradius / Fußdistanz:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-300">
                    {heatmap.radiusKm >= 1
                      ? `${heatmap.radiusKm.toFixed(1)} km`
                      : `${(heatmap.radiusKm * 1000).toFixed(0)} m`}{' '}
                    (ca. {Math.round(heatmap.radiusKm * 12)} Min)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.25"
                  value={heatmap.radiusKm}
                  onChange={(e) => onUpdateHeatmap({ radiusKm: parseFloat(e.target.value) })}
                  className="w-full accent-amber-600 h-1.5 bg-amber-200 dark:bg-amber-900/50 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/50 dark:border-amber-800/40">
                  <span className="text-amber-900 dark:text-amber-200 font-medium">Farbintensität & Deckkraft:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-300">
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
                  className="w-full accent-amber-600 h-1.5 bg-amber-200 dark:bg-amber-900/50 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
