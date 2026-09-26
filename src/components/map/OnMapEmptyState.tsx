import React from 'react';
import { FallbackSuggestion, PersonProfile } from '../../types';
import { AlertCircle, ArrowRight, Sparkles, Sliders } from 'lucide-react';

interface OnMapEmptyStateProps {
  emptyIntersection: boolean;
  activeProfiles: PersonProfile[];
  suggestions: FallbackSuggestion[];
  onApplySuggestion: (suggestion: FallbackSuggestion) => void;
  onOpenSidebar?: () => void;
}

/**
 * On-Map Empty State Guidance (DIN EN ISO 9241-110)
 * Provides immediate visual feedback and 1-click recovery actions directly on
 * the map when reachability polygons do not intersect (empty state).
 */
export const OnMapEmptyState: React.FC<OnMapEmptyStateProps> = ({
  emptyIntersection,
  activeProfiles,
  suggestions,
  onApplySuggestion,
  onOpenSidebar,
}) => {
  if (!emptyIntersection || activeProfiles.length < 2) return null;

  const topSuggestion = suggestions && suggestions.length > 0 ? suggestions[0] : null;

  return (
    <div
      role="alert"
      className="absolute top-20 sm:top-16 left-1/2 -translate-x-1/2 z-30 w-[92%] sm:w-auto max-w-lg bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-600/60 p-3.5 sm:p-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#f1f3f4] leading-tight">
              Keine gemeinsame Wohnzone gefunden
            </h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 shrink-0">
              0 km² Schnittmenge
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-[#9aa0a6] mt-1 leading-relaxed">
            Die Erreichbarkeitsbereiche überschneiden sich bei den aktuellen Fahrzeiten noch nicht.
          </p>

          {topSuggestion && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-amber-950 dark:text-amber-200 truncate">
                  {topSuggestion.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onApplySuggestion(topSuggestion)}
                className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs cursor-pointer transition-colors shrink-0"
              >
                <span>Jetzt anwenden</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
