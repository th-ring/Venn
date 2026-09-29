import React, { useState, useRef, useEffect } from 'react';
import { PresetScenario } from '../types';
import { PRESET_SCENARIOS } from '../data/presets';
import { MapPin, ChevronDown, Check } from 'lucide-react';

interface PresetSelectorProps {
  onSelectScenario: (scenario: PresetScenario) => void;
  activeScenarioId?: string;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  onSelectScenario,
  activeScenarioId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeScenario =
    PRESET_SCENARIOS.find((s) => s.id === activeScenarioId) || null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Airbnb-style search capsule */}
      <button
        id="btn-preset-selector"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-[#121315] hover:bg-slate-100/90 dark:hover:bg-[#25262a] border border-slate-200/80 dark:border-[#2f3336] rounded-full text-xs font-medium text-slate-700 dark:text-[#c4c7c5] shadow-2xs transition-all cursor-pointer group"
        title="Beispielszenario für eine Stadt laden"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8] shrink-0" />
          <span className="text-slate-800 dark:text-[#e3e3e3] font-semibold truncate">
            {activeScenario ? activeScenario.name : 'München & Region (MVV)'}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-[#e3e3e3] transition-transform ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-[#8ab4f8]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-[#25262a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#383b40] p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-xs font-semibold text-slate-400 dark:text-[#9aa0a6] uppercase tracking-wider">
            Städte & Regionen
          </div>

          {PRESET_SCENARIOS.map((scenario) => {
            const isSelected = activeScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => {
                  onSelectScenario(scenario);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-[#8ab4f8] font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-[#34373c] text-slate-700 dark:text-[#e3e3e3] border border-transparent'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8] shrink-0" />
                    <span className="text-xs font-bold">{scenario.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] font-normal mt-0.5 leading-snug line-clamp-2">
                    {scenario.description}
                  </p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
