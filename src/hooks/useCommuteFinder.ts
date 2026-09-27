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
  IntersectionAreaStats,
  ApartmentListing,
  CommuteEstimate,
  IntersectionSubArea,
  PortalSearchLink,
} from '../types';
import * as turf from '@turf/turf';
import {
  loadApartmentCatalog,
  filterApartmentsInPolygon,
  subscribeApartments,
  extractIntersectionSubAreas,
  getPortalSearchLinks,
} from '../services/apartmentService';
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
  CommuteWorkerInspectionRequest,
  CommuteWorkerInspectionResponse,
  CommuteWorkerOutgoingMessage,
} from '../workers/commuteWorker';
import {
  calculateMultiIntersection,
  calculateAreaKm2,
  generateEmptyIntersectionSuggestions,
  isPointInPolygon,
  getPolygonCenter,
  samplePolygonPoints,
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

// WCAG 1.4.1: Emerald Green (#10B981) is reserved strictly for the intersection layer.
// Individual profiles use distinct, high-contrast, colorblind-safe tones.
const PALETTE = ['#2563EB', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308', '#64748B'];

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
  const resultRef = useRef<CalculationResult | null>(null);
  resultRef.current = result;

  const profilesRef = useRef<PersonProfile[]>(profiles);
  profilesRef.current = profiles;

  const scheduleRef = useRef<CommuteSchedule>(schedule);
  scheduleRef.current = schedule;

  const [isCalculating, setIsCalculating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<Date | null>(null);
  const [inspectionPoint, setInspectionPoint] = useState<InspectionPoint | null>(null);
  const inspectionPointRef = useRef<InspectionPoint | null>(null);
  inspectionPointRef.current = inspectionPoint;
  const handleSelectInspectionPointRef = useRef<(lat: number, lng: number) => Promise<void>>(() => Promise.resolve());
  const applyInspectionDataRef = useRef<(data: any, specificApartment?: ApartmentListing | null) => Promise<void>>(() => Promise.resolve());

  // Apartments State
  const [apartments, setApartments] = useState<ApartmentListing[]>([]);
  const apartmentsRef = useRef<ApartmentListing[]>([]);
  apartmentsRef.current = apartments;
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  useEffect(() => {
    loadApartmentCatalog().then((loaded) => {
      setApartments(loaded);
    });
    return subscribeApartments((updated) => {
      setApartments(updated);
    });
  }, []);
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

  const onlyResidentialRef = useRef(onlyResidential);
  onlyResidentialRef.current = onlyResidential;

  const workerRef = useRef<Worker | null>(null);
  const workerWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const activeInspectionRequestIdRef = useRef<string | null>(null);
  const pendingInspectContextRef = useRef<{
    lat: number;
    lng: number;
    matchedApartment?: ApartmentListing;
  } | null>(null);
  const runMainThreadCalculationRef = useRef<(p?: PersonProfile[], s?: CommuteSchedule, r?: boolean) => Promise<void>>(
    () => Promise.resolve()
  );

  // Main-Thread Calculation Fallback
  const runMainThreadCalculation = useCallback(
    async (
      currentProfiles: PersonProfile[] = profilesRef.current,
      currentSchedule: CommuteSchedule = scheduleRef.current,
      residentialFilter: boolean = onlyResidentialRef.current
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

        const finalResult: CalculationResult = {
          isochrones: isochronesMap,
          intersection: finalIntersection,
          rawIntersection,
          intersectionAreaKm2: finalAreaKm2,
          rawIntersectionAreaKm2: rawAreaKm2,
          emptyIntersection: isEmpty,
          suggestions,
          fallbackAlerts: fallbackAlerts.length > 0 ? fallbackAlerts : undefined,
        };
        setResult(finalResult);
        resultRef.current = finalResult;
        if (inspectionPointRef.current) {
          setTimeout(() => {
            if (inspectionPointRef.current) {
              handleSelectInspectionPointRef.current(
                inspectionPointRef.current.lat,
                inspectionPointRef.current.lng
              );
            }
          }, 16);
        }
        setLastCalculatedAt(new Date());
      } catch (err) {
        console.error('[useCommuteFinder] Main-thread calculation error:', err);
      } finally {
        setIsCalculating(false);
        setIsPending(false);
      }
    },
    []
  );
  runMainThreadCalculationRef.current = runMainThreadCalculation;

  // Initialize background computation Web Worker
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      if (typeof Worker !== 'undefined') {
        worker = new Worker(new URL('../workers/commuteWorker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (e: MessageEvent<CommuteWorkerOutgoingMessage>) => {
          if (workerWatchdogTimerRef.current) {
            clearTimeout(workerWatchdogTimerRef.current);
            workerWatchdogTimerRef.current = null;
          }
          const resp = e.data;
          if (!resp) return;

          if (resp.type === 'INSPECT_POINT_RESULT') {
            if (resp.requestId !== activeInspectionRequestIdRef.current) {
              return;
            }
            if (!resp.success) {
              console.warn('[useCommuteFinder] Web Worker inspection failed:', resp.error);
              return;
            }
            applyInspectionDataRef.current(resp, pendingInspectContextRef.current?.matchedApartment);
            return;
          }

          if (resp.requestId !== activeRequestIdRef.current) {
            // Drop stale / cancelled calculation results
            return;
          }
          if (resp.success) {
            const newRes = resp.result || null;
            setResult(newRes);
            resultRef.current = newRes;
            if (inspectionPointRef.current) {
              setTimeout(() => {
                if (inspectionPointRef.current) {
                  handleSelectInspectionPointRef.current(
                    inspectionPointRef.current.lat,
                    inspectionPointRef.current.lng
                  );
                }
              }, 16);
            }
          } else {
            console.warn('[useCommuteFinder] Web Worker calculation failed:', resp.error);
            setResult((prev) =>
              prev
                ? {
                    ...prev,
                    fallbackAlerts: [
                      ...(prev.fallbackAlerts || []),
                      {
                        personId: 'worker-error',
                        personName: 'Berechnungssystem',
                        mode: 'transit',
                        requestedProvider: 'calibrated',
                        reason: resp.error || 'Hintergrundberechnung fehlgeschlagen',
                      },
                    ],
                  }
                : null
            );
          }
          setIsCalculating(false);
          setIsPending(false);
          setLastCalculatedAt(new Date());
        };
        worker.onerror = (err) => {
          console.warn('[useCommuteFinder] Web Worker calculation error, falling back to main-thread:', err);
          if (workerWatchdogTimerRef.current) {
            clearTimeout(workerWatchdogTimerRef.current);
            workerWatchdogTimerRef.current = null;
          }
          try {
            worker?.terminate();
          } catch {}
          workerRef.current = null;
          runMainThreadCalculationRef.current();
        };
        workerRef.current = worker;
      }
    } catch (err) {
      console.warn('[useCommuteFinder] Web Worker initialization failed, using main-thread fallback:', err);
    }

    return () => {
      if (workerWatchdogTimerRef.current) {
        clearTimeout(workerWatchdogTimerRef.current);
        workerWatchdogTimerRef.current = null;
      }
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
        if (workerWatchdogTimerRef.current) {
          clearTimeout(workerWatchdogTimerRef.current);
        }
        workerWatchdogTimerRef.current = setTimeout(() => {
          console.warn('[useCommuteFinder] Web Worker watchdog timeout (7s), falling back to main-thread:');
          if (workerWatchdogTimerRef.current) {
            clearTimeout(workerWatchdogTimerRef.current);
            workerWatchdogTimerRef.current = null;
          }
          try {
            workerRef.current?.terminate();
          } catch {}
          workerRef.current = null;
          runMainThreadCalculationRef.current(currentProfiles, currentSchedule, residentialFilter);
        }, 7000);

        try {
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
        } catch (postErr) {
          console.warn('[useCommuteFinder] worker.postMessage failed, executing on main thread:', postErr);
          if (workerWatchdogTimerRef.current) {
            clearTimeout(workerWatchdogTimerRef.current);
            workerWatchdogTimerRef.current = null;
          }
          try { workerRef.current?.terminate(); } catch {}
          workerRef.current = null;
        }
      }

      // Fallback: Synchronous Main-Thread execution if Web Worker is unavailable
      await runMainThreadCalculation(currentProfiles, currentSchedule, residentialFilter);
    },
    [profiles, schedule, onlyResidential, runMainThreadCalculation]
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

  const applyInspectionData = useCallback(
    async (
      data: {
        lat: number;
        lng: number;
        estimates: CommuteEstimate[];
        allWithinLimit: boolean;
        withinLimitCount: number;
        isIntersectionInspection: boolean;
        centerCoord: [number, number] | null;
        avgCommuteMinutes?: number;
        commuteSpreadMinutes?: number;
        subAreas?: IntersectionSubArea[];
        portalLinks?: PortalSearchLink[];
        selectedSubAreaId?: string;
      },
      specificApartment?: ApartmentListing | null
    ) => {
      let matchedApartment: ApartmentListing | undefined = specificApartment || undefined;
      if (!matchedApartment) {
        matchedApartment = apartmentsRef.current.find(
          (apt) => Math.abs(apt.lat - data.lat) < 0.0003 && Math.abs(apt.lng - data.lng) < 0.0003
        );
      }

      if (matchedApartment) {
        setSelectedApartmentId(matchedApartment.id);
      } else {
        setSelectedApartmentId(null);
      }

      const currentResult = resultRef.current;
      const intersectionFeature = currentResult?.intersection || currentResult?.rawIntersection;

      const areaApartments = data.isIntersectionInspection && intersectionFeature
        ? filterApartmentsInPolygon(apartmentsRef.current, intersectionFeature)
        : undefined;

      let intersectionStats: IntersectionAreaStats | undefined;
      if (data.isIntersectionInspection && data.centerCoord) {
        const areaKm2 =
          currentResult?.intersectionAreaKm2 ??
          (intersectionFeature ? calculateAreaKm2(intersectionFeature as any) : 0);

        intersectionStats = {
          areaKm2,
          centerLat: data.centerCoord[1],
          centerLng: data.centerCoord[0],
          centerAddress: 'Lade Mittelpunkt...',
          avgCommuteMinutes: data.avgCommuteMinutes ?? 0,
          commuteSpreadMinutes: data.commuteSpreadMinutes ?? 0,
          subAreas: data.subAreas,
          selectedSubAreaId: data.selectedSubAreaId,
          portalLinks: data.portalLinks,
        };
      }

      const rentalInfo = getRentalDistrictAtPoint(
        data.lat,
        data.lng,
        scheduleRef.current.options?.rentalOverlay?.selectedRegionId || 'munich-mvv'
      );

      setInspectionPoint({
        lat: data.lat,
        lng: data.lng,
        address: matchedApartment?.title || 'Lade Adresse...',
        estimates: data.estimates,
        allWithinLimit: data.allWithinLimit,
        activePersonsCount: profilesRef.current.filter((p) => p.visible).length,
        withinLimitCount: data.withinLimitCount,
        rentalInfo: rentalInfo || undefined,
        isIntersectionInspection: data.isIntersectionInspection,
        intersectionStats,
        apartmentListings: areaApartments,
        selectedApartment: matchedApartment,
        subAreas: intersectionStats?.subAreas,
        selectedSubAreaId: intersectionStats?.selectedSubAreaId,
        portalLinks: intersectionStats?.portalLinks,
      });

      // Async reverse geocoding for clicked point and center point
      const addrPromise = reverseGeocode(data.lat, data.lng);
      const centerAddrPromise =
        data.isIntersectionInspection && data.centerCoord
          ? reverseGeocode(data.centerCoord[1], data.centerCoord[0])
          : Promise.resolve(undefined);

      const [addr, centerAddr] = await Promise.all([addrPromise, centerAddrPromise]);

      setInspectionPoint((prev) => {
        if (!prev || prev.lat !== data.lat || prev.lng !== data.lng) return prev;
        return {
          ...prev,
          address: matchedApartment ? `${matchedApartment.address} (${matchedApartment.title})` : addr,
          intersectionStats: prev.intersectionStats
            ? {
                ...prev.intersectionStats,
                centerAddress: centerAddr || prev.intersectionStats.centerAddress,
              }
            : undefined,
        };
      });
    },
    []
  );
  applyInspectionDataRef.current = applyInspectionData;

  // Map Inspection
  const handleSelectInspectionPoint = useCallback(
    async (lat: number, lng: number, specificApartment?: ApartmentListing | null) => {
      let matchedApartment: ApartmentListing | undefined = specificApartment || undefined;
      if (!matchedApartment) {
        matchedApartment = apartmentsRef.current.find(
          (apt) => Math.abs(apt.lat - lat) < 0.0003 && Math.abs(apt.lng - lng) < 0.0003
        );
      }
      if (matchedApartment) {
        setSelectedApartmentId(matchedApartment.id);
      } else {
        setSelectedApartmentId(null);
      }

      // If Web Worker is available, offload Dijkstra/matrix estimations, point-in-polygon & subarea extractions
      if (workerRef.current) {
        const inspectRequestId = `${Date.now()}_inspect_${Math.random().toString(36).substring(2, 9)}`;
        activeInspectionRequestIdRef.current = inspectRequestId;
        pendingInspectContextRef.current = { lat, lng, matchedApartment };

        const currentResult = resultRef.current;
        const currentSchedule = scheduleRef.current;
        const intersectionFeature = currentResult?.intersection || currentResult?.rawIntersection || null;

        const req: CommuteWorkerInspectionRequest = {
          type: 'INSPECT_POINT',
          requestId: inspectRequestId,
          lat,
          lng,
          intersectionFeature,
          profiles: profilesRef.current,
          schedule: currentSchedule,
          isochronesMap: currentResult?.isochrones,
          activeTransitRegion: getTransitRegion(),
          apartments: apartmentsRef.current,
        };

        workerRef.current.postMessage(req);
        return;
      }

      // Fallback: Synchronous Main-Thread calculation if Web Worker is unavailable
      const active = profilesRef.current.filter((p) => p.visible);
      const currentResult = resultRef.current;
      const currentSchedule = scheduleRef.current;

      const intersectionFeature = currentResult?.intersection || currentResult?.rawIntersection;

      const isInIntersection = intersectionFeature
        ? isPointInPolygon([lng, lat], intersectionFeature)
        : false;

      // When inside the shared intersection, calculate area center and spread
      const isIntersectionInspection = isInIntersection && !!intersectionFeature;
      const centerCoord = isIntersectionInspection ? getPolygonCenter(intersectionFeature) : null;
      const sampleCoords = isIntersectionInspection ? samplePolygonPoints(intersectionFeature, 12) : [];

      const estimates = active.map((p) => {
        const poly = currentResult?.isochrones?.[p.id];
        const isInIsochrone = poly ? isPointInPolygon([lng, lat], poly) : false;

        let { travelTimeMinutes, distanceKm, details } = estimateCommuteTime(
          { lat, lng },
          { lat: p.lat, lng: p.lng },
          p.mode,
          currentSchedule,
          p.maxTransfers,
          p.maxWalkToStationMin,
          p.maxWalkFromStationMin,
          p.transitModes
        );

        let isWithinLimit = travelTimeMinutes <= p.travelTimeMinutes;

        // If the location is geometrically inside the shared intersection or this person's isochrone,
        // it is mathematically proven to be reachable within their budget. Reconcile any small heuristic overshoot.
        if (isInIntersection || isInIsochrone) {
          isWithinLimit = true;
          if (travelTimeMinutes > p.travelTimeMinutes) {
            travelTimeMinutes = p.travelTimeMinutes;
          }
          if (details) {
            if (
              details.firstMileWalkLimitMin !== undefined &&
              details.firstMileWalkMin !== undefined &&
              details.firstMileWalkMin > details.firstMileWalkLimitMin
            ) {
              details.firstMileWalkMin = details.firstMileWalkLimitMin;
            }
            if (
              details.lastMileWalkLimitMin !== undefined &&
              details.lastMileWalkMin !== undefined &&
              details.lastMileWalkMin > details.lastMileWalkLimitMin
            ) {
              details.lastMileWalkMin = details.lastMileWalkLimitMin;
            }
          }
        }

        // Calculate area-based metrics when evaluating the shared intersection
        let minMinutes: number | undefined;
        let maxMinutes: number | undefined;
        let spanPlusMinus: number | undefined;
        let centerMinutes: number | undefined;
        let centerDistanceKm: number | undefined;

        if (isIntersectionInspection && centerCoord) {
          const centerEst = estimateCommuteTime(
            { lat: centerCoord[1], lng: centerCoord[0] },
            { lat: p.lat, lng: p.lng },
            p.mode,
            currentSchedule,
            p.maxTransfers,
            p.maxWalkToStationMin,
            p.maxWalkFromStationMin,
            p.transitModes
          );

          centerMinutes = Math.min(p.travelTimeMinutes, centerEst.travelTimeMinutes);
          centerDistanceKm = centerEst.distanceKm;

          // Compute spread over sample coords
          const sampleTimes: number[] = [centerMinutes];
          sampleCoords.forEach((coord) => {
            const sampleEst = estimateCommuteTime(
              { lat: coord[1], lng: coord[0] },
              { lat: p.lat, lng: p.lng },
              p.mode,
              currentSchedule,
              p.maxTransfers,
              p.maxWalkToStationMin,
              p.maxWalkFromStationMin,
              p.transitModes
            );
            sampleTimes.push(Math.min(p.travelTimeMinutes, sampleEst.travelTimeMinutes));
          });

          minMinutes = Math.min(...sampleTimes);
          maxMinutes = Math.min(p.travelTimeMinutes, Math.max(...sampleTimes));
          spanPlusMinus = Math.max(1, Math.round(Math.max(centerMinutes - minMinutes, maxMinutes - centerMinutes)));

          // Prefer center route details if available for the area overview
          if (centerEst.details) {
            details = centerEst.details;
          }
        }

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
          minMinutes,
          maxMinutes,
          spanPlusMinus,
          centerMinutes,
          centerDistanceKm,
        };
      });

      const withinLimitCount = isInIntersection
        ? active.length
        : estimates.filter((e) => e.isWithinLimit).length;
      const allWithinLimit = isInIntersection || withinLimitCount === active.length;

      let avgCommuteMinutes: number | undefined;
      let commuteSpreadMinutes: number | undefined;
      let subAreas: IntersectionSubArea[] | undefined;
      let portalLinks: PortalSearchLink[] | undefined;
      let selectedSubAreaId: string | undefined;

      if (isIntersectionInspection && centerCoord) {
        const centerTimes = estimates.map((e) => e.centerMinutes ?? e.travelTimeMinutes);
        avgCommuteMinutes = Math.round(
          centerTimes.reduce((acc, t) => acc + t, 0) / (centerTimes.length || 1)
        );
        if (centerTimes.length === 2) {
          commuteSpreadMinutes = Math.round(Math.abs(centerTimes[0] - centerTimes[1]) / 2);
        } else if (centerTimes.length > 2) {
          commuteSpreadMinutes = Math.round(
            Math.max(...centerTimes.map((t) => Math.abs(t - avgCommuteMinutes!)))
          );
        }

        subAreas = extractIntersectionSubAreas(
          intersectionFeature,
          apartmentsRef.current
        );

        let clickedSubArea = subAreas.find((sa) => {
          try {
            return turf.booleanPointInPolygon(turf.point([lng, lat]), sa.feature);
          } catch {
            return false;
          }
        });

        const activeBbox = clickedSubArea ? clickedSubArea.bbox : (turf.bbox(intersectionFeature as any) as [number, number, number, number]);
        portalLinks = clickedSubArea
          ? clickedSubArea.portalLinks
          : getPortalSearchLinks({ lat: centerCoord[1], lng: centerCoord[0] }, activeBbox);
        selectedSubAreaId = clickedSubArea?.id;
      }

      applyInspectionData(
        {
          lat,
          lng,
          estimates,
          allWithinLimit,
          withinLimitCount,
          isIntersectionInspection,
          centerCoord,
          avgCommuteMinutes,
          commuteSpreadMinutes,
          subAreas,
          portalLinks,
          selectedSubAreaId,
        },
        matchedApartment
      );
    },
    [applyInspectionData]
  );
  handleSelectInspectionPointRef.current = handleSelectInspectionPoint;

  const handleSelectApartment = useCallback(
    (apt: ApartmentListing | null) => {
      if (!apt) {
        setSelectedApartmentId(null);
        setInspectionPoint((prev) => (prev ? { ...prev, selectedApartment: undefined } : null));
        return;
      }
      setSelectedApartmentId(apt.id);
      handleSelectInspectionPoint(apt.lat, apt.lng, apt);
    },
    [handleSelectInspectionPoint]
  );

  const handleReloadApartments = useCallback(async () => {
    const loaded = await loadApartmentCatalog();
    setApartments(loaded);
  }, []);

  const undoProfilesSnapshotRef = useRef<PersonProfile[] | null>(null);
  const [undoToastMessage, setUndoToastMessage] = useState<string | null>(null);

  // Fallback suggestions with 1-click Undo capability (ISO 9241-110)
  const handleApplySuggestion = useCallback(
    (suggestion: FallbackSuggestion) => {
      // Snapshot state for reversibility
      undoProfilesSnapshotRef.current = JSON.parse(JSON.stringify(profiles));
      setUndoToastMessage(`Vorschlag angewendet: ${suggestion.title}`);

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
    [profiles, handleUpdateProfile]
  );

  const handleUndoLastSuggestion = useCallback(() => {
    if (undoProfilesSnapshotRef.current) {
      setProfiles(undoProfilesSnapshotRef.current);
      undoProfilesSnapshotRef.current = null;
      setUndoToastMessage(null);
    }
  }, []);

  const handleDismissUndoToast = useCallback(() => {
    setUndoToastMessage(null);
  }, []);

  // Residential filter with background worker offloading (ISO/IEC 25010)
  const handleToggleOnlyResidential = useCallback(() => {
    setOnlyResidential((prevOnly) => {
      const nextVal = !prevOnly;
      runCalculation(profiles, schedule, nextVal);
      return nextVal;
    });
  }, [profiles, schedule, runCalculation]);

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
    undoToastMessage,
    handleUndoLastSuggestion,
    handleDismissUndoToast,
    apartments,
    selectedApartmentId,
    handleSelectApartment,
    handleReloadApartments,
  };
}
