import React, { useState, Suspense } from 'react';
import {
  CommuteSchedule,
  PersonProfile,
  BasemapProvider,
  TransitSubMode,
  HeatmapSettings,
} from '../types';
import { ScheduleControls } from './commute/ScheduleControls';
import { PriorityHeatmapWidget } from './commute/PriorityHeatmapWidget';
import { TransitSubmodeWidget } from './commute/TransitSubmodeWidget';
import { Settings, ChevronRight } from 'lucide-react';
import { getSelectedBasemap } from '../services/isochroneEngine';

const SettingsModal = React.lazy(() =>
  import('./settings/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);

export interface CommuteSettingsProps {
  schedule: CommuteSchedule;
  profiles?: PersonProfile[];
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
  onRefreshIsochrones?: () => void;
  isCalculating?: boolean;
  autoUpdate?: boolean;
  onToggleAutoUpdate?: () => void;
  basemap?: BasemapProvider;
  onBasemapChange?: (provider: BasemapProvider) => void;
  isApiKeyModalOpen?: boolean;
  onToggleApiKeyModal?: (open: boolean) => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  showIndividualIsochrones?: boolean;
  onToggleIndividualIsochrones?: () => void;
}

export const CommuteSettings: React.FC<CommuteSettingsProps> = ({
  schedule,
  profiles,
  onChangeSchedule,
  onRefreshIsochrones,
  isCalculating = false,
  autoUpdate = true,
  onToggleAutoUpdate,
  basemap: externalBasemap,
  onBasemapChange,
  isApiKeyModalOpen = false,
  onToggleApiKeyModal,
  showOnlyIntersection,
  onToggleOnlyIntersection,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const showModal = isApiKeyModalOpen || internalModalOpen;

  const handleSetModalOpen = (open: boolean) => {
    setInternalModalOpen(open);
    if (onToggleApiKeyModal) {
      onToggleApiKeyModal(open);
    }
  };

  const currentBasemap = externalBasemap || getSelectedBasemap();
  const isGoogleBasemap = currentBasemap.startsWith('google');

  const showTransitSubmodes =
    !profiles || profiles.some((p) => p.visible && p.mode === 'transit');

  const options = schedule.options ?? {
    liveTraffic: false,
    enableSmoothing: true,
    fidelity: 'AUTOMATIC',
  };

  const handleUpdateHeatmap = (updated: Partial<HeatmapSettings>) => {
    onChangeSchedule({
      options: {
        ...options,
        heatmap: {
          ...(options.heatmap || { mode: 'none', radiusKm: 1.5, intensity: 0.65 }),
          ...updated,
        },
      },
    });
  };

  const handleChangeTransitModes = (modes: TransitSubMode[]) => {
    onChangeSchedule({
      options: {
        ...options,
        transitModes: modes,
      },
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. Pendelzeit & Fahrtrichtung */}
      <ScheduleControls
        schedule={schedule}
        onChangeSchedule={onChangeSchedule}
        onRefreshIsochrones={onRefreshIsochrones}
        isCalculating={isCalculating}
        autoUpdate={autoUpdate}
        onToggleAutoUpdate={onToggleAutoUpdate}
      />

      {/* 2. Prioritäts-Heatmap (U-Bahn, S-Bahn, Autobahn) */}
      <PriorityHeatmapWidget
        heatmap={options.heatmap}
        onUpdateHeatmap={handleUpdateHeatmap}
      />

      {/* 3. ÖPNV-Verkehrsmittel (sichtbar wenn ÖPNV-Profil vorhanden) */}
      {showTransitSubmodes && (
        <TransitSubmodeWidget
          transitModes={options.transitModes}
          onChangeTransitModes={handleChangeTransitModes}
        />
      )}

      {/* 4. Single Point of Entry: Einstellungen Card (Karten, APIs & Parameter) */}
      <button
        id="btn-open-api-settings"
        type="button"
        onClick={() => handleSetModalOpen(true)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-200 text-xs transition-all group cursor-pointer shadow-2xs"
        title="Zentrales Einstellungsfenster für Karten, APIs, Isochronen-Parameter und MVV-Matrix öffnen"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-slate-600 group-hover:text-blue-600 shadow-2xs transition-colors shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <div className="font-bold text-slate-800 group-hover:text-blue-900 leading-tight">
              Karten, APIs & Parameter
            </div>
            <div className="text-[11px] text-slate-500 leading-tight truncate">
              {isGoogleBasemap ? 'Google Maps' : 'OSM'} • {options.fidelity || 'Auto'} •{' '}
              {options.liveTraffic ? 'Live-Verkehr an' : 'Standard'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-white group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs shrink-0">
          <span>Öffnen</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* 5. Zentrales Modal für Karten, APIs, Isochronen & MVV */}
      {showModal && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={showModal}
            onClose={() => handleSetModalOpen(false)}
            schedule={schedule}
            onChangeSchedule={onChangeSchedule}
            onRefreshIsochrones={onRefreshIsochrones}
            onBasemapChange={onBasemapChange}
            showOnlyIntersection={showOnlyIntersection}
            onToggleOnlyIntersection={onToggleOnlyIntersection}
          />
        </Suspense>
      )}
    </div>
  );
};
