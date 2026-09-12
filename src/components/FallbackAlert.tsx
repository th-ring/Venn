import React from 'react';
import { FallbackSuggestion } from '../types';
import { AlertTriangle, ArrowUpRight, Sparkles } from 'lucide-react';

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
      className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-1.5">
            <span>Keine gemeinsame Schnittmenge (∅)</span>
          </h4>
          <p className="text-xs text-amber-800/90 mb-3 leading-relaxed">
            Mit den aktuellen Parametern überschneiden sich die Erreichbarkeitspolygone noch nicht.
            Hier sind automatische Optimierungsvorschläge:
          </p>

          <div className="space-y-2">
            {suggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="bg-white/90 border border-amber-200/70 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>{sugg.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {sugg.description}
                  </div>
                </div>

                <button
                  id={`btn-apply-suggestion-${sugg.id}`}
                  type="button"
                  onClick={() => onApplySuggestion(sugg)}
                  className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
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
