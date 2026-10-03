import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useCommuteFinder } from './hooks/useCommuteFinder';
import { MapComponent } from './components/MapComponent';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { InspectionPanel } from './components/InspectionPanel';
import { FallbackWarningBanner } from './components/FallbackWarningBanner';
import { A11yLiveRegion } from './components/a11y/A11yLiveRegion';
import { OnMapEmptyState } from './components/map/OnMapEmptyState';
import { UndoToast } from './components/common/UndoToast';
import { clearIsochroneCache } from './services/isochroneEngine';
import { saveRentalOverlaySettings } from './services/rentalService';
import type { SettingsTabId } from './components/settings/SettingsModal';
import { useTheme } from './hooks/useTheme';
import {
  SlidersHorizontal,
  PanelLeftOpen,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const ShareModal = React.lazy(() =>
  import('./components/ShareModal').then((m) => ({ default: m.ShareModal }))
);

const SettingsModal = React.lazy(() =>
  import('./components/settings/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);

const ApartmentManagerModal = React.lazy(() =>
  import('./components/apartments/ApartmentManagerModal').then((m) => ({ default: m.ApartmentManagerModal }))
);

const WalkthroughModal = React.lazy(() =>
  import('./components/walkthrough/WalkthroughModal').then((m) => ({ default: m.WalkthroughModal }))
);

export default function App() {
  const { themePreference, resolvedTheme, isDark, toggleTheme } = useTheme();
  const {
    profiles,
    schedule,
    setSchedule,
    result,
    isCalculating,
    isPending,
    autoUpdate,
    setAutoUpdate,
    lastCalculatedAt,
    inspectionPoint,
    setInspectionPoint,
    showIntersectionLayer,
    setShowIntersectionLayer,
    showIndividualIsochrones,
    showOnlyIntersection,
    handleToggleOnlyIntersection,
    handleToggleIndividualIsochrones,
    onlyResidential,
    handleToggleOnlyResidential,
    basemap,
    handleBasemapChange,
    activeScenarioId,
    handleSelectScenario,
    handleUpdateProfile,
    handleAddProfile,
    handleRemoveProfile,
    handleUpdatePersonPosition,
    handleSelectInspectionPoint,
    handleApplySuggestion,
    runCalculation,
    layerOrder,
    handleReorderLayer,
    handleResetLayerOrder,
    hiddenLayers,
    handleToggleLayerVisibility,
    poiIconSettings,
    handleUpdatePoiIcons,
    handleToggleProfileVisibility,
    currentFullConfig,
    applyFullConfig,
    undoToastMessage,
    handleUndoLastSuggestion,
    handleDismissUndoToast,
    apartments,
    selectedApartmentId,
    handleSelectApartment,
    handleReloadApartments,
    activeRoutes,
    isCalculatingRoutes,
    routeCalculationError,
    handleCalculateRoutes,
    handleClearRoutes,
  } = useCommuteFinder();


  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isApartmentManagerOpen, setIsApartmentManagerOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTabId>('basemap');
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);

  // Desktop sidebar collapse state (persisted)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('commute_sidebar_open') !== 'false';
    } catch {
      return true;
    }
  });

  // Sidebar width for desktop drag-to-resize (persisted)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('commute_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 340 && parsed <= 900) {
          return parsed;
        }
      }
    } catch {}
    return 450;
  });

  const handleToggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('commute_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleResizeSidebarWidth = (newWidth: number) => {
    setSidebarWidth(newWidth);
    try {
      localStorage.setItem('commute_sidebar_width', String(newWidth));
    } catch {}
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleToggleDesktopSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenSettings = useCallback((tab: SettingsTabId = 'basemap') => {
    setSettingsModalTab(tab);
    setIsSettingsModalOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  const handleToggleIntersectionLayer = useCallback(() => {
    setShowIntersectionLayer((prev) => !prev);
  }, [setShowIntersectionLayer]);

  const handleUpdateHeatmap = useCallback((upd: any) => {
    setSchedule((prev) => ({
      ...prev,
      options: {
        ...(prev.options || { liveTraffic: false, enableSmoothing: true, fidelity: 'AUTOMATIC' }),
        heatmap: {
          ...(prev.options?.heatmap || { mode: 'none', radiusKm: 1.5, intensity: 0.65 }),
          ...upd,
        },
      },
    }));
  }, [setSchedule]);

  const handleUpdateRentalOverlay = useCallback((upd: any) => {
    saveRentalOverlaySettings(upd);
    setSchedule((prev) => ({
      ...prev,
      options: {
        ...(prev.options || { liveTraffic: false, enableSmoothing: true, fidelity: 'AUTOMATIC' }),
        rentalOverlay: {
          ...(prev.options?.rentalOverlay || { enabled: false, opacity: 0.35, selectedRegionId: 'munich-mvv' }),
          ...upd,
        },
      },
    }));
  }, [setSchedule]);

  const handleOpenApiKeySettings = useCallback(() => {
    handleOpenSettings('keys');
  }, [handleOpenSettings]);

  // First-time visit: auto-start walkthrough after a brief render delay
  useEffect(() => {
    try {
      const seen = localStorage.getItem('venn_walkthrough_seen');
      if (!seen) {
        const timer = setTimeout(() => {
          setIsWalkthroughOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleCloseWalkthrough = useCallback(() => {
    setIsWalkthroughOpen(false);
    try {
      localStorage.setItem('venn_walkthrough_seen', 'true');
    } catch {}
  }, []);

  const handleOpenWalkthrough = useCallback(() => {
    setIsDesktopSidebarOpen(true);
    setIsMobileSidebarOpen(true);
    setIsWalkthroughOpen(true);
  }, []);

  const handleEnsureSidebarOpen = useCallback(() => {
    setIsDesktopSidebarOpen(true);
    setIsMobileSidebarOpen(true);
  }, []);

  const handleEnsureMapVisible = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <div className="fixed inset-0 flex h-full w-full max-w-full overflow-hidden bg-slate-100 dark:bg-[#131314] text-slate-900 dark:text-[#e3e3e3] font-sans antialiased">
      {/* Sidebar with Inputs, Controls, Presets & Settings */}
      <Sidebar
        profiles={profiles}
        schedule={schedule}
        result={result}
        isCalculating={isCalculating}
        isPending={isPending}
        autoUpdate={autoUpdate}
        onToggleAutoUpdate={() => setAutoUpdate((prev) => !prev)}
        lastCalculatedAt={lastCalculatedAt}
        onUpdateProfile={handleUpdateProfile}
        onAddProfile={handleAddProfile}
        onRemoveProfile={handleRemoveProfile}
        onChangeSchedule={(upd) => setSchedule((prev) => ({ ...prev, ...upd }))}
        onApplySuggestion={handleApplySuggestion}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenSettings={handleOpenSettings}
        onRefreshIsochrones={() => runCalculation()}
        isMobileOpen={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(false)}
        onlyResidential={onlyResidential}
        onToggleOnlyResidential={handleToggleOnlyResidential}
        showOnlyIntersection={showOnlyIntersection}
        onToggleOnlyIntersection={handleToggleOnlyIntersection}
        showIndividualIsochrones={showIndividualIsochrones}
        onToggleIndividualIsochrones={handleToggleIndividualIsochrones}
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktopCollapse={handleToggleDesktopSidebar}
        sidebarWidth={sidebarWidth}
        onResizeWidth={handleResizeSidebarWidth}
        onOpenApartmentManager={() => setIsApartmentManagerOpen(true)}
        apartmentsCount={apartments.length}
        onOpenWalkthrough={handleOpenWalkthrough}
      />

      {/* Main Map Stage */}
      <main className="relative flex-1 h-full w-full overflow-hidden">
        {/* Floating Sidebar Toggle Button when sidebar is collapsed (Desktop or Mobile) */}
        {(!isDesktopSidebarOpen || !isMobileSidebarOpen) && (
          <div
            className={`absolute top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-20 flex items-center gap-2 ${
              isDesktopSidebarOpen ? 'md:hidden' : 'flex'
            }`}
          >
            <button
              id="btn-expand-sidebar"
              type="button"
              onClick={() => {
                setIsDesktopSidebarOpen(true);
                setIsMobileSidebarOpen(true);
                try {
                  localStorage.setItem('commute_sidebar_open', 'true');
                } catch {}
              }}
              className="bg-white/95 dark:bg-[#1e1f20]/95 hover:bg-slate-50 dark:hover:bg-[#282a2c] text-slate-800 dark:text-[#e3e3e3] hover:text-blue-700 dark:hover:text-[#8ab4f8] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-md border border-slate-200/90 dark:border-[#3c4043] backdrop-blur-md flex items-center gap-1.5 sm:gap-2 text-xs font-bold cursor-pointer transition-colors group max-w-[calc(100vw-110px)] sm:max-w-none"
              title="Seitenleiste einblenden (Strg+B)"
            >
              <div className="p-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#8ab4f8] group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-[#8ab4f8] dark:group-hover:text-[#131314] transition-colors shrink-0">
                <PanelLeftOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="truncate">
                <span className="hidden sm:inline">Referenzorte</span> ({profiles.length})
              </span>

              {/* Status Badge inside floating trigger */}
              {result?.intersection && (result?.intersectionAreaKm2 || 0) > 0 ? (
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{result?.intersectionAreaKm2} km²</span>
                </span>
              ) : isCalculating ? (
                <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/80 flex items-center gap-1 shrink-0">
                  <Loader2 className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="hidden sm:inline">Berechne...</span>
                </span>
              ) : (
                <span className="text-[10px] font-medium bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6] px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#3c4043] shrink-0">
                  0 km²
                </span>
              )}
            </button>
          </div>
        )}

        {/* Screenreader Live Region for WCAG 4.1.3 */}
        <A11yLiveRegion
          result={result}
          profiles={profiles}
          isCalculating={isCalculating}
        />

        {/* On-Map Empty State Guidance (DIN EN ISO 9241-110) */}
        <OnMapEmptyState
          emptyIntersection={!!result?.emptyIntersection}
          activeProfiles={profiles.filter((p) => p.visible)}
          suggestions={result?.suggestions || []}
          onApplySuggestion={handleApplySuggestion}
          onOpenSidebar={() => {
            setIsDesktopSidebarOpen(true);
            setIsMobileSidebarOpen(true);
          }}
        />

        {/* Reversible Action Toast (DIN EN ISO 9241-110) */}
        <UndoToast
          message={undoToastMessage}
          onUndo={handleUndoLastSuggestion}
          onClose={handleDismissUndoToast}
        />

        {/* Prominent Fallback Warning Banner if an online API fails */}
        <FallbackWarningBanner
          alerts={result?.fallbackAlerts}
          onOpenSettings={handleOpenSettings}
          onRetry={() => {
            clearIsochroneCache();
            runCalculation();
          }}
        />

        {/* Leaflet Map with Controls wrapped in Error Boundary */}
        <MapErrorBoundary>
          <MapComponent
            profiles={profiles}
            result={result}
            inspectionPoint={inspectionPoint}
            isCalculating={isCalculating}
            isPending={isPending}
            onSelectInspectionPoint={handleSelectInspectionPoint}
            onUpdatePersonPosition={handleUpdatePersonPosition}
            showIntersectionLayer={showIntersectionLayer}
            onToggleIntersectionLayer={handleToggleIntersectionLayer}
            showIndividualIsochrones={showIndividualIsochrones}
            onToggleIndividualIsochrones={handleToggleIndividualIsochrones}
            showOnlyIntersection={showOnlyIntersection}
            onToggleOnlyIntersection={handleToggleOnlyIntersection}
            onlyResidential={onlyResidential}
            onToggleOnlyResidential={handleToggleOnlyResidential}
            heatmapSettings={schedule.options?.heatmap}
            onUpdateHeatmap={handleUpdateHeatmap}
            rentalSettings={schedule.options?.rentalOverlay}
            onUpdateRentalOverlay={handleUpdateRentalOverlay}
            basemap={basemap}
            onBasemapChange={handleBasemapChange}
            onOpenApiKeySettings={handleOpenApiKeySettings}
            layerOrder={layerOrder}
            onReorderLayer={handleReorderLayer}
            onResetLayerOrder={handleResetLayerOrder}
            hiddenLayers={hiddenLayers}
            onToggleLayerVisibility={handleToggleLayerVisibility}
            poiIconSettings={poiIconSettings}
            onUpdatePoiIcons={handleUpdatePoiIcons}
            onToggleProfileVisibility={handleToggleProfileVisibility}
            apartmentListings={apartments}
            selectedApartmentId={selectedApartmentId || undefined}
            onSelectApartment={handleSelectApartment}
            onOpenApartmentManager={() => setIsApartmentManagerOpen(true)}
            isInspectionActive={Boolean(inspectionPoint)}
            activeRoutes={activeRoutes}
          />
        </MapErrorBoundary>

        {/* Floating Inspection Panel / Mobile Bottom Sheet */}
        {inspectionPoint && (
          <div className="absolute bottom-0 inset-x-0 sm:bottom-6 sm:inset-x-auto sm:right-6 z-20 sm:max-w-lg w-full px-2 sm:px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0 pointer-events-none">
            <div className="pointer-events-auto">
              <InspectionPanel
                inspection={inspectionPoint}
                onClose={() => setInspectionPoint(null)}
                showRentalInfo={Boolean(
                  schedule.options?.rentalOverlay?.enabled && !hiddenLayers.has('rental')
                )}
                allListings={apartments}
                intersectionFeature={result?.intersection || result?.rawIntersection || null}
                profiles={profiles}
                schedule={schedule}
                onSelectApartment={handleSelectApartment}
                onOpenApartmentManager={() => setIsApartmentManagerOpen(true)}
                activeRoutes={activeRoutes}
                onRequestCalculateRoute={handleCalculateRoutes}
                onClearRoutes={handleClearRoutes}
                isCalculatingRoute={isCalculatingRoutes}
                routeError={routeCalculationError}
              />
            </div>
          </div>
        )}

      </main>

      {/* Share Modal */}
      {isShareModalOpen && (
        <Suspense fallback={null}>
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            profiles={profiles}
            schedule={schedule}
            fullConfig={currentFullConfig}
            onApplyConfig={applyFullConfig}
          />
        </Suspense>
      )}

      {/* Central Application Settings Modal */}
      {isSettingsModalOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={handleCloseSettings}
            schedule={schedule}
            onChangeSchedule={(upd) => setSchedule((prev) => ({ ...prev, ...upd }))}
            onRefreshIsochrones={runCalculation}
            onBasemapChange={handleBasemapChange}
            showOnlyIntersection={showOnlyIntersection}
            onToggleOnlyIntersection={handleToggleOnlyIntersection}
            initialTab={settingsModalTab}
          />
        </Suspense>
      )}

      {/* Apartment Manager & Scraper Ingestion Modal */}
      {isApartmentManagerOpen && (
        <Suspense fallback={null}>
          <ApartmentManagerModal
            isOpen={isApartmentManagerOpen}
            onClose={() => setIsApartmentManagerOpen(false)}
            listings={apartments}
            intersection={result?.intersection || result?.rawIntersection || null}
            intersectionStats={inspectionPoint?.intersectionStats}
            onRefreshListings={handleReloadApartments}
          />
        </Suspense>
      )}

      {/* Interactive Onboarding Walkthrough */}
      {isWalkthroughOpen && (
        <Suspense fallback={null}>
          <WalkthroughModal
            isOpen={isWalkthroughOpen}
            onClose={handleCloseWalkthrough}
            onEnsureSidebarOpen={handleEnsureSidebarOpen}
            onEnsureMapVisible={handleEnsureMapVisible}
          />
        </Suspense>
      )}
    </div>
  );
}
