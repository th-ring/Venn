import React from 'react';
import { FallbackSuggestion } from '../types';
import { AlertTriangle, ArrowUpRight, Lightbulb } from 'lucide-react';

interface FallbackAlertProps {
  suggestions: FallbackSuggestion[];
  onApplySuggestion: (suggestion: FallbackSuggestion) => void;
}

export const FallbackAlert: React.FC<FallbackAlertProps> = ({
  suggestions,
  onApplySuggestion,
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      id="fallback-empty-alert"
      className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/50 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 rounded-xl mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
            <span>Keine gemeinsame Schnittmenge</span>
          </h4>
          <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mb-3 leading-relaxed">
            Mit den aktuellen Parametern überschneiden sich die Erreichbarkeitspolygone noch nicht.
            Hier sind automatische Optimierungsvorschläge:
          </p>

          <div className="space-y-2">
            {suggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="bg-white/90 dark:bg-[#282a2c] border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800 dark:text-[#e3e3e3] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>{sugg.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-[#9aa0a6] mt-0.5 leading-normal">
                    {sugg.description}
                  </div>
                </div>

                <button
                  id={`btn-apply-suggestion-${sugg.id}`}
                  type="button"
                  onClick={() => onApplySuggestion(sugg)}
                  className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-full shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Anwenden</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
