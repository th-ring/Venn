import React from 'react';
import { InspectionPoint, TransportMode } from '../types';
import {
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Train,
  Car,
  Bike,
  Footprints,
  Clock,
} from 'lucide-react';

interface InspectionPanelProps {
  inspection: InspectionPoint | null;
  onClose: () => void;
}

const MODE_ICONS: Record<TransportMode, React.ComponentType<{ className?: string }>> = {
  transit: Train,
  driving: Car,
  cycling: Bike,
  walking: Footprints,
};

const MODE_NAMES: Record<TransportMode, string> = {
  transit: 'ÖPNV',
  driving: 'Pkw',
  cycling: 'Fahrrad',
  walking: 'Zu Fuß',
};

export const InspectionPanel: React.FC<InspectionPanelProps> = ({ inspection, onClose }) => {
  if (!inspection) return null;

  const isIdealLocation = inspection.allWithinLimit;

  return (
    <div
      id="inspection-detail-panel"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-start justify-between gap-3 ${
          isIdealLocation
            ? 'bg-emerald-50/80 border-emerald-100'
            : 'bg-amber-50/80 border-amber-100'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">
            {isIdealLocation ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4
                className={`text-sm font-bold ${
                  isIdealLocation ? 'text-emerald-900' : 'text-amber-900'
                }`}
              >
                {isIdealLocation
                  ? 'Gemeinsamer Wohnort (Ideal)'
                  : `${inspection.withinLimitCount} von ${inspection.activePersonsCount} Zielen erreichbar`}
              </h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isIdealLocation
                    ? 'bg-emerald-200/80 text-emerald-800'
                    : 'bg-amber-200/80 text-amber-800'
                }`}
              >
                {isIdealLocation ? '100% Match' : 'Teilweise'}
              </span>
            </div>
            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate max-w-xs">{inspection.address || `${inspection.lat.toFixed(4)}, ${inspection.lng.toFixed(4)}`}</span>
            </p>
          </div>
        </div>

        <button
          id="btn-close-inspector"
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-colors"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Breakdown Table */}
      <div className="p-3">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>Fahrzeiten von diesem Punkt zu den Zielorten:</span>
        </div>

        <div className="divide-y divide-slate-100">
          {inspection.estimates.map((est) => {
            const Icon = MODE_ICONS[est.mode] || Car;
            const bufferMinutes = est.limitMinutes - est.travelTimeMinutes;

            return (
              <div
                key={est.personId}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: est.personColor }}
                  />
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 truncate">{est.personName}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Icon className="w-3 h-3 text-slate-500" />
                      <span>{MODE_NAMES[est.mode]}</span>
                      <span>•</span>
                      <span>{est.distanceKm} km</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className={`font-bold text-sm ${
                        est.isWithinLimit ? 'text-slate-900' : 'text-rose-600'
                      }`}
                    >
                      {est.travelTimeMinutes} Min
                    </span>
                    <span className="text-[11px] text-slate-400">/ max. {est.limitMinutes}m</span>
                  </div>

                  <div
                    className={`text-[10px] font-medium ${
                      est.isWithinLimit ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {bufferMinutes >= 0
                      ? `${bufferMinutes} Min Puffer`
                      : `+${Math.abs(bufferMinutes)} Min über Limit`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
