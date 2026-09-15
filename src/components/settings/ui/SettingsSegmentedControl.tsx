import React from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SettingsSegmentedControlProps<T extends string | number> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SettingsSegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  disabled = false,
  className = '',
}: SettingsSegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex p-1 bg-slate-100 dark:bg-[#131314] rounded-xl border border-slate-200/80 dark:border-[#3c4043] gap-1 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const Icon = opt.icon;

        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
              isSelected
                ? 'bg-white dark:bg-[#282a2c] text-blue-600 dark:text-[#8ab4f8] shadow-xs font-semibold'
                : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3] hover:bg-slate-200/50 dark:hover:bg-[#202124]'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{opt.label}</span>
            {opt.badge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
