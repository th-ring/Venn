import React from 'react';
import { PolygonFidelity, IsochroneOptions } from '../../../types';
import {
  IsochroneProvider,
  hasGoogleMapsApiKey,
  hasOrsApiKey,
} from '../../../services/isochroneEngine';
import { Globe, Route, Sparkles, SlidersHorizontal, ExternalLink, Check, KeyRound, Info } from 'lucide-react';
import { SettingsCard } from '../ui/SettingsCard';
import { SettingsRow } from '../ui/SettingsRow';
import { SettingsSwitch } from '../ui/SettingsSwitch';
import { SettingsSegmentedControl } from '../ui/SettingsSegmentedControl';

interface IsochroneEngineTabProps {
  activeProvider: IsochroneProvider;
  onSelectProvider: (provider: IsochroneProvider) => void;
  options: IsochroneOptions;
  onSelectFidelity: (fidelity: PolygonFidelity) => void;
  onToggleOption: (key: 'liveTraffic' | 'enableSmoothing' | 'fillHoles') => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  onOpenRoutingTab?: () => void;
  onOpenKeysTab?: () => void;
}

interface ProviderItem {
  id: IsochroneProvider;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isConfigured: boolean;
  docUrl?: string;
  docLabel?: string;
}

export const IsochroneEngineTab: React.FC<IsochroneEngineTabProps> = ({
  activeProvider,
  onSelectProvider,
  options,
  onSelectFidelity,
  onToggleOption,
  showOnlyIntersection,
  onToggleOnlyIntersection,
  onOpenRoutingTab,
  onOpenKeysTab,
}) => {
  const providers: ProviderItem[] = [
    {
      id: 'google',
      name: 'Google Maps Isochrones API',
      badge: hasGoogleMapsApiKey() ? 'Aktiviert' : 'API-Key erforderlich',
      badgeColor: hasGoogleMapsApiKey()
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      description:
        'Offizielle Google Maps Erreichbarkeits-Polygone für Pkw, Fahrrad und Fußwege mit Live-Verkehrsdaten. (ÖPNV nutzt nahtlos die lokale MVV/MVG-Haltestellenmatrix).',
      icon: Globe,
      isConfigured: hasGoogleMapsApiKey(),
      docUrl: 'https://developers.google.com/maps/documentation/isochrones',
      docLabel: 'Google Doku',
    },
    {
      id: 'ors',
      name: 'OpenRouteService (ORS)',
      badge: hasOrsApiKey() ? 'Aktiviert' : 'API-Key erforderlich',
      badgeColor: hasOrsApiKey()
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      description:
        'OpenStreetMap-basierte Erreichbarkeitszonen für Pkw, Rad und Fußgänger via HeiGIT OpenRouteService API.',
      icon: Route,
      isConfigured: hasOrsApiKey(),
      docUrl: 'https://openrouteservice.org',
      docLabel: 'openrouteservice.org',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
          Isochronen-Engine & Berechnungsqualität
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
          Wähle deinen Standard-Routingdienst für Pkw, Rad und Fußwege. Alle Straßenberechnungen erfolgen ausschließlich über echte APIs.
        </p>
      </div>

      {/* Info Callout */}
      <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-xs text-slate-600 dark:text-[#c4c7c5] flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-white">API-Standard: </span>
          Straßen-Isochronen erfordern einen hinterlegten API-Key für exakte Verkehrszeiten ohne künstliche Näherungen. ÖPNV-Fahrzeiten basieren lokal auf der GTFS-Fahrplanmatrix und benötigen keinen Key.
        </div>
      </div>

      {/* Engine Selection Cards */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-slate-700 dark:text-[#c4c7c5] uppercase tracking-wider px-1">
          Berechnungs-Engine
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {providers.map((p) => {
            const Icon = p.icon;
            const isSelected = activeProvider === p.id;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProvider(p.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-2 border-blue-600 dark:border-[#8ab4f8] shadow-xs'
                    : 'bg-white dark:bg-[#1e1f20] border-slate-200/90 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314]'
                          : 'bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900 dark:text-[#e3e3e3]">
                          {p.name}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#9aa0a6] leading-relaxed mt-1">
                        {p.description}
                      </p>

                      {!p.isConfigured && onOpenKeysTab && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenKeysTab();
                          }}
                          className="mt-2 text-xs font-semibold text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Jetzt API-Key in den Einstellungen hinterlegen</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {p.docUrl && (
                      <a
                        href={p.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#282a2c]"
                        title={p.docLabel}
                      >
                        <span className="hidden sm:inline">{p.docLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Computation & Geometry Settings Card */}
      <SettingsCard title="Berechnungs- & Geometrie-Parameter">
        {/* Fidelity / Detailgrad */}
        <SettingsRow
          icon={Sparkles}
          iconColor="text-blue-600 dark:text-[#8ab4f8]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          title="Detailgrad der Polygone"
          description="Bestimmt die Auflösung des Erreichbarkeitsrasters (Auto balanciert Geschwindigkeit und Detailtreue)."
          control={
            <SettingsSegmentedControl<PolygonFidelity>
              value={options.fidelity || 'AUTOMATIC'}
              onChange={onSelectFidelity}
              options={[
                { value: 'AUTOMATIC', label: 'Auto' },
                { value: 'LOW', label: 'Grob' },
                { value: 'MEDIUM', label: 'Mittel' },
                { value: 'HIGH', label: 'Präzise' },
              ]}
            />
          }
        />

        {/* Glatte Kanten / Smoothing */}
        <SettingsRow
          title="Glatte Konturkanten"
          description="Wendet B-Spline Glättung auf die berechneten Polygon-Außenkanten an."
          control={
            <SettingsSwitch
              checked={Boolean(options.enableSmoothing)}
              onChange={() => onToggleOption('enableSmoothing')}
              ariaLabel="Glatte Kanten umschalten"
            />
          }
        />

        {/* Hole-Filling */}
        <SettingsRow
          title="Künstliche Netzlöcher schließen (Hole-Filling)"
          description="Schließt unbegründete Hohlräume und Artefakte in dichten Stadtgebieten (z. B. Moosach) für ein konsistentes Polygon."
          control={
            <SettingsSwitch
              checked={options.fillHoles !== false}
              onChange={() => onToggleOption('fillHoles')}
              ariaLabel="Hole-Filling umschalten"
            />
          }
        />

        {/* Nur Treffbereich anzeigen */}
        {onToggleOnlyIntersection && (
          <SettingsRow
            title="Nur gemeinsamen Treffbereich anzeigen"
            description="Blendet individuelle Personen-Isochronen aus und hebt ausschließlich die grüne gemeinsame Schnittmenge hervor."
            control={
              <SettingsSwitch
                checked={Boolean(showOnlyIntersection)}
                onChange={onToggleOnlyIntersection}
                ariaLabel="Nur Schnittmenge anzeigen umschalten"
              />
            }
          />
        )}
      </SettingsCard>

      {/* Link to Routing Parameters */}
      {onOpenRoutingTab && (
        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0" />
            <span className="text-xs text-slate-700 dark:text-[#c4c7c5]">
              Gehzeiten, Umsteigepuffer, Taktzeiten & Geschwindigkeiten anpassen?
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenRoutingTab}
            className="text-xs font-semibold text-blue-600 dark:text-[#8ab4f8] hover:underline px-3 py-1.5 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-900/40 shrink-0 cursor-pointer"
          >
            Zu den Mobilitäts-Parametern →
          </button>
        </div>
      )}
    </div>
  );
};
