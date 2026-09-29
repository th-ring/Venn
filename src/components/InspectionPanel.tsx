import React, { useState, useEffect } from 'react';
import { InspectionPoint, TransportMode, CommuteEstimate, PersonProfile, CommuteSchedule, ApartmentListing } from '../types';
import { ApartmentListSection } from './apartments/ApartmentListSection';
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
  Scale,
  Home,
  ExternalLink,
  ChevronLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { getRentalChoroplethColor } from '../services/rentalService';

interface InspectionPanelProps {
  inspection: InspectionPoint | null;
  onClose: () => void;
  showRentalInfo?: boolean;
  allListings?: ApartmentListing[];
  intersectionFeature?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  profiles?: PersonProfile[];
  schedule?: CommuteSchedule;
  onSelectApartment?: (apartment: ApartmentListing | null) => void;
  onOpenApartmentManager?: () => void;
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

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  inspection,
  onClose,
  showRentalInfo = false,
  allListings = [],
  intersectionFeature = null,
  profiles = [],
  schedule,
  onSelectApartment,
  onOpenApartmentManager,
}) => {
  const [expandedPersonIds, setExpandedPersonIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'apartments' | 'commute'>('commute');
  const [imageError, setImageError] = useState(false);

  // If entering an intersection inspection, default to apartments tab initially
  useEffect(() => {
    if (inspection?.isIntersectionInspection) {
      setActiveTab('apartments');
    } else {
      setActiveTab('commute');
    }
  }, [inspection?.lat, inspection?.lng, inspection?.isIntersectionInspection]);

  if (!inspection) return null;

  const isIdealLocation = inspection.allWithinLimit;
  const selectedApt = inspection.selectedApartment;

  const toggleExpand = (personId: string) => {
    setExpandedPersonIds((prev) => ({
      ...prev,
      [personId]: !prev[personId],
    }));
  };

  const handleSelectApt = (apt: ApartmentListing) => {
    if (onSelectApartment) {
      onSelectApartment(apt);
    }
  };

  const handleClearSelectedApt = () => {
    if (onSelectApartment) {
      onSelectApartment(null);
    }
  };

  return (
    <div
      id="inspection-detail-panel"
      className="bg-white dark:bg-[#1e1f20] rounded-t-3xl sm:rounded-2xl border border-slate-200/90 dark:border-[#3c4043] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-lg w-full flex flex-col max-h-[78dvh] sm:max-h-[85vh]"
    >
      {/* Mobile Top Grabber Pill */}
      <div className="w-10 h-1 bg-slate-300 dark:bg-[#5f6368] rounded-full mx-auto my-1.5 sm:hidden shrink-0" />

      {/* Header (Fixed at top) */}
      <div
        className={`px-4 py-3 border-b flex items-start justify-between gap-3 shrink-0 ${
          isIdealLocation
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/60'
            : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/60'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5">
            {selectedApt ? (
              <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                <Home className="w-4 h-4" />
              </div>
            ) : isIdealLocation ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-bold truncate ${
                  isIdealLocation ? 'text-emerald-900 dark:text-emerald-300' : 'text-amber-900 dark:text-amber-300'
                }`}
              >
                {selectedApt
                  ? 'Wohnungs-Fahrzeiten'
                  : inspection.isIntersectionInspection
                  ? 'Gemeinsamer Treffbereich'
                  : 'Außerhalb der Schnittmenge'}
              </h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isIdealLocation
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                }`}
              >
                {isIdealLocation
                  ? 'Alle im Zeitbudget'
                  : `${inspection.withinLimitCount}/${inspection.activePersonsCount} im Limit`}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#c4c7c5] flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-slate-400 dark:text-[#9aa0a6] shrink-0" />
              <span className="truncate">
                {selectedApt
                  ? `${selectedApt.address}${selectedApt.district ? ` · ${selectedApt.district}` : ''}`
                  : inspection.isIntersectionInspection && inspection.intersectionStats?.centerAddress
                  ? `Mitte: ${inspection.intersectionStats.centerAddress}`
                  : inspection.address || `${inspection.lat.toFixed(4)}, ${inspection.lng.toFixed(4)}`}
              </span>
            </p>
          </div>
        </div>

        <button
          id="btn-close-inspector"
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-[#9aa0a6] hover:text-slate-600 dark:hover:text-[#e3e3e3] hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="overflow-y-auto flex-1 touch-scroll-y overscroll-contain">
        {/* Warning/Clarification Banner if outside intersection */}
        {!isIdealLocation && (
          <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-800/50 px-4 py-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 leading-tight">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Dieser Punkt liegt nicht in der gemeinsamen Schnittmenge, weil mindestens ein Ziel das Zeitbudget überschreitet.
            </span>
          </div>
        )}

      {/* Selected Apartment Hero Card (when an apartment is explicitly selected) */}
      {selectedApt && (
        <div className="bg-slate-50/90 dark:bg-[#1a1b1c] border-b border-slate-200 dark:border-[#3c4043] p-3 animate-in fade-in duration-150">
          <div className="flex gap-3">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-[#282a2c] shrink-0 relative">
              {selectedApt.thumbnailUrl && !imageError ? (
                <img
                  src={selectedApt.thumbnailUrl}
                  alt={selectedApt.title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Home className="w-6 h-6" />
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {selectedApt.priceWarm || selectedApt.priceCold} €
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Ausgewählte Wohnung
                  </span>
                  {selectedApt.url && (
                    <a
                      href={selectedApt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
                    >
                      <span>Exposé</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {selectedApt.title}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                  {selectedApt.rooms} Zi. • {selectedApt.sizeSqm} m² • {selectedApt.address}
                </p>
              </div>

              {selectedApt.features && selectedApt.features.length > 0 && (
                <div className="flex items-center gap-1 mt-1 overflow-hidden flex-wrap">
                  {selectedApt.features.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="text-[9px] px-1.5 py-0.2 bg-white dark:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] rounded border border-slate-200 dark:border-[#3c4043]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleClearSelectedApt}
                className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:text-[#9aa0a6] dark:hover:text-white flex items-center gap-1 mt-1 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Zurück zur Gebietsübersicht</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Area Pair-Average & Balance Card (when evaluating intersection area) */}
      {!selectedApt && inspection.isIntersectionInspection && inspection.intersectionStats && (
        <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-200/70 dark:border-emerald-800/60 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Paar-Mittelwert (Mitte)
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
                  Flächenauswertung
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 truncate">
                Fläche ca. {inspection.intersectionStats.areaKm2} km² · Ausgewogene Mitte
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-emerald-900 dark:text-white flex items-baseline justify-end gap-1">
              <span>Ø {inspection.intersectionStats.avgCommuteMinutes} Min</span>
              {inspection.intersectionStats.commuteSpreadMinutes > 0 && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  ± {inspection.intersectionStats.commuteSpreadMinutes}m
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-700/90 dark:text-emerald-400 font-medium">
              {inspection.activePersonsCount === 2
                ? 'Differenz zw. beiden Orten'
                : 'Spreizung zw. Zielorten'}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation (when inside intersection area) */}
      {inspection.isIntersectionInspection && (
        <div className="flex items-center border-b border-slate-200 dark:border-[#3c4043] bg-slate-50/70 dark:bg-[#18191a] px-3 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('apartments')}
            className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'apartments'
                ? 'border-rose-500 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9aa0a6] dark:hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Wohnungsangebote</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commute')}
            className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'commute'
                ? 'border-blue-600 text-blue-600 dark:border-[#8ab4f8] dark:text-[#8ab4f8]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9aa0a6] dark:hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Fahrzeiten & Routen</span>
          </button>
        </div>
      )}

      {/* TAB 1: APARTMENTS LIST */}
      {activeTab === 'apartments' && inspection.isIntersectionInspection && (
        <div className="p-3 bg-white dark:bg-[#1e1f20]">
          <ApartmentListSection
            listings={allListings}
            intersection={intersectionFeature}
            intersectionStats={inspection.intersectionStats}
            profiles={profiles}
            schedule={schedule || { direction: 'to_work', dayOfWeek: 'workday', time: '07:00', options: { liveTraffic: false, enableSmoothing: true, fidelity: 'AUTOMATIC' } }}
            selectedApartmentId={selectedApt?.id}
            onSelectApartment={handleSelectApt}
            onOpenImportModal={onOpenApartmentManager}
          />
        </div>
      )}

      {/* TAB 2: COMMUTE & RENTAL DETAILS */}
      {(activeTab === 'commute' || !inspection.isIntersectionInspection) && (
        <>
          {/* Mietspiegel / Rental District Card (only shown when rental overlay is active) */}
          {showRentalInfo && inspection.rentalInfo && (
            <div className="bg-slate-50/80 dark:bg-[#282a2c]/60 border-b border-slate-200/80 dark:border-[#3c4043] p-3 flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
                style={{
                  backgroundColor: getRentalChoroplethColor(inspection.rentalInfo.avgRentColdSqm),
                }}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {inspection.rentalInfo.name} (Bezirk {inspection.rentalInfo.districtNumber})
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${getRentalChoroplethColor(inspection.rentalInfo.avgRentColdSqm)}22`,
                      color: getRentalChoroplethColor(inspection.rentalInfo.avgRentColdSqm),
                    }}
                  >
                    Ø {inspection.rentalInfo.avgRentColdSqm.toFixed(2)} €/m² Kaltmiete
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                  Amtliche Spanne: {inspection.rentalInfo.minRentColdSqm.toFixed(2)} –{' '}
                  {inspection.rentalInfo.maxRentColdSqm.toFixed(2)} €/m² • {inspection.rentalInfo.qualityLabel}
                </p>
              </div>
            </div>
          )}

          {/* Commute Estimates List */}
          <div className="p-3 max-h-[360px] overflow-y-auto space-y-2.5 touch-scroll-y">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#9aa0a6] px-1 flex items-center justify-between">
              <span>Fahrzeiten der Profile</span>
              <span className="font-normal text-[10px]">
                {inspection.isIntersectionInspection ? 'Ab Mitte des Treffbereichs' : 'Direktroute ab Klickpunkt'}
              </span>
            </div>

            <div className="space-y-2">
              {inspection.estimates.map((est) => {
                const Icon = MODE_ICONS[est.mode] || Train;
                const bufferMinutes = est.limitMinutes - (est.centerMinutes ?? est.travelTimeMinutes);
                const isExpanded = expandedPersonIds[est.personId];

                return (
                  <div
                    key={est.personId}
                    className="rounded-xl border border-slate-200/90 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] overflow-hidden"
                  >
                    <div
                      onClick={() => toggleExpand(est.personId)}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-[#282a2c]/60 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: est.personColor }}
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3] truncate">
                            {est.personName}
                          </h5>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                            <Icon className="w-3 h-3 text-slate-500 dark:text-[#9aa0a6]" />
                            <span>{MODE_NAMES[est.mode]}</span>
                            <span>•</span>
                            <span>
                              {inspection.isIntersectionInspection && est.centerDistanceKm !== undefined
                                ? `Ø ${est.centerDistanceKm} km`
                                : `${est.distanceKm} km`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                          <span
                            className={`text-sm font-bold ${
                              est.isWithinLimit ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {inspection.isIntersectionInspection && est.centerMinutes !== undefined
                              ? `${est.centerMinutes}${est.spanPlusMinus ? ` ± ${est.spanPlusMinus}` : ''}`
                              : est.travelTimeMinutes}{' '}
                            Min
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6]">
                            / max. {est.limitMinutes}m
                          </span>
                        </div>
                        <div
                          className={`text-[10px] font-medium ${
                            est.isWithinLimit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {inspection.isIntersectionInspection && est.minMinutes !== undefined && est.maxMinutes !== undefined
                            ? `Spanne: ${est.minMinutes} – ${est.maxMinutes} Min`
                            : bufferMinutes >= 0
                            ? `${bufferMinutes} Min Puffer`
                            : `+${Math.abs(bufferMinutes)} Min über Limit`}
                        </div>
                      </div>
                    </div>

                    {/* Unserviced Fallback Warning Badge */}
                    {est.details?.isFallback && (
                      <div className="mx-2.5 mb-2 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Näherungsberechnung (keine Haltestelle im Einzugsbereich)</span>
                      </div>
                    )}

                    {/* Step by step stages */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-[#3c4043] bg-slate-50/80 dark:bg-[#131314] text-xs space-y-2 animate-in fade-in duration-150">
                        {est.details?.isFallback && est.details.fallbackReason && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{est.details.fallbackReason}</span>
                          </div>
                        )}

                        <div className="text-[11px] font-medium text-slate-600 dark:text-[#9aa0a6] flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-blue-600 dark:text-[#8ab4f8]" />
                          <span>
                            {inspection.isIntersectionInspection
                              ? 'Routen-Etappen & Zeitaufteilung ab Mittelpunkt:'
                              : 'Routen-Etappen & Zeitaufteilung:'}
                          </span>
                        </div>

                        {est.details?.steps && est.details.steps.length > 0 ? (
                          <div className="space-y-1.5 pl-1">
                            {est.details.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-[#c4c7c5]"
                              >
                                <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic">
                            Direktverbindung ohne Zwischenhalte.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};
