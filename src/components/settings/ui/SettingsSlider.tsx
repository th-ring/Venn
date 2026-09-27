import React, { useState, useEffect, useRef } from 'react';

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
  const [localValue, setLocalValue] = useState<number>(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const commitValue = (val: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onChange(val);
  };

  const handleChange = (newVal: number) => {
    setLocalValue(newVal);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      commitValue(newVal);
    }, 120);
  };

  const handleRelease = () => {
    commitValue(localValue);
  };

  const displayVal = formatValue ? formatValue(localValue) : `${localValue}${unit ? ` ${unit}` : ''}`;

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
          value={localValue}
          aria-label={label}
          aria-valuetext={displayVal}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          onPointerUp={handleRelease}
          onKeyUp={handleRelease}
          disabled={disabled}
          className="w-full h-2 bg-slate-300 dark:bg-[#4a4d51] border border-slate-300 dark:border-[#5f6368] rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-[#8ab4f8] transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        {(minLabel || maxLabel) && (
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-[#9aa0a6] mt-1.5">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
