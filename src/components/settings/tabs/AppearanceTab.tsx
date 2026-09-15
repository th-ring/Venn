import React from 'react';
import { ThemePreference, ResolvedTheme } from '../../../services/themeService';
import { Monitor, Sun, Moon, Check, Sparkles } from 'lucide-react';
import { SettingsCard } from '../ui/SettingsCard';
import { SettingsRow } from '../ui/SettingsRow';

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
  headerBg: string;
  sidebarBg: string;
  cardBg: string;
  accentBg: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'system',
    label: 'Systemstandard',
    badge: 'Empfohlen',
    description: 'Passt sich automatisch den Einstellungen deines Betriebssystems an.',
    icon: Monitor,
    headerBg: 'bg-gradient-to-r from-slate-200 to-slate-800',
    sidebarBg: 'bg-gradient-to-r from-slate-100 to-slate-900',
    cardBg: 'bg-gradient-to-r from-white to-[#1e1f20]',
    accentBg: 'bg-blue-600 dark:bg-[#8ab4f8]',
  },
  {
    id: 'light',
    label: 'Helles Design',
    description: 'Klares Google Material Light Theme mit hellen Flächen und hohem Kontrast.',
    icon: Sun,
    headerBg: 'bg-slate-200',
    sidebarBg: 'bg-slate-100',
    cardBg: 'bg-white',
    accentBg: 'bg-blue-600',
  },
  {
    id: 'dark',
    label: 'Dunkles Design',
    description: 'Augenschonendes Google Dark Theme mit dezenten Anthrazit-Tönen (#1e1f20).',
    icon: Moon,
    headerBg: 'bg-[#282a2c]',
    sidebarBg: 'bg-[#131314]',
    cardBg: 'bg-[#1e1f20]',
    accentBg: 'bg-[#8ab4f8]',
  },
];

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  themePreference,
  resolvedTheme,
  onSelectTheme,
}) => {
  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div>
        <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
          Erscheinungsbild
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
          Wähle dein bevorzugtes Anzeigedesign für die Benutzeroberfläche, Karten-Overlays und Steuerelemente.
        </p>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = themePreference === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectTheme(opt.id)}
              className={`p-4 rounded-[20px] text-left transition-all relative flex flex-col justify-between cursor-pointer group select-none ${
                isSelected
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-2 border-blue-600 dark:border-[#8ab4f8] shadow-xs'
                  : 'bg-white dark:bg-[#1e1f20] border border-slate-200/90 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368] hover:shadow-xs'
              }`}
            >
              <div>
                {/* Top Row with Icon, Badge & Radio Check */}
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314]'
                        : 'bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6] group-hover:text-slate-900 dark:group-hover:text-[#e3e3e3]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {opt.badge && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        {opt.badge}
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314]'
                          : 'border border-slate-300 dark:border-[#5f6368]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <div className="text-sm font-medium text-slate-900 dark:text-[#e3e3e3]">
                  {opt.label}
                </div>
                <p className="text-xs text-slate-500 dark:text-[#9aa0a6] leading-relaxed mt-1">
                  {opt.description}
                </p>
              </div>

              {/* Realistic Visual Preview Mockup */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#2d2f31]">
                <div className={`w-full h-14 rounded-xl p-1.5 flex flex-col justify-between border border-slate-200/60 dark:border-[#3c4043] ${opt.sidebarBg}`}>
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="w-8 h-1.5 rounded-full bg-slate-400/50" />
                    <div className={`w-2 h-2 rounded-full ${opt.accentBg}`} />
                  </div>

                  {/* Mockup Cards */}
                  <div className="flex gap-1.5 h-7">
                    <div className={`w-1/3 h-full rounded-lg ${opt.cardBg} border border-black/5 dark:border-white/5 p-1 flex flex-col justify-center gap-0.5`}>
                      <div className="w-full h-1 rounded-full bg-slate-400/40" />
                      <div className="w-2/3 h-1 rounded-full bg-slate-400/20" />
                    </div>
                    <div className={`w-2/3 h-full rounded-lg ${opt.cardBg} border border-black/5 dark:border-white/5 p-1 flex items-center justify-center`}>
                      <div className="w-full h-2 rounded-md bg-blue-500/20 border border-blue-500/30" />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Theme Status Details Card */}
      <SettingsCard title="Anzeige-Status">
        <SettingsRow
          icon={Sparkles}
          iconColor="text-blue-600 dark:text-[#8ab4f8]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          title="Aktiver Render-Modus"
          description={
            themePreference === 'system'
              ? `Wird automatisch vom System gesteuert (aktuell ${resolvedTheme === 'dark' ? 'Dunkelmodus' : 'Hellmodus'}).`
              : `Manuell ausgewählt (${themePreference === 'dark' ? 'Dunkles Design' : 'Helles Design'}).`
          }
          control={
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#282a2c] text-slate-800 dark:text-[#e3e3e3] border border-slate-200 dark:border-[#3c4043]">
              {resolvedTheme === 'dark' ? '🌙 Dunkel' : '☀️ Hell'}
            </span>
          }
        />
      </SettingsCard>
    </div>
  );
};
