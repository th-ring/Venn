import React, { useState } from 'react';
import { InspectionPoint, TransportMode, CommuteEstimate } from '../types';
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
  ChevronDown,
  ChevronUp,
  Navigation,
  CornerDownRight,
  ShieldAlert,
  ShieldCheck,
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
  const [expandedPersonIds, setExpandedPersonIds] = useState<Record<string, boolean>>({});

  if (!inspection) return null;

  const isIdealLocation = inspection.allWithinLimit;

  const toggleExpand = (personId: string) => {
    setExpandedPersonIds((prev) => ({
      ...prev,
      [personId]: !prev[personId],
    }));
  };

  return (
    <div
      id="inspection-detail-panel"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-md w-full"
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-start justify-between gap-3 ${
          isIdealLocation
            ? 'bg-emerald-50/90 border-emerald-100'
            : 'bg-amber-50/90 border-amber-200/70'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5">
            {isIdealLocation ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-bold ${
                  isIdealLocation ? 'text-emerald-900' : 'text-amber-900'
                }`}
              >
                {isIdealLocation
                  ? 'Gemeinsamer Wohnort (Ideal)'
                  : 'Außerhalb der Schnittmenge'}
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isIdealLocation
                    ? 'bg-emerald-200/80 text-emerald-800'
                    : 'bg-amber-200/80 text-amber-800'
                }`}
              >
                {isIdealLocation
                  ? '100% Match'
                  : `${inspection.withinLimitCount}/${inspection.activePersonsCount} im Limit`}
              </span>
            </div>
            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{inspection.address || `${inspection.lat.toFixed(4)}, ${inspection.lng.toFixed(4)}`}</span>
            </p>
          </div>
        </div>

        <button
          id="btn-close-inspector"
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Warning/Clarification Banner if outside intersection */}
      {!isIdealLocation && (
        <div className="bg-amber-500/10 border-b border-amber-200/60 px-4 py-2 text-[11px] text-amber-800 flex items-center gap-1.5 leading-tight">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            Dieser Punkt liegt nicht in der gemeinsamen Schnittmenge, weil mindestens ein Ziel das Zeitbudget überschreitet.
          </span>
        </div>
      )}

      {/* Breakdown Table */}
      <div className="p-3.5 space-y-2 max-h-[70vh] overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Fahrzeiten & Routen-Details:</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal lowercase">Klick für Details</span>
        </div>

        <div className="space-y-2">
          {inspection.estimates.map((est) => {
            const Icon = MODE_ICONS[est.mode] || Car;
            const bufferMinutes = est.limitMinutes - est.travelTimeMinutes;
            const isExpanded = !!expandedPersonIds[est.personId];

            return (
              <div
                key={est.personId}
                className={`rounded-xl border transition-all overflow-hidden ${
                  est.isWithinLimit
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-rose-200/80 bg-rose-50/30 hover:border-rose-300'
                }`}
              >
                {/* Person Header Card */}
                <button
                  type="button"
                  onClick={() => toggleExpand(est.personId)}
                  className="w-full text-left p-2.5 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: est.personColor }}
                    />
                    <div className="min-w-0 truncate">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {est.personName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Icon className="w-3 h-3 text-slate-500" />
                        <span>{MODE_NAMES[est.mode]}</span>
                        <span>•</span>
                        <span>{est.distanceKm} km</span>
                        {est.details?.summary && (
                          <>
                            <span>•</span>
                            <span className="truncate text-slate-600 font-medium max-w-[130px]">
                              {est.details.summary}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="flex items-baseline justify-end gap-1">
                        <span
                          className={`font-black text-sm ${
                            est.isWithinLimit ? 'text-slate-900' : 'text-rose-600'
                          }`}
                        >
                          {est.travelTimeMinutes} Min
                        </span>
                        <span className="text-[10px] text-slate-400">/ max. {est.limitMinutes}m</span>
                      </div>

                      <div
                        className={`text-[10px] font-bold ${
                          est.isWithinLimit ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {bufferMinutes >= 0
                          ? `${bufferMinutes} Min Puffer`
                          : `+${Math.abs(bufferMinutes)} Min über Limit`}
                      </div>
                    </div>

                    <div className="text-slate-400 p-1 rounded-md hover:bg-slate-100">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expandable Route Details Drawer */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/80 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-blue-600" />
                      <span>Routen-Etappen & Zeitaufteilung:</span>
                    </div>

                    {est.details?.steps && est.details.steps.length > 0 ? (
                      <div className="space-y-1.5 pl-1">
                        {est.details.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 leading-tight">
                            <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 pl-1">
                        Reisezeit berechnet über Wegstrecke ({est.distanceKm} km).
                      </div>
                    )}

                    {/* Transit Lines Badges */}
                    {est.details?.linesUsed && est.details.linesUsed.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-semibold">Genutzte Linien:</span>
                        {est.details.linesUsed.map((line) => (
                          <span
                            key={line}
                            className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200"
                          >
                            {line}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sub-breakdown if available */}
                    {est.details?.firstMileStationName && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                        <div>
                          <div className="text-slate-400 font-medium">1. Start-Fußweg</div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span
                              className={`font-bold ${
                                est.details.firstMileWalkLimitMin &&
                                est.details.firstMileWalkMin !== undefined &&
                                est.details.firstMileWalkMin > est.details.firstMileWalkLimitMin
                                  ? 'text-rose-600 font-black'
                                  : 'text-slate-800'
                              }`}
                            >
                              {est.details.firstMileWalkMin} Min
                            </span>
                            {est.details.firstMileWalkLimitMin && (
                              <span className="text-[9px] text-slate-400">
                                / max. {est.details.firstMileWalkLimitMin}m
                              </span>
                            )}
                          </div>
                          <div className="truncate text-slate-500 text-[9px] mt-0.5" title={est.details.firstMileStationName}>
                            ➔ {est.details.firstMileStationName}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">2. Fahrt & Umstieg</div>
                          <div className="font-bold text-slate-800 mt-0.5">{est.details.inVehicleMin} Min</div>
                          <div className="text-slate-500 text-[9px] mt-0.5">
                            {est.details.transfersCount === 0
                              ? 'Direktfahrt'
                              : `${est.details.transfersCount} ${est.details.transfersCount === 1 ? 'Umstieg' : 'Umstiege'}`}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">3. Ziel-Fußweg</div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span
                              className={`font-bold ${
                                est.details.lastMileWalkLimitMin &&
                                est.details.lastMileWalkMin !== undefined &&
                                est.details.lastMileWalkMin > est.details.lastMileWalkLimitMin
                                  ? 'text-rose-600 font-black'
                                  : 'text-slate-800'
                              }`}
                            >
                              {est.details.lastMileWalkMin} Min
                            </span>
                            {est.details.lastMileWalkLimitMin && (
                              <span className="text-[9px] text-slate-400">
                                / max. {est.details.lastMileWalkLimitMin}m
                              </span>
                            )}
                          </div>
                          <div className="truncate text-slate-500 text-[9px] mt-0.5" title={est.details.lastMileStationName}>
                            ab {est.details.lastMileStationName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
