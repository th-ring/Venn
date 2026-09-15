import React, { useState, useEffect, useRef } from 'react';
import {
  BasemapPlatform,
  MapVariant,
  BasemapProvider,
  CommuteSchedule,
  PolygonFidelity,
  TransitSubMode,
  DEFAULT_TRANSIT_SUBMODES,
  HeatmapSettings,
  IsochroneOptions,
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
import { RoutingParametersTab } from './tabs/RoutingParametersTab';
import { DataPackagesTab } from './tabs/DataPackagesTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { PriorityHeatmapTab } from './tabs/PriorityHeatmapTab';
import { RentalOverlayTab } from './tabs/RentalOverlayTab';
import { SettingsSearch } from './ui/SettingsSearch';
import { useTheme } from '../../hooks/useTheme';
import {
  Layers,
  Map as MapIcon,
  Globe,
  SlidersHorizontal,
  Key,
  Flame,
  Euro,
  Palette,
  X,
  Check,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react';

export type SettingsTabId =
  | 'appearance'
  | 'basemap'
  | 'isochrones'
  | 'routing'
  | 'rental'
  | 'heatmap'
  | 'mvv'
  | 'keys';

interface NavSection {
  title: string;
  items: Array<{
    id: SettingsTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const SETTINGS_SECTIONS: NavSection[] = [
  {
    title: 'Darstellung & Karte',
    items: [
      { id: 'appearance', label: 'Erscheinungsbild', icon: Palette },
      { id: 'basemap', label: 'Kartendienst & Overlays', icon: MapIcon },
    ],
  },
  {
    title: 'Berechnung & Routing',
    items: [
      { id: 'isochrones', label: 'Isochronen-Engine', icon: Globe },
      { id: 'routing', label: 'Mobilität & Parameter', icon: SlidersHorizontal },
    ],
  },
  {
    title: 'Karten-Ebenen',
    items: [
      { id: 'rental', label: 'Mietspiegel & Wohnlagen', icon: Euro },
      { id: 'heatmap', label: 'Prioritäts-Heatmap', icon: Flame },
    ],
  },
  {
    title: 'Daten & Schnittstellen',
    items: [
      { id: 'mvv', label: 'Datenpakete & Regionen', icon: Layers },
      { id: 'keys', label: 'API-Schlüssel', icon: Key },
    ],
  },
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
  initialTab = 'appearance',
}) => {
  if (!isOpen) return null;

  const [modalTab, setModalTab] = useState<SettingsTabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();

  useEffect(() => {
    setModalTab(initialTab);
  }, [initialTab]);

  // Keys & Engine State
  const [googleKeyInput, setGoogleKeyInput] = useState(() => getGoogleMapsApiKey());
  const [orsKeyInput, setOrsKeyInput] = useState(() => getOrsApiKey());
  const [activeProvider, setActiveProvider] = useState<IsochroneProvider>(() => getSelectedProvider());
  const [modalPlatform, setModalPlatform] = useState<BasemapPlatform>(() => getBasemapPlatform());
  const [modalVariant, setModalVariant] = useState<MapVariant>(() => getMapVariant());
  const [modalRailwayOverlay, setModalRailwayOverlay] = useState<boolean>(() => getRailwayOverlayEnabled());

  // Key check state
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(false);
  const [googleCheckResult, setGoogleCheckResult] = useState<KeyCheckResult | null>(null);
  const [isCheckingOrs, setIsCheckingOrs] = useState(false);
  const [orsCheckResult, setOrsCheckResult] = useState<KeyCheckResult | null>(null);

  // MVV Data sync state
  const [mvvMeta, setMvvMeta] = useState(() => getMvvDatasetMetadata());
  const [isSyncingMvv, setIsSyncingMvv] = useState(false);
  const [mvvSyncMessage, setMvvSyncMessage] = useState<string | null>(null);

  // Platform selection handler
  const handleSelectPlatform = (platform: BasemapPlatform) => {
    setModalPlatform(platform);
    let nextVariant = modalVariant;
    if (platform === 'carto' && !['carto_light', 'carto_dark', 'carto_voyager'].includes(modalVariant)) {
      nextVariant = 'carto_light';
    } else if ((platform === 'memomaps' || platform === 'opnv') && modalVariant !== 'memomaps') {
      nextVariant = 'memomaps';
    } else if (platform === 'osm' && ['carto_light', 'carto_dark', 'carto_voyager', 'memomaps', 'railway'].includes(modalVariant)) {
      nextVariant = 'normal';
    } else if (platform === 'google' && ['carto_light', 'carto_dark', 'carto_voyager', 'topo', 'memomaps', 'railway'].includes(modalVariant)) {
      nextVariant = 'normal';
    }
    setModalVariant(nextVariant);

    setBasemapPlatform(platform);
    setMapVariant(nextVariant);
    const composite = `${platform}_${nextVariant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
  };

  const handleSelectVariant = (variant: MapVariant) => {
    setModalVariant(variant);
    setMapVariant(variant);
    const composite = `${modalPlatform}_${variant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
  };

  const handleToggleRailwayOverlay = () => {
    const nextVal = !modalRailwayOverlay;
    setModalRailwayOverlay(nextVal);
    setRailwayOverlayEnabled(nextVal);
  };

  const handleSelectProvider = (provider: IsochroneProvider) => {
    setActiveProvider(provider);
    setSelectedProvider(provider);
    clearIsochroneCache();
    if (onRefreshIsochrones) {
      onRefreshIsochrones();
    }
  };

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
      if (res.valid) {
        setGoogleMapsApiKey(googleKeyInput);
        clearIsochroneCache();
        if (onRefreshIsochrones) {
          onRefreshIsochrones();
        }
      }
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
      if (res.valid) {
        setOrsApiKey(orsKeyInput);
        clearIsochroneCache();
        if (onRefreshIsochrones) {
          onRefreshIsochrones();
        }
      }
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

  const handleSaveAndClose = () => {
    if (googleKeyInput !== getGoogleMapsApiKey()) {
      setGoogleMapsApiKey(googleKeyInput);
      clearIsochroneCache();
    }
    if (orsKeyInput !== getOrsApiKey()) {
      setOrsApiKey(orsKeyInput);
      clearIsochroneCache();
    }
    if (onRefreshIsochrones) {
      onRefreshIsochrones();
    }
    onClose();
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

  const handleUpdateOptions = (updated: Partial<IsochroneOptions>) => {
    onChangeSchedule({
      options: {
        ...options,
        ...updated,
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e1f20] rounded-[24px] sm:rounded-[28px] w-full max-w-5xl h-[740px] max-h-[92vh] shadow-2xl border border-slate-200/90 dark:border-[#3c4043] flex flex-col overflow-hidden">
        {/* Top App Bar (Google M3 Style) */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3] leading-none">
                  Einstellungen
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-normal text-slate-500 dark:text-[#9aa0a6] bg-slate-100 dark:bg-[#282a2c] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Live synchronisiert</span>
                </span>
              </div>
            </div>
          </div>

          {/* Centered Search Bar */}
          <SettingsSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectResult={(tabId) => setModalTab(tabId)}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer shrink-0"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Navigation Drawer + Content Pane */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* M3 Navigation Rail / Sidebar */}
          <nav className="w-full md:w-64 bg-[#f8fafd] dark:bg-[#131314] border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-[#2d2f31] p-3 flex md:flex-col justify-between shrink-0 overflow-x-auto md:overflow-y-auto select-none gap-4">
            <div className="flex md:flex-col gap-4 w-full">
              {SETTINGS_SECTIONS.map((sec) => (
                <div key={sec.title} className="space-y-1">
                  <div className="hidden md:block px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider">
                    {sec.title}
                  </div>

                  <div className="flex md:flex-col gap-1">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = modalTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setModalTab(item.id)}
                          className={`px-3.5 py-2 rounded-full text-left transition-all flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 md:shrink ${
                            isSelected
                              ? 'bg-blue-100/90 text-blue-900 font-semibold dark:bg-[#004a77] dark:text-[#c2e7ff]'
                              : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3] hover:bg-slate-200/60 dark:hover:bg-[#202124]'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected
                                ? 'text-blue-700 dark:text-[#c2e7ff]'
                                : 'text-slate-500 dark:text-[#9aa0a6]'
                            }`}
                          />
                          <span className="text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Footer Brand Tag */}
            <div className="hidden md:flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 dark:text-[#747775] border-t border-slate-200/60 dark:border-[#202124]">
              <span>Venn v1.0</span>
              <span>Build 2026</span>
            </div>
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1f20]">
            {/* Scrollable Content Pane */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7">
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
                  onSelectPlatform={handleSelectPlatform}
                  onSelectVariant={handleSelectVariant}
                  hasGoogleKey={Boolean(getGoogleMapsApiKey())}
                  onOpenKeysTab={() => setModalTab('keys')}
                  showRailwayOverlay={modalRailwayOverlay}
                  onToggleRailwayOverlay={handleToggleRailwayOverlay}
                />
              )}

              {modalTab === 'isochrones' && (
                <IsochroneEngineTab
                  activeProvider={activeProvider}
                  onSelectProvider={handleSelectProvider}
                  options={options}
                  onSelectFidelity={handleSelectFidelity}
                  onToggleOption={handleToggleOption}
                  showOnlyIntersection={showOnlyIntersection}
                  onToggleOnlyIntersection={onToggleOnlyIntersection}
                  onOpenRoutingTab={() => setModalTab('routing')}
                />
              )}

              {modalTab === 'routing' && (
                <RoutingParametersTab
                  options={options}
                  onUpdateOptions={handleUpdateOptions}
                />
              )}

              {modalTab === 'rental' && (
                <RentalOverlayTab
                  schedule={schedule}
                  onChangeSchedule={onChangeSchedule}
                />
              )}

              {modalTab === 'heatmap' && (
                <PriorityHeatmapTab
                  heatmap={heatmap}
                  onUpdateHeatmap={handleUpdateHeatmap}
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
            </div>

            {/* M3 Bottom Bar */}
            <div className="px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-[#3c4043] bg-[#f8fafd] dark:bg-[#18191a] flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Alle Anpassungen werden live angewendet.</span>
              </div>

              <button
                type="button"
                onClick={handleSaveAndClose}
                className="px-5 py-2 text-xs font-medium rounded-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] dark:text-[#131314] transition-colors cursor-pointer shadow-2xs"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
