import React, { useState, useEffect, useRef } from 'react';
import {
  CommuteSchedule,
  PolygonFidelity,
  BasemapProvider,
  BasemapPlatform,
  MapVariant,
  PriorityHeatmapMode,
  PriorityHeatmapItem,
  ALL_HEATMAP_ITEMS,
  HeatmapSettings,
  TransitSubMode,
  ALL_TRANSIT_SUBMODES,
} from '../types';
import {
  getOrsApiKey,
  setOrsApiKey,
  getGoogleMapsApiKey,
  setGoogleMapsApiKey,
  getSelectedProvider,
  setSelectedProvider,
  getSelectedBasemap,
  setSelectedBasemap,
  getBasemapPlatform,
  setBasemapPlatform,
  getMapVariant,
  setMapVariant,
  IsochroneProvider,
} from '../services/isochroneEngine';
import {
  Clock,
  ArrowRightLeft,
  Calendar,
  Key,
  Check,
  Globe,
  Layers,
  Map as MapIcon,
  Satellite,
  Mountain,
  Train,
  Navigation,
  ExternalLink,
  Info,
  RefreshCw,
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sliders,
  Flame,
  Car,
  Bus,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import {
  validateGoogleMapsApiKey,
  validateOrsApiKey,
  KeyCheckResult,
} from '../services/apiKeyValidator';
import {
  getMvvDatasetMetadata,
  syncMvvDatasetFromEndpoint,
} from '../services/mvvMatrixService';

interface CommuteSettingsProps {
  schedule: CommuteSchedule;
  onChangeSchedule: (updated: Partial<CommuteSchedule>) => void;
  onRefreshIsochrones?: () => void;
  isCalculating?: boolean;
  autoUpdate?: boolean;
  onToggleAutoUpdate?: () => void;
  basemap?: BasemapProvider;
  onBasemapChange?: (provider: BasemapProvider) => void;
  isApiKeyModalOpen?: boolean;
  onToggleApiKeyModal?: (open: boolean) => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  showIndividualIsochrones?: boolean;
  onToggleIndividualIsochrones?: () => void;
}

export const CommuteSettings: React.FC<CommuteSettingsProps> = ({
  schedule,
  onChangeSchedule,
  onRefreshIsochrones,
  isCalculating = false,
  autoUpdate = true,
  onToggleAutoUpdate,
  basemap,
  onBasemapChange,
  isApiKeyModalOpen = false,
  onToggleApiKeyModal,
  showOnlyIntersection,
  onToggleOnlyIntersection,
  showIndividualIsochrones,
  onToggleIndividualIsochrones,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const showModal = isApiKeyModalOpen || internalModalOpen;

  const handleSetModalOpen = (open: boolean) => {
    setInternalModalOpen(open);
    if (onToggleApiKeyModal) {
      onToggleApiKeyModal(open);
    }
  };

  const [modalTab, setModalTab] = useState<'basemap' | 'isochrones' | 'mvv' | 'keys' | 'heatmap'>('basemap');

  // Input states
  const [googleKeyInput, setGoogleKeyInput] = useState(getGoogleMapsApiKey());
  const [orsKeyInput, setOrsKeyInput] = useState(getOrsApiKey());
  const [activeProvider, setActiveProvider] = useState<IsochroneProvider>(getSelectedProvider());
  
  // Basemap platform (osm / google) and variant (normal / satellite / streets / transit)
  const [modalPlatform, setModalPlatform] = useState<BasemapPlatform>(() => getBasemapPlatform());
  const [modalVariant, setModalVariant] = useState<MapVariant>(() => getMapVariant());

  const [activeBasemap, setActiveBasemap] = useState<BasemapProvider>(
    basemap || getSelectedBasemap()
  );
  const [keySaved, setKeySaved] = useState(false);

  // Sync if external basemap changes
  useEffect(() => {
    if (basemap) {
      setActiveBasemap(basemap);
      const isGoogle = basemap.startsWith('google');
      setModalPlatform(isGoogle ? 'google' : 'osm');
      if (basemap.includes('satellite')) setModalVariant('satellite');
      else if (basemap.includes('transit')) setModalVariant('transit');
      else if (basemap.includes('streets')) setModalVariant('streets');
      else setModalVariant('normal');
    }
  }, [basemap]);

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
    setActiveBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
    setKeySaved(true);
    if (onRefreshIsochrones) {
      onRefreshIsochrones();
    }
    setTimeout(() => {
      setKeySaved(false);
      handleSetModalOpen(false);
    }, 800);
  };

  const hasGoogleKey = !!getGoogleMapsApiKey();
  const hasOrsKey = !!getOrsApiKey();

  const options = schedule.options ?? {
    liveTraffic: false,
    enableSmoothing: true,
    fidelity: 'AUTOMATIC',
  };

  const activeTransitModes: TransitSubMode[] =
    options.transitModes && options.transitModes.length > 0
      ? options.transitModes
      : ALL_TRANSIT_SUBMODES;

  const handleToggleTransitMode = (mode: TransitSubMode) => {
    let nextModes: TransitSubMode[];
    if (activeTransitModes.includes(mode)) {
      // Prevent unchecking all modes (keep at least one)
      if (activeTransitModes.length <= 1) {
        return;
      }
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

  const heatmap: HeatmapSettings = options.heatmap ?? {
    mode: 'none',
    selectedItems: [],
    radiusKm: 1.5,
    intensity: 0.65,
  };

  const activeHeatmapItems: PriorityHeatmapItem[] =
    heatmap.selectedItems && heatmap.selectedItems.length > 0
      ? heatmap.selectedItems
      : heatmap.mode && heatmap.mode !== 'none'
      ? [heatmap.mode as PriorityHeatmapItem]
      : [];

  const isHeatmapActive = activeHeatmapItems.length > 0;

  // Dropdown for Heatmap multi-select
  const [isHeatmapDropdownOpen, setIsHeatmapDropdownOpen] = useState(false);
  const heatmapDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (heatmapDropdownRef.current && !heatmapDropdownRef.current.contains(e.target as Node)) {
        setIsHeatmapDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collapsible UI sections for clean daily use
  const [isScheduleCollapsed, setIsScheduleCollapsed] = useState(false);
  const [isTransitCollapsed, setIsTransitCollapsed] = useState(false);
  const [isHeatmapCollapsed, setIsHeatmapCollapsed] = useState(false);

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

  const handleToggleHeatmapItem = (item: PriorityHeatmapItem) => {
    let nextItems: PriorityHeatmapItem[];
    if (activeHeatmapItems.includes(item)) {
      nextItems = activeHeatmapItems.filter((i) => i !== item);
    } else {
      nextItems = [...activeHeatmapItems, item];
    }
    const nextMode: PriorityHeatmapMode = nextItems.length > 0 ? nextItems[0] : 'none';
    handleUpdateHeatmap({
      mode: nextMode,
      selectedItems: nextItems,
    });
  };

  const handleToggleHeatmapActive = () => {
    if (isHeatmapActive) {
      handleUpdateHeatmap({
        mode: 'none',
        selectedItems: [],
      });
    } else {
      handleUpdateHeatmap({
        mode: 'ubahn',
        selectedItems: ['ubahn', 'sbahn'],
      });
    }
  };

  const handleSelectAllHeatmapItems = () => {
    handleUpdateHeatmap({
      mode: 'ubahn',
      selectedItems: ['ubahn', 'sbahn', 'highway'],
    });
  };

  const handleClearAllHeatmapItems = () => {
    handleUpdateHeatmap({
      mode: 'none',
      selectedItems: [],
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

  const handleSelectFidelity = (fidelity: PolygonFidelity) => {
    onChangeSchedule({
      options: {
        ...options,
        fidelity,
      },
    });
  };

  const isGoogleBasemap = activeBasemap.startsWith('google');

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. Pendelzeit & Fahrtrichtung (Einklappbar) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        {/* Header / Toggle-Leiste */}
        <div
          onClick={() => setIsScheduleCollapsed((prev) => !prev)}
          className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 truncate">
              Pendelzeit & Richtung
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Summary badge when collapsed */}
            {isScheduleCollapsed && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                {schedule.direction === 'to_work' ? 'Zum Ziel' : 'Vom Ziel'} • {schedule.dayOfWeek === 'workday' ? 'Mo–Fr' : 'Sa/So'} {schedule.time || '08:30'}
              </span>
            )}

            {/* Action Buttons: Refresh & Auto */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                id="btn-manual-refresh"
                type="button"
                disabled={isCalculating}
                onClick={() => {
                  if (onRefreshIsochrones) {
                    onRefreshIsochrones();
                  }
                }}
                className={`p-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                  isCalculating
                    ? 'bg-blue-50 text-blue-500 border-blue-200 cursor-not-allowed'
                    : 'bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border-slate-200 hover:border-blue-200 active:scale-95'
                }`}
                title="Isochronen jetzt manuell neu berechnen"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              {onToggleAutoUpdate && (
                <button
                  id="btn-toggle-autoupdate"
                  type="button"
                  onClick={onToggleAutoUpdate}
                  className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    autoUpdate
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/70'
                  }`}
                  title={
                    autoUpdate
                      ? 'Automatische Neuberechnung: AKTIV'
                      : 'Automatische Neuberechnung: PAUSIERT'
                  }
                >
                  <Zap className={`w-3.5 h-3.5 ${autoUpdate ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'}`} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              title={isScheduleCollapsed ? 'Aufklappen' : 'Einklappen'}
            >
              {isScheduleCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isScheduleCollapsed && (
          <div className="p-3 pt-0 border-t border-slate-100 mt-1 space-y-2.5">
            <div className="flex items-center justify-between gap-2 pt-2">
              {/* Richtung */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Richtung:
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                  <button
                    id="btn-direction-to-work"
                    type="button"
                    onClick={() => onChangeSchedule({ direction: 'to_work' })}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      schedule.direction === 'to_work'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Vom Wohnort zum Arbeitsplatz / Ziel"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Zum Ziel</span>
                  </button>
                  <button
                    id="btn-direction-from-work"
                    type="button"
                    onClick={() => onChangeSchedule({ direction: 'from_work' })}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      schedule.direction === 'from_work'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Vom Arbeitsplatz / Ziel nach Hause"
                  >
                    <ArrowRightLeft className="w-3 h-3 rotate-180" />
                    <span>Vom Ziel</span>
                  </button>
                </div>
              </div>

              {/* Tag */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tag:
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                  <button
                    id="btn-day-workday"
                    type="button"
                    onClick={() => onChangeSchedule({ dayOfWeek: 'workday' })}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      schedule.dayOfWeek === 'workday'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Mo–Fr</span>
                  </button>
                  <button
                    id="btn-day-weekend"
                    type="button"
                    onClick={() => onChangeSchedule({ dayOfWeek: 'weekend' })}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      schedule.dayOfWeek === 'weekend'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Sa/So</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Uhrzeit */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Abfahrtszeit:</span>
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    id="input-departure-time"
                    type="time"
                    step="60"
                    value={schedule.time || '08:30'}
                    onChange={(e) => {
                      if (e.target.value) {
                        onChangeSchedule({ time: e.target.value });
                      }
                    }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-800 font-semibold px-1.5 py-0.5 rounded-md text-xs focus:outline-none transition-colors cursor-pointer"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1">
                {['07:30', '08:30', '17:30'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeSchedule({ time: preset })}
                    className={`text-[11px] px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      schedule.time === preset
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                        : 'text-slate-500 hover:text-slate-800 border-slate-200 bg-slate-50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Prioritäts-Heatmap (Einklappbar mit Dropdown-Mehrfachauswahl) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-visible transition-all">
        {/* Header / Toggle */}
        <div
          onClick={() => setIsHeatmapCollapsed((prev) => !prev)}
          className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1 rounded-lg shrink-0 ${isHeatmapActive ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <Flame className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 truncate">
              Prioritäts-Heatmap
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status-Badge */}
            {isHeatmapActive ? (
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span>{activeHeatmapItems.length} aktiv</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                Inaktiv
              </span>
            )}

            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              title={isHeatmapCollapsed ? 'Aufklappen' : 'Einklappen'}
            >
              {isHeatmapCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isHeatmapCollapsed && (
          <div className="p-3 pt-0 border-t border-slate-100 mt-1 space-y-3">
            {/* Master Switch */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-slate-700">
                Heatmap im Treffbereich aktivieren
              </span>
              <button
                id="switch-heatmap-master"
                type="button"
                role="switch"
                aria-checked={isHeatmapActive}
                onClick={handleToggleHeatmapActive}
                className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  isHeatmapActive ? 'bg-amber-500' : 'bg-slate-200'
                }`}
                title={isHeatmapActive ? 'Heatmap deaktivieren' : 'Heatmap aktivieren'}
              >
                <div
                  className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                    isHeatmapActive ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* When active: Dropdown Multi-Select & Sliders */}
            {isHeatmapActive && (
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                {/* Multi-Select Dropdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">
                      Prioritäts-Infrastruktur (Mehrfachauswahl):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeHeatmapItems.length} von {ALL_HEATMAP_ITEMS.length} gewählt
                    </span>
                  </div>

                  <div ref={heatmapDropdownRef} className="relative">
                    <button
                      id="btn-heatmap-dropdown"
                      type="button"
                      onClick={() => setIsHeatmapDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs text-left shadow-2xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {activeHeatmapItems.length === 0 ? (
                          <span className="text-slate-400 italic">Klicke, um Kategorien zu wählen...</span>
                        ) : (
                          activeHeatmapItems.map((item) => {
                            const isUbahn = item === 'ubahn';
                            const isSbahn = item === 'sbahn';
                            return (
                              <span
                                key={item}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                  isUbahn
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : isSbahn
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                }`}
                              >
                                <span>{isUbahn ? '🚇 U-Bahn' : isSbahn ? '🚆 S-Bahn' : '🚗 Autobahn'}</span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleHeatmapItem(item);
                                  }}
                                  className="text-slate-400 hover:text-slate-700 font-bold ml-0.5 cursor-pointer"
                                  title="Abwählen"
                                >
                                  ×
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isHeatmapDropdownOpen ? 'rotate-180 text-amber-600' : ''
                        }`}
                      />
                    </button>

                    {/* Floating Dropdown Card */}
                    {isHeatmapDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 pb-1.5 border-b border-slate-100">
                          <span>Kategorien wählen (z.B. zwei kombinieren):</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSelectAllHeatmapItems}
                              className="text-[10px] text-amber-700 font-semibold hover:underline cursor-pointer"
                            >
                              Alle
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              type="button"
                              onClick={handleClearAllHeatmapItems}
                              className="text-[10px] text-slate-400 hover:underline cursor-pointer"
                            >
                              Keine
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {[
                            {
                              id: 'ubahn' as PriorityHeatmapItem,
                              label: '🚇 U-Bahn Stationen',
                              desc: 'U1 – U8 Haltestellen im MVV/MVG Netz',
                            },
                            {
                              id: 'sbahn' as PriorityHeatmapItem,
                              label: '🚆 S-Bahn Stationen',
                              desc: 'S1 – S8 Stammstrecke und Außenäste',
                            },
                            {
                              id: 'highway' as PriorityHeatmapItem,
                              label: '🚗 Autobahn-Anschlussstellen',
                              desc: 'A8, A9, A94, A95, A96, A99 Zufahrten',
                            },
                          ].map((opt) => {
                            const isChecked = activeHeatmapItems.includes(opt.id);
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-amber-50/70 text-amber-950 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleHeatmapItem(opt.id)}
                                  className="rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs">{opt.label}</div>
                                  <div className="text-[10px] text-slate-400 font-normal truncate">
                                    {opt.desc}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Range Sliders */}
                <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-900 font-medium">Suchradius / Fußdistanz:</span>
                    <span className="font-bold text-amber-800">
                      {heatmap.radiusKm >= 1 ? `${heatmap.radiusKm.toFixed(1)} km` : `${(heatmap.radiusKm * 1000).toFixed(0)} m`} (ca. {Math.round(heatmap.radiusKm * 12)} Min)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.25"
                    value={heatmap.radiusKm}
                    onChange={(e) => handleUpdateHeatmap({ radiusKm: parseFloat(e.target.value) })}
                    className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/50">
                    <span className="text-amber-900 font-medium">Farbintensität & Deckkraft:</span>
                    <span className="font-bold text-amber-800">
                      {Math.round(heatmap.intensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.95"
                    step="0.05"
                    value={heatmap.intensity}
                    onChange={(e) => handleUpdateHeatmap({ intensity: parseFloat(e.target.value) })}
                    className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. ÖPNV-Verkehrsmittel (Einklappbar) */}
      {schedule.mode === 'transit' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <div
            onClick={() => setIsTransitCollapsed((prev) => !prev)}
            className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <Train className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 truncate">
                ÖPNV-Verkehrsmittel
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {activeTransitModes.length} von {ALL_TRANSIT_SUBMODES.length} aktiv
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                title={isTransitCollapsed ? 'Aufklappen' : 'Einklappen'}
              >
                {isTransitCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isTransitCollapsed && (
            <div className="p-2.5 pt-0 border-t border-slate-100 mt-1">
              <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'tram' as TransitSubMode, label: 'Tram', icon: '🚋' },
                  { id: 'ubahn' as TransitSubMode, label: 'U-Bahn', icon: '🚇' },
                  { id: 'bus' as TransitSubMode, label: 'Bus', icon: '🚌' },
                  { id: 'expressbus' as TransitSubMode, label: 'X-Bus', icon: '⚡' },
                  { id: 'sbahn' as TransitSubMode, label: 'S-Bahn', icon: '🚆' },
                ].map((item) => {
                  const active = activeTransitModes.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleTransitMode(item.id)}
                      title={`${item.label} ${active ? 'abwählen' : 'einbeziehen'}`}
                      className={`py-1.5 px-1 text-center rounded-lg transition-all text-xs font-medium flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                        active
                          ? 'bg-white text-blue-900 shadow-xs font-semibold ring-1 ring-blue-500/20'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-white/50 opacity-60'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Single Point of Entry: Einstellungen Card (Karten, APIs & Parameter) */}
      <button
        id="btn-open-api-settings"
        type="button"
        onClick={() => handleSetModalOpen(true)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-200 text-xs transition-all group cursor-pointer shadow-2xs"
        title="Zentrales Einstellungsfenster für Karten, APIs, Isochronen-Parameter und MVV-Matrix öffnen"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-slate-600 group-hover:text-blue-600 shadow-2xs transition-colors shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <div className="font-bold text-slate-800 group-hover:text-blue-900 leading-tight">
              Karten, APIs & Parameter
            </div>
            <div className="text-[11px] text-slate-500 leading-tight truncate">
              {isGoogleBasemap ? 'Google Maps' : 'OSM'} • {options.fidelity || 'Auto'} • {options.liveTraffic ? 'Live-Verkehr an' : 'Standard'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-white group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs shrink-0">
          <span>Öffnen</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Kartendienst, Isochronen & API Keys Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto flex flex-col gap-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Karten- & API-Konfiguration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wähle deinen Kartendienst (OSM vs. Google Maps), die Isochronen-Quelle und verwalte API-Keys.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setModalTab('basemap')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'basemap'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>1. Kartendienst (Basemap)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('isochrones')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'isochrones'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>2. Isochronen-Quelle</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('mvv')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'keys'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>4. API-Keys & Check</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('heatmap')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'heatmap'
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>5. Treff-Heatmap</span>
              </button>
            </div>

            {/* TAB 1: KARTENDIENST & KARTENTYP (ZENTRALE WAHL) */}
            {modalTab === 'basemap' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed">
                  Hier kannst du zentral zwischen <strong>OpenStreetMap</strong> und <strong>Google Maps</strong> wählen. In beiden Varianten kannst du den <strong>Kartentyp</strong> (Normal, Satellit, Straße, ÖPNV) flexibel festlegen.
                </div>

                {/* STUFE 1: KARTENDIENST WÄHLEN */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>1. Basis-Kartendienst</span>
                    {hasGoogleKey && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Google Key aktiv
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Option: OpenStreetMap */}
                    <div
                      onClick={() => setModalPlatform('osm')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        modalPlatform === 'osm'
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="modalPlatform"
                          checked={modalPlatform === 'osm'}
                          onChange={() => setModalPlatform('osm')}
                          className="mt-0.5 text-blue-600 cursor-pointer"
                        />
                        <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            OpenStreetMap
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            100% kostenfrei, Open-Source & ohne Key.
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                        Kostenlos
                      </span>
                    </div>

                    {/* Option: Google Maps */}
                    <div
                      onClick={() => setModalPlatform('google')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        modalPlatform === 'google'
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="modalPlatform"
                          checked={modalPlatform === 'google'}
                          onChange={() => setModalPlatform('google')}
                          className="mt-0.5 text-blue-600 cursor-pointer"
                        />
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                          <MapIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Google Maps
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Offizielle Google Vektor- & Satellitendaten.
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full shrink-0">
                        Google Key
                      </span>
                    </div>
                  </div>

                  {modalPlatform === 'google' && !hasGoogleKey && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Für Google Maps ist ein API-Key erforderlich.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalTab('keys')}
                        className="text-amber-900 font-bold underline text-xs ml-2 cursor-pointer"
                      >
                        Jetzt eintragen
                      </button>
                    </div>
                  )}
                </div>

                {/* STUFE 2: KARTENTYP SEPARAT WÄHLEN */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    2. Kartentyp auswählen ({modalPlatform === 'google' ? 'Google Maps' : 'OpenStreetMap'})
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Normal */}
                    <div
                      onClick={() => setModalVariant('normal')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        modalVariant === 'normal'
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${modalVariant === 'normal' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <MapIcon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">Normal</span>
                        </div>
                        {modalVariant === 'normal' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {modalPlatform === 'google'
                          ? 'Klassische Google Roadmap mit Standardfarben'
                          : 'Standard OpenStreetMap Kartografie'}
                      </p>
                    </div>

                    {/* Satellit */}
                    <div
                      onClick={() => setModalVariant('satellite')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        modalVariant === 'satellite'
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${modalVariant === 'satellite' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Satellite className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">Satellit</span>
                        </div>
                        {modalVariant === 'satellite' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {modalPlatform === 'google'
                          ? 'Fotorealistische Google Hybrid-Luftbilder mit Straßennamen'
                          : 'Hochauflösende weltweite Satelliten-Luftbilder'}
                      </p>
                    </div>

                    {/* Straße */}
                    <div
                      onClick={() => setModalVariant('streets')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        modalVariant === 'streets'
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${modalVariant === 'streets' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Navigation className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">Straße</span>
                        </div>
                        {modalVariant === 'streets' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {modalPlatform === 'google'
                          ? 'Fokussierte Google Straßenkarte mit Autobahnen & Trassen'
                          : 'Detailliertes Straßen- und Verkehrsnetzwerk'}
                      </p>
                    </div>

                    {/* ÖPNV */}
                    <div
                      onClick={() => setModalVariant('transit')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        modalVariant === 'transit'
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${modalVariant === 'transit' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Train className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">ÖPNV</span>
                        </div>
                        {modalVariant === 'transit' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {modalPlatform === 'google'
                          ? 'Google TransitLayer mit S-Bahn, U-Bahn, Tram & Bahnhöfen'
                          : 'CyclOSM / Transit Layer für Bahn-, Tram- & Busverbindungen'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ISOCHRONEN-QUELLE */}
            {modalTab === 'isochrones' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-600 leading-relaxed">
                  Wähle, welche Berechnungs-Engine die Erreichbarkeits-Polygone (Fahrzeit-Zonen) berechnen soll.
                </div>

                {/* Option 1: Google Maps Isochrones API */}
                <div
                  onClick={() => setActiveProvider('google')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeProvider === 'google'
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="provider"
                        checked={activeProvider === 'google'}
                        onChange={() => setActiveProvider('google')}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          Google Maps Isochrones API
                        </span>
                        <span className="ml-2 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          Public Preview
                        </span>
                      </div>
                    </div>
                    <a
                      href="https://developers.google.com/maps/documentation/isochrones"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Doku</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 pl-5 leading-relaxed">
                    Offizielle Google Maps Erreichbarkeits-Polygone für <strong>Pkw, Fahrrad und Fußwege</strong>. 
                    <span className="text-amber-700 block mt-0.5">
                      (Hinweis: Für ÖPNV wird automatisch die MVV/MVG-Haltestellenmatrix genutzt, da Google keine ÖPNV-Isochronen bereitstellt.)
                    </span>
                  </p>
                </div>

                {/* Option 2: Integrierte Offline Simulation */}
                <div
                  onClick={() => setActiveProvider('calibrated')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeProvider === 'calibrated'
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="provider"
                      checked={activeProvider === 'calibrated'}
                      onChange={() => setActiveProvider('calibrated')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Integrierte Multimodale Engine (Standard)
                      </span>
                      <span className="ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                        100% Kostenfrei & Ohne Key
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 pl-5 leading-relaxed">
                    Mathematisch kalibriertes Modell mit schnellen radialen Transit-Fingern (S-Bahn/U-Bahn),
                    lokalem Bus-Netz, Autobahn-Korridoren und Tageszeit-/Rush-Hour-Faktoren.
                  </p>
                </div>

                {/* Option 3: OpenRouteService (ORS) */}
                <div
                  onClick={() => setActiveProvider('ors')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeProvider === 'ors'
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="provider"
                        checked={activeProvider === 'ors'}
                        onChange={() => setActiveProvider('ors')}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          OpenRouteService (ORS)
                        </span>
                        <span className="ml-2 text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full">
                          Open Source API
                        </span>
                      </div>
                    </div>
                    <a
                      href="https://openrouteservice.org"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>openrouteservice.org</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 pl-5 leading-relaxed">
                    OpenStreetMap-basierte Isochronen für Auto, Fahrrad und Fußgänger (kostenloser API-Key erforderlich).
                  </p>
                </div>

                {/* Berechnungsparameter: Detailgrad, Live-Verkehr & Glättung */}
                <div className="pt-3 border-t border-slate-200/80 space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Berechnungs- & Darstellungs-Parameter
                  </div>

                  {/* Detailgenauigkeit / Fidelity */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Detailgrad der Isochronen:</span>
                      <span className="text-[11px] text-slate-500">
                        {options.fidelity === 'HIGH' ? 'Sehr präzise Berechnungsraster' : options.fidelity === 'LOW' ? 'Grob & maximal schnell' : 'Ausgewogen'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-lg border border-slate-200">
                      {[
                        { id: 'AUTOMATIC' as PolygonFidelity, label: 'Auto' },
                        { id: 'LOW' as PolygonFidelity, label: 'Grob' },
                        { id: 'MEDIUM' as PolygonFidelity, label: 'Mittel' },
                        { id: 'HIGH' as PolygonFidelity, label: 'Präzise' },
                      ].map((item) => {
                        const isSelected = (options.fidelity || 'AUTOMATIC') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectFidelity(item.id)}
                            className={`py-1.5 text-center rounded-md transition-all text-xs font-medium cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Switches for Live-Traffic and Smoothing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Live-Verkehr Switch */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Live-Verkehr & Stau</div>
                        <div className="text-[10px] text-slate-500">Rush-Hour Berücksichtigung</div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={options.liveTraffic}
                        onClick={() => handleToggleOption('liveTraffic')}
                        className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          options.liveTraffic ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                            options.liveTraffic ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Glatte Kanten Switch */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Glatte Kanten</div>
                        <div className="text-[10px] text-slate-500">B-Spline Konturen-Glättung</div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={options.enableSmoothing}
                        onClick={() => handleToggleOption('enableSmoothing')}
                        className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          options.enableSmoothing ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                            options.enableSmoothing ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Nur überlagerten Treffbereich anzeigen Switch */}
                    {onToggleOnlyIntersection && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="pr-2">
                          <div className="text-xs font-semibold text-slate-800">
                            Nur überlagerten Treffbereich anzeigen
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            Blendet die individuellen Personen-Isochronen aus und zeigt nur den gemeinsamen grünen Treffbereich.
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={showOnlyIntersection}
                          onClick={onToggleOnlyIntersection}
                          className={`w-8 h-4.5 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                            showOnlyIntersection ? 'bg-emerald-600' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                              showOnlyIntersection ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MVV / MVG HALTESTELLEN- & FAHRZEITEN-MATRIX */}
            {modalTab === 'mvv' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-600 text-white rounded-md">
                        <Train className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          Münchner Verkehrsverbund (MVV / MVG)
                        </span>
                        <div className="text-[11px] text-slate-600">
                          U-Bahn, S-Bahn, Tram & Express-/Metrobusse
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncMvv}
                      disabled={isSyncingMvv}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Fahrplan- und Haltestellendaten jetzt aktualisieren"
                    >
                      {isSyncingMvv ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>{isSyncingMvv ? 'Aktualisiere...' : 'Jetzt aktualisieren'}</span>
                    </button>
                  </div>

                  {mvvSyncMessage && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{mvvSyncMessage}</span>
                    </div>
                  )}
                </div>

                {/* Matrix Statistics & Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Haltestellen</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">{mvvMeta.stationCount}</div>
                    <div className="text-[10px] text-slate-500">Knotenpunkte & Bahnhöfe</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Verbindungen</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">{mvvMeta.connectionCount}</div>
                    <div className="text-[10px] text-slate-500">Fahrzeit-Kanten</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Verkehrsträger</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">S, U, Tram, Bus</div>
                    <div className="text-[10px] text-slate-500">Multimodal integriert</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Stand / Version</div>
                    <div className="text-xs font-bold text-slate-800 mt-1 truncate">{mvvMeta.version}</div>
                    <div className="text-[10px] text-slate-500 truncate">{mvvMeta.lastUpdated}</div>
                  </div>
                </div>

                {/* Verkehrsmittel / Modalitäten Filter */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <Train className="w-3.5 h-3.5 text-blue-600" />
                      <span>ÖPNV-Verkehrsträger einbeziehen:</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {activeTransitModes.length} von {ALL_TRANSIT_SUBMODES.length} aktiv
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Wähle aus, welche Verkehrsmittel für die MVV-Isochronen und Fahrzeiten berücksichtigt werden sollen. Mindestens ein Verkehrsmittel bleibt immer aktiv.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {(
                      [
                        { id: 'tram', label: 'Tram', icon: '🚋', desc: 'Straßenbahnlinien' },
                        { id: 'ubahn', label: 'U-Bahn', icon: '🚇', desc: 'U1 – U8 Netz' },
                        { id: 'bus', label: 'Bus', icon: '🚌', desc: 'Stadt- & Regionalbusse' },
                        { id: 'expressbus', label: 'Expressbus', icon: '⚡', desc: 'X-Busse (z.B. X30, X50)' },
                        { id: 'sbahn', label: 'S-Bahn', icon: '🚆', desc: 'S1 – S8 Stammstrecke & Außenäste' },
                      ] as const
                    ).map((modeItem) => {
                      const isChecked = activeTransitModes.includes(modeItem.id as TransitSubMode);
                      return (
                        <label
                          key={modeItem.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                              : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleTransitMode(modeItem.id as TransitSubMode)}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                              <span>{modeItem.icon}</span>
                              <span>{modeItem.label}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight truncate">
                              {modeItem.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Info Box explaining transit mechanics */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Wie die MVV-Isochrone berechnet wird:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li><strong>Erste Meile (Fußweg):</strong> Berechnet die Gehzeit von der Haustür zur nächsten Station (unter Berücksichtigung des gewählten Maximums, z. B. 10 Min).</li>
                    <li><strong>Echte Fahrzeiten:</strong> Nutzt die Soll-Fahrzeitkanten der Linien (z. B. Tram 23 Domagkstr. ➔ Münchner Freiheit in 6 Min; S8 Pasing ➔ Gilching in 16 Min).</li>
                    <li><strong>Umstiege & Puffer:</strong> Berücksichtigt deine Parameter <em>Max. Umstiege</em> und <em>Max. Umstiegszeit</em> (Takt-Wartezeit & Bahnsteigwechsel).</li>
                    <li><strong>Letzte Meile (Umkreis):</strong> An jeder erreichten Station wird mit der verbleibenden Restreisezeit die Fußgänger-Erreichbarkeit aufgespannt.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: API-SCHLÜSSEL & LIVE-CHECK */}
            {modalTab === 'keys' && (
              <div className="space-y-4">
                {/* Google Maps API Key Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-slate-900">
                        Google Maps API Key
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckGoogleKey}
                      disabled={isCheckingGoogle || !googleKeyInput.trim()}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100/80 disabled:bg-slate-100 transition-colors"
                      title="Diesen API-Key jetzt live auf Gültigkeit testen"
                    >
                      {isCheckingGoogle ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                      )}
                      <span>{isCheckingGoogle ? 'Prüfe Key...' : 'Key testen'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={googleKeyInput}
                    onChange={(e) => {
                      setGoogleKeyInput(e.target.value);
                      setGoogleCheckResult(null);
                    }}
                    placeholder="AIzaSy..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono bg-white"
                  />

                  {/* Google Key Test Result Banner with Individual Sub-Service Status */}
                  {googleCheckResult && (
                    <div className="space-y-2">
                      <div
                        className={`p-2.5 rounded-xl text-xs border flex flex-col gap-1 transition-all ${
                          googleCheckResult.valid
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold">
                          {googleCheckResult.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{googleCheckResult.message}</span>
                        </div>
                        {googleCheckResult.details && (
                          <p className="text-[11px] opacity-90 pl-5.5 leading-snug">
                            {googleCheckResult.details}
                          </p>
                        )}
                      </div>

                      {/* Split Diagnosis: Individual API Badges */}
                      {googleCheckResult.detailedGoogle && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-xs">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            API-Berechtigungen im GCP-Projekt:
                          </div>

                          {/* 1. Maps JS API */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                            <div className="flex items-center gap-2">
                              {googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                              <div>
                                <span className="font-semibold text-slate-800">
                                  Maps JavaScript API
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  Kartenanzeige, Satellit & Google Basemap
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid'
                                ? 'Aktiviert ✔'
                                : 'Fehlt / Beschränkt'}
                            </span>
                          </div>

                          {/* 2. Google Maps Isochrones API */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                            <div className="flex items-center gap-2">
                              {googleCheckResult.detailedGoogle.isochronesApi.status === 'valid' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                              <div>
                                <span className="font-semibold text-slate-800">
                                  Google Maps Isochrones API
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  Pkw-, Rad- & Fußwege-Polygone
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                googleCheckResult.detailedGoogle.isochronesApi.status === 'valid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {googleCheckResult.detailedGoogle.isochronesApi.status === 'valid'
                                ? 'Aktiviert ✔'
                                : 'Deaktiviert'}
                            </span>
                          </div>

                          {/* 3. Transit Explanation */}
                          <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 leading-snug">
                            <span className="font-semibold">ÖPNV-Besonderheit: </span>
                            Google bietet in seiner Isochrones API grundsätzlich keinen ÖPNV-Modus. Dafür wird die MVV/MVG-Matrix herangezogen.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-1.5 bg-blue-50/80 border border-blue-200/60 rounded-lg p-2 text-[11px] text-blue-900 leading-snug">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Dieser Key aktiviert sowohl die <strong>Google Maps Hintergrundkarte</strong> (Maps JavaScript API) als auch die <strong>Google Maps Isochronen API</strong>.
                    </span>
                  </div>
                </div>

                {/* OpenRouteService API Key Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-500" />
                      <span className="text-xs font-bold text-slate-900">
                        OpenRouteService API Key (optional)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckOrsKey}
                      disabled={isCheckingOrs || !orsKeyInput.trim()}
                      className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 disabled:text-slate-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/60 hover:bg-slate-200 disabled:bg-slate-100 transition-colors"
                      title="ORS API-Key live testen"
                    >
                      {isCheckingOrs ? (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-slate-600" />
                      )}
                      <span>{isCheckingOrs ? 'Prüfe Key...' : 'Key testen'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={orsKeyInput}
                    onChange={(e) => {
                      setOrsKeyInput(e.target.value);
                      setOrsCheckResult(null);
                    }}
                    placeholder="5b3ce3597851110001cf6248..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono bg-white"
                  />

                  {/* ORS Test Result Banner */}
                  {orsCheckResult && (
                    <div
                      className={`p-2.5 rounded-xl text-xs border flex flex-col gap-1 transition-all ${
                        orsCheckResult.valid
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        {orsCheckResult.valid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{orsCheckResult.message}</span>
                      </div>
                      {orsCheckResult.details && (
                        <p className="text-[11px] opacity-90 pl-5.5 leading-snug">
                          {orsCheckResult.details}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500">
                    Kostenlos erstellbar unter{' '}
                    <a
                      href="https://account.heigit.org/manage/key"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      account.heigit.org/manage/key
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: TREFFBEREICH-HEATMAP NACH NÄHE (U-BAHN, S-BAHN, AUTOBAHN) */}
            {modalTab === 'heatmap' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-amber-500 text-white rounded-md">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Prioritäts-Heatmap im gemeinsamen Treffbereich
                      </span>
                      <div className="text-[11px] text-slate-600">
                        Visualisiert Lagen mit optimaler Nähe zu Schnellbahnen oder Autobahnen
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Markiert innerhalb des gemeinsamen Treffbereichs (bzw. Wohnbereichs) diejenigen Zonen als Heatmap, die besonders nah an einer Haltestelle oder Autobahnauffahrt liegen (in 3 konzentrischen Fußdistanz-Stufen).
                  </p>
                </div>

                {/* Auswahl der Prioritäts-Kriterien (Mehrfachauswahl) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      1. Prioritäts-Kriterien (Mehrfachauswahl möglich):
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllHeatmapItems}
                        className="text-[11px] text-amber-700 font-semibold hover:underline cursor-pointer"
                      >
                        Alle wählen
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllHeatmapItems}
                        className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                      >
                        Keine
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'ubahn' as PriorityHeatmapItem,
                        title: '🚇 U-Bahn',
                        desc: 'Priorisiert Gehdistanz zu allen Münchner U-Bahn-Stationen (U1-U8).',
                        icon: <Train className="w-4 h-4 text-blue-600" />,
                      },
                      {
                        id: 'sbahn' as PriorityHeatmapItem,
                        title: '🚆 S-Bahn',
                        desc: 'Priorisiert Gehdistanz zum MVV S-Bahn-Netz (S1-S8 Stammstrecke + Außenäste).',
                        icon: <Train className="w-4 h-4 text-emerald-600" />,
                      },
                      {
                        id: 'highway' as PriorityHeatmapItem,
                        title: '🚗 Autobahn',
                        desc: 'Priorisiert kurze Anbindung an Anschlussstellen (A8, A9, A94, A95, A96, A99).',
                        icon: <Car className="w-4 h-4 text-orange-600" />,
                      },
                    ].map((opt) => {
                      const active = activeHeatmapItems.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleToggleHeatmapItem(opt.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none ${
                            active
                              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => handleToggleHeatmapItem(opt.id)}
                                className="rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                            </div>
                            <div className="p-1 bg-slate-100 rounded-md shrink-0">{opt.icon}</div>
                          </div>
                          <span className="text-[11px] text-slate-500 leading-snug">{opt.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Parameter-Regler */}
                {isHeatmapActive && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>2. Heatmap-Parameter einstellen</span>
                      <span className="text-[10px] text-slate-500">Live auf der Karte</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-700 font-medium">Maximaler Such- & Einflussradius:</span>
                        <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {heatmap.radiusKm >= 1 ? `${heatmap.radiusKm.toFixed(2)} km` : `${(heatmap.radiusKm * 1000).toFixed(0)} m`} (ca. {Math.round(heatmap.radiusKm * 12)} Min)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.5"
                        step="0.1"
                        value={heatmap.radiusKm}
                        onChange={(e) => handleUpdateHeatmap({ radiusKm: parseFloat(e.target.value) })}
                        className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>500 m (Top Gehdistanz)</span>
                        <span>1.5 km (Standard)</span>
                        <span>3.5 km (Großraum)</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-700 font-medium">Farbintensität & Deckkraft:</span>
                        <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {Math.round(heatmap.intensity * 100)} %
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="0.95"
                        step="0.05"
                        value={heatmap.intensity}
                        onChange={(e) => handleUpdateHeatmap({ intensity: parseFloat(e.target.value) })}
                        className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setGoogleKeyInput('');
                  setOrsKeyInput('');
                  setGoogleCheckResult(null);
                  setOrsCheckResult(null);
                  setActiveProvider('calibrated');
                  setModalPlatform('osm');
                  setModalVariant('normal');
                  setActiveBasemap('osm');
                  setGoogleMapsApiKey('');
                  setOrsApiKey('');
                  setSelectedProvider('calibrated');
                  setBasemapPlatform('osm');
                  setMapVariant('normal');
                  setSelectedBasemap('osm_normal');
                  if (onBasemapChange) {
                    onBasemapChange('osm_normal');
                  }
                }}
                className="text-xs text-slate-500 hover:text-red-600 transition-colors"
              >
                Zurücksetzen auf Standard (OSM)
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetModalOpen(false)}
                  className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {keySaved ? <Check className="w-3.5 h-3.5" /> : null}
                  {keySaved ? 'Gespeichert & Übernommen!' : 'Speichern & Übernehmen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
