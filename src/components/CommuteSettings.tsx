import React from 'react';
import {
  CommuteSchedule,
  PersonProfile,
  HeatmapSettings,
} from '../types';
import { ScheduleControls } from './commute/ScheduleControls';
import { PriorityHeatmapWidget } from './commute/PriorityHeatmapWidget';

export interface CommuteSettingsProps {
  schedule: CommuteSchedule;
  profiles?: PersonProfile[];
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
  onRefreshIsochrones?: () => void;
  isCalculating?: boolean;
  autoUpdate?: boolean;
  onToggleAutoUpdate?: () => void;
}

export const CommuteSettings: React.FC<CommuteSettingsProps> = ({
  schedule,
  onChangeSchedule,
  onRefreshIsochrones,
  isCalculating = false,
  autoUpdate = true,
  onToggleAutoUpdate,
}) => {
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
    </div>
  );
};

