import React from 'react';

interface SettingsCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-[#3c4043] shadow-xs overflow-hidden ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-[#2d2f31] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#1b1c1d]/50">
          <div className="min-w-0">
            {title && (
              <h4 className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3] uppercase tracking-wider">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="divide-y divide-slate-100 dark:divide-[#2d2f31]">{children}</div>
    </div>
  );
};
