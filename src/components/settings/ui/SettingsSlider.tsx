import React from 'react';

interface SettingsSliderProps {
  id?: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  minLabel?: string;
  maxLabel?: string;
  description?: string;
  disabled?: boolean;
}

export const SettingsSlider: React.FC<SettingsSliderProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
  minLabel,
  maxLabel,
  description,
  disabled = false,
}) => {
  const displayVal = formatValue ? formatValue(value) : `${value}${unit ? ` ${unit}` : ''}`;
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={`space-y-2 py-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-[#e3e3e3]">
          {label}
        </label>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#8ab4f8] border border-blue-200/60 dark:border-blue-800/50">
          {displayVal}
        </span>
      </div>

      {description && (
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] leading-relaxed">
          {description}
        </p>
      )}

      <div className="relative pt-1">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-1.5 bg-slate-200 dark:bg-[#3c4043] rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-[#8ab4f8] transition-all focus:outline-none"
        />
        {(minLabel || maxLabel) && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-[#747775] mt-1.5">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
