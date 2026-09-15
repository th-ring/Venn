import React, { useState } from 'react';
import { IsochroneFallbackAlert, TransportMode } from '../types';
import type { SettingsTabId } from './settings/SettingsModal';
import {
  AlertOctagon,
  Settings,
  RefreshCw,
  X,
  Car,
  Bike,
  Footprints,
  Train,
} from 'lucide-react';

interface FallbackWarningBannerProps {
  alerts?: IsochroneFallbackAlert[];
  onOpenSettings: (tab?: SettingsTabId) => void;
  onRetry: () => void;
}

const MODE_ICONS: Record<TransportMode, React.ComponentType<{ className?: string }>> = {
  driving: Car,
  cycling: Bike,
  walking: Footprints,
  transit: Train,
};

export const FallbackWarningBanner: React.FC<FallbackWarningBannerProps> = ({
  alerts,
  onOpenSettings,
  onRetry,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  if (!alerts || alerts.length === 0 || isDismissed) {
    return null;
  }

  const handleRetryClick = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  return (
    <aside
      id="fallback-warning-banner"
      aria-label="Hinweis: Eingeschränkte Isochronen-Berechnung"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-xl bg-white dark:bg-[#282a2c] border border-amber-200/80 dark:border-amber-700/50 text-slate-800 dark:text-[#e3e3e3] rounded-2xl shadow-xl p-3.5 sm:p-4 animate-in slide-in-from-top-3 duration-200 pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5 border border-amber-200/60 dark:border-amber-800/40">
            <AlertOctagon className="w-4 h-4 stroke-2" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Eingeschränkte Isochronen-Berechnung
              </h3>
              <span className="text-[10px] font-medium bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60">
                Offline-Modell
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#9aa0a6] mt-1 leading-relaxed">
              Für mindestens einen Standort konnte der Online-Dienst nicht berechnet werden.
              Betroffene Zonen werden näherungsweise abgebildet.
            </p>

            {/* Error details list */}
            <div className="mt-2.5 space-y-1.5 bg-slate-50 dark:bg-[#1e1f20] rounded-xl p-2.5 border border-slate-200/70 dark:border-[#3c4043] text-xs">
              {alerts.map((alert, idx) => {
                const ModeIcon = MODE_ICONS[alert.mode] || Car;
                return (
                  <div key={`${alert.personId}-${idx}`} className="flex items-start gap-2 text-slate-700 dark:text-[#c4c7c5]">
                    <ModeIcon className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6] shrink-0 mt-0.5" />
                    <div className="min-w-0 leading-snug">
                      <span className="font-semibold text-slate-900 dark:text-white">{alert.personName}: </span>
                      <span className="text-slate-600 dark:text-[#9aa0a6]">{alert.reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenSettings('keys')}
                className="bg-white dark:bg-[#202124] hover:bg-slate-50 dark:hover:bg-[#303134] text-slate-700 dark:text-[#e3e3e3] font-medium text-xs px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-[#5f6368] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6]" />
                <span>API-Keys konfigurieren</span>
              </button>

              <button
                type="button"
                onClick={handleRetryClick}
                disabled={isRetrying}
                className="bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124] font-medium text-xs px-3.5 py-1.5 rounded-full shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Wird berechnet...' : 'Erneut versuchen'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-slate-600 dark:text-[#9aa0a6] dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#3c4043] transition-colors cursor-pointer shrink-0"
          title="Hinweis schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};