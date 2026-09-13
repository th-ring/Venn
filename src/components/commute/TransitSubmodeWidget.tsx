import React, { useState } from 'react';
import { TransitSubMode, ALL_TRANSIT_SUBMODES, DEFAULT_TRANSIT_SUBMODES } from '../../types';
import { Train, ChevronDown, ChevronUp } from 'lucide-react';

export interface TransitSubmodeItem {
  id: TransitSubMode;
  label: string;
  icon: string;
  description: string;
}

export const TRANSIT_SUBMODE_CONFIG: TransitSubmodeItem[] = [
  { id: 'tram', label: 'Tram', icon: '🚋', description: 'Straßenbahnlinien' },
  { id: 'ubahn', label: 'U-Bahn', icon: '🚇', description: 'U-Bahn Kernnetz' },
  { id: 'bus', label: 'Bus', icon: '🚌', description: 'Stadt- & Regionalbusse' },
  { id: 'expressbus', label: 'X-Bus', icon: '⚡', description: 'Expressbusse (z.B. X30, X80)' },
  { id: 'sbahn', label: 'S-Bahn', icon: '🚆', description: 'S-Bahn (Stammstrecke & Außenäste)' },
  { id: 'train', label: 'Regio', icon: '🚄', description: 'Regionalbahn (RB / RE / BRB)' },
];

export interface TransitSubmodeWidgetProps {
  transitModes?: TransitSubMode[];
  onChangeTransitModes: (modes: TransitSubMode[]) => void;
  title?: string;
  embedded?: boolean;
}

export const TransitSubmodeWidget: React.FC<TransitSubmodeWidgetProps> = ({
  transitModes,
  onChangeTransitModes,
  title = 'ÖPNV-Verkehrsmittel',
  embedded = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeTransitModes: TransitSubMode[] =
    transitModes && transitModes.length > 0 ? transitModes : DEFAULT_TRANSIT_SUBMODES;

  const handleToggleMode = (mode: TransitSubMode) => {
    let nextModes: TransitSubMode[];
    if (activeTransitModes.includes(mode)) {
      // Keep at least one mode active
      if (activeTransitModes.length <= 1) return;
      nextModes = activeTransitModes.filter((m) => m !== mode);
    } else {
      nextModes = [...activeTransitModes, mode];
    }
    onChangeTransitModes(nextModes);
  };

  const gridContent = (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-100 dark:bg-[#131314] p-1 rounded-xl">
      {TRANSIT_SUBMODE_CONFIG.map((item) => {
        const active = activeTransitModes.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleToggleMode(item.id)}
            title={`${item.label} (${item.description}) – ${active ? 'abwählen' : 'einbeziehen'}`}
            className={`py-1.5 px-1 text-center rounded-lg transition-all text-xs font-medium flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              active
                ? 'bg-white dark:bg-[#282a2c] text-blue-900 dark:text-[#8ab4f8] shadow-xs font-semibold ring-1 ring-blue-500/20 dark:ring-[#8ab4f8]/30'
                : 'text-slate-400 dark:text-[#9aa0a6] hover:text-slate-700 dark:hover:text-[#e3e3e3] hover:bg-white/50 dark:hover:bg-[#282a2c]/50 opacity-60'
            }`}
          >
            <span>{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (embedded) {
    return (
      <div className="bg-white dark:bg-[#1e1f20] p-2.5 rounded-lg border border-slate-200/80 dark:border-[#3c4043] shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-800 dark:text-[#e3e3e3] flex items-center gap-1">
            <Train className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
            {title}
          </span>
          <span className="text-[10px] font-semibold text-slate-600 dark:text-[#c4c7c5] bg-slate-100 dark:bg-[#282a2c] px-1.5 py-0.5 rounded">
            {activeTransitModes.length} von {ALL_TRANSIT_SUBMODES.length} aktiv
          </span>
        </div>
        {gridContent}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1f20] rounded-xl border border-slate-200/90 dark:border-[#3c4043] shadow-2xs overflow-hidden transition-all">
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#282a2c]/80 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] shrink-0">
            <Train className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-[#e3e3e3] truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6] px-2 py-0.5 rounded-md">
            {activeTransitModes.length} von {ALL_TRANSIT_SUBMODES.length} aktiv
          </span>
          <button
            type="button"
            className="text-slate-400 dark:text-[#9aa0a6] hover:text-slate-600 dark:hover:text-[#e3e3e3] p-0.5 rounded transition-colors"
            title={isCollapsed ? 'Aufklappen' : 'Einklappen'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2.5 pt-0 border-t border-slate-100 dark:border-[#3c4043] mt-1">
          {gridContent}
        </div>
      )}
    </div>
  );
};
