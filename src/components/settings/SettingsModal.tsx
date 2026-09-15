import React, { useState, useEffect } from 'react';
import {
  BasemapPlatform,
  MapVariant,
  BasemapProvider,
  CommuteSchedule,
  PolygonFidelity,
  TransitSubMode,
  DEFAULT_TRANSIT_SUBMODES,
  HeatmapSettings,
} from '../../types';
import {
  IsochroneProvider,
  getGoogleMapsApiKey,
  getOrsApiKey,
  getSelectedProvider,
  getBasemapPlatform,
  getMapVariant,
  setGoogleMapsApiKey,
  setOrsApiKey,
  setSelectedProvider,
  setBasemapPlatform,
  setMapVariant,
  setSelectedBasemap,
  getRailwayOverlayEnabled,
  setRailwayOverlayEnabled,
  clearIsochroneCache,
} from '../../services/isochroneEngine';
import {
  validateGoogleMapsApiKey,
  validateOrsApiKey,
  KeyCheckResult,
} from '../../services/apiKeyValidator';
import {
  getMvvDatasetMetadata,
  syncMvvDatasetFromEndpoint,
} from '../../services/mvvMatrixService';
import { AppearanceTab } from './tabs/AppearanceTab';
import { BasemapTab } from './tabs/BasemapTab';
import { IsochroneEngineTab } from './tabs/IsochroneEngineTab';
import { DataPackagesTab } from './tabs/DataPackagesTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { PriorityHeatmapTab } from './tabs/PriorityHeatmapTab';
import { RentalOverlayTab } from './tabs/RentalOverlayTab';
import { useTheme } from '../../hooks/useTheme';
import {
  Settings,
  Layers,
  Map as MapIcon,
  Globe,
  Train,
  Key,
  Flame,
  Euro,
  Palette,
  X,
  Check,
} from 'lucide-react';

export type SettingsTabId =
  | 'appearance'
  | 'basemap'
  | 'isochrones'
  | 'mvv'
  | 'keys'
  | 'heatmap'
  | 'rental';

const SETTINGS_MENU: Array<{
  id: SettingsTabId;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'appearance', label: 'Erscheinungsbild', subLabel: 'Design & Theme', icon: Palette },
  { id: 'basemap', label: 'Kartendienst', subLabel: 'OSM, MemoMaps, CARTO & Google', icon: MapIcon },
  { id: 'isochrones', label: 'Isochronen', subLabel: 'Berechnung & Parameter', icon: Globe },
  { id: 'mvv', label: 'Datenpakete & Regionen', subLabel: 'Lokale Verkehrsdaten', icon: Layers },
  { id: 'keys', label: 'API-Schlüssel', subLabel: 'Google & ORS Zugangsdaten', icon: Key },
  { id: 'heatmap', label: 'Prioritäts-Heatmap', subLabel: 'Infrastruktur-Puffer', icon: Flame },
  { id: 'rental', label: 'Mietspiegel', subLabel: 'Kaltmieten & Wohnlagen', icon: Euro },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: CommuteSchedule;
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
  onRefreshIsochrones?: () => void;
  onBasemapChange?: (provider: BasemapProvider) => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  initialTab?: SettingsTabId;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onChangeSchedule,
  onRefreshIsochrones,
  onBasemapChange,
  showOnlyIntersection,
  onToggleOnlyIntersection,
  initialTab = 'basemap',
}) => {
  if (!isOpen) return null;

  const [modalTab, setModalTab] = useState<SettingsTabId>(initialTab);
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();

  useEffect(() => {
    setModalTab(initialTab);
  }, [initialTab]);

  // Input states
  const [googleKeyInput, setGoogleKeyInput] = useState(getGoogleMapsApiKey());
  const [orsKeyInput, setOrsKeyInput] = useState(getOrsApiKey());
  const [activeProvider, setActiveProvider] = useState<IsochroneProvider>(getSelectedProvider());
  const [modalPlatform, setModalPlatform] = useState<BasemapPlatform>(() => getBasemapPlatform());
  const [modalVariant, setModalVariant] = useState<MapVariant>(() => getMapVariant());
  const [modalRailwayOverlay, setModalRailwayOverlay] = useState<boolean>(() => getRailwayOverlayEnabled());
  const [isSaved, setIsSaved] = useState(false);

  const handleModalSelectPlatform = (platform: BasemapPlatform) => {
    setModalPlatform(platform);
    if (platform === 'carto' && !['carto_light', 'carto_dark', 'carto_voyager'].includes(modalVariant)) {
      setModalVariant('carto_light');
    } else if ((platform === 'memomaps' || platform === 'opnv') && modalVariant !== 'memomaps') {
      setModalVariant('memomaps');
    } else if (platform === 'osm' && ['carto_light', 'carto_dark', 'carto_voyager', 'memomaps', 'railway'].includes(modalVariant)) {
      setModalVariant('normal');
    } else if (platform === 'google' && ['carto_light', 'carto_dark', 'carto_voyager', 'topo', 'memomaps', 'railway'].includes(modalVariant)) {
      setModalVariant('normal');
    }
  };

  // Key check statuses
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(false);
  const [googleCheckResult, setGoogleCheckResult] = useState<KeyCheckResult | null>(null);

  const [isCheckingOrs, setIsCheckingOrs] = useState(false);
  const [orsCheckResult, setOrsCheckResult] = useState<KeyCheckResult | null>(null);

  // MVV Dataset metadata & sync state
  const [mvvMeta, setMvvMeta] = useState(() => getMvvDatasetMetadata());
  const [isSyncingMvv, setIsSyncingMvv] = useState(false);
  const [mvvSyncMessage, setMvvSyncMessage] = useState<string | null>(null);

  const handleSyncMvv = async () => {
    setIsSyncingMvv(true);
    setMvvSyncMessage(null);
    try {
      const res = await syncMvvDatasetFromEndpoint();
      setMvvMeta(getMvvDatasetMetadata());
      setMvvSyncMessage(res.message);
      if (onRefreshIsochrones) {
        onRefreshIsochrones();
      }
    } catch (e: any) {
      setMvvSyncMessage('Fehler bei der Aktualisierung: ' + (e?.message || 'Unbekannt'));
    } finally {
      setIsSyncingMvv(false);
    }
  };

  const handleCheckGoogleKey = async () => {
    setIsCheckingGoogle(true);
    setGoogleCheckResult(null);
    try {
      const res = await validateGoogleMapsApiKey(googleKeyInput);
      setGoogleCheckResult(res);
    } catch {
      setGoogleCheckResult({
        valid: false,
        provider: 'google',
        message: 'Unerwarteter Fehler bei der Prüfung.',
      });
    } finally {
      setIsCheckingGoogle(false);
    }
  };

  const handleCheckOrsKey = async () => {
    setIsCheckingOrs(true);
    setOrsCheckResult(null);
    try {
      const res = await validateOrsApiKey(orsKeyInput);
      setOrsCheckResult(res);
    } catch {
      setOrsCheckResult({
        valid: false,
        provider: 'ors',
        message: 'Unerwarteter Fehler bei der Prüfung.',
      });
    } finally {
      setIsCheckingOrs(false);
    }
  };

  const handleSaveSettings = () => {
    setGoogleMapsApiKey(googleKeyInput);
    setOrsApiKey(orsKeyInput);

    let providerToSave = activeProvider;
    // If user entered an ORS key and provider was still default 'calibrated', activate ORS
    if (orsKeyInput.trim() && activeProvider === 'calibrated' && !getOrsApiKey()) {
      providerToSave = 'ors';
      setActiveProvider('ors');
    } else if (googleKeyInput.trim() && activeProvider === 'calibrated' && !getGoogleMapsApiKey() && !orsKeyInput.trim()) {
      providerToSave = 'google';
      setActiveProvider('google');
    }

    setSelectedProvider(providerToSave);
    setBasemapPlatform(modalPlatform);
    setMapVariant(modalVariant);
    setRailwayOverlayEnabled(modalRailwayOverlay);
    const composite = `${modalPlatform}_${modalVariant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }

    // Invalidate isochrone cache so fresh calculation runs with new keys/provider
    clearIsochroneCache();

    setIsSaved(true);
    if (onRefreshIsochrones) {
      onRefreshIsochrones();
    }
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const options = schedule.options ?? {
    liveTraffic: false,
    enableSmoothing: true,
    fidelity: 'AUTOMATIC',
  };

  const activeTransitModes: TransitSubMode[] =
    options.transitModes && options.transitModes.length > 0
      ? options.transitModes
      : DEFAULT_TRANSIT_SUBMODES;

  const handleToggleTransitMode = (mode: TransitSubMode) => {
    let nextModes: TransitSubMode[];
    if (activeTransitModes.includes(mode)) {
      if (activeTransitModes.length <= 1) return;
      nextModes = activeTransitModes.filter((m) => m !== mode);
    } else {
      nextModes = [...activeTransitModes, mode];
    }
    onChangeSchedule({
      options: {
        ...options,
        transitModes: nextModes,
      },
    });
  };

  const handleSelectFidelity = (fidelity: PolygonFidelity) => {
    onChangeSchedule({
      options: {
        ...options,
        fidelity,
      },
    });
  };

  const handleToggleOption = (key: 'liveTraffic' | 'enableSmoothing' | 'fillHoles') => {
    const currentVal = key === 'fillHoles' ? options.fillHoles !== false : !!options[key];
    onChangeSchedule({
      options: {
        ...options,
        [key]: !currentVal,
      },
    });
  };

  const heatmap: HeatmapSettings = options.heatmap ?? {
    mode: 'none',
    selectedItems: [],
    radiusKm: 1.5,
    intensity: 0.65,
  };

  const handleUpdateHeatmap = (updated: Partial<HeatmapSettings>) => {
    onChangeSchedule({
      options: {
        ...options,
        heatmap: {
          ...heatmap,
          ...updated,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e1f20] rounded-2xl w-full max-w-3xl h-[620px] max-h-[92vh] shadow-2xl border border-slate-200 dark:border-[#3c4043] flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3] leading-tight">
              Einstellungen
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5">
              Erscheinungsbild, Kartendienste, Isochronen, ÖPNV, API-Keys und Heatmaps
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two-column layout with fixed navigation */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Fixed Navigation Menu */}
          <nav className="w-full sm:w-56 bg-slate-50/90 dark:bg-[#131314]/90 border-b sm:border-b-0 sm:border-r border-slate-200/90 dark:border-[#3c4043] p-2.5 flex sm:flex-col justify-between shrink-0 overflow-x-auto sm:overflow-x-visible select-none gap-1">
            <div className="flex sm:flex-col gap-1 w-full">
              <div className="hidden sm:block px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-[#9aa0a6]">
                Kategorien
              </div>

              {SETTINGS_MENU.map((item) => {
                const Icon = item.icon;
                const isSelected = modalTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModalTab(item.id)}
                    className={`px-3.5 py-2 rounded-full text-left transition-colors flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 sm:shrink ${
                      isSelected
                        ? 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-900 dark:text-[#8ab4f8] font-medium'
                        : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3] hover:bg-slate-200/60 dark:hover:bg-[#282a2c] font-normal'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-700 dark:text-[#8ab4f8]' : 'text-slate-500 dark:text-[#9aa0a6]'}`} />
                    <div className="min-w-0">
                      <div className="text-xs leading-tight">{item.label}</div>
                      <div
                        className={`hidden sm:block text-[10px] font-normal leading-tight truncate mt-0.5 ${
                          isSelected ? 'text-blue-800/80 dark:text-[#8ab4f8]/80' : 'text-slate-400 dark:text-[#747775]'
                        }`}
                      >
                        {item.subLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Status Pill in Sidebar on desktop */}
            <div className="hidden sm:block p-2.5 rounded-2xl bg-white dark:bg-[#1e1f20] border border-slate-200/80 dark:border-[#3c4043] text-[10px] text-slate-500 dark:text-[#9aa0a6] space-y-1">
              <div className="font-medium text-slate-700 dark:text-[#e3e3e3] flex items-center justify-between">
                <span>Konfiguration</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="truncate text-slate-600 dark:text-[#9aa0a6]">
                Theme: <span className="font-medium text-slate-800 dark:text-[#e3e3e3]">{themePreference === 'system' ? 'System' : themePreference === 'dark' ? 'Dunkel' : 'Hell'}</span>
              </div>
              <div className="truncate text-slate-600 dark:text-[#9aa0a6]">
                Karte: <span className="font-medium text-slate-800 dark:text-[#e3e3e3]">{modalPlatform === 'google' ? 'Google Maps' : modalPlatform === 'carto' ? 'CARTO' : modalPlatform === 'memomaps' || modalPlatform === 'opnv' ? 'MemoMaps' : 'OSM'}</span>
              </div>
              <div className="truncate text-slate-600 dark:text-[#9aa0a6]">
                Engine: <span className="font-medium text-slate-800 dark:text-[#e3e3e3]">{activeProvider === 'google' ? 'Google API' : activeProvider === 'ors' ? 'ORS' : 'Offline'}</span>
              </div>
            </div>
          </nav>

          {/* Main Content & Actions Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1f20]">
            {/* Scrollable Tab Content Pane */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {modalTab === 'appearance' && (
                <AppearanceTab
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  onSelectTheme={setThemePreference}
                />
              )}

              {modalTab === 'basemap' && (
                <BasemapTab
                  platform={modalPlatform}
                  variant={modalVariant}
                  onSelectPlatform={handleModalSelectPlatform}
                  onSelectVariant={setModalVariant}
                  hasGoogleKey={!!getGoogleMapsApiKey()}
                  onOpenKeysTab={() => setModalTab('keys')}
                  showRailwayOverlay={modalRailwayOverlay}
                  onToggleRailwayOverlay={() => setModalRailwayOverlay((prev) => !prev)}
                />
              )}

              {modalTab === 'isochrones' && (
                <IsochroneEngineTab
                  activeProvider={activeProvider}
                  onSelectProvider={setActiveProvider}
                  options={options}
                  onSelectFidelity={handleSelectFidelity}
                  onToggleOption={handleToggleOption}
                  showOnlyIntersection={showOnlyIntersection}
                  onToggleOnlyIntersection={onToggleOnlyIntersection}
                />
              )}

              {modalTab === 'mvv' && (
                <DataPackagesTab
                  mvvMeta={mvvMeta}
                  isSyncingMvv={isSyncingMvv}
                  mvvSyncMessage={mvvSyncMessage}
                  onSyncMvv={handleSyncMvv}
                  activeTransitModes={activeTransitModes}
                  onToggleTransitMode={handleToggleTransitMode}
                  onRefreshIsochrones={onRefreshIsochrones}
                />
              )}

              {modalTab === 'keys' && (
                <ApiKeysTab
                  googleKeyInput={googleKeyInput}
                  onChangeGoogleKeyInput={setGoogleKeyInput}
                  isCheckingGoogle={isCheckingGoogle}
                  googleCheckResult={googleCheckResult}
                  onCheckGoogleKey={handleCheckGoogleKey}
                  orsKeyInput={orsKeyInput}
                  onChangeOrsKeyInput={setOrsKeyInput}
                  isCheckingOrs={isCheckingOrs}
                  orsCheckResult={orsCheckResult}
                  onCheckOrsKey={handleCheckOrsKey}
                />
              )}

              {modalTab === 'heatmap' && (
                <PriorityHeatmapTab
                  heatmap={heatmap}
                  onUpdateHeatmap={handleUpdateHeatmap}
                />
              )}

              {modalTab === 'rental' && (
                <RentalOverlayTab
                  schedule={schedule}
                  onChangeSchedule={onChangeSchedule}
                />
              )}
            </div>

            {/* Fixed Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-[#3c4043] bg-slate-50/70 dark:bg-[#131314]/70 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3] hover:bg-slate-200/60 dark:hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                className={`px-5 py-2 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#131314]'
                }`}
              >
                {isSaved ? <Check className="w-4 h-4" /> : null}
                <span>{isSaved ? 'Gespeichert!' : 'Speichern & Übernehmen'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
