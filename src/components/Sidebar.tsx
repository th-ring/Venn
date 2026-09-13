import React from 'react';
import {
  PersonProfile,
  CalculationResult,
  CommuteSchedule,
  FallbackSuggestion,
  BasemapProvider,
  PresetScenario,
} from '../types';
import { PersonCard } from './PersonCard';
import { CommuteSettings } from './CommuteSettings';
import { FallbackAlert } from './FallbackAlert';
import { PresetSelector } from './PresetSelector';
import {
  Users,
  Plus,
  Compass,
  Share2,
  Settings,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  Loader2,
  RefreshCw,
  Home,
  Flame,
  Focus,
} from 'lucide-react';

const PALETTE = ['#3B82F6', '#F97316', '#10B981', '#A855F7', '#EC4899', '#06B6D4', '#EAB308'];

interface SidebarProps {
  profiles: PersonProfile[];
  schedule: CommuteSchedule;
  result: CalculationResult | null;
  isCalculating: boolean;
  isPending?: boolean;
  autoUpdate?: boolean;
  onToggleAutoUpdate?: () => void;
  lastCalculatedAt?: Date | null;
  onUpdateProfile: (id: string, updated: Partial<PersonProfile>) => void;
  onAddProfile: () => void;
  onRemoveProfile: (id: string) => void;
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
  onApplySuggestion: (suggestion: FallbackSuggestion) => void;
  onOpenShareModal: () => void;
  onOpenSettings?: (tab?: 'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap') => void;
  onRefreshIsochrones?: () => void;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  onlyResidential?: boolean;
  onToggleOnlyResidential?: () => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  showIndividualIsochrones?: boolean;
  onToggleIndividualIsochrones?: () => void;
  onSelectScenario?: (scenario: PresetScenario) => void;
  activeScenarioId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  profiles,
  schedule,
  result,
  isCalculating,
  isPending = false,
  autoUpdate = true,
  onToggleAutoUpdate,
  lastCalculatedAt,
  onUpdateProfile,
  onAddProfile,
  onRemoveProfile,
  onChangeSchedule,
  onApplySuggestion,
  onOpenShareModal,
  onOpenSettings,
  onRefreshIsochrones,
  isMobileOpen,
  onToggleMobile,
  onlyResidential = false,
  onToggleOnlyResidential,
  showOnlyIntersection,
  onToggleOnlyIntersection,
  showIndividualIsochrones,
  onToggleIndividualIsochrones,
  onSelectScenario,
  activeScenarioId,
}) => {
  const activeProfilesCount = profiles.filter((p) => p.visible).length;
  const hasIntersection = !!result?.intersection && (result?.intersectionAreaKm2 || 0) > 0;

  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 z-30 w-full md:w-[420px] lg:w-[460px] bg-slate-50 flex flex-col border-r border-slate-200/90 shadow-xl md:shadow-none transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* App Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Commute-Zone Finder
            </h1>
            <p className="text-[11px] text-slate-500">
              Isochronen-Wohnortsuche für Paare & WGs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-open-share"
            type="button"
            onClick={onOpenShareModal}
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
            title="Suche als Link teilen"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {onOpenSettings && (
            <button
              id="btn-open-settings"
              type="button"
              onClick={() => onOpenSettings('basemap')}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
              title="Zentrale Anwendungseinstellungen (Karten, APIs, ÖPNV, Heatmap)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Close mobile sidebar button */}
          <button
            type="button"
            onClick={onToggleMobile}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preset Scenario Quick-Switch Bar */}
      {onSelectScenario && (
        <div className="px-4 py-2.5 bg-white border-b border-slate-200">
          <PresetSelector
            onSelectScenario={onSelectScenario}
            activeScenarioId={activeScenarioId}
          />
        </div>
      )}

      {/* Commute Direction & Time Settings */}
      <CommuteSettings
        schedule={schedule}
        profiles={profiles}
        onChangeSchedule={onChangeSchedule}
        onRefreshIsochrones={onRefreshIsochrones}
        isCalculating={isCalculating || isPending}
        autoUpdate={autoUpdate}
        onToggleAutoUpdate={onToggleAutoUpdate}
      />

      {/* Status & Summary Banner with Calculation State Transparency & Wohnbereichs-Filter */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasIntersection ? (
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {onlyResidential ? 'Wohnbereich: ' : 'Schnittmenge: '}
                  {result?.intersectionAreaKm2} km²
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Keine Überlappung (∅)</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{activeProfilesCount} von {profiles.length} Referenzorten</span>
          </div>
        </div>

        {/* Schnell-Filter: Nur überlagerten Treffbereich anzeigen (nur Grün) */}
        {hasIntersection && onToggleOnlyIntersection && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1 rounded-lg ${
                  showOnlyIntersection ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Focus className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[11px] text-slate-800 leading-tight">
                  Nur Schnittmenge anzeigen
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {showOnlyIntersection
                    ? 'Einzelbereiche ausgeblendet (nur Grün)'
                    : 'Alle Bereiche aktiv (Einzel-Isochronen + Schnittmenge)'}
                </span>
              </div>
            </div>

            <button
              id="switch-sidebar-only-intersection"
              type="button"
              role="switch"
              aria-checked={showOnlyIntersection}
              onClick={onToggleOnlyIntersection}
              title={
                showOnlyIntersection
                  ? 'Klicken, um Einzel-Isochronen der Personen wieder einzublenden'
                  : 'Klicken, um nur den überlagerten Treffbereich (grün) anzuzeigen'
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                showOnlyIntersection ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  showOnlyIntersection ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Wohnbereich-Filter Toggle (Reduziert Treffbereich auf Wohngebiete) */}
        {hasIntersection && onToggleOnlyResidential && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded-lg ${onlyResidential ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <Home className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[11px] text-slate-800 leading-tight">
                  Nur Wohnbereich anzeigen
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {onlyResidential
                    ? `Gefiltert (${result?.intersectionAreaKm2} von ${result?.rawIntersectionAreaKm2 ?? result?.intersectionAreaKm2} km²)`
                    : 'Filtert Forste, Seen & Industrie aus'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleOnlyResidential}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                onlyResidential ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  onlyResidential ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Prioritäts-Heatmap Statusanzeige (wenn aktiv) */}
        {hasIntersection &&
          ((schedule.options?.heatmap?.selectedItems && schedule.options.heatmap.selectedItems.length > 0) ||
            (schedule.options?.heatmap?.mode && schedule.options.heatmap.mode !== 'none')) && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold text-[11px] text-amber-950">
                  Heatmap aktiv:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {(
                    schedule.options?.heatmap?.selectedItems && schedule.options.heatmap.selectedItems.length > 0
                      ? schedule.options.heatmap.selectedItems
                      : [schedule.options?.heatmap?.mode]
                  )
                    .filter(Boolean)
                    .map((item) => (
                      <span
                        key={item}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-800"
                      >
                        {item === 'ubahn' ? '🚇 U-Bahn' : item === 'sbahn' ? '🚆 S-Bahn' : '🚗 Autobahn'}
                      </span>
                    ))}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-700">
                {(
                  (schedule.options?.heatmap?.radiusKm ?? 1.5) * 1000
                ).toFixed(0)}m
              </span>
            </div>
          )}

        {/* Calculation State Transparency Bar */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {isCalculating ? (
              <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                Berechne neue Isochronen...
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                <RefreshCw className="w-3 h-3 text-amber-500 animate-pulse" />
                Warte auf Eingabeende...
              </span>
            ) : !autoUpdate ? (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Manuell (Klick auf Aktualisieren)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Aktuell
              </span>
            )}
          </div>

          {lastCalculatedAt && (
            <span className="text-slate-400 text-[10px]">
              Stand: {lastCalculatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Profiles List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Empty Fallback Suggestions if no intersection */}
        {!hasIntersection && result?.suggestions && result.suggestions.length > 0 && (
          <FallbackAlert
            suggestions={result.suggestions}
            onApplySuggestion={onApplySuggestion}
          />
        )}

        {/* Profiles List */}
        {profiles.map((profile, index) => (
          <PersonCard
            key={profile.id}
            profile={profile}
            index={index}
            totalProfiles={profiles.length}
            onUpdate={(updated) => onUpdateProfile(profile.id, updated)}
            onRemove={() => onRemoveProfile(profile.id)}
          />
        ))}

        {/* Add Reference Location Button (FR-1.1) */}
        {profiles.length < 6 && (
          <button
            id="btn-add-person"
            type="button"
            onClick={onAddProfile}
            className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Weiteren Referenzort hinzufügen ({profiles.length + 1}. Zielort)</span>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-white border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          Marker auf Karte verschiebbar
        </span>
        <span>OpenStreetMap • Turf.js</span>
      </div>
    </aside>
  );
};
