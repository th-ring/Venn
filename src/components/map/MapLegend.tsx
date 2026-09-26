import React, { useState } from 'react';
import { PersonProfile } from '../../types';
import { getProfileLineSignature } from '../../services/mapPatterns';
import { Info, ChevronDown, ChevronUp, Layers, MousePointerClick } from 'lucide-react';

interface MapLegendProps {
  profiles: PersonProfile[];
  hasIntersection: boolean;
  intersectionAreaKm2?: number;
  onlyResidential: boolean;
}

/**
 * Responsive Map Legend Component (DIN EN ISO 9241-110 & WCAG 1.4.1)
 * Explains the meaning of reachability zones, line patterns, and the sweetspot intersection
 * to non-expert users in an intuitive, self-descriptive manner.
 */
export const MapLegend: React.FC<MapLegendProps> = ({
  profiles,
  hasIntersection,
  intersectionAreaKm2,
  onlyResidential,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeProfiles = profiles.filter((p) => p.visible);

  return (
    <div className="absolute bottom-6 left-3 sm:left-4 z-20">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-label="Kartenlegende öffnen"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md shadow-md border border-slate-200/90 dark:border-[#3c4043] text-xs font-semibold text-slate-800 dark:text-[#e3e3e3] hover:bg-slate-50 dark:hover:bg-[#282a2c] transition-all cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
          <span>Legende</span>
        </button>
      ) : (
        <div
          role="region"
          aria-label="Kartenlegende"
          className="bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-[#3c4043] p-3 sm:p-3.5 w-64 sm:w-72 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-[#3c4043]">
            <span className="font-bold text-slate-900 dark:text-[#f1f3f4] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
              Kartenlegende
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Kartenlegende schließen"
              className="text-slate-400 hover:text-slate-600 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] p-0.5 rounded cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Golden Intersection explanation */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-emerald-500/30 border-2 border-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-xs" />
              </span>
              <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">
                {onlyResidential ? 'Wohnbereich (Schnittmenge)' : 'Gemeinsame Zone'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] pl-6 leading-tight">
              {hasIntersection
                ? `Fläche: ca. ${intersectionAreaKm2 ?? 0} km² – für alle Beteiligten erreichbar.`
                : 'Aktuell keine Überschneidung der Reisezeiten vorhanden.'}
            </p>
          </div>

          {/* Active Profiles & Signatures */}
          {activeProfiles.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-[#3c4043]">
              <span className="text-[10px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider">
                Erreichbarkeitszonen
              </span>
              <div className="space-y-1">
                {activeProfiles.map((p, idx) => {
                  const sig = getProfileLineSignature(idx);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-1 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate text-slate-700 dark:text-[#e3e3e3] font-medium">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-[#9aa0a6] shrink-0 font-mono">
                        {p.travelTimeMinutes}m ({sig.label.split(' ')[0]})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inspection tip */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-[#3c4043] flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-[#9aa0a6] leading-tight">
            <MousePointerClick className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>Klicke an einen beliebigen Ort auf der Karte, um genaue Reisezeiten zu prüfen.</span>
          </div>
        </div>
      )}
    </div>
  );
};
