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
} from '../types';
import { DEFAULT_MUNICH_PROFILES } from '../data/presets';
import {
  generateIsochrone,
  estimateCommuteTime,
  getSelectedBasemap,
  setSelectedBasemap,
} from '../services/isochroneEngine';
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

const PALETTE = ['#3B82F6', '#F97316', '#10B981', '#A855F7', '#EC4899', '#06B6D4', '#EAB308'];

export function useCommuteFinder() {
  // 1. Initial Profiles from URL Hash (FR-4.5) or Default Munich Setup
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#zone=')) {
        const jsonStr = decodeURIComponent(hash.replace('#zone=', ''));
        const parsed = JSON.parse(jsonStr);
        if (parsed && Array.isArray(parsed.p) && parsed.p.length > 0) {
          return parsed.p.map((item: any, idx: number) => ({
            id: `p-shared-${idx}-${Date.now()}`,
            name: item.n || `Person ${idx + 1}`,
            address: item.a || '',
            lat: item.lat,
            lng: item.lng,
            travelTimeMinutes: item.t || 35,
            mode: item.m || 'transit',
            color: item.c || PALETTE[idx % PALETTE.length],
            visible: item.v !== false,
            maxTransfers: item.mt,
            maxWalkToStationMin: item.mw,
            maxWalkFromStationMin: item.mfw,
            maxTransferWaitMin: item.mtw,
            transitModes: Array.isArray(item.tm) ? item.tm : undefined,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse URL share hash:', e);
    }
    return DEFAULT_MUNICH_PROFILES;
  });

  // 2. Initial Schedule from URL Hash
  const [schedule, setSchedule] = useState<CommuteSchedule>(() => {
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#zone=')) {
        const jsonStr = decodeURIComponent(hash.replace('#zone=', ''));
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.s) {
          return {
            direction: parsed.s.d || 'to_work',
            dayOfWeek: parsed.s.w || 'workday',
            time: parsed.s.t || '08:30',
            options: {
              liveTraffic: parsed.s.lt ?? false,
              enableSmoothing: parsed.s.sm ?? true,
              fidelity: parsed.s.fi || 'AUTOMATIC',
            },
          };
        }
      }
    } catch {
      // Fall through
    }
    return {
      direction: 'to_work',
      dayOfWeek: 'workday',
      time: '08:30',
      options: {
        liveTraffic: false,
        enableSmoothing: true,
        fidelity: 'AUTOMATIC',
      },
    };
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<Date | null>(null);
  const [inspectionPoint, setInspectionPoint] = useState<InspectionPoint | null>(null);
  const [showIntersectionLayer, setShowIntersectionLayer] = useState(true);
  const [showIndividualIsochrones, setShowIndividualIsochrones] = useState(true);
  const [onlyResidential, setOnlyResidential] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('munich-standard');
  const [basemap, setBasemap] = useState<BasemapProvider>(() => getSelectedBasemap());

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

  // Initialize IndexedDB transit storage on startup
  useEffect(() => {
    initializeTransitStorage().catch(() => {});
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
        maxTransfers: 2,
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

      setInspectionPoint({
        lat,
        lng,
        address: 'Lade Adresse...',
        estimates,
        allWithinLimit,
        activePersonsCount: active.length,
        withinLimitCount,
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
  };
}
