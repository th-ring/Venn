import React, { useState } from 'react';
import {
  BasemapPlatform,
  MapVariant,
  BasemapProvider,
  CommuteSchedule,
  PolygonFidelity,
  TransitSubMode,
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
import {
  Layers,
  Map as MapIcon,
  Globe,
  Train,
  Key,
  Flame,
  X,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: CommuteSchedule;
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
  onRefreshIsochrones?: () => void;
  onBasemapChange?: (provider: BasemapProvider) => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  initialTab?: 'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap';
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

  const [modalTab, setModalTab] = useState<'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap'>(initialTab);

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
    setSelectedProvider(activeProvider);
    setBasemapPlatform(modalPlatform);
    setMapVariant(modalVariant);
    const composite = `${modalPlatform}_${modalVariant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
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
      : ['tram', 'ubahn', 'bus', 'expressbus', 'sbahn'];

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

  const handleToggleOption = (key: 'liveTraffic' | 'enableSmoothing') => {
    onChangeSchedule({
      options: {
        ...options,
        [key]: !options[key],
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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Karten- & API-Konfiguration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Wähle deinen Kartendienst, die Isochronen-Quelle und verwalte API-Keys.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setModalTab('basemap')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              modalTab === 'basemap'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>1. Kartendienst</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('isochrones')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              modalTab === 'isochrones'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>2. Isochronen</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('mvv')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              modalTab === 'mvv'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>3. MVV Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('keys')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              modalTab === 'keys'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>4. API-Keys</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('heatmap')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              modalTab === 'heatmap'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>5. Heatmap</span>
          </button>
        </div>

        {/* Tab Content Panes */}
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

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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
  );
};
