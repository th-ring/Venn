import React from 'react';
import {
  PersonProfile,
  CalculationResult,
  CommuteSchedule,
  FallbackSuggestion,
  BasemapProvider,
} from '../types';
import { PersonCard } from './PersonCard';
import { CommuteSettings } from './CommuteSettings';
import { FallbackAlert } from './FallbackAlert';
import {
  Users,
  Plus,
  Compass,
  Share2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  Loader2,
  RefreshCw,
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
  onRefreshIsochrones?: () => void;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  basemap?: BasemapProvider;
  onBasemapChange?: (provider: BasemapProvider) => void;
  isApiKeyModalOpen?: boolean;
  onToggleApiKeyModal?: (open: boolean) => void;
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
  onRefreshIsochrones,
  isMobileOpen,
  onToggleMobile,
  basemap,
  onBasemapChange,
  isApiKeyModalOpen,
  onToggleApiKeyModal,
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
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200/80 shadow-2xs"
            title="Suche als Link teilen"
          >
            <Share2 className="w-4 h-4" />
          </button>

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

      {/* Commute Direction & Time Settings */}
      <CommuteSettings
        schedule={schedule}
        onChangeSchedule={onChangeSchedule}
        onRefreshIsochrones={onRefreshIsochrones}
        isCalculating={isCalculating || isPending}
        autoUpdate={autoUpdate}
        onToggleAutoUpdate={onToggleAutoUpdate}
        basemap={basemap}
        onBasemapChange={onBasemapChange}
        isApiKeyModalOpen={isApiKeyModalOpen}
        onToggleApiKeyModal={onToggleApiKeyModal}
      />

      {/* Status & Summary Banner with Calculation State Transparency */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasIntersection ? (
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Schnittmenge: {result?.intersectionAreaKm2} km²</span>
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
