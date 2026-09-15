import React from 'react';

interface SettingsRowProps {
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  control?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-[#8ab4f8]',
  iconBg = 'bg-blue-50 dark:bg-blue-950/40',
  title,
  description,
  badge,
  control,
  onClick,
  className = '',
  children,
  disabled = false,
}) => {
  const isClickable = !disabled && Boolean(onClick);

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`p-3.5 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isClickable ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#282a2c]/60' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${iconBg} ${iconColor}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-900 dark:text-[#e3e3e3] leading-snug">
              {title}
            </span>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-[#9aa0a6] leading-relaxed mt-0.5">
              {description}
            </p>
          )}
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>

      {control && (
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {control}
        </div>
      )}
    </div>
  );
};
