import React from 'react';
import { ThemePreference, ResolvedTheme } from '../../../services/themeService';
import { Monitor, Sun, Moon, Check, Info } from 'lucide-react';

interface AppearanceTabProps {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onSelectTheme: (pref: ThemePreference) => void;
}

interface ThemeOption {
  id: ThemePreference;
  label: string;
  badge?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'system',
    label: 'System',
    badge: 'Standard',
    description: 'Passt sich automatisch den Systemeinstellungen deines Geräts oder Browsers an.',
    icon: Monitor,
    previewBg: 'bg-gradient-to-r from-slate-100 to-neutral-900',
    previewCard: 'bg-gradient-to-r from-white to-neutral-800',
    previewAccent: 'from-blue-500 to-blue-400',
  },
  {
    id: 'light',
    label: 'Hell',
    description: 'Klares Google Material Light Theme mit hellen Flächen und hohem Kontrast.',
    icon: Sun,
    previewBg: 'bg-slate-100',
    previewCard: 'bg-white',
    previewAccent: 'bg-blue-600',
  },
  {
    id: 'dark',
    label: 'Dunkel',
    description: 'Augenschonendes Google Dark Theme für blendfreies Arbeiten und dunkle Karten.',
    icon: Moon,
    previewBg: 'bg-[#131314]',
    previewCard: 'bg-[#1e1f20]',
    previewAccent: 'bg-[#8ab4f8]',
  },
];

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  themePreference,
  resolvedTheme,
  onSelectTheme,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3] uppercase tracking-wider mb-1">
          Erscheinungsbild & Theme
        </h4>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] leading-relaxed">
          Wähle dein bevorzugtes Anzeigedesign. Das Design wird auf alle Menüs, Steuerelemente,
          Popups und die von uns gerenderten Karten-Visualisierungen angewendet.
        </p>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = themePreference === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectTheme(opt.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group select-none ${
                isSelected
                  ? 'border-blue-600 dark:border-[#8ab4f8] bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/30 dark:ring-blue-400/30 shadow-sm'
                  : 'border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] hover:border-slate-300 dark:hover:border-[#5f6368] hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314]'
                        : 'bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6] group-hover:text-slate-900 dark:group-hover:text-[#e3e3e3]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {opt.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200/70 dark:border-blue-700/50">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-[#8ab4f8] text-white dark:text-[#131314] flex items-center justify-center shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="text-sm font-bold text-slate-900 dark:text-[#e3e3e3] mb-1">
                  {opt.label}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-snug">
                  {opt.description}
                </p>
              </div>

              {/* Visual Preview Miniature */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2f31]">
                <div
                  className={`w-full h-11 rounded-lg p-1.5 flex items-center justify-between border border-slate-200/60 dark:border-[#3c4043] ${opt.previewBg}`}
                >
                  <div className={`w-1/2 h-full rounded-md shadow-2xs ${opt.previewCard} p-1 flex flex-col justify-center gap-1`}>
                    <div className="w-3/4 h-1 bg-slate-300 dark:bg-neutral-600 rounded-full" />
                    <div className="w-1/2 h-1 bg-slate-200 dark:bg-neutral-700 rounded-full" />
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      opt.id === 'system'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                        : opt.previewAccent
                    }`}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Callout */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202124] border border-slate-200/80 dark:border-[#3c4043] flex items-center justify-between text-xs text-slate-600 dark:text-[#9aa0a6]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0" />
          <span>
            Aktiver Modus:{' '}
            <strong className="text-slate-900 dark:text-[#e3e3e3]">
              {resolvedTheme === 'dark' ? 'Dunkel' : 'Hell'}
            </strong>
            {themePreference === 'system' ? ' (über System gesteuert)' : ' (manuell gewählt)'}
          </span>
        </div>
      </div>
    </div>
  );
};
