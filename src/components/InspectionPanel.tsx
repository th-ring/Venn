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
  Building2,
} from 'lucide-react';
import { getRentalChoroplethColor } from '../services/rentalService';

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
      className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-[#3c4043] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-md w-full"
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-start justify-between gap-3 ${
          isIdealLocation
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/60'
            : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/60'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5">
            {isIdealLocation ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-bold ${
                  isIdealLocation ? 'text-emerald-900 dark:text-emerald-300' : 'text-amber-900 dark:text-amber-300'
                }`}
              >
                {isIdealLocation
                  ? 'Gemeinsamer Wohnort (Ideal)'
                  : 'Außerhalb der Schnittmenge'}
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isIdealLocation
                    ? 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                }`}
              >
                {isIdealLocation
                  ? '100% Match'
                  : `${inspection.withinLimitCount}/${inspection.activePersonsCount} im Limit`}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#c4c7c5] flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-slate-400 dark:text-[#9aa0a6] shrink-0" />
              <span className="truncate">{inspection.address || `${inspection.lat.toFixed(4)}, ${inspection.lng.toFixed(4)}`}</span>
            </p>
          </div>
        </div>

        <button
          id="btn-close-inspector"
          type="button"
          onClick={onClose}
          className="text-slate-400 dark:text-[#9aa0a6] hover:text-slate-600 dark:hover:text-[#e3e3e3] p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Warning/Clarification Banner if outside intersection */}
      {!isIdealLocation && (
        <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-800/50 px-4 py-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 leading-tight">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Dieser Punkt liegt nicht in der gemeinsamen Schnittmenge, weil mindestens ein Ziel das Zeitbudget überschreitet.
          </span>
        </div>
      )}

      {/* Mietspiegel / Rental District Card */}
      {inspection.rentalInfo && (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-[#1e1f20] dark:to-blue-950/20 border-b border-slate-200/80 dark:border-[#3c4043] p-3 flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-[#8ab4f8] shrink-0 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-800 dark:text-[#e3e3e3] truncate" title={inspection.rentalInfo.name}>
                {inspection.rentalInfo.name} <span className="text-slate-400 dark:text-[#9aa0a6] font-normal">({inspection.rentalInfo.districtNumber})</span>
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: `${getRentalChoroplethColor(inspection.rentalInfo.avgRentColdSqm)}20`,
                  color: getRentalChoroplethColor(inspection.rentalInfo.avgRentColdSqm),
                }}
              >
                {inspection.rentalInfo.qualityLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                Ø {inspection.rentalInfo.avgRentColdSqm.toFixed(2)} €/m²
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">
                Spanne: {inspection.rentalInfo.minRentColdSqm.toFixed(2)} – {inspection.rentalInfo.maxRentColdSqm.toFixed(2)} €
              </span>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-[#9aa0a6] mt-0.5 flex items-center justify-between">
              <span>{inspection.rentalInfo.source}</span>
              <span className="font-semibold text-slate-500 dark:text-[#9aa0a6]">Kaltmiete</span>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Table */}
      <div className="p-3.5 space-y-2 max-h-[70vh] overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500 dark:text-[#9aa0a6]" />
            <span>Fahrzeiten & Routen-Details:</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6] font-normal lowercase">Klick für Details</span>
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
                    ? 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:border-slate-300 dark:hover:border-[#5f6368]'
                    : 'border-rose-200/80 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-700'
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
                      <div className="font-bold text-xs text-slate-900 dark:text-[#e3e3e3] truncate">
                        {est.personName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1 mt-0.5">
                        <Icon className="w-3 h-3 text-slate-500 dark:text-[#9aa0a6]" />
                        <span>{MODE_NAMES[est.mode]}</span>
                        <span>•</span>
                        <span>{est.distanceKm} km</span>
                        {est.details?.summary && (
                          <>
                            <span>•</span>
                            <span className="truncate text-slate-600 dark:text-[#c4c7c5] font-medium max-w-[130px]">
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
                            est.isWithinLimit ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {est.travelTimeMinutes} Min
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6]">/ max. {est.limitMinutes}m</span>
                      </div>

                      <div
                        className={`text-[10px] font-bold ${
                          est.isWithinLimit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {bufferMinutes >= 0
                          ? `${bufferMinutes} Min Puffer`
                          : `+${Math.abs(bufferMinutes)} Min über Limit`}
                      </div>
                    </div>

                    <div className="text-slate-400 dark:text-[#9aa0a6] p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#3c4043]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expandable Route Details Drawer */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-[#3c4043] bg-slate-50/80 dark:bg-[#131314] text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#9aa0a6] tracking-wider flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-blue-600 dark:text-[#8ab4f8]" />
                      <span>Routen-Etappen & Zeitaufteilung:</span>
                    </div>

                    {est.details?.steps && est.details.steps.length > 0 ? (
                      <div className="space-y-1.5 pl-1">
                        {est.details.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-[#c4c7c5] leading-tight">
                            <CornerDownRight className="w-3 h-3 text-slate-400 dark:text-[#9aa0a6] shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] pl-1">
                        Reisezeit berechnet über Wegstrecke ({est.distanceKm} km).
                      </div>
                    )}

                    {/* Transit Lines Badges */}
                    {est.details?.linesUsed && est.details.linesUsed.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <span className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-semibold">Genutzte Linien:</span>
                        {est.details.linesUsed.map((line) => (
                          <span
                            key={line}
                            className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800"
                          >
                            {line}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sub-breakdown if available */}
                    {est.details?.firstMileStationName && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] text-slate-600 dark:text-[#c4c7c5] bg-white dark:bg-[#1e1f20] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
                        <div>
                          <div className="text-slate-400 dark:text-[#9aa0a6] font-medium">1. Start-Fußweg</div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span
                              className={`font-bold ${
                                est.details.firstMileWalkLimitMin &&
                                est.details.firstMileWalkMin !== undefined &&
                                est.details.firstMileWalkMin > est.details.firstMileWalkLimitMin
                                  ? 'text-rose-600 dark:text-rose-400 font-black'
                                  : 'text-slate-800 dark:text-[#e3e3e3]'
                              }`}
                            >
                              {est.details.firstMileWalkMin} Min
                            </span>
                            {est.details.firstMileWalkLimitMin && (
                              <span className="text-[9px] text-slate-400 dark:text-[#9aa0a6]">
                                / max. {est.details.firstMileWalkLimitMin}m
                              </span>
                            )}
                          </div>
                          <div className="truncate text-slate-500 dark:text-[#9aa0a6] text-[9px] mt-0.5" title={est.details.firstMileStationName}>
                            ➔ {est.details.firstMileStationName}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 dark:text-[#9aa0a6] font-medium">2. Fahrt & Umstieg</div>
                          <div className="font-bold text-slate-800 dark:text-[#e3e3e3] mt-0.5">{est.details.inVehicleMin} Min</div>
                          <div className="text-slate-500 dark:text-[#9aa0a6] text-[9px] mt-0.5">
                            {est.details.transfersCount === 0
                              ? 'Direktfahrt'
                              : `${est.details.transfersCount} ${est.details.transfersCount === 1 ? 'Umstieg' : 'Umstiege'}`}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 dark:text-[#9aa0a6] font-medium">3. Ziel-Fußweg</div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span
                              className={`font-bold ${
                                est.details.lastMileWalkLimitMin &&
                                est.details.lastMileWalkMin !== undefined &&
                                est.details.lastMileWalkMin > est.details.lastMileWalkLimitMin
                                  ? 'text-rose-600 dark:text-rose-400 font-black'
                                  : 'text-slate-800 dark:text-[#e3e3e3]'
                              }`}
                            >
                              {est.details.lastMileWalkMin} Min
                            </span>
                            {est.details.lastMileWalkLimitMin && (
                              <span className="text-[9px] text-slate-400 dark:text-[#9aa0a6]">
                                / max. {est.details.lastMileWalkLimitMin}m
                              </span>
                            )}
                          </div>
                          <div className="truncate text-slate-500 dark:text-[#9aa0a6] text-[9px] mt-0.5" title={est.details.lastMileStationName}>
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
