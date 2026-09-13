import React, { useState } from 'react';
import { IsochroneFallbackAlert, TransportMode } from '../types';
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
  onOpenSettings: (tab?: 'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap') => void;
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
      aria-label="API-Fehler Fallback-Warnung"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-2xl bg-rose-600 border-2 border-rose-300 text-white rounded-2xl shadow-2xl p-4 sm:p-5 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 bg-white text-rose-600 rounded-xl shadow-md shrink-0 mt-0.5">
            <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Achtung: API-Fehler bei Isochrone – Offline-Fallback aktiv!
              </h3>
              <span className="text-[10px] uppercase font-black tracking-wider bg-rose-950/40 text-rose-100 px-2 py-0.5 rounded-md border border-rose-400/40">
                Warnung
              </span>
            </div>

            <p className="text-xs text-rose-100 mt-1 leading-relaxed">
              Für mindestens einen Ort konnte der gewählte Online-Dienst nicht berechnet werden.
              Die betroffenen Zonen wurden automatisch durch das <strong>grobe mathematische Offline-Modell</strong> angenähert.
            </p>

            {/* Error details list */}
            <div className="mt-2.5 space-y-1.5 bg-rose-700/80 rounded-xl p-2.5 border border-rose-500/60 text-xs">
              {alerts.map((alert, idx) => {
                const ModeIcon = MODE_ICONS[alert.mode] || Car;
                return (
                  <div key={`${alert.personId}-${idx}`} className="flex items-start gap-2">
                    <ModeIcon className="w-3.5 h-3.5 text-rose-200 shrink-0 mt-0.5" />
                    <div className="min-w-0 leading-snug">
                      <span className="font-bold text-white">{alert.personName}: </span>
                      <span className="text-rose-100">{alert.reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenSettings('keys')}
                className="bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Settings className="w-3.5 h-3.5 text-rose-600" />
                <span>API-Keys & Einstellungen prüfen</span>
              </button>

              <button
                type="button"
                onClick={handleRetryClick}
                disabled={isRetrying}
                className="bg-rose-800/80 hover:bg-rose-800 text-white font-semibold text-xs px-3 py-1.5 rounded-xl border border-rose-400/60 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
          className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-rose-700/60 transition-colors cursor-pointer shrink-0"
          title="Warnung ausblenden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};