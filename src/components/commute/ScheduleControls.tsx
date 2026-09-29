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

const SCHEDULE_PRESETS: Array<{
  id: string;
  dayOfWeek: 'workday' | 'weekend';
  time: string;
  label: string;
}> = [
  { id: 'wd_0700', dayOfWeek: 'workday', time: '07:00', label: 'Mo–Fr, 07:00 Uhr' },
  { id: 'wd_0730', dayOfWeek: 'workday', time: '07:30', label: 'Mo–Fr, 07:30 Uhr' },
  { id: 'wd_0800', dayOfWeek: 'workday', time: '08:00', label: 'Mo–Fr, 08:00 Uhr' },
  { id: 'wd_0830', dayOfWeek: 'workday', time: '08:30', label: 'Mo–Fr, 08:30 Uhr' },
  { id: 'wd_0900', dayOfWeek: 'workday', time: '09:00', label: 'Mo–Fr, 09:00 Uhr' },
  { id: 'wd_1700', dayOfWeek: 'workday', time: '17:00', label: 'Mo–Fr, 17:00 Uhr' },
  { id: 'we_1000', dayOfWeek: 'weekend', time: '10:00', label: 'Sa/So, 10:00 Uhr' },
  { id: 'we_1400', dayOfWeek: 'weekend', time: '14:00', label: 'Sa/So, 14:00 Uhr' },
];

function getHeadwayProfile(dayOfWeek?: string, time?: string): { name: string; badgeClass: string; desc: string } {
  const t = time || '07:00';
  const isWeekend = dayOfWeek === 'weekend';
  const [h] = t.split(':').map(Number);
  const isNight = h >= 1 && h < 5;
  const isPeak = !isWeekend && ((t >= '06:30' && t <= '09:00') || (t >= '15:30' && t <= '19:00'));
  const isLateOrSunday = isWeekend || t >= '20:00' || t < '06:00';

  if (isNight) {
    return {
      name: 'Nachttakt',
      badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      desc: 'Nachtnetz & ausgedünnte Takte (30–60 Min)',
    };
  }
  if (isPeak) {
    return {
      name: 'HVZ',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      desc: 'Berufsverkehr-Takt (U-Bahn 5m, S-Bahn 2.5–10m)',
    };
  }
  if (isLateOrSunday) {
    return {
      name: 'SVZ',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      desc: 'Wochenende / Spätverkehr (U-Bahn 10m, S-Bahn 5–20m)',
    };
  }
  return {
    name: 'NVZ',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    desc: 'Normaler Tagestakt (U-Bahn 5–7m, S-Bahn 3.5–15m)',
  };
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
  const [isCustomMode, setIsCustomMode] = useState(false);

  const headwayProfile = getHeadwayProfile(schedule.dayOfWeek, schedule.time);

  const activePreset = SCHEDULE_PRESETS.find(
    (p) => p.dayOfWeek === schedule.dayOfWeek && p.time === schedule.time
  );

  const handleSelectPreset = (presetId: string) => {
    if (presetId === 'custom') {
      setIsCustomMode(true);
      return;
    }
    const found = SCHEDULE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setIsCustomMode(false);
      onChangeSchedule({
        dayOfWeek: found.dayOfWeek,
        time: found.time,
      });
    }
  };

  return (
    <div
      id="commute-schedule-controls"
      className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-slate-200/90 dark:border-[#2f3336] shadow-2xs overflow-hidden transition-all text-xs"
    >
      {/* Header bar */}
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-[#25262a]/70 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 dark:text-[#e8eaed] truncate">
            Taktprofil & Zeitfenster
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Summary badge when collapsed */}
          {isCollapsed && (
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${headwayProfile.badgeClass}`}>
                {headwayProfile.name}
              </span>
              <span className="text-[11px] font-medium bg-slate-100 dark:bg-[#25262a] text-slate-600 dark:text-[#9aa0a6] px-2.5 py-0.5 rounded-full truncate max-w-[140px]">
                {schedule.direction === 'to_work' ? '➔ Ziel' : '➔ Zurück'} •{' '}
                {schedule.dayOfWeek === 'workday' ? 'Mo–Fr' : 'Sa/So'} {schedule.time || '07:00'}
              </span>
            </div>
          )}

          {/* Action Button: Manual Refresh */}
          <button
            id="btn-manual-refresh"
            type="button"
            disabled={isCalculating}
            onClick={() => onRefreshIsochrones?.()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isCalculating
                ? 'text-blue-500 cursor-not-allowed'
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#25262a]'
            }`}
            title="Isochronen jetzt manuell neu berechnen"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>

          {/* Action Button: Auto-Update toggle */}
          {onToggleAutoUpdate && (
            <button
              id="btn-toggle-autoupdate"
              type="button"
              onClick={onToggleAutoUpdate}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                autoUpdate
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-[#25262a]'
              }`}
              title={
                autoUpdate
                  ? 'Automatische Neuberechnung: AKTIV'
                  : 'Automatische Neuberechnung: PAUSIERT'
              }
            >
              <Zap className={`w-3.5 h-3.5 ${autoUpdate ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Aufklappen' : 'Einklappen'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Streamlined Body */}
      {!isCollapsed && (
        <div className="p-2.5 pt-0 border-t border-slate-100 dark:border-[#2f3336] mt-0.5 space-y-2">
          {/* Row: Direction Segmented Pill + Day/Time Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5">
            {/* Direction 2-segment switch */}
            <div className="bg-slate-100 dark:bg-[#121315] p-0.5 rounded-xl border border-slate-200/60 dark:border-[#2f3336] flex items-center shrink-0">
              <button
                id="btn-direction-to-work"
                type="button"
                onClick={() => onChangeSchedule({ direction: 'to_work' })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  schedule.direction === 'to_work'
                    ? 'bg-white dark:bg-[#25262a] text-blue-600 dark:text-[#8ab4f8] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-white'
                }`}
                title="Vom Wohnort zum Zielort fahren"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Zum Ziel</span>
              </button>
              <button
                id="btn-direction-from-work"
                type="button"
                onClick={() => onChangeSchedule({ direction: 'from_work' })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  schedule.direction === 'from_work'
                    ? 'bg-white dark:bg-[#25262a] text-blue-600 dark:text-[#8ab4f8] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-white'
                }`}
                title="Vom Zielort starten"
              >
                <ArrowRightLeft className="w-3 h-3 rotate-180" />
                <span>Zurück</span>
              </button>
            </div>

            {/* Combined Day & Time Dropdown */}
            <div className="flex-1 min-w-0">
              <select
                value={isCustomMode ? 'custom' : (activePreset?.id || 'custom')}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121315] hover:bg-slate-100/80 dark:hover:bg-[#25262a] border border-slate-200/80 dark:border-[#2f3336] rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-[#e8eaed] cursor-pointer focus:ring-1 focus:ring-blue-500 transition-colors"
                title="Fahrplanzeit wählen"
              >
                {SCHEDULE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                <option value="custom">Eigene Uhrzeit...</option>
              </select>
            </div>
          </div>

          {/* Granular Custom Time inputs (only if 'custom' is active) */}
          {isCustomMode && (
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-[#121315] rounded-xl border border-slate-200/80 dark:border-[#2f3336] animate-in fade-in">
              {/* Day selection */}
              <div className="flex items-center gap-1">
                <button
                  id="btn-day-workday"
                  type="button"
                  onClick={() => onChangeSchedule({ dayOfWeek: 'workday' })}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    schedule.dayOfWeek === 'workday'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-200 dark:hover:bg-[#25262a]'
                  }`}
                >
                  Mo–Fr
                </button>
                <button
                  id="btn-day-weekend"
                  type="button"
                  onClick={() => onChangeSchedule({ dayOfWeek: 'weekend' })}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    schedule.dayOfWeek === 'weekend'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-200 dark:hover:bg-[#25262a]'
                  }`}
                >
                  Sa/So
                </button>
              </div>

              {/* Exact Time Input */}
              <div className="flex items-center gap-1.5">
                <input
                  id="input-departure-time"
                  type="time"
                  value={schedule.time || '07:00'}
                  onChange={(e) => {
                    if (e.target.value) {
                      onChangeSchedule({ time: e.target.value });
                    }
                  }}
                  className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-[#2f3336] rounded-lg px-2 py-0.5 text-xs text-slate-800 dark:text-white font-mono cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Active Headway Profile Indicator */}
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121315] border border-slate-200/60 dark:border-[#2f3336]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${headwayProfile.badgeClass}`}>
                {headwayProfile.name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6] truncate">
                {headwayProfile.desc}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-[#5f6368] shrink-0 font-medium">
              Soll-Taktung
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
