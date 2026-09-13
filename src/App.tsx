import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PersonProfile,
  CommuteSchedule,
  CalculationResult,
  InspectionPoint,
  FallbackSuggestion,
  BasemapProvider,
} from './types';
import { DEFAULT_MUNICH_PROFILES } from './data/presets';
import {
  generateIsochrone,
  estimateCommuteTime,
  getSelectedBasemap,
  setSelectedBasemap,
} from './services/isochroneEngine';
import {
  calculateMultiIntersection,
  calculateAreaKm2,
  generateEmptyIntersectionSuggestions,
} from './services/geometry';
import { maskByResidentialAreas } from './data/residentialZones';
import { reverseGeocode } from './services/geocoding';
import { MapComponent } from './components/MapComponent';
import { Sidebar } from './components/Sidebar';
import { InspectionPanel } from './components/InspectionPanel';
import { ShareModal } from './components/ShareModal';
import { Menu, X, SlidersHorizontal } from 'lucide-react';

const PALETTE = ['#3B82F6', '#F97316', '#10B981', '#A855F7', '#EC4899', '#06B6D4', '#EAB308'];

export default function App() {
  // 1. Initial State from URL Hash (FR-4.5) or Default Munich Setup
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
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse URL share hash:', e);
    }
    // Default: Munich (München)
    return DEFAULT_MUNICH_PROFILES;
  });

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Basemap & API modal state
  const [basemap, setBasemap] = useState<BasemapProvider>(() => getSelectedBasemap());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [onlyResidential, setOnlyResidential] = useState(false);

  const showOnlyIntersection = !showIndividualIsochrones && showIntersectionLayer;

  const handleToggleOnlyIntersection = () => {
    if (showOnlyIntersection) {
      setShowIndividualIsochrones(true);
      setShowIntersectionLayer(true);
    } else {
      setShowIndividualIsochrones(false);
      setShowIntersectionLayer(true);
    }
  };

  const handleToggleIndividualIsochrones = () => {
    setShowIndividualIsochrones((prev) => !prev);
  };

  const handleBasemapChange = (newBasemap: BasemapProvider) => {
    setBasemap(newBasemap);
    setSelectedBasemap(newBasemap);
  };

  // Debounce calculation timer ref
  const calculationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. Perform Isochrone and Intersection Calculation
  const runCalculation = useCallback(
    async (
      currentProfiles: PersonProfile[],
      currentSchedule: CommuteSchedule,
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
        // Generate isochrone for each active profile
        const isochronePromises = active.map(async (p) => {
          const poly = await generateIsochrone(p, currentSchedule);
          return { id: p.id, poly };
        });

        const generated = await Promise.all(isochronePromises);
        const isochronesMap: Record<string, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = {};
        const polygonList: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = [];

        generated.forEach(({ id, poly }) => {
          isochronesMap[id] = poly;
          polygonList.push(poly);
        });

        // Compute raw intersection
        const rawIntersection = calculateMultiIntersection(polygonList);
        const rawAreaKm2 = calculateAreaKm2(rawIntersection);

        // If residential filter active, mask with residential areas
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

        // Fallback suggestions if empty
        const suggestions = isEmpty ? generateEmptyIntersectionSuggestions(active) : [];

        setResult({
          isochrones: isochronesMap,
          intersection: finalIntersection,
          rawIntersection: rawIntersection,
          intersectionAreaKm2: finalAreaKm2,
          rawIntersectionAreaKm2: rawAreaKm2,
          emptyIntersection: isEmpty,
          suggestions,
        });
        setLastCalculatedAt(new Date());
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        setIsCalculating(false);
        setIsPending(false);
      }
    },
    [onlyResidential]
  );

  // 3. Trigger Calculation with Debounce when autoUpdate is true
  useEffect(() => {
    if (!autoUpdate) {
      return;
    }

    setIsPending(true);

    if (calculationTimerRef.current) {
      clearTimeout(calculationTimerRef.current);
    }

    calculationTimerRef.current = setTimeout(() => {
      runCalculation(profiles, schedule);
    }, 380);

    return () => {
      if (calculationTimerRef.current) {
        clearTimeout(calculationTimerRef.current);
      }
    };
  }, [profiles, schedule, autoUpdate, runCalculation]);

  // 4. Update an individual profile
  const handleUpdateProfile = (id: string, updated: Partial<PersonProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  // 5. Add a new profile (FR-1.1 flexible 1 to X)
  const handleAddProfile = () => {
    const nextIndex = profiles.length;
    const color = PALETTE[nextIndex % PALETTE.length];
    // Slightly offset coords from first profile or center
    const baseLat = profiles[0]?.lat || 52.52;
    const baseLng = profiles[0]?.lng || 13.4;

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
    };

    setProfiles((prev) => [...prev, newProfile]);
  };

  // 6. Remove a profile
  const handleRemoveProfile = (id: string) => {
    if (profiles.length <= 1) return;
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  // 7. Update profile destination coordinates (e.g. Marker dragged on map FR-1.4)
  const handleUpdatePersonPosition = async (personId: string, lat: number, lng: number) => {
    handleUpdateProfile(personId, { lat, lng });

    // In parallel, reverse geocode to update address string
    const resolvedAddress = await reverseGeocode(lat, lng);
    handleUpdateProfile(personId, { address: resolvedAddress });
  };

  // 8. Map Click: Inspect Point anywhere on map (FR-4.4)
  const handleSelectInspectionPoint = async (lat: number, lng: number) => {
    const active = profiles.filter((p) => p.visible);

    // Calculate commute times to all person destinations
    const estimates = active.map((p) => {
      const { travelTimeMinutes, distanceKm } = estimateCommuteTime(
        { lat, lng },
        { lat: p.lat, lng: p.lng },
        p.mode,
        schedule,
        p.maxTransfers,
        p.maxWalkToStationMin
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
      };
    });

    const withinLimitCount = estimates.filter((e) => e.isWithinLimit).length;
    const allWithinLimit = withinLimitCount === active.length;

    // Set temporary point while geocoding
    setInspectionPoint({
      lat,
      lng,
      address: 'Lade Adresse...',
      estimates,
      allWithinLimit,
      activePersonsCount: active.length,
      withinLimitCount,
    });

    // Reverse geocode clicked location
    const addr = await reverseGeocode(lat, lng);
    setInspectionPoint((prev) => (prev ? { ...prev, address: addr } : null));
  };

  // 9. Apply Smart Fallback Suggestion (FR-3.3)
  const handleApplySuggestion = (suggestion: FallbackSuggestion) => {
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
  };

  const handleToggleOnlyResidential = () => {
    const nextVal = !onlyResidential;
    setOnlyResidential(nextVal);
    // Instant re-evaluation without recalculating entire isochrones if result already exists
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
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Sidebar with Inputs, Controls & Settings */}
      <Sidebar
        profiles={profiles}
        schedule={schedule}
        result={result}
        isCalculating={isCalculating}
        isPending={isPending}
        autoUpdate={autoUpdate}
        onToggleAutoUpdate={() => setAutoUpdate((prev) => !prev)}
        lastCalculatedAt={lastCalculatedAt}
        onUpdateProfile={handleUpdateProfile}
        onAddProfile={handleAddProfile}
        onRemoveProfile={handleRemoveProfile}
        onChangeSchedule={(upd) => setSchedule((prev) => ({ ...prev, ...upd }))}
        onApplySuggestion={handleApplySuggestion}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onRefreshIsochrones={() => runCalculation(profiles, schedule)}
        isMobileOpen={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(false)}
        basemap={basemap}
        onBasemapChange={handleBasemapChange}
        isApiKeyModalOpen={isApiKeyModalOpen}
        onToggleApiKeyModal={setIsApiKeyModalOpen}
        onlyResidential={onlyResidential}
        onToggleOnlyResidential={handleToggleOnlyResidential}
        showOnlyIntersection={showOnlyIntersection}
        onToggleOnlyIntersection={handleToggleOnlyIntersection}
        showIndividualIsochrones={showIndividualIsochrones}
        onToggleIndividualIsochrones={handleToggleIndividualIsochrones}
      />

      {/* Main Map Stage */}
      <main className="relative flex-1 h-full w-full overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="md:hidden absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="bg-white/95 text-slate-800 p-2.5 rounded-xl shadow-md border border-slate-200 backdrop-blur-sm flex items-center gap-2 text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Referenzorte ({profiles.length})</span>
          </button>
        </div>

        {/* Leaflet Map */}
        <MapComponent
          profiles={profiles}
          result={result}
          inspectionPoint={inspectionPoint}
          isCalculating={isCalculating}
          isPending={isPending}
          onSelectInspectionPoint={handleSelectInspectionPoint}
          onUpdatePersonPosition={handleUpdatePersonPosition}
          showIntersectionLayer={showIntersectionLayer}
          onToggleIntersectionLayer={() => setShowIntersectionLayer((prev) => !prev)}
          showIndividualIsochrones={showIndividualIsochrones}
          onToggleIndividualIsochrones={handleToggleIndividualIsochrones}
          showOnlyIntersection={showOnlyIntersection}
          onToggleOnlyIntersection={handleToggleOnlyIntersection}
          onlyResidential={onlyResidential}
          onToggleOnlyResidential={handleToggleOnlyResidential}
          heatmapSettings={schedule.options?.heatmap}
          onUpdateHeatmap={(upd) =>
            setSchedule((prev) => ({
              ...prev,
              options: {
                ...(prev.options || { liveTraffic: false, enableSmoothing: true, fidelity: 'AUTOMATIC' }),
                heatmap: {
                  ...(prev.options?.heatmap || { mode: 'none', radiusKm: 1.5, intensity: 0.65 }),
                  ...upd,
                },
              },
            }))
          }
          basemap={basemap}
          onBasemapChange={handleBasemapChange}
          onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
        />

        {/* Floating Inspection Panel (FR-4.4 Click feedback) */}
        {inspectionPoint && (
          <div className="absolute bottom-6 right-4 sm:right-6 z-20 max-w-sm w-full">
            <InspectionPanel
              inspection={inspectionPoint}
              onClose={() => setInspectionPoint(null)}
            />
          </div>
        )}
      </main>

      {/* Share Modal (FR-4.5) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profiles={profiles}
        schedule={schedule}
      />
    </div>
  );
}
