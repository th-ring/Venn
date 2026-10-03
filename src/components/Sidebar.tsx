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
import type { SettingsTabId } from './settings/SettingsModal';
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
  HelpCircle,
  X,
  SlidersHorizontal,
  Clock,
  ChevronDown,
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
  onOpenSettings?: (tab?: SettingsTabId) => void;
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
  onOpenApartmentManager?: () => void;
  apartmentsCount?: number;
  onOpenWalkthrough?: () => void;
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
  onOpenApartmentManager,
  apartmentsCount = 0,
  onOpenWalkthrough,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isSearchSettingsOpen, setIsSearchSettingsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('venn_search_settings_open');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleSearchSettings = React.useCallback(() => {
    setIsSearchSettingsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('venn_search_settings_open', String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Adaptive sidebar width for tablets (iPad portrait)
  const effectiveWidth = React.useMemo(() => {
    if (typeof window === 'undefined') return sidebarWidth;
    if (window.innerWidth >= 768 && window.innerWidth < 1024) {
      // Tablet portrait: cap width to 44% of screen or 380px so map gets ample space
      return Math.min(sidebarWidth, Math.max(320, Math.floor(window.innerWidth * 0.44)));
    }
    return sidebarWidth;
  }, [sidebarWidth, isMobileScreen]);

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!onResizeWidth) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const startX = clientX;
    const startWidth = effectiveWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (currentX: number) => {
      const deltaX = currentX - startX;
      const maxWidth = Math.min(840, Math.floor(window.innerWidth * 0.65));
      const minWidth = 320;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      onResizeWidth(newWidth);
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onMove(moveEvent.clientX);
    };

    const handleTouchMove = (touchEvent: TouchEvent) => {
      if (touchEvent.touches.length > 0) {
        onMove(touchEvent.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
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
    <>
      {/* Mobile Backdrop Scrim */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onToggleMobile}
          className="fixed inset-0 z-25 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          aria-label="Seitenleiste schließen"
        />
      )}

      <aside
        id="commute-sidebar"
        style={{
          width: !isMobileScreen ? (isDesktopOpen ? `${effectiveWidth}px` : '0px') : undefined,
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
            width: !isMobileScreen ? `${effectiveWidth}px` : '100%',
          }}
        >
          {/* App Header */}
          <div className="h-14 sm:h-14 pt-[env(safe-area-inset-top)] box-content px-3 sm:px-4 bg-white dark:bg-[#1e1f20] border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Standalone Brand Vector Mark */}
            <div className="w-8 h-7 sm:w-9 sm:h-8 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <defs>
                  <clipPath id="sb-venn-clip">
                    <circle cx="58" cy="54" r="26" />
                  </clipPath>
                </defs>
                {/* Left Circle: Primary Blue */}
                <circle cx="42" cy="54" r="26" fill="#4285F4" className="dark:fill-[#4285F4] fill-[#1A73E8]" />
                {/* Right Circle: Accent Green */}
                <circle cx="58" cy="54" r="26" fill="#34A853" className="dark:fill-[#34A853] fill-[#1E8E3E]" />
                {/* Overlap Intersection: Teal Lens */}
                <circle cx="42" cy="54" r="26" clipPath="url(#sb-venn-clip)" fill="#00897B" className="dark:fill-[#00897B] fill-[#00796B]" />
                {/* Classic Pin: 2/3 Depth Anchor with 2.2px Chiseled Border */}
                <path
                  d="M 50 62 C 43 53, 35 45, 35 36 A 15 15 0 1 1 65 36 C 65 45, 57 53, 50 62 Z"
                  fill="#EA4335"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                {/* Simplified Monolith House with Portal Notch */}
                <path
                  d="M 42 42 L 42 36 L 50 28 L 58 36 L 58 42 H 53 V 38 H 47 V 42 Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
            <span className="text-base sm:text-[18px] font-medium tracking-tight text-slate-900 dark:text-[#e8eaed]">
              Venn
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Quick Theme Toggle Button */}
            <button
              id="btn-toggle-theme-quick"
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
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
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
              title="Suche als Link teilen"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {onOpenApartmentManager && (
              <button
                id="btn-open-apartments"
                type="button"
                onClick={onOpenApartmentManager}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer relative"
                title={`Aktive Wohnungssuche & Scraper (${apartmentsCount} Angebote)`}
              >
                <Home className="w-4 h-4" />
                {apartmentsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#1e1f20]" />
                )}
              </button>
            )}

            {onOpenWalkthrough && (
              <button
                id="btn-open-walkthrough"
                type="button"
                onClick={onOpenWalkthrough}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
                title="Einführung & Tour starten (Hilfe)"
                aria-label="Einführungstour starten"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            {onOpenSettings && (
              <button
                id="btn-open-settings"
                type="button"
                onClick={() => onOpenSettings('appearance')}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
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
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
                title="Seitenleiste einklappen (Strg+B)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {/* Close mobile sidebar button */}
            <button
              type="button"
              onClick={onToggleMobile}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
              title="Zur Karte zurückkehren"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Region Quick-Switch Bar */}
        {onSelectScenario && (
          <div className="px-3 sm:px-4 py-2 bg-white dark:bg-[#1e1f20] border-b border-slate-200 dark:border-[#3c4043]">
            <PresetSelector
              onSelectScenario={onSelectScenario}
              activeScenarioId={activeScenarioId}
            />
          </div>
        )}

        {/* Unified Scrollable Body: Referenzorte first, then global controls */}
        <div
          id="sidebar-scrollable-body"
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 touch-scroll-y"
        >
          {/* Status & Filter Kapsel (Unified Bar) */}
          <div className="bg-white dark:bg-[#1a1b1e] p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 dark:border-[#2f3336] shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {hasIntersection ? (
                <div
                  className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs shrink-0"
                  title={onlyResidential ? 'Gefilterter Wohnbereich' : 'Gemeinsamer Treffbereich'}
                >
                  <span className="text-emerald-600 dark:text-emerald-400">✦</span>
                  <span>{result?.intersectionAreaKm2} km²</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full text-xs shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>0 km²</span>
                </div>
              )}

              {/* Heatmap Micro-Pill (if active) */}
              {hasIntersection && (schedule.options?.heatmap?.mode && schedule.options.heatmap.mode !== 'none') && (
                <div className="hidden sm:flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>
                    {schedule.options.heatmap.mode === 'ubahn'
                      ? 'U-Bahn'
                      : schedule.options.heatmap.mode === 'sbahn'
                      ? 'S-Bahn'
                      : 'Autobahn'}
                  </span>
                </div>
              )}

              <span className="text-[11px] text-slate-400 dark:text-[#9aa0a6] hidden sm:inline">
                {activeProfilesCount} von {profiles.length} Orten
              </span>
            </div>

            {/* Schnell-Filter Pills (Icon-First) */}
            <div className="flex items-center gap-1 shrink-0">
              {hasIntersection && onToggleOnlyIntersection && (
                <button
                  id="btn-sidebar-only-intersection"
                  type="button"
                  onClick={onToggleOnlyIntersection}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    showOnlyIntersection
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#25262a]'
                  }`}
                  title={
                    showOnlyIntersection
                      ? 'Klicken, um Einzel-Isochronen wieder einzublenden'
                      : 'Klicken, um nur den überlagerten Treffbereich anzuzeigen'
                  }
                >
                  <Focus className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Treffbereich</span>
                </button>
              )}

              {hasIntersection && onToggleOnlyResidential && (
                <button
                  id="btn-sidebar-only-residential"
                  type="button"
                  onClick={onToggleOnlyResidential}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    onlyResidential
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#25262a]'
                  }`}
                  title="Filtert Forste, Gewässer & Industriegebiete aus dem Treffbereich"
                >
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Wohnen</span>
                </button>
              )}

              {onOpenApartmentManager && (
                <button
                  id="btn-sidebar-apartments-chip"
                  type="button"
                  onClick={onOpenApartmentManager}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Wohnungsangebote im Treffbereich anzeigen"
                >
                  <Home className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{apartmentsCount}</span>
                </button>
              )}
            </div>
          </div>

          {/* Empty Fallback Suggestions if no intersection */}
          {!hasIntersection && result?.suggestions && result.suggestions.length > 0 && (
            <FallbackAlert
              suggestions={result.suggestions}
              onApplySuggestion={onApplySuggestion}
            />
          )}

          {/* Referenzorte Section (PROMINENT AT TOP!) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#c4c7c5]">
                  Referenzorte ({activeProfilesCount === profiles.length ? profiles.length : `${activeProfilesCount}/${profiles.length} aktiv`})
                </h2>
              </div>
              {profiles.length < 6 && (
                <button
                  type="button"
                  onClick={onAddProfile}
                  className="text-xs font-semibold text-blue-600 dark:text-[#8ab4f8] hover:text-blue-700 dark:hover:text-[#aecbfa] flex items-center gap-1 py-1 px-2.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                  title="Weiteren Referenzort hinzufügen"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ort hinzufügen</span>
                </button>
              )}
            </div>

            {/* Profiles List */}
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                id={index === 0 ? 'sidebar-first-person-card' : undefined}
              >
                <PersonCard
                  profile={profile}
                  index={index}
                  totalProfiles={profiles.length}
                  isochroneInfo={result?.isochrones?.[profile.id]?.properties}
                  onUpdate={(updated) => onUpdateProfile(profile.id, updated)}
                  onRemove={() => onRemoveProfile(profile.id)}
                />
              </div>
            ))}

            {/* Add Reference Location Sleek Button */}
            {profiles.length < 6 && (
              <button
                id="btn-add-person"
                type="button"
                onClick={onAddProfile}
                className="w-full py-2 px-3 rounded-2xl border border-dashed border-slate-300 dark:border-[#2f3336] hover:border-blue-500 dark:hover:border-[#8ab4f8] hover:bg-blue-50/40 dark:hover:bg-[#25262a]/50 text-slate-500 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-[#8ab4f8] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Referenzort hinzufügen</span>
              </button>
            )}
          </div>

          {/* Commute Direction & Time Settings (Collapsible Search Settings) */}
          <div id="commute-schedule-controls" className="pt-2 border-t border-slate-200/80 dark:border-[#2f3336] space-y-2">
            <button
              id="btn-toggle-search-settings"
              type="button"
              onClick={handleToggleSearchSettings}
              className="w-full flex items-center justify-between px-1 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] cursor-pointer transition-colors group select-none rounded-xl hover:bg-slate-100/60 dark:hover:bg-[#25262a]/60"
              title={isSearchSettingsOpen ? 'Sucheinstellungen einklappen' : 'Sucheinstellungen ausklappen'}
              aria-expanded={isSearchSettingsOpen}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8] shrink-0" />
                <span>Sucheinstellungen</span>
                {!isSearchSettingsOpen && (
                  <span className="normal-case font-normal text-[11px] text-slate-400 dark:text-[#9aa0a6] truncate ml-1">
                    ({schedule.direction === 'to_work' ? '➔ Ziel' : '➔ Zurück'}, {schedule.dayOfWeek === 'weekend' ? 'Sa/So' : 'Mo–Fr'} {schedule.time || '07:00'})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isSearchSettingsOpen && schedule.options?.heatmap?.mode && schedule.options.heatmap.mode !== 'none' && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    🔥 {schedule.options.heatmap.mode === 'ubahn' ? 'U-Bahn' : schedule.options.heatmap.mode === 'sbahn' ? 'S-Bahn' : 'Autobahn'}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-[#e3e3e3] transition-transform duration-200 shrink-0 ${
                    isSearchSettingsOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isSearchSettingsOpen && (
              <div className="animate-in fade-in duration-150">
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
            )}
          </div>

          {/* Status & Calculation Transparency */}
          <div className="flex items-center justify-between text-[11px] pt-1 pb-1 text-slate-400 dark:text-[#9aa0a6]">
            <div className="flex items-center gap-1.5">
              {isCalculating ? (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-[#8ab4f8] font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-[#8ab4f8]" />
                  Berechne...
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-pulse" />
                  Warte auf Eingabe...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Aktuell
                </span>
              )}
            </div>

            {lastCalculatedAt && (
              <span className="text-[10px]">
                Stand: {lastCalculatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Sticky Quick Action Bar: "Karte anzeigen" */}
        <div className="md:hidden p-3 bg-white/95 dark:bg-[#1e1f20]/95 border-t border-slate-200 dark:border-[#3c4043] pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0 backdrop-blur-md">
          <button
            type="button"
            onClick={onToggleMobile}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#131314] font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>Karte anzeigen</span>
            {hasIntersection && (
              <span className="text-[10px] bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-full font-bold ml-1">
                {result?.intersectionAreaKm2} km²
              </span>
            )}
          </button>
        </div>

        {/* Footer Info (Desktop / Tablet) */}
        <div className="hidden md:flex p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white dark:bg-[#1e1f20] border-t border-slate-200 dark:border-[#3c4043] text-[11px] text-slate-400 dark:text-[#9aa0a6] items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Marker auf Karte verschiebbar
          </span>
          <span>OpenStreetMap • Turf.js</span>
        </div>
      </div>

      {/* Drag-to-Resize Handle (Desktop and Tablet with Touch/Mouse) */}
      {isDesktopOpen && onResizeWidth && (
        <div
          id="sidebar-resize-handle"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
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
  </>
  );
};
