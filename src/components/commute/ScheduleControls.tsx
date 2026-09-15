import React, { useState } from 'react';
import { CommuteSchedule } from '../../types';
import {
  Clock,
  ArrowRightLeft,
  Calendar,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ScheduleControlsProps {
  schedule: CommuteSchedule;
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
  onRefreshIsochrones?: () => void;
  isCalculating?: boolean;
  autoUpdate?: boolean;
  onToggleAutoUpdate?: () => void;
}

export const ScheduleControls: React.FC<ScheduleControlsProps> = ({
  schedule,
  onChangeSchedule,
  onRefreshIsochrones,
  isCalculating = false,
  autoUpdate = true,
  onToggleAutoUpdate,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-white dark:bg-[#1e1f20] rounded-xl border border-slate-200/90 dark:border-[#3c4043] shadow-2xs overflow-hidden transition-all">
      {/* Header / Toggle-Leiste */}
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#282a2c]/80 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-[#e3e3e3] truncate">
            Pendelzeit & Richtung
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Summary badge when collapsed */}
          {isCollapsed && (
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6] px-2 py-0.5 rounded-md truncate max-w-[170px]">
              {schedule.direction === 'to_work' ? 'Zum Ziel' : 'Vom Ziel'} •{' '}
              {schedule.dayOfWeek === 'workday' ? 'Mo–Fr' : 'Sa/So'}{' '}
              {schedule.time || '07:00'}
            </span>
          )}

          {/* Action Buttons: Refresh & Auto (Google M3 standard icon buttons) */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              id="btn-manual-refresh"
              type="button"
              disabled={isCalculating}
              onClick={() => {
                if (onRefreshIsochrones) {
                  onRefreshIsochrones();
                }
              }}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                isCalculating
                  ? 'text-blue-500 dark:text-[#8ab4f8] cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-[#e8eaed] hover:bg-slate-100 dark:hover:bg-[#282a2c]'
              }`}
              title="Isochronen jetzt manuell neu berechnen"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin text-blue-600 dark:text-[#8ab4f8]' : ''}`}
              />
            </button>

            {onToggleAutoUpdate && (
              <button
                id="btn-toggle-autoupdate"
                type="button"
                onClick={onToggleAutoUpdate}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  autoUpdate
                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    : 'text-slate-400 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                }`}
                title={
                  autoUpdate
                    ? 'Automatische Neuberechnung: AKTIV'
                    : 'Automatische Neuberechnung: PAUSIERT'
                }
              >
                <Zap
                  className={`w-3.5 h-3.5 ${
                    autoUpdate ? 'fill-current' : ''
                  }`}
                />
              </button>
            )}
          </div>

          <button
            type="button"
            className="text-slate-400 dark:text-[#9aa0a6] hover:text-slate-600 dark:hover:text-[#e3e3e3] p-0.5 rounded transition-colors"
            title={isCollapsed ? 'Aufklappen' : 'Einklappen'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content Body */}
      {!isCollapsed && (
        <div className="p-3 pt-0 border-t border-slate-100 dark:border-[#3c4043] mt-1 space-y-2.5">
          <div className="flex items-center justify-between gap-2 pt-2">
            {/* Richtung */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-[#9aa0a6]">
                Richtung:
              </span>
              <div className="flex bg-slate-100 dark:bg-[#131314] p-0.5 rounded-xl">
                <button
                  id="btn-direction-to-work"
                  type="button"
                  onClick={() => onChangeSchedule({ direction: 'to_work' })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    schedule.direction === 'to_work'
                      ? 'bg-white dark:bg-[#282a2c] text-blue-700 dark:text-[#8ab4f8] shadow-xs'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed]'
                  }`}
                  title="Vom Wohnort zum Arbeitsplatz / Ziel"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Zum Ziel</span>
                </button>
                <button
                  id="btn-direction-from-work"
                  type="button"
                  onClick={() => onChangeSchedule({ direction: 'from_work' })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    schedule.direction === 'from_work'
                      ? 'bg-white dark:bg-[#282a2c] text-blue-700 dark:text-[#8ab4f8] shadow-xs'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed]'
                  }`}
                  title="Vom Arbeitsplatz / Ziel nach Hause"
                >
                  <ArrowRightLeft className="w-3 h-3 rotate-180" />
                  <span>Vom Ziel</span>
                </button>
              </div>
            </div>

            {/* Tag */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-[#9aa0a6]">
                Tag:
              </span>
              <div className="flex bg-slate-100 dark:bg-[#131314] p-0.5 rounded-xl">
                <button
                  id="btn-day-workday"
                  type="button"
                  onClick={() => onChangeSchedule({ dayOfWeek: 'workday' })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    schedule.dayOfWeek === 'workday'
                      ? 'bg-white dark:bg-[#282a2c] text-blue-700 dark:text-[#8ab4f8] shadow-xs'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed]'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Mo–Fr</span>
                </button>
                <button
                  id="btn-day-weekend"
                  type="button"
                  onClick={() => onChangeSchedule({ dayOfWeek: 'weekend' })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    schedule.dayOfWeek === 'weekend'
                      ? 'bg-white dark:bg-[#282a2c] text-blue-700 dark:text-[#8ab4f8] shadow-xs'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed]'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Sa/So</span>
                </button>
              </div>
            </div>
          </div>

          {/* Uhrzeit */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#3c4043]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-[#9aa0a6]">Abfahrt:</span>
              <input
                id="input-departure-time"
                type="time"
                step="60"
                value={schedule.time || '07:00'}
                onChange={(e) => {
                  if (e.target.value) {
                    onChangeSchedule({ time: e.target.value });
                  }
                }}
                className="bg-white dark:bg-[#282a2c] hover:bg-slate-50 dark:hover:bg-[#3c4043] border border-slate-300 dark:border-[#5f6368] focus:border-blue-600 dark:focus:border-[#8ab4f8] text-slate-900 dark:text-[#e8eaed] font-medium px-2 py-1 rounded-lg text-xs focus:outline-none transition-colors cursor-pointer"
              />
            </div>

            {/* Presets (Google M3 chips) */}
            <div className="flex items-center gap-1">
              {['07:00', '07:30', '08:00', '17:00'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeSchedule({ time: preset })}
                  className={`text-[11px] px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                    schedule.time === preset
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-[#8ab4f8] font-medium'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
