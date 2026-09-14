import React, { useState, useEffect } from 'react';
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
import { useTheme } from '../hooks/useTheme';
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
  PanelLeftClose,
  Sun,
  Moon,
  Monitor,
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
  onOpenSettings?: (tab?: 'appearance' | 'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap') => void;
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
  isDesktopOpen?: boolean;
  onToggleDesktopCollapse?: () => void;
  sidebarWidth?: number;
  onResizeWidth?: (width: number) => void;
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
  isDesktopOpen = true,
  onToggleDesktopCollapse,
  sidebarWidth = 450,
  onResizeWidth,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!onResizeWidth) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const maxWidth = Math.min(840, Math.floor(window.innerWidth * 0.65));
      const minWidth = 360;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      onResizeWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetWidth = () => {
    if (onResizeWidth) {
      onResizeWidth(450);
    }
  };
  const { themePreference, resolvedTheme, toggleTheme } = useTheme();
  const activeProfilesCount = profiles.filter((p) => p.visible).length;
  const hasIntersection = !!result?.intersection && (result?.intersectionAreaKm2 || 0) > 0;

  return (
    <aside
      id="commute-sidebar"
      style={{
        width: !isMobileScreen ? (isDesktopOpen ? `${sidebarWidth}px` : '0px') : undefined,
      }}
      className={`fixed md:relative inset-y-0 left-0 z-30 flex-shrink-0 bg-slate-50 dark:bg-[#131314] flex flex-col border-slate-200/90 dark:border-[#3c4043] shadow-xl md:shadow-none overflow-hidden ${
        isDragging ? 'transition-none select-none' : 'transition-[width,transform] duration-300 ease-in-out'
      } ${
        isMobileOpen ? 'translate-x-0 w-full sm:w-[420px]' : '-translate-x-full md:translate-x-0'
      } ${
        isDesktopOpen ? 'md:border-r' : 'md:w-0 md:border-r-0 md:pointer-events-none'
      }`}
    >
      <div
        className="h-full flex flex-col flex-shrink-0 overflow-hidden relative"
        style={{
          width: !isMobileScreen ? `${sidebarWidth}px` : '100%',
        }}
      >
        {/* App Header */}
        <div className="p-4 bg-white dark:bg-[#1e1f20] border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-cyan-500/20 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" className="w-full h-full">
                <defs>
                  <clipPath id="sb-venn-clip">
                    <circle cx="120" cy="160" r="88" />
                  </clipPath>
                </defs>
                <circle cx="120" cy="160" r="88" fill="#38BDF8" />
                <circle cx="200" cy="160" r="88" fill="#34D399" />
                <circle cx="200" cy="160" r="88" clipPath="url(#sb-venn-clip)" fill="#FFFFFF" />
                <g transform="translate(126.4, 126.4) scale(2.8)">
                  <path fill="#020617" d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.35.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z" />
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-[#e3e3e3] leading-tight">
                Venn
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">
                Finding common ground
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Theme Toggle Button */}
            <button
              id="btn-toggle-theme-quick"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#282a2c] transition-colors border border-slate-200/80 dark:border-[#3c4043] shadow-2xs cursor-pointer"
              title={`Design wechseln (Aktuell: ${themePreference === 'system' ? 'System' : themePreference === 'dark' ? 'Dunkel' : 'Hell'})`}
            >
              {themePreference === 'system' ? (
                <Monitor className="w-4 h-4" />
              ) : resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            <button
              id="btn-open-share"
              type="button"
              onClick={onOpenShareModal}
              className="p-2 rounded-xl text-slate-600 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#282a2c] transition-colors border border-slate-200/80 dark:border-[#3c4043] shadow-2xs cursor-pointer"
              title="Suche als Link teilen"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {onOpenSettings && (
              <button
                id="btn-open-settings"
                type="button"
                onClick={() => onOpenSettings('appearance')}
                className="p-2 rounded-xl text-slate-600 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#282a2c] transition-colors border border-slate-200/80 dark:border-[#3c4043] shadow-2xs cursor-pointer"
                title="Zentrale Anwendungseinstellungen (Design, Karten, APIs, ÖPNV, Heatmap)"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Desktop collapse button */}
            {onToggleDesktopCollapse && (
              <button
                id="btn-collapse-sidebar"
                type="button"
                onClick={onToggleDesktopCollapse}
                className="hidden md:flex p-2 rounded-xl text-slate-600 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-[#282a2c] transition-colors border border-slate-200/80 dark:border-[#3c4043] shadow-2xs cursor-pointer"
                title="Seitenleiste einklappen (Strg+B)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {/* Close mobile sidebar button */}
            <button
              type="button"
              onClick={onToggleMobile}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Scenario Quick-Switch Bar */}
        {onSelectScenario && (
          <div className="px-4 py-2.5 bg-white dark:bg-[#1e1f20] border-b border-slate-200 dark:border-[#3c4043]">
            <PresetSelector
              onSelectScenario={onSelectScenario}
              activeScenarioId={activeScenarioId}
            />
          </div>
        )}

        {/* Commute Direction & Time Settings */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#131314] border-b border-slate-200/80 dark:border-[#3c4043]">
          <CommuteSettings
            schedule={schedule}
            profiles={profiles}
            onChangeSchedule={onChangeSchedule}
            onRefreshIsochrones={onRefreshIsochrones}
            isCalculating={isCalculating || isPending}
            autoUpdate={autoUpdate}
            onToggleAutoUpdate={onToggleAutoUpdate}
          />
        </div>

        {/* Status & Summary Banner with Calculation State Transparency & Wohnbereichs-Filter */}
        <div className="px-4 py-2.5 bg-white dark:bg-[#1e1f20] border-b border-slate-200 dark:border-[#3c4043] flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasIntersection ? (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {onlyResidential ? 'Wohnbereich: ' : 'Schnittmenge: '}
                    {result?.intersectionAreaKm2} km²
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Keine Überschneidung</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400 dark:text-[#9aa0a6]" />
              <span>{activeProfilesCount} von {profiles.length} Referenzorten</span>
            </div>
          </div>

          {/* Schnell-Filter: Nur überlagerten Treffbereich & Wohnbereich anzeigen */}
          {hasIntersection && (onToggleOnlyIntersection || onToggleOnlyResidential) && (
            <div className="grid grid-cols-2 gap-2">
              {onToggleOnlyIntersection && (
                <div
                  onClick={onToggleOnlyIntersection}
                  className={`border rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer transition-colors select-none ${
                    showOnlyIntersection
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-[#131314] hover:bg-slate-100/80 dark:hover:bg-[#282a2c] border-slate-200/90 dark:border-[#3c4043] text-slate-700 dark:text-[#c4c7c5]'
                  }`}
                  title={
                    showOnlyIntersection
                      ? 'Klicken, um Einzel-Isochronen wieder einzublenden'
                      : 'Klicken, um nur den überlagerten Treffbereich (grün) anzuzeigen'
                  }
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`p-1 rounded-md shrink-0 ${
                        showOnlyIntersection ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6]'
                      }`}
                    >
                      <Focus className="w-3 h-3" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-[11px] leading-tight truncate">
                        Nur Treffbereich
                      </span>
                      <span className="text-[9px] opacity-75 truncate">
                        {showOnlyIntersection ? 'Aktiv (Grün)' : 'Alle Isochronen'}
                      </span>
                    </div>
                  </div>

                  <button
                    id="switch-sidebar-only-intersection"
                    type="button"
                    role="switch"
                    aria-checked={showOnlyIntersection}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleOnlyIntersection();
                    }}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      showOnlyIntersection ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-[#3c4043]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        showOnlyIntersection ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {onToggleOnlyResidential && (
                <div
                  onClick={onToggleOnlyResidential}
                  className={`border rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer transition-colors select-none ${
                    onlyResidential
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-[#131314] hover:bg-slate-100/80 dark:hover:bg-[#282a2c] border-slate-200/90 dark:border-[#3c4043] text-slate-700 dark:text-[#c4c7c5]'
                  }`}
                  title="Filtert Forste, Gewässer & Industriegebiete aus dem Treffbereich"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`p-1 rounded-md shrink-0 ${
                        onlyResidential ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6]'
                      }`}
                    >
                      <Home className="w-3 h-3" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-[11px] leading-tight truncate">
                        Wohnbereich
                      </span>
                      <span className="text-[9px] opacity-75 truncate">
                        {onlyResidential ? 'Gefiltert' : 'Ungefiltert'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={onlyResidential}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleOnlyResidential();
                    }}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      onlyResidential ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-[#3c4043]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        onlyResidential ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prioritäts-Heatmap Statusanzeige (wenn aktiv) */}
          {hasIntersection &&
            ((schedule.options?.heatmap?.selectedItems && schedule.options.heatmap.selectedItems.length > 0) ||
              (schedule.options?.heatmap?.mode && schedule.options.heatmap.mode !== 'none')) && (
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/50 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-[11px] text-amber-950 dark:text-amber-200">
                    Heatmap:
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
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/90 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                        >
                          {item === 'ubahn' ? 'U-Bahn' : item === 'sbahn' ? 'S-Bahn' : 'Autobahn'}
                        </span>
                      ))}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  {(
                    (schedule.options?.heatmap?.radiusKm ?? 1.5) * 1000
                  ).toFixed(0)}m
                </span>
              </div>
            )}

          {/* Calculation State Transparency Bar */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-[#3c4043]">
            <div className="flex items-center gap-1.5">
              {isCalculating ? (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-[#8ab4f8] font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-[#8ab4f8]" />
                  Berechne neue Isochronen...
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <RefreshCw className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-pulse" />
                  Warte auf Eingabeende...
                </span>
              ) : !autoUpdate ? (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-[#9aa0a6]">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Manuell
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Aktuell
                </span>
              )}
            </div>

            {lastCalculatedAt && (
              <span className="text-slate-400 dark:text-[#9aa0a6] text-[10px]">
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
              isochroneFeature={result?.isochrones?.[profile.id]}
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
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#3c4043] hover:border-blue-500 dark:hover:border-[#8ab4f8] hover:bg-blue-50/50 dark:hover:bg-[#282a2c]/50 text-slate-600 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Weiteren Referenzort hinzufügen ({profiles.length + 1}. Zielort)</span>
            </button>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-white dark:bg-[#1e1f20] border-t border-slate-200 dark:border-[#3c4043] text-[11px] text-slate-400 dark:text-[#9aa0a6] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Marker auf Karte verschiebbar
          </span>
          <span>OpenStreetMap • Turf.js</span>
        </div>
      </div>

      {/* Drag-to-Resize Handle (Desktop only when open) */}
      {isDesktopOpen && onResizeWidth && (
        <div
          id="sidebar-resize-handle"
          onMouseDown={handleResizeStart}
          onDoubleClick={handleResetWidth}
          className={`hidden md:flex absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-40 group items-center justify-center transition-colors select-none ${
            isDragging ? 'bg-blue-500/20' : 'hover:bg-blue-500/15'
          }`}
          title="Breite anpassen (Doppelklick für Standard: 450px)"
        >
          <div
            className={`w-1 h-8 rounded-full transition-all ${
              isDragging ? 'bg-blue-600 scale-y-125' : 'bg-slate-300/80 dark:bg-[#3c4043] group-hover:bg-blue-500 dark:group-hover:bg-[#8ab4f8]'
            }`}
          />
        </div>
      )}
    </aside>
  );
};
