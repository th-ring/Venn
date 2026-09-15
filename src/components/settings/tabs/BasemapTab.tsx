import React from 'react';
import { BasemapPlatform, MapVariant } from '../../../types';
import {
  OSM_VARIANTS,
  MEMOMAPS_VARIANTS,
  CARTO_VARIANTS,
  GOOGLE_VARIANTS,
} from '../../map/MapLayerControls';
import { Globe, Map as MapIcon, Palette, Train, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { SettingsCard } from '../ui/SettingsCard';
import { SettingsRow } from '../ui/SettingsRow';
import { SettingsSwitch } from '../ui/SettingsSwitch';

interface BasemapTabProps {
  platform: BasemapPlatform;
  variant: MapVariant;
  onSelectPlatform: (platform: BasemapPlatform) => void;
  onSelectVariant: (variant: MapVariant) => void;
  hasGoogleKey: boolean;
  onOpenKeysTab: () => void;
  showRailwayOverlay?: boolean;
  onToggleRailwayOverlay?: () => void;
}

interface PlatformDefinition {
  id: BasemapPlatform;
  name: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresKey?: boolean;
}

const PLATFORMS: PlatformDefinition[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    tagline: 'Standard',
    description: 'Freie weltweite Geodaten mit detaillierter Straßen- und Wegenavigation.',
    icon: Globe,
  },
  {
    id: 'memomaps',
    name: 'MemoMaps ÖPNV',
    tagline: 'Fokus Nahverkehr',
    description: 'Klar gezeichnetes europäisches Bahn-, S-Bahn-, U-Bahn- und Busliniennetz.',
    icon: Train,
  },
  {
    id: 'carto',
    name: 'CARTO',
    tagline: 'Minimalistisch',
    description: 'Kontrastreduzierte Positron- und Dark Matter-Karten für optimale Datenlesbarkeit.',
    icon: Palette,
  },
  {
    id: 'google',
    name: 'Google Maps',
    tagline: 'Google Maps JS API',
    description: 'Originale Google Maps Vektorkarte und globale Luftbild-Satellitenaufnahmen.',
    icon: MapIcon,
    requiresKey: true,
  },
];

export const BasemapTab: React.FC<BasemapTabProps> = ({
  platform,
  variant,
  onSelectPlatform,
  onSelectVariant,
  hasGoogleKey,
  onOpenKeysTab,
  showRailwayOverlay = false,
  onToggleRailwayOverlay,
}) => {
  const currentVariants =
    platform === 'google'
      ? GOOGLE_VARIANTS
      : platform === 'carto'
      ? CARTO_VARIANTS
      : platform === 'memomaps' || platform === 'opnv'
      ? MEMOMAPS_VARIANTS
      : OSM_VARIANTS;

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
          Kartendienst & Overlays
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
          Wähle den primären Kartenanbieter und den visuellen Darstellungsstil für die interaktive Karte.
        </p>
      </div>

      {/* Basis-Kartendienst Grid */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-slate-700 dark:text-[#c4c7c5] uppercase tracking-wider px-1">
          Kartenanbieter
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const isSelected = platform === p.id;
            const isGoogleWithoutKey = p.requiresKey && !hasGoogleKey;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPlatform(p.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-2 border-blue-600 dark:border-[#8ab4f8] shadow-xs'
                    : 'bg-white dark:bg-[#1e1f20] border-slate-200/90 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368] hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314]'
                          : 'bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isGoogleWithoutKey ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                          Key nötig
                        </span>
                      ) : p.requiresKey && hasGoogleKey ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                          Key aktiv
                        </span>
                      ) : null}

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
                    {p.name}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#9aa0a6] leading-snug mt-1">
                    {p.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Notice for Google Key if selected but missing */}
        {platform === 'google' && !hasGoogleKey && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Für Google Maps ist ein gültiger Google Cloud API-Key erforderlich.</span>
            </div>
            <button
              type="button"
              onClick={onOpenKeysTab}
              className="px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800/60 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>Key hinterlegen</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Kartentyp / Varianten */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-semibold text-slate-700 dark:text-[#c4c7c5] uppercase tracking-wider">
            Kartentyp & Stil
          </div>
          <span className="text-[11px] text-slate-400 dark:text-[#747775]">
            {currentVariants.length} Varianten verfügbar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentVariants.map((v) => {
            const VIcon = v.icon;
            const isSel = variant === v.id;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVariant(v.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer select-none ${
                  isSel
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-2 border-blue-600 dark:border-[#8ab4f8] shadow-xs'
                    : 'bg-white dark:bg-[#1e1f20] border-slate-200/90 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSel
                      ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314]'
                      : 'bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6]'
                  }`}
                >
                  <VIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-900 dark:text-[#e3e3e3]">
                      {v.label}
                    </span>
                    {isSel && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-tight mt-0.5">
                    {v.subLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zusatz-Ebenen / Schienennetz */}
      {onToggleRailwayOverlay && (
        <SettingsCard title="Zusätzliche Ebenen">
          <SettingsRow
            icon={Train}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            title="Schienennetz-Overlay (OpenRailwayMap)"
            description="Blendet S-Bahn, U-Bahn, Tram und DB-Gleise mit Bahnhöfen transparent über die gewählte Basiskarte ein."
            badge={
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] border border-slate-200 dark:border-[#3c4043]">
                Vektorgleise
              </span>
            }
            control={
              <SettingsSwitch
                checked={showRailwayOverlay}
                onChange={onToggleRailwayOverlay}
                ariaLabel="Schienennetz-Overlay umschalten"
              />
            }
          />
        </SettingsCard>
      )}
    </div>
  );
};
