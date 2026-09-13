import React, { useState, useEffect, Suspense } from 'react';
import { useCommuteFinder } from './hooks/useCommuteFinder';
import { MapComponent } from './components/MapComponent';
import { Sidebar } from './components/Sidebar';
import { InspectionPanel } from './components/InspectionPanel';
import { FallbackWarningBanner } from './components/FallbackWarningBanner';
import { clearIsochroneCache } from './services/isochroneEngine';
import { saveRentalOverlaySettings } from './services/rentalService';
import type { SettingsTabId } from './components/settings/SettingsModal';
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

export default function App() {
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
  } = useCommuteFinder();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTabId>('basemap');

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

  const handleOpenSettings = (tab: SettingsTabId = 'basemap') => {
    setSettingsModalTab(tab);
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased">
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
      />

      {/* Main Map Stage */}
      <main className="relative flex-1 h-full w-full overflow-hidden">
        {/* Floating Sidebar Toggle Button when sidebar is collapsed (Desktop or Mobile) */}
        {(!isDesktopSidebarOpen || !isMobileSidebarOpen) && (
          <div
            className={`absolute top-4 left-4 z-20 flex items-center gap-2 ${
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
              className="bg-white/95 hover:bg-blue-50/90 text-slate-800 hover:text-blue-700 px-3 py-2 rounded-xl shadow-md border border-slate-200/90 backdrop-blur-md flex items-center gap-2 text-xs font-bold cursor-pointer transition-all hover:scale-102 active:scale-98 group"
              title="Seitenleiste einblenden (Strg+B)"
            >
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <PanelLeftOpen className="w-4 h-4" />
              </div>
              <span>Referenzorte ({profiles.length})</span>

              {/* Status Badge inside floating trigger */}
              {result?.intersection && (result?.intersectionAreaKm2 || 0) > 0 ? (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {result?.intersectionAreaKm2} km²
                </span>
              ) : isCalculating ? (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200/80 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                  Berechne...
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/80">
                  ∅
                </span>
              )}
            </button>
          </div>
        )}

        {/* Prominent Fallback Warning Banner if an online API fails */}
        <FallbackWarningBanner
          alerts={result?.fallbackAlerts}
          onOpenSettings={handleOpenSettings}
          onRetry={() => {
            clearIsochroneCache();
            runCalculation();
          }}
        />

        {/* Leaflet Map with Controls */}
        <MapComponent
          profiles={profiles}
          result={result}
          inspectionPoint={inspectionPoint}
          isCalculating={isCalculating}
          isPending={isPending}
          onSelectInspectionPoint={handleSelectInspectionPoint}
          onUpdatePersonPosition={handleUpdatePersonPosition}
          showIntersectionLayer={showIntersectionLayer}
          onToggleIntersectionLayer={() => setShowIntersectionLayer((prev) => !prev)}
          showIndividualIsochrones={showIndividualIsochrones}
          onToggleIndividualIsochrones={handleToggleIndividualIsochrones}
          showOnlyIntersection={showOnlyIntersection}
          onToggleOnlyIntersection={handleToggleOnlyIntersection}
          onlyResidential={onlyResidential}
          onToggleOnlyResidential={handleToggleOnlyResidential}
          heatmapSettings={schedule.options?.heatmap}
          onUpdateHeatmap={(upd) =>
            setSchedule((prev) => ({
              ...prev,
              options: {
                ...(prev.options || { liveTraffic: false, enableSmoothing: true, fidelity: 'AUTOMATIC' }),
                heatmap: {
                  ...(prev.options?.heatmap || { mode: 'none', radiusKm: 1.5, intensity: 0.65 }),
                  ...upd,
                },
              },
            }))
          }
          rentalSettings={schedule.options?.rentalOverlay}
          onUpdateRentalOverlay={(upd) => {
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
          }}
          basemap={basemap}
          onBasemapChange={handleBasemapChange}
          onOpenApiKeySettings={() => handleOpenSettings('keys')}
          layerOrder={layerOrder}
          onReorderLayer={handleReorderLayer}
          onResetLayerOrder={handleResetLayerOrder}
          hiddenLayers={hiddenLayers}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          poiIconSettings={poiIconSettings}
          onUpdatePoiIcons={handleUpdatePoiIcons}
          onToggleProfileVisibility={handleToggleProfileVisibility}
        />

        {/* Floating Inspection Panel */}
        {inspectionPoint && (
          <div className="absolute bottom-6 right-4 sm:right-6 z-20 max-w-sm w-full">
            <InspectionPanel
              inspection={inspectionPoint}
              onClose={() => setInspectionPoint(null)}
            />
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
    </div>
  );
}
