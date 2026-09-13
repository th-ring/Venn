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
import { BasemapTab } from './tabs/BasemapTab';
import { IsochroneEngineTab } from './tabs/IsochroneEngineTab';
import { MvvMatrixTab } from './tabs/MvvMatrixTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { PriorityHeatmapTab } from './tabs/PriorityHeatmapTab';
import { RentalOverlayTab } from './tabs/RentalOverlayTab';
import {
  Settings,
  Layers,
  Map as MapIcon,
  Globe,
  Train,
  Key,
  Flame,
  Euro,
  X,
  Check,
} from 'lucide-react';

export type SettingsTabId = 'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap' | 'rental';

const SETTINGS_MENU: Array<{
  id: SettingsTabId;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'basemap', label: '1. Kartendienst', subLabel: 'OSM & Google Maps', icon: MapIcon },
  { id: 'isochrones', label: '2. Isochronen', subLabel: 'Engine & Parameter', icon: Globe },
  { id: 'mvv', label: '3. ÖPNV & Regionen', subLabel: 'Netze & Verkehrsmittel', icon: Train },
  { id: 'keys', label: '4. API-Keys', subLabel: 'Google & ORS Keys', icon: Key },
  { id: 'heatmap', label: '5. Heatmap', subLabel: 'Prioritäts-Infrastruktur', icon: Flame },
  { id: 'rental', label: '6. Mietspiegel', subLabel: 'München & Open Data', icon: Euro },
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

  useEffect(() => {
    setModalTab(initialTab);
  }, [initialTab]);

  // Input states
  const [googleKeyInput, setGoogleKeyInput] = useState(getGoogleMapsApiKey());
  const [orsKeyInput, setOrsKeyInput] = useState(getOrsApiKey());
  const [activeProvider, setActiveProvider] = useState<IsochroneProvider>(getSelectedProvider());
  const [modalPlatform, setModalPlatform] = useState<BasemapPlatform>(() => getBasemapPlatform());
  const [modalVariant, setModalVariant] = useState<MapVariant>(() => getMapVariant());
  const [isSaved, setIsSaved] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-[620px] max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Anwendungseinstellungen
              </h3>
              <p className="text-[11px] text-slate-500">
                Zentrale Konfiguration für Kartendienste, Isochronen-Berechnung, ÖPNV-Netze, API-Keys und Heatmaps.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two-column layout with fixed navigation */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Fixed Navigation Menu */}
          <nav className="w-full sm:w-56 bg-slate-50/90 border-b sm:border-b-0 sm:border-r border-slate-200/90 p-2.5 flex sm:flex-col justify-between shrink-0 overflow-x-auto sm:overflow-x-visible select-none gap-1">
            <div className="flex sm:flex-col gap-1 w-full">
              <div className="hidden sm:block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kategorien
              </div>

              {SETTINGS_MENU.map((item) => {
                const Icon = item.icon;
                const isSelected = modalTab === item.id;
                const isHeatmap = item.id === 'heatmap';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModalTab(item.id)}
                    className={`px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 sm:shrink ${
                      isSelected
                        ? isHeatmap
                          ? 'bg-amber-500 text-white font-bold shadow-xs'
                          : 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : isHeatmap ? 'text-amber-500' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="text-xs leading-tight">{item.label}</div>
                      <div
                        className={`hidden sm:block text-[10px] font-normal leading-tight truncate mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-slate-400'
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
            <div className="hidden sm:block p-2.5 rounded-xl bg-white border border-slate-200/80 text-[10px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>Konfiguration</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="truncate text-slate-600">
                Karte: <span className="font-semibold">{modalPlatform === 'google' ? 'Google Maps' : 'OSM'}</span>
              </div>
              <div className="truncate text-slate-600">
                Engine: <span className="font-semibold">{activeProvider === 'google' ? 'Google API' : activeProvider === 'ors' ? 'ORS' : 'Offline'}</span>
              </div>
            </div>
          </nav>

          {/* Main Content & Actions Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Scrollable Tab Content Pane */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {modalTab === 'basemap' && (
                <BasemapTab
                  platform={modalPlatform}
                  variant={modalVariant}
                  onSelectPlatform={setModalPlatform}
                  onSelectVariant={setModalVariant}
                  hasGoogleKey={!!getGoogleMapsApiKey()}
                  onOpenKeysTab={() => setModalTab('keys')}
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
                <MvvMatrixTab
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
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
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
