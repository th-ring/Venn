import React, { useState, Suspense } from 'react';
import { useCommuteFinder } from './hooks/useCommuteFinder';
import { MapComponent } from './components/MapComponent';
import { Sidebar } from './components/Sidebar';
import { InspectionPanel } from './components/InspectionPanel';
import { FallbackWarningBanner } from './components/FallbackWarningBanner';
import { clearIsochroneCache } from './services/isochroneEngine';
import { SlidersHorizontal } from 'lucide-react';

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
  } = useCommuteFinder();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap'>('basemap');

  const handleOpenSettings = (tab: 'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap' = 'basemap') => {
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
      />

      {/* Main Map Stage */}
      <main className="relative flex-1 h-full w-full overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="md:hidden absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="bg-white/95 text-slate-800 p-2.5 rounded-xl shadow-md border border-slate-200 backdrop-blur-sm flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Referenzorte ({profiles.length})</span>
          </button>
        </div>

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
          basemap={basemap}
          onBasemapChange={handleBasemapChange}
          onOpenApiKeySettings={() => handleOpenSettings('keys')}
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
