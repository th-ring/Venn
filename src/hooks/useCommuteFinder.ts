import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PersonProfile,
  CommuteSchedule,
  CalculationResult,
  InspectionPoint,
  FallbackSuggestion,
  BasemapProvider,
  PresetScenario,
  DEFAULT_TRANSIT_SUBMODES,
  IsochroneFallbackAlert,
  LayerId,
  DEFAULT_LAYER_ORDER,
  PoiIconSettings,
  DEFAULT_POI_ICON_SETTINGS,
} from '../types';
import { DEFAULT_MUNICH_PROFILES } from '../data/presets';
import {
  generateIsochrone,
  estimateCommuteTime,
  getSelectedBasemap,
  setSelectedBasemap,
  getGoogleMapsApiKey,
  getOrsApiKey,
  getSelectedProvider,
} from '../services/isochroneEngine';
import {
  CommuteWorkerRequest,
  CommuteWorkerResponse,
} from '../workers/commuteWorker';
import {
  calculateMultiIntersection,
  calculateAreaKm2,
  generateEmptyIntersectionSuggestions,
} from '../services/geometry';
import { maskByResidentialAreas } from '../data/residentialZones';
import { reverseGeocode } from '../services/geocoding';
import {
  initializeTransitStorage,
  detectRegionForCoordinate,
  switchTransitRegion,
  getTransitRegion,
} from '../services/mvvMatrixService';
import {
  getRentalDistrictAtPoint,
  getSavedRentalOverlaySettings,
} from '../services/rentalService';

import {
  FullShareConfig,
  parseConfigFromWindowHash,
  loadLocalProfileState,
  saveLocalProfileState,
  clearLocalProfileState,
} from '../services/configShareService';

const PALETTE = ['#3B82F6', '#F97316', '#10B981', '#A855F7', '#EC4899', '#06B6D4', '#EAB308'];

export function useCommuteFinder() {
  // 0. Initial Startup Config: 1) URL-Hash (#zone= / #config=), 2) LocalProfile (localStorage), 3) Defaults
  const initialConfigRef = useRef<FullShareConfig | null>(null);
  if (initialConfigRef.current === null) {
    const fromHash = parseConfigFromWindowHash();
    if (fromHash && fromHash.profiles && fromHash.profiles.length > 0) {
      initialConfigRef.current = fromHash;
    } else {
      const fromLocal = loadLocalProfileState();
      if (fromLocal && fromLocal.profiles && fromLocal.profiles.length > 0) {
        initialConfigRef.current = fromLocal;
      }
    }
  }
  const initialConfig = initialConfigRef.current;

  // 1. Initial Profiles
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    return initialConfig?.profiles && initialConfig.profiles.length > 0
      ? initialConfig.profiles
      : DEFAULT_MUNICH_PROFILES;
  });

  // 2. Initial Schedule
  const [schedule, setSchedule] = useState<CommuteSchedule>(() => {
    if (initialConfig?.schedule) {
      return initialConfig.schedule;
    }
    return {
      direction: 'to_work',
      dayOfWeek: 'workday',
      time: '07:00',
      options: {
        liveTraffic: false,
        enableSmoothing: true,
        fidelity: 'AUTOMATIC',
        fillHoles: true,
        rentalOverlay: getSavedRentalOverlaySettings(),
      },
    };
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<Date | null>(null);
  const [inspectionPoint, setInspectionPoint] = useState<InspectionPoint | null>(null);
  const [showIntersectionLayer, setShowIntersectionLayer] = useState(
    initialConfig?.showIntersectionLayer ?? true
  );
  const [showIndividualIsochrones, setShowIndividualIsochrones] = useState(
    initialConfig?.showIndividualIsochrones ?? true
  );
  const [onlyResidential, setOnlyResidential] = useState(
    initialConfig?.onlyResidential ?? false
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    initialConfig?.activeScenarioId || 'munich-standard'
  );
  const [basemap, setBasemap] = useState<BasemapProvider>(
    () => initialConfig?.basemap || getSelectedBasemap()
  );

  const calculationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showOnlyIntersection = !showIndividualIsochrones && showIntersectionLayer;

  const handleToggleOnlyIntersection = useCallback(() => {
    if (showOnlyIntersection) {
      setShowIndividualIsochrones(true);
      setShowIntersectionLayer(true);
    } else {
      setShowIndividualIsochrones(false);
      setShowIntersectionLayer(true);
    }
  }, [showOnlyIntersection]);

  const handleToggleIndividualIsochrones = useCallback(() => {
    setShowIndividualIsochrones((prev) => !prev);
  }, []);

  const handleBasemapChange = useCallback((newBasemap: BasemapProvider) => {
    setBasemap(newBasemap);
    setSelectedBasemap(newBasemap);
  }, []);

  // Layer Ordering & Management
  const [layerOrder, setLayerOrder] = useState<LayerId[]>(() => {
    if (initialConfig?.layerOrder && initialConfig.layerOrder.length > 0) {
      return initialConfig.layerOrder;
    }
    try {
      const saved = localStorage.getItem('commute_layer_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((id: any) => DEFAULT_LAYER_ORDER.includes(id));
          DEFAULT_LAYER_ORDER.forEach((id) => {
            if (!valid.includes(id)) valid.push(id);
          });
          return valid;
        }
      }
    } catch {}
    return DEFAULT_LAYER_ORDER;
  });

  const [hiddenLayers, setHiddenLayers] = useState<Set<LayerId>>(() => {
    if (initialConfig?.hiddenLayers) {
      return new Set(initialConfig.hiddenLayers);
    }
    return new Set();
  });

  const [poiIconSettings, setPoiIconSettings] = useState<PoiIconSettings>(() => {
    if (initialConfig?.poiIconSettings) {
      return initialConfig.poiIconSettings;
    }
    try {
      const saved = localStorage.getItem('commute_poi_icon_settings');
      if (saved) {
        return { ...DEFAULT_POI_ICON_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_POI_ICON_SETTINGS;
  });

  const handleReorderLayer = useCallback((fromIndex: number, toIndex: number) => {
    setLayerOrder((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      try {
        localStorage.setItem('commute_layer_order', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleResetLayerOrder = useCallback(() => {
    setLayerOrder(DEFAULT_LAYER_ORDER);
    try {
      localStorage.removeItem('commute_layer_order');
    } catch {}
  }, []);

  const handleToggleLayerVisibility = useCallback((layerId: LayerId) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleUpdatePoiIcons = useCallback((updated: Partial<PoiIconSettings>) => {
    setPoiIconSettings((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('commute_poi_icon_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleProfileVisibility = useCallback((id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p))
    );
  }, []);

  // Initialize IndexedDB transit storage on startup
  useEffect(() => {
    initializeTransitStorage().catch(() => {});
  }, []);

  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  // Initialize background computation Web Worker
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      if (typeof Worker !== 'undefined') {
        worker = new Worker(new URL('../workers/commuteWorker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (e: MessageEvent<CommuteWorkerResponse>) => {
          const resp = e.data;
          if (!resp || resp.requestId !== activeRequestIdRef.current) {
            // Drop stale / cancelled calculation results
            return;
          }
          if (resp.success) {
            setResult(resp.result || null);
          }
          setIsCalculating(false);
          setIsPending(false);
          setLastCalculatedAt(new Date());
        };
        worker.onerror = (err) => {
          console.warn('[useCommuteFinder] Web Worker calculation error, falling back to main-thread:', err);
          setIsCalculating(false);
          setIsPending(false);
        };
        workerRef.current = worker;
      }
    } catch (err) {
      console.warn('[useCommuteFinder] Web Worker initialization failed, using main-thread fallback:', err);
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
      workerRef.current = null;
    };
  }, []);

  // Calculation Engine
  const runCalculation = useCallback(
    async (
      currentProfiles: PersonProfile[] = profiles,
      currentSchedule: CommuteSchedule = schedule,
      residentialFilter = onlyResidential
    ) => {
      setIsPending(false);
      setIsCalculating(true);
      const active = currentProfiles.filter((p) => p.visible);

      if (active.length === 0) {
        setResult(null);
        setIsCalculating(false);
        setLastCalculatedAt(new Date());
        return;
      }

      const requestId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      activeRequestIdRef.current = requestId;

      // Primary: Execute all matrix searches, Turf buffering, and geometric intersections in Web Worker
      if (workerRef.current) {
        const workerPayload: CommuteWorkerRequest = {
          requestId,
          profiles: currentProfiles,
          schedule: currentSchedule,
          onlyResidential: residentialFilter,
          activeTransitRegion: getTransitRegion(),
          selectedProvider: getSelectedProvider(),
          googleMapsApiKey: getGoogleMapsApiKey(),
          orsApiKey: getOrsApiKey(),
        };
        workerRef.current.postMessage(workerPayload);
        return;
      }

      // Fallback: Synchronous Main-Thread execution if Web Worker is unavailable
      try {
        const isochronePromises = active.map(async (p) => {
          const poly = await generateIsochrone(p, currentSchedule);
          return { id: p.id, poly };
        });

        const generated = await Promise.all(isochronePromises);
        const isochronesMap: Record<string, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = {};
        const polygonList: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = [];
        const fallbackAlerts: IsochroneFallbackAlert[] = [];

        generated.forEach(({ id, poly }) => {
          isochronesMap[id] = poly;
          polygonList.push(poly);
          if (poly.properties?.isFallback && poly.properties?.fallbackReason) {
            const p = active.find((person) => person.id === id);
            fallbackAlerts.push({
              personId: id,
              personName: p?.name || p?.address || 'Referenzort',
              mode: p?.mode || 'driving',
              requestedProvider: poly.properties.requestedProvider || 'calibrated',
              reason: poly.properties.fallbackReason,
              statusCode: poly.properties.statusCode,
            });
          }
        });

        const rawIntersection = calculateMultiIntersection(polygonList);
        const rawAreaKm2 = calculateAreaKm2(rawIntersection);

        let finalIntersection = rawIntersection;
        let finalAreaKm2 = rawAreaKm2;

        if (residentialFilter && rawIntersection) {
          const masked = maskByResidentialAreas(rawIntersection);
          if (masked) {
            finalIntersection = masked;
            finalAreaKm2 = calculateAreaKm2(masked);
          }
        }

        const isEmpty = !finalIntersection || finalAreaKm2 <= 0;
        const suggestions = isEmpty ? generateEmptyIntersectionSuggestions(active) : [];

        setResult({
          isochrones: isochronesMap,
          intersection: finalIntersection,
          rawIntersection,
          intersectionAreaKm2: finalAreaKm2,
          rawIntersectionAreaKm2: rawAreaKm2,
          emptyIntersection: isEmpty,
          suggestions,
          fallbackAlerts: fallbackAlerts.length > 0 ? fallbackAlerts : undefined,
        });
        setLastCalculatedAt(new Date());
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        setIsCalculating(false);
        setIsPending(false);
      }
    },
    [profiles, schedule, onlyResidential]
  );

  // Debounced auto-calculation
  useEffect(() => {
    if (!autoUpdate) return;

    setIsPending(true);

    if (calculationTimerRef.current) {
      clearTimeout(calculationTimerRef.current);
    }

    calculationTimerRef.current = setTimeout(() => {
      runCalculation(profiles, schedule, onlyResidential);
    }, 380);

    return () => {
      if (calculationTimerRef.current) {
        clearTimeout(calculationTimerRef.current);
      }
    };
  }, [profiles, schedule, autoUpdate, onlyResidential, runCalculation]);

  // Profile actions
  const handleUpdateProfile = useCallback((id: string, updated: Partial<PersonProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  }, []);

  const handleAddProfile = useCallback(() => {
    setProfiles((prev) => {
      const nextIndex = prev.length;
      const color = PALETTE[nextIndex % PALETTE.length];
      const baseLat = prev[0]?.lat || 52.52;
      const baseLng = prev[0]?.lng || 13.4;

      const newProfile: PersonProfile = {
        id: `profile-${Date.now()}`,
        name: `Referenzort ${nextIndex + 1}`,
        address: 'Neuer Zielort',
        lat: baseLat + (Math.random() - 0.5) * 0.06,
        lng: baseLng + (Math.random() - 0.5) * 0.08,
        travelTimeMinutes: 35,
        mode: 'transit',
        color,
        visible: true,
        maxTransfers: 1,
        maxWalkToStationMin: 5,
        maxWalkFromStationMin: 5,
        maxTransferWaitMin: 5,
        transitModes: [...DEFAULT_TRANSIT_SUBMODES],
      };

      return [...prev, newProfile];
    });
  }, []);

  const handleRemoveProfile = useCallback((id: string) => {
    setProfiles((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleUpdatePersonPosition = useCallback(
    async (personId: string, lat: number, lng: number) => {
      handleUpdateProfile(personId, { lat, lng });

      // Auto-detect if coordinates belong to another metropolitan region
      const detected = detectRegionForCoordinate(lat, lng);
      const current = getTransitRegion();
      if (detected && detected.id !== current.id) {
        try {
          await switchTransitRegion(detected.id);
        } catch {}
      }

      const resolvedAddress = await reverseGeocode(lat, lng);
      handleUpdateProfile(personId, { address: resolvedAddress });
    },
    [handleUpdateProfile]
  );

  // Map Inspection
  const handleSelectInspectionPoint = useCallback(
    async (lat: number, lng: number) => {
      const active = profiles.filter((p) => p.visible);

      const estimates = active.map((p) => {
        const { travelTimeMinutes, distanceKm, details } = estimateCommuteTime(
          { lat, lng },
          { lat: p.lat, lng: p.lng },
          p.mode,
          schedule,
          p.maxTransfers,
          p.maxWalkToStationMin,
          p.maxWalkFromStationMin,
          p.transitModes
        );

        const isWithinLimit = travelTimeMinutes <= p.travelTimeMinutes;

        return {
          personId: p.id,
          personName: p.name,
          personColor: p.color,
          mode: p.mode,
          travelTimeMinutes,
          limitMinutes: p.travelTimeMinutes,
          isWithinLimit,
          distanceKm,
          details,
        };
      });

      const withinLimitCount = estimates.filter((e) => e.isWithinLimit).length;
      const allWithinLimit = withinLimitCount === active.length;

      const rentalInfo = getRentalDistrictAtPoint(
        lat,
        lng,
        schedule.options?.rentalOverlay?.selectedRegionId || 'munich-mvv'
      );

      setInspectionPoint({
        lat,
        lng,
        address: 'Lade Adresse...',
        estimates,
        allWithinLimit,
        activePersonsCount: active.length,
        withinLimitCount,
        rentalInfo: rentalInfo || undefined,
      });

      const addr = await reverseGeocode(lat, lng);
      setInspectionPoint((prev) => (prev ? { ...prev, address: addr } : null));
    },
    [profiles, schedule]
  );

  // Fallback suggestions
  const handleApplySuggestion = useCallback(
    (suggestion: FallbackSuggestion) => {
      if (suggestion.type === 'increase_time' && suggestion.personId && suggestion.suggestedMinutes) {
        handleUpdateProfile(suggestion.personId, {
          travelTimeMinutes: suggestion.suggestedMinutes,
        });
      } else if (suggestion.type === 'change_mode' && suggestion.personId && suggestion.suggestedMode) {
        handleUpdateProfile(suggestion.personId, {
          mode: suggestion.suggestedMode,
        });
      } else if (suggestion.type === 'mutual_increase') {
        setProfiles((prev) =>
          prev.map((p) => ({
            ...p,
            travelTimeMinutes: Math.min(p.travelTimeMinutes + 10, 90),
          }))
        );
      }
    },
    [handleUpdateProfile]
  );

  // Residential filter with instant local geometry update if rawIntersection is present
  const handleToggleOnlyResidential = useCallback(() => {
    setOnlyResidential((prevOnly) => {
      const nextVal = !prevOnly;
      if (result && result.rawIntersection) {
        if (nextVal) {
          const masked = maskByResidentialAreas(result.rawIntersection);
          const area = calculateAreaKm2(masked);
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  intersection: masked,
                  intersectionAreaKm2: area,
                  emptyIntersection: !masked || area <= 0,
                }
              : null
          );
        } else {
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  intersection: prev.rawIntersection || null,
                  intersectionAreaKm2: prev.rawIntersectionAreaKm2 || 0,
                  emptyIntersection: !prev.rawIntersection || (prev.rawIntersectionAreaKm2 || 0) <= 0,
                }
              : null
          );
        }
      } else {
        runCalculation(profiles, schedule, nextVal);
      }
      return nextVal;
    });
  }, [result, profiles, schedule, runCalculation]);

  // Scenario selection
  const handleSelectScenario = useCallback((scenario: PresetScenario) => {
    setActiveScenarioId(scenario.id);
    setProfiles(scenario.profiles);
    setInspectionPoint(null);

    const first = scenario.profiles[0];
    if (first) {
      const detected = detectRegionForCoordinate(first.lat, first.lng);
      const current = getTransitRegion();
      if (detected && detected.id !== current.id) {
        switchTransitRegion(detected.id).catch(() => {});
      }
    }
  }, []);

  // 10. Reversible Full Configuration Object
  const currentFullConfig: FullShareConfig = {
    version: 2,
    profiles,
    schedule,
    basemap,
    layerOrder,
    hiddenLayers: Array.from(hiddenLayers),
    poiIconSettings,
    onlyResidential,
    showIndividualIsochrones,
    showIntersectionLayer,
    activeScenarioId,
  };

  // 11. Auto-save local profile state in browser (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveLocalProfileState(currentFullConfig);
    }, 400);
    return () => clearTimeout(timer);
  }, [
    profiles,
    schedule,
    basemap,
    layerOrder,
    hiddenLayers,
    poiIconSettings,
    onlyResidential,
    showIndividualIsochrones,
    showIntersectionLayer,
    activeScenarioId,
  ]);

  // 12. Apply full imported configuration
  const applyFullConfig = useCallback((newConfig: FullShareConfig) => {
    if (newConfig.profiles && newConfig.profiles.length > 0) {
      setProfiles(newConfig.profiles);
    }
    if (newConfig.schedule) {
      setSchedule(newConfig.schedule);
    }
    if (newConfig.basemap) {
      handleBasemapChange(newConfig.basemap);
    }
    if (newConfig.layerOrder && newConfig.layerOrder.length > 0) {
      setLayerOrder(newConfig.layerOrder);
    }
    if (newConfig.hiddenLayers) {
      setHiddenLayers(new Set(newConfig.hiddenLayers));
    }
    if (newConfig.poiIconSettings) {
      setPoiIconSettings(newConfig.poiIconSettings);
    }
    if (newConfig.onlyResidential !== undefined) {
      setOnlyResidential(newConfig.onlyResidential);
    }
    if (newConfig.showIndividualIsochrones !== undefined) {
      setShowIndividualIsochrones(newConfig.showIndividualIsochrones);
    }
    if (newConfig.showIntersectionLayer !== undefined) {
      setShowIntersectionLayer(newConfig.showIntersectionLayer);
    }
    if (newConfig.activeScenarioId) {
      setActiveScenarioId(newConfig.activeScenarioId);
    }
  }, [handleBasemapChange]);

  // 13. Reset to neutral defaults
  const handleResetToDefaults = useCallback(() => {
    clearLocalProfileState();
    setProfiles(DEFAULT_MUNICH_PROFILES);
    setActiveScenarioId('munich-standard');
    setSchedule({
      direction: 'to_work',
      dayOfWeek: 'workday',
      time: '07:00',
      options: {
        liveTraffic: false,
        enableSmoothing: true,
        fidelity: 'AUTOMATIC',
        fillHoles: true,
        rentalOverlay: getSavedRentalOverlaySettings(),
      },
    });
    setBasemap('osm');
    setSelectedBasemap('osm');
    setLayerOrder(DEFAULT_LAYER_ORDER);
    setHiddenLayers(new Set());
    setPoiIconSettings(DEFAULT_POI_ICON_SETTINGS);
    setOnlyResidential(false);
    setShowIndividualIsochrones(true);
    setShowIntersectionLayer(true);
  }, []);

  return {
    profiles,
    setProfiles,
    schedule,
    setSchedule,
    result,
    isCalculating,
    isPending,
    autoUpdate,
    setAutoUpdate,
    lastCalculatedAt,
    inspectionPoint,
    setInspectionPoint,
    showIntersectionLayer,
    setShowIntersectionLayer,
    showIndividualIsochrones,
    setShowIndividualIsochrones,
    showOnlyIntersection,
    handleToggleOnlyIntersection,
    handleToggleIndividualIsochrones,
    onlyResidential,
    handleToggleOnlyResidential,
    basemap,
    handleBasemapChange,
    activeScenarioId,
    handleSelectScenario,
    handleUpdateProfile,
    handleAddProfile,
    handleRemoveProfile,
    handleUpdatePersonPosition,
    handleSelectInspectionPoint,
    handleApplySuggestion,
    runCalculation,
    layerOrder,
    handleReorderLayer,
    handleResetLayerOrder,
    hiddenLayers,
    handleToggleLayerVisibility,
    poiIconSettings,
    handleUpdatePoiIcons,
    handleToggleProfileVisibility,
    currentFullConfig,
    applyFullConfig,
    handleResetToDefaults,
  };
}
