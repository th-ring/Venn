import React, { useState, useRef, useEffect } from 'react';
import { PresetScenario } from '../types';
import { PRESET_SCENARIOS } from '../data/presets';
import { MapPin, ChevronDown, Check, Sparkles } from 'lucide-react';

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
      <button
        id="btn-preset-selector"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs group"
        title="Beispielszenario für eine Stadt laden"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-500 font-medium">Szenario:</span>
          <span className="text-slate-800 font-bold truncate">
            {activeScenario ? activeScenario.name : 'München & Region (Standard)'}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Vorkonfigurierte Städte-Szenarien
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
                    ? 'bg-blue-50/80 border border-blue-200 text-blue-950 font-bold'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold">{scenario.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug line-clamp-2">
                    {scenario.description}
                  </p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
