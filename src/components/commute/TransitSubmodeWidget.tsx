import React, { useState } from 'react';
import { TransitSubMode, ALL_TRANSIT_SUBMODES } from '../../types';
import { Train, ChevronDown, ChevronUp } from 'lucide-react';

interface TransitSubmodeWidgetProps {
  transitModes?: TransitSubMode[];
  onChangeTransitModes: (modes: TransitSubMode[]) => void;
}

export const TransitSubmodeWidget: React.FC<TransitSubmodeWidgetProps> = ({
  transitModes,
  onChangeTransitModes,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeTransitModes: TransitSubMode[] =
    transitModes && transitModes.length > 0 ? transitModes : ALL_TRANSIT_SUBMODES;

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

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Train className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 truncate">
            ÖPNV-Verkehrsmittel
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
            {activeTransitModes.length} von {ALL_TRANSIT_SUBMODES.length} aktiv
          </span>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            title={isCollapsed ? 'Aufklappen' : 'Einklappen'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2.5 pt-0 border-t border-slate-100 mt-1">
          <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'tram' as TransitSubMode, label: 'Tram', icon: '🚋' },
              { id: 'ubahn' as TransitSubMode, label: 'U-Bahn', icon: '🚇' },
              { id: 'bus' as TransitSubMode, label: 'Bus', icon: '🚌' },
              { id: 'expressbus' as TransitSubMode, label: 'X-Bus', icon: '⚡' },
              { id: 'sbahn' as TransitSubMode, label: 'S-Bahn', icon: '🚆' },
            ].map((item) => {
              const active = activeTransitModes.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleMode(item.id)}
                  title={`${item.label} ${active ? 'abwählen' : 'einbeziehen'}`}
                  className={`py-1.5 px-1 text-center rounded-lg transition-all text-xs font-medium flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-white text-blue-900 shadow-xs font-semibold ring-1 ring-blue-500/20'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-white/50 opacity-60'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
