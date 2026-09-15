import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import {
  PersonProfile,
  CalculationResult,
  InspectionPoint,
  BasemapProvider,
  BasemapPlatform,
  MapVariant,
  HeatmapSettings,
  RentalOverlaySettings,
  LayerId,
  PoiIconSettings,
  DEFAULT_LAYER_ORDER,
  DEFAULT_POI_ICON_SETTINGS,
} from '../types';
import { Loader2, AlertCircle, Key } from 'lucide-react';
import {
  generatePriorityHeatmapZones,
  getPriorityTargets,
} from '../services/priorityHeatmapEngine';
import {
  getHighwayRamps,
  getHighwayAreas,
  subscribeHighwayData,
} from '../services/highwayService';
import {
  getRentalGeoJsonForRegion,
  getRentalChoroplethColor,
  getRentalRelativeTier,
} from '../services/rentalService';
import {
  getGoogleMapsApiKey,
  getBasemapPlatform,
  getMapVariant,
  setBasemapPlatform,
  setMapVariant,
  setSelectedBasemap,
  getRailwayOverlayEnabled,
  setRailwayOverlayEnabled,
} from '../services/isochroneEngine';
import {
  loadGoogleMapsJsApi,
  createBasemapLayer,
  createRailwayOverlayLayer,
} from '../services/googleMapsBasemap';
import {
  createPersonPinIcon,
  createInspectionPinIcon,
  createPriorityTargetIcon,
  createPersonPopupHtml,
} from './map/mapIcons';
import { MapLayerControls } from './map/MapLayerControls';
import { useTheme } from '../hooks/useTheme';

interface MapComponentProps {
  profiles: PersonProfile[];
  result: CalculationResult | null;
  inspectionPoint: InspectionPoint | null;
  isCalculating?: boolean;
  isPending?: boolean;
  onSelectInspectionPoint: (lat: number, lng: number) => void;
  onUpdatePersonPosition: (personId: string, lat: number, lng: number) => void;
  showIntersectionLayer: boolean;
  onToggleIntersectionLayer: () => void;
  showIndividualIsochrones?: boolean;
  onToggleIndividualIsochrones?: () => void;
  showOnlyIntersection?: boolean;
  onToggleOnlyIntersection?: () => void;
  onlyResidential?: boolean;
  onToggleOnlyResidential?: () => void;
  heatmapSettings?: HeatmapSettings;
  onUpdateHeatmap?: (settings: Partial<HeatmapSettings>) => void;
  rentalSettings?: RentalOverlaySettings;
  onUpdateRentalOverlay?: (settings: Partial<RentalOverlaySettings>) => void;
  basemap?: BasemapProvider;
  onBasemapChange?: (provider: BasemapProvider) => void;
  onOpenApiKeySettings?: () => void;
  layerOrder?: LayerId[];
  onReorderLayer?: (fromIndex: number, toIndex: number) => void;
  onResetLayerOrder?: () => void;
  hiddenLayers?: Set<LayerId>;
  onToggleLayerVisibility?: (layerId: LayerId) => void;
  poiIconSettings?: PoiIconSettings;
  onUpdatePoiIcons?: (settings: Partial<PoiIconSettings>) => void;
  onToggleProfileVisibility?: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  profiles,
  result,
  inspectionPoint,
  isCalculating = false,
  isPending = false,
  onSelectInspectionPoint,
  onUpdatePersonPosition,
  showIntersectionLayer,
  onToggleIntersectionLayer,
  showIndividualIsochrones = true,
  onToggleIndividualIsochrones,
  showOnlyIntersection,
  onToggleOnlyIntersection,
  onlyResidential = false,
  onToggleOnlyResidential,
  heatmapSettings,
  onUpdateHeatmap,
  rentalSettings,
  onUpdateRentalOverlay,
  basemap: externalBasemap,
  onBasemapChange,
  onOpenApiKeySettings,
  layerOrder = DEFAULT_LAYER_ORDER,
  onReorderLayer = () => {},
  onResetLayerOrder = () => {},
  hiddenLayers = new Set<LayerId>(),
  onToggleLayerVisibility = () => {},
  poiIconSettings = DEFAULT_POI_ICON_SETTINGS,
  onUpdatePoiIcons = () => {},
  onToggleProfileVisibility,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { isDark } = useTheme();

  // Basemap platform & variant management
  const [activePlatform, setActivePlatform] = useState<BasemapPlatform>(() => getBasemapPlatform());
  const [activeVariant, setActiveVariant] = useState<MapVariant>(() => getMapVariant());
  const [showRailwayOverlay, setShowRailwayOverlay] = useState<boolean>(() => getRailwayOverlayEnabled());
  const [isBasemapLoading, setIsBasemapLoading] = useState(false);
  const [basemapError, setBasemapError] = useState<string | null>(null);
  const [highwayVersion, setHighwayVersion] = useState(0);

  // Subscribe to live highway dataset updates
  useEffect(() => {
    return subscribeHighwayData(() => {
      setHighwayVersion((v) => v + 1);
    });
  }, []);

  // Sync if external composite basemap prop changes
  useEffect(() => {
    if (externalBasemap) {
      const isGoogle = externalBasemap.startsWith('google');
      const isCarto = externalBasemap.startsWith('carto');
      const isMemomaps = externalBasemap.startsWith('memomaps') || externalBasemap.startsWith('opnv');
      const platform: BasemapPlatform = isGoogle
        ? 'google'
        : isCarto
        ? 'carto'
        : isMemomaps
        ? 'memomaps'
        : 'osm';
      let variant: MapVariant = 'normal';
      if (platform === 'carto') {
        if (externalBasemap.includes('dark')) variant = 'carto_dark';
        else if (externalBasemap.includes('voyager')) variant = 'carto_voyager';
        else variant = 'carto_light';
      } else if (platform === 'memomaps') {
        variant = 'memomaps';
      } else {
        if (externalBasemap.includes('satellite')) variant = 'satellite';
        else if (externalBasemap.includes('transit')) variant = 'transit';
        else if (externalBasemap.includes('streets') || externalBasemap.includes('terrain')) variant = 'streets';
        else if (externalBasemap.includes('topo')) variant = 'topo';
        else variant = 'normal';
      }

      if (platform !== activePlatform || variant !== activeVariant) {
        setActivePlatform(platform);
        setActiveVariant(variant);
      }
    }
  }, [externalBasemap]);

  // Leaflet Layer groups & Panes
  const basemapLayerRef = useRef<L.Layer | null>(null);
  const railwayLayerRef = useRef<L.Layer | null>(null);
  const rentalLayerRef = useRef<L.LayerGroup | null>(null);
  const isochronesLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const intersectionLayerRef = useRef<L.LayerGroup | null>(null);
  const poiIconsLayerRef = useRef<L.LayerGroup | null>(null);
  const personsLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectionMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once with custom panes for deterministic layer ordering & hover hierarchy
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center: Between Gilching and Munich
    const map = L.map(mapContainerRef.current, {
      center: [48.14, 11.45],
      zoom: 11,
      zoomControl: false,
    });

    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Create custom Leaflet panes for deterministic z-ordering and hover hierarchy
    map.createPane('pane-railway');
    const rPane = map.getPane('pane-railway');
    if (rPane) {
      rPane.style.zIndex = '310';
      rPane.style.pointerEvents = 'none';
    }

    map.createPane('pane-rental');
    map.createPane('pane-isochrones');
    map.createPane('pane-heatmap');
    map.createPane('pane-intersection');
    map.createPane('pane-poi_icons');
    map.createPane('pane-persons');
    map.createPane('pane-inspection');

    // Create dedicated LayerGroups
    const rentalGroup = L.layerGroup().addTo(map);
    const isochronesGroup = L.layerGroup().addTo(map);
    const heatmapGroup = L.layerGroup().addTo(map);
    const intersectionGroup = L.layerGroup().addTo(map);
    const poiIconsGroup = L.layerGroup().addTo(map);
    const personsGroup = L.layerGroup().addTo(map);

    rentalLayerRef.current = rentalGroup;
    isochronesLayerRef.current = isochronesGroup;
    heatmapLayerRef.current = heatmapGroup;
    intersectionLayerRef.current = intersectionGroup;
    poiIconsLayerRef.current = poiIconsGroup;
    personsLayerRef.current = personsGroup;
    mapRef.current = map;

    // Handle map clicks for inspection
    map.on('click', (e: L.LeafletMouseEvent) => {
      onSelectInspectionPoint(e.latlng.lat, e.latlng.lng);
    });

    // Observe container size changes
    let animationFrameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize({ pan: false });
        }
      });
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      basemapLayerRef.current = null;
      if (railwayLayerRef.current) {
        try {
          map.removeLayer(railwayLayerRef.current);
        } catch (_) {}
        railwayLayerRef.current = null;
      }
      rentalLayerRef.current = null;
      isochronesLayerRef.current = null;
      heatmapLayerRef.current = null;
      intersectionLayerRef.current = null;
      poiIconsLayerRef.current = null;
      personsLayerRef.current = null;
    };
  }, []);

  // Dynamically adjust Leaflet Pane z-indexes according to layerOrder
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const baseZIndex = 350;
    const total = layerOrder.length;

    layerOrder.forEach((layerId, index) => {
      const paneName = `pane-${layerId}`;
      const pane = map.getPane(paneName);
      if (pane) {
        // index 0 has the highest z-index (top layer)
        const zIndex = baseZIndex + (total - index) * 30;
        pane.style.zIndex = `${zIndex}`;
      }
    });
  }, [layerOrder]);

  // OpenRailwayMap overlay toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (showRailwayOverlay) {
      if (!railwayLayerRef.current) {
        const railwayLayer = createRailwayOverlayLayer();
        (railwayLayer as any).options.pane = 'pane-railway';
        railwayLayer.addTo(map);
        railwayLayerRef.current = railwayLayer;
      }
    } else {
      if (railwayLayerRef.current) {
        try {
          map.removeLayer(railwayLayerRef.current);
        } catch (e) {
          console.warn('Error removing railway layer:', e);
        }
        railwayLayerRef.current = null;
      }
    }
  }, [showRailwayOverlay]);

  const handleToggleRailwayOverlay = () => {
    setShowRailwayOverlay((prev) => {
      const next = !prev;
      setRailwayOverlayEnabled(next);
      return next;
    });
  };

  // Switch basemap layer dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let isCancelled = false;

    async function applyBasemap() {
      setIsBasemapLoading(true);
      setBasemapError(null);

      try {
        let newLayer: L.Layer;

        if (activePlatform === 'google') {
          const apiKey = getGoogleMapsApiKey();
          if (!apiKey) {
            setBasemapError(
              'Kein Google Maps API-Schlüssel hinterlegt. Bitte hinterlege deinen Key in den Einstellungen.'
            );
            newLayer = createBasemapLayer('osm', 'normal');
          } else {
            await loadGoogleMapsJsApi(apiKey);
            if (isCancelled) return;
            newLayer = createBasemapLayer('google', activeVariant);
          }
        } else if (activePlatform === 'carto') {
          newLayer = createBasemapLayer('carto', activeVariant);
        } else if (activePlatform === 'memomaps' || activePlatform === 'opnv') {
          newLayer = createBasemapLayer('memomaps', activeVariant);
        } else {
          newLayer = createBasemapLayer('osm', activeVariant);
        }

        if (isCancelled) return;

        const currentMap = mapRef.current;
        if (!currentMap) return;

        // Remove old basemap layer safely
        if (basemapLayerRef.current) {
          try {
            currentMap.removeLayer(basemapLayerRef.current);
          } catch (e) {
            console.warn('Error removing old basemap layer:', e);
          }
          basemapLayerRef.current = null;
        }

        newLayer.addTo(currentMap);
        if ((newLayer as any).bringToBack) {
          (newLayer as any).bringToBack();
        }
        basemapLayerRef.current = newLayer;
      } catch (err: any) {
        console.error('Failed to initialize basemap:', err);
        setBasemapError(
          err?.message ||
            'Kartenlayer konnte nicht geladen werden. Bitte API-Key und Verbindung prüfen.'
        );
        const fallbackMap = mapRef.current;
        if (!basemapLayerRef.current && fallbackMap) {
          const fallback = createBasemapLayer('osm', 'normal').addTo(fallbackMap);
          if ((fallback as any).bringToBack) (fallback as any).bringToBack();
          basemapLayerRef.current = fallback;
        }
      } finally {
        if (!isCancelled) {
          setIsBasemapLoading(false);
        }
      }
    }

    applyBasemap();

    return () => {
      isCancelled = true;
    };
  }, [activePlatform, activeVariant]);

  const handleSelectPlatform = (platform: BasemapPlatform) => {
    setActivePlatform(platform);
    setBasemapPlatform(platform);

    let nextVariant = activeVariant;
    if (platform === 'carto' && !['carto_light', 'carto_dark', 'carto_voyager'].includes(activeVariant)) {
      nextVariant = 'carto_light';
      setActiveVariant('carto_light');
      setMapVariant('carto_light');
    } else if ((platform === 'memomaps' || platform === 'opnv') && activeVariant !== 'memomaps') {
      nextVariant = 'memomaps';
      setActiveVariant('memomaps');
      setMapVariant('memomaps');
    } else if (platform === 'osm' && ['carto_light', 'carto_dark', 'carto_voyager', 'memomaps'].includes(activeVariant)) {
      nextVariant = 'normal';
      setActiveVariant('normal');
      setMapVariant('normal');
    } else if (
      platform === 'google' &&
      ['carto_light', 'carto_dark', 'carto_voyager', 'topo', 'memomaps', 'railway'].includes(activeVariant)
    ) {
      nextVariant = 'normal';
      setActiveVariant('normal');
      setMapVariant('normal');
    }

    const composite = `${platform}_${nextVariant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
  };

  const handleSelectVariant = (variant: MapVariant) => {
    setActiveVariant(variant);
    setMapVariant(variant);
    const composite = `${activePlatform}_${variant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
  };

  // 1. Render Draggable Person Markers (Pane: pane-persons)
  useEffect(() => {
    const personsGroup = personsLayerRef.current;
    if (!personsGroup || !mapRef.current) return;

    personsGroup.clearLayers();

    if (hiddenLayers.has('persons')) return;

    profiles.forEach((profile) => {
      if (!profile.visible) return;

      const customIcon = createPersonPinIcon(profile.name, profile.color);

      const marker = L.marker([profile.lat, profile.lng], {
        icon: customIcon,
        draggable: true,
        pane: 'pane-persons',
        title: `${profile.name} - Ziehen um Standort zu verändern`,
      });

      marker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        onUpdatePersonPosition(profile.id, newLatLng.lat, newLatLng.lng);
      });

      marker.bindPopup(createPersonPopupHtml(profile));
      marker.addTo(personsGroup);
    });
  }, [profiles, onUpdatePersonPosition, hiddenLayers]);

  // 2. Render Inspection Point Pin (Pane: pane-inspection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!inspectionPoint || hiddenLayers.has('inspection')) {
      if (inspectionMarkerRef.current) {
        inspectionMarkerRef.current.remove();
        inspectionMarkerRef.current = null;
      }
      return;
    }

    const customPin = createInspectionPinIcon(inspectionPoint.allWithinLimit);

    if (inspectionMarkerRef.current) {
      inspectionMarkerRef.current.setLatLng([inspectionPoint.lat, inspectionPoint.lng]);
      inspectionMarkerRef.current.setIcon(customPin);
    } else {
      const marker = L.marker([inspectionPoint.lat, inspectionPoint.lng], {
        icon: customPin,
        pane: 'pane-inspection',
        zIndexOffset: 1000,
      }).addTo(map);
      inspectionMarkerRef.current = marker;
    }
  }, [inspectionPoint, hiddenLayers]);

  // 3. Render Individual Person Isochrones (Pane: pane-isochrones)
  useEffect(() => {
    const isochronesGroup = isochronesLayerRef.current;
    if (!isochronesGroup || !mapRef.current) return;

    isochronesGroup.clearLayers();

    if (!result || !showIndividualIsochrones || hiddenLayers.has('isochrones')) return;

    profiles.forEach((profile) => {
      if (!profile.visible) return;
      const poly = result.isochrones[profile.id];
      if (!poly) return;

      const layer = L.geoJSON(poly as any, {
        pane: 'pane-isochrones',
        style: {
          color: profile.color,
          weight: isDark ? 2.5 : 2,
          opacity: isDark ? 0.95 : 0.85,
          fillColor: profile.color,
          fillOpacity: isDark ? 0.22 : 0.15,
          dashArray: '4, 4',
        },
        onEachFeature: (_, fLayer) => {
          fLayer.on({
            click: (e: L.LeafletMouseEvent) => {
              onSelectInspectionPoint(e.latlng.lat, e.latlng.lng);
            },
          });
        },
      });

      layer.bindTooltip(
        `<strong>${profile.name}</strong><br/>Max. ${profile.travelTimeMinutes} Min (${
          profile.mode === 'transit'
            ? 'ÖPNV'
            : profile.mode === 'driving'
            ? 'Auto'
            : profile.mode === 'cycling'
            ? 'Rad'
            : 'Fuß'
        })`,
        { sticky: true, className: 'isochrone-tooltip' }
      );

      layer.addTo(isochronesGroup);
    });
  }, [result, profiles, showIndividualIsochrones, hiddenLayers, onSelectInspectionPoint, isDark]);

  // 4. Render Golden Intersection Layer (Pane: pane-intersection)
  useEffect(() => {
    const intersectionGroup = intersectionLayerRef.current;
    if (!intersectionGroup || !mapRef.current) return;

    intersectionGroup.clearLayers();

    if (!result?.intersection || !showIntersectionLayer || hiddenLayers.has('intersection')) return;

    const intersectionLayer = L.geoJSON(result.intersection as any, {
      pane: 'pane-intersection',
      style: {
        color: isDark
          ? (onlyResidential ? '#34d399' : '#10b981')
          : (onlyResidential ? '#065f46' : '#047857'),
        weight: isDark ? 4 : 3.5,
        opacity: 0.95,
        fillColor: isDark
          ? (onlyResidential ? '#10b981' : '#34d399')
          : (onlyResidential ? '#059669' : '#10b981'),
        fillOpacity: isDark
          ? (onlyResidential ? 0.42 : 0.35)
          : (onlyResidential ? 0.45 : 0.38),
        lineJoin: 'round',
      },
      onEachFeature: (_, fLayer) => {
        fLayer.on({
          click: (e: L.LeafletMouseEvent) => {
            onSelectInspectionPoint(e.latlng.lat, e.latlng.lng);
          },
        });
      },
    });

    intersectionLayer.bindTooltip(
      `<div style="font-weight: 600; color: ${isDark ? '#34d399' : '#065f46'}; font-size: 12px;">${
        onlyResidential ? 'Gemeinsamer Wohnbereich' : 'Gemeinsamer Schnittbereich'
      }</div><div style="font-size: 11px; color: ${isDark ? '#a7f3d0' : '#047857'};">Fläche: ca. ${
        result.intersectionAreaKm2
      } km²${
        onlyResidential && result.rawIntersectionAreaKm2
          ? ` (von ${result.rawIntersectionAreaKm2} km² Gesamt)`
          : ''
      }<br/>${
        onlyResidential
          ? 'Gefiltert auf Wohn- und Siedlungsflächen'
          : 'Erreichbar für alle Profile'
      }</div>`,
      { sticky: true }
    );

    intersectionLayer.addTo(intersectionGroup);
  }, [result, showIntersectionLayer, onlyResidential, hiddenLayers, onSelectInspectionPoint, isDark]);

  // 5. Render Priority Heatmap Layer (Pane: pane-heatmap)
  useEffect(() => {
    const heatmapGroup = heatmapLayerRef.current;
    if (!heatmapGroup || !mapRef.current) return;

    heatmapGroup.clearLayers();

    if (
      !result?.intersection ||
      !heatmapSettings ||
      heatmapSettings.mode === 'none' ||
      hiddenLayers.has('heatmap')
    ) {
      return;
    }

    try {
      const heatmapZones = generatePriorityHeatmapZones(
        result.intersection as any,
        heatmapSettings
      );

      heatmapZones.forEach((zone) => {
        const zoneLayer = L.geoJSON(zone.geometry as any, {
          pane: 'pane-heatmap',
          style: {
            stroke: true,
            color: zone.color,
            weight: isDark ? 2 : 1.5,
            opacity: Math.min(0.95, (heatmapSettings.intensity ?? 0.65) * 1.15),
            fillColor: zone.color,
            fillOpacity: Math.min(
              0.85,
              (heatmapSettings.intensity ?? 0.65) *
                (zone.tier === 'tier1' ? 0.75 : zone.tier === 'tier2' ? 0.55 : 0.38)
            ),
            lineJoin: 'round',
          },
          onEachFeature: (_, fLayer) => {
            fLayer.on({
              click: (e: L.LeafletMouseEvent) => {
                onSelectInspectionPoint(e.latlng.lat, e.latlng.lng);
              },
            });
          },
        });

        zoneLayer.bindTooltip(
          `<div style="font-weight: bold; font-size: 12px; color: ${zone.color};">${zone.label}</div><div style="font-size: 11px; color: ${isDark ? '#cbd5e1' : '#334155'};">${zone.description}</div>`,
          { sticky: true }
        );

        zoneLayer.addTo(heatmapGroup);
      });
    } catch (err) {
      console.warn('Error rendering heatmap zones:', err);
    }
  }, [result, heatmapSettings, hiddenLayers, onSelectInspectionPoint, isDark]);

  // 6. Render POI Station & Highway Badges & Vector Ramps (Pane: pane-poi_icons)
  useEffect(() => {
    const poiGroup = poiIconsLayerRef.current;
    if (!poiGroup || !mapRef.current) return;

    poiGroup.clearLayers();

    if (!poiIconSettings.visible || hiddenLayers.has('poi_icons')) return;

    // Collect active target types
    const activeTypes: Array<'ubahn' | 'sbahn' | 'highway'> = [];
    if (poiIconSettings.showUbahn) activeTypes.push('ubahn');
    if (poiIconSettings.showSbahn) activeTypes.push('sbahn');
    if (poiIconSettings.showHighway) activeTypes.push('highway');

    if (activeTypes.length === 0) return;

    // A. If Highway is active, render Area Enclosures (Umkreisung)
    if (activeTypes.includes('highway') && poiIconSettings.showHighwayAreas !== false) {
      try {
        const areas = getHighwayAreas();
        areas.forEach((area) => {
          let isAreaVisible = true;
          if (poiIconSettings.onlyWithinIntersection && result?.intersection) {
            try {
              const center = turf.center(area as any);
              const dist = turf.pointToPolygonDistance(
                center,
                result.intersection as any,
                { units: 'kilometers' }
              );
              if (dist > (heatmapSettings?.radiusKm || 1.5)) {
                isAreaVisible = false;
              }
            } catch {
              isAreaVisible = true;
            }
          }

          if (isAreaVisible) {
            const polyLayer = L.geoJSON(area as any, {
              pane: 'pane-poi_icons',
              style: {
                color: isDark ? '#fb923c' : '#ea580c',
                weight: 1.5,
                dashArray: '5, 5',
                fillColor: isDark ? '#ea580c' : '#fdba74',
                fillOpacity: isDark ? 0.22 : 0.16,
              },
            });
            polyLayer.bindTooltip(
              `<div style="font-size: 11px;">
                <strong>⭕ Autobahnanschluss-Areal</strong><br/>
                ${area.properties.name}${area.properties.ref ? ` (AS ${area.properties.ref})` : ''}
              </div>`,
              { direction: 'center', opacity: 0.95 }
            );
            polyLayer.addTo(poiGroup);
          }
        });
      } catch (err) {
        console.warn('[MapComponent] Error rendering highway areas:', err);
      }
    }

    // B. If Highway is active, render Ramp Vector Lines (straßenmäßig)
    if (activeTypes.includes('highway') && poiIconSettings.showHighwayRamps !== false) {
      try {
        const ramps = getHighwayRamps();
        ramps.forEach((ramp) => {
          const coords = ramp.geometry.coordinates;
          if (!coords || coords.length < 2) return;

          let isRampVisible = true;
          if (poiIconSettings.onlyWithinIntersection && result?.intersection) {
            try {
              const midCoord = coords[Math.floor(coords.length / 2)];
              const midPt = turf.point(midCoord);
              const dist = turf.pointToPolygonDistance(
                midPt,
                result.intersection as any,
                { units: 'kilometers' }
              );
              if (dist > (heatmapSettings?.radiusKm || 1.5)) {
                isRampVisible = false;
              }
            } catch {
              isRampVisible = true;
            }
          }

          if (isRampVisible) {
            const latLngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);

            // Casing (outer dark glow for readability over all map basemaps)
            const casing = L.polyline(latLngs, {
              pane: 'pane-poi_icons',
              color: isDark ? '#18181b' : '#7c2d12',
              weight: 4.5,
              opacity: isDark ? 0.9 : 0.7,
              lineCap: 'round',
              lineJoin: 'round',
            });
            casing.addTo(poiGroup);

            // Core road line (vibrant orange/amber)
            const line = L.polyline(latLngs, {
              pane: 'pane-poi_icons',
              color: isDark ? '#fb923c' : '#f97316',
              weight: 2.5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            });

            line.bindTooltip(
              `<div style="font-size: 11px;">
                <strong style="color:${isDark ? '#fb923c' : '#c2410c'};">${ramp.properties.name}</strong>
                ${ramp.properties.ref ? `<br/><span style="color:${isDark ? '#e2e8f0' : '#0f172a'}; font-weight:600;">${ramp.properties.ref}</span>` : ''}
                ${ramp.properties.maxspeed ? `<br/><span style="color:${isDark ? '#94a3b8' : '#64748b'};">Tempo: ${ramp.properties.maxspeed} km/h</span>` : ''}
              </div>`,
              { direction: 'top', sticky: true }
            );

            line.on('click', (e) => {
              L.DomEvent.stopPropagation(e);
              const mid = coords[Math.floor(coords.length / 2)];
              onSelectInspectionPoint(mid[1], mid[0]);
            });

            line.addTo(poiGroup);
          }
        });
      } catch (err) {
        console.warn('[MapComponent] Error rendering highway ramps:', err);
      }
    }

    // C. Render Target Node Pins (Station & Junction Badges)
    const targets = getPriorityTargets(activeTypes);
    if (targets.length > 0) {
      targets.forEach((target) => {
        let isVisible = true;

        if (poiIconSettings.onlyWithinIntersection && result?.intersection) {
          try {
            const pt = turf.point([target.lng, target.lat]);
            const distToIntersection = turf.pointToPolygonDistance(
              pt,
              result.intersection as any,
              { units: 'kilometers' }
            );
            if (distToIntersection > (heatmapSettings?.radiusKm || 1.5)) {
              isVisible = false;
            }
          } catch {
            isVisible = true;
          }
        }

        if (isVisible) {
          const markerIcon = createPriorityTargetIcon(target.type);
          const marker = L.marker([target.lat, target.lng], {
            icon: markerIcon,
            pane: 'pane-poi_icons',
          });
          marker.bindTooltip(
            `<div style="font-size: 11px;"><strong>${target.name}</strong><br/>${
              target.linesOrRoad ? `<span style="color:${isDark ? '#94a3b8' : '#64748b'}">${target.linesOrRoad}</span>` : ''
            }</div>`,
            { direction: 'top', offset: [0, -8] }
          );
          marker.on('click', () => {
            onSelectInspectionPoint(target.lat, target.lng);
          });
          marker.addTo(poiGroup);
        }
      });
    }
  }, [
    poiIconSettings,
    result,
    heatmapSettings?.radiusKm,
    hiddenLayers,
    onSelectInspectionPoint,
    highwayVersion,
    isDark,
  ]);

  // 7. Render Rental Choropleth Overlay (Pane: pane-rental)
  useEffect(() => {
    const rentalGroup = rentalLayerRef.current;
    if (!rentalGroup || !mapRef.current) return;

    rentalGroup.clearLayers();

    if (!rentalSettings?.enabled || hiddenLayers.has('rental')) return;

    const geojson = getRentalGeoJsonForRegion(rentalSettings.selectedRegionId || 'munich-mvv');
    if (!geojson) return;

    const opacity = rentalSettings.opacity ?? 0.35;

    const layer = L.geoJSON(geojson as any, {
      pane: 'pane-rental',
      style: (feature) => {
        const price = feature?.properties?.avgRentColdSqm || 18.0;
        const color = getRentalChoroplethColor(price);
        return {
          color: color,
          weight: isDark ? 2 : 1.5,
          opacity: isDark ? 0.95 : 0.85,
          fillColor: color,
          fillOpacity: opacity,
          lineJoin: 'round',
        };
      },
      onEachFeature: (feature, fLayer) => {
        const p = feature.properties;
        const color = getRentalChoroplethColor(p.avgRentColdSqm);
        const relativeTier = getRentalRelativeTier(p.avgRentColdSqm);

        fLayer.bindTooltip(
          `<div style="font-family: inherit; font-size: 12px; line-height: 1.35; padding: 2px;">
            <div style="font-weight: 700; color: ${isDark ? '#f1f5f9' : '#0f172a'}; font-size: 13px;">
              ${p.name} <span style="font-weight: 400; color: ${isDark ? '#94a3b8' : '#64748b'};">(Bezirk ${p.districtNumber})</span>
            </div>
            <div style="margin-top: 4px; font-weight: 800; font-size: 14px; color: ${color};">
              Ø ${p.avgRentColdSqm.toFixed(2)} €/m² <span style="font-size: 11px; font-weight: 500; color: ${isDark ? '#94a3b8' : '#475569'};">Kaltmiete</span>
            </div>
            <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-top: 2px;">
              Amtliche Spanne: ${p.minRentColdSqm.toFixed(2)} – ${p.maxRentColdSqm.toFixed(2)} €/m²
            </div>
            <div style="font-size: 10px; color: ${relativeTier.color}; font-weight: 600; margin-top: 3px;">
              ${relativeTier.label} • ${p.qualityLabel}
            </div>
            <div style="font-size: 9px; color: ${isDark ? '#64748b' : '#94a3b8'}; margin-top: 4px; border-top: 1px solid ${isDark ? '#334155' : '#f1f5f9'}; padding-top: 2px;">
              ${p.source} (Mietspiegel Bestand/Neuabschlüsse)
            </div>
          </div>`,
          { sticky: true, className: 'rental-choropleth-tooltip' }
        );

        fLayer.on({
          mouseover: (e: any) => {
            const target = e.target;
            target.setStyle({
              weight: isDark ? 3 : 2.5,
              opacity: 1,
              fillOpacity: Math.min(0.85, opacity + 0.15),
            });
            // NO target.bringToFront() - Keeps Leaflet Pane hierarchy completely intact!
          },
          mouseout: (e: any) => {
            const target = e.target;
            target.setStyle({
              weight: isDark ? 2 : 1.5,
              opacity: isDark ? 0.95 : 0.85,
              fillOpacity: opacity,
            });
          },
          click: (e: L.LeafletMouseEvent) => {
            onSelectInspectionPoint(e.latlng.lat, e.latlng.lng);
          },
        });
      },
    });

    layer.addTo(rentalGroup);
  }, [
    rentalSettings?.enabled,
    rentalSettings?.opacity,
    rentalSettings?.selectedRegionId,
    hiddenLayers,
    onSelectInspectionPoint,
    isDark,
  ]);

  // Center bounds on visible markers / isochrones
  const handleFitBounds = () => {
    const map = mapRef.current;
    if (!map) return;

    const visibleProfiles = profiles.filter((p) => p.visible);
    if (visibleProfiles.length === 0) return;

    const bounds = L.latLngBounds(visibleProfiles.map((p) => [p.lat, p.lng]));

    if (result?.intersection) {
      try {
        const tempLayer = L.geoJSON(result.intersection as any);
        bounds.extend(tempLayer.getBounds());
      } catch (e) {
        console.warn('Could not extend bounds by intersection:', e);
      }
    }

    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  };

  const hasIntersection = !!result?.intersection && (result?.intersectionAreaKm2 || 0) > 0;

  return (
    <div className="relative w-full h-full select-none">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100 dark:bg-[#131314]" />

      {/* Calculating overlay spinner */}
      {(isCalculating || isPending) && (
        <div className="absolute top-4 left-4 z-20 bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/90 dark:border-[#3c4043] flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-[#e3e3e3] animate-in fade-in duration-200">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span>{isCalculating ? 'Berechne Isochronen...' : 'Aktualisierung ausstehend...'}</span>
        </div>
      )}

      {/* Floating Basemap Warning / Error Banner if Key is Missing */}
      {basemapError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-amber-950/90 text-white px-4 py-2 rounded-xl shadow-xl border border-amber-600/50 backdrop-blur-md text-xs max-w-md w-full animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 leading-snug">{basemapError}</div>
          {onOpenApiKeySettings && (
            <button
              type="button"
              onClick={onOpenApiKeySettings}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Key className="w-3 h-3" />
              <span>Key eingeben</span>
            </button>
          )}
        </div>
      )}

      {/* Modular Map Controls Top-Right & Layer Manager Drawer */}
      <MapLayerControls
        activePlatform={activePlatform}
        activeVariant={activeVariant}
        onSelectPlatform={handleSelectPlatform}
        onSelectVariant={handleSelectVariant}
        isBasemapLoading={isBasemapLoading}
        profiles={profiles}
        onToggleProfileVisibility={onToggleProfileVisibility}
        hasIntersection={hasIntersection}
        showIntersectionLayer={showIntersectionLayer}
        onToggleIntersectionLayer={onToggleIntersectionLayer}
        showIndividualIsochrones={showIndividualIsochrones}
        onToggleIndividualIsochrones={onToggleIndividualIsochrones}
        showOnlyIntersection={showOnlyIntersection}
        onToggleOnlyIntersection={onToggleOnlyIntersection}
        onlyResidential={onlyResidential}
        onToggleOnlyResidential={onToggleOnlyResidential}
        heatmapSettings={heatmapSettings}
        onUpdateHeatmap={onUpdateHeatmap}
        rentalSettings={rentalSettings}
        onUpdateRentalOverlay={onUpdateRentalOverlay}
        onFitBounds={handleFitBounds}
        onOpenApiKeySettings={onOpenApiKeySettings}
        layerOrder={layerOrder}
        onReorderLayer={onReorderLayer}
        onResetLayerOrder={onResetLayerOrder}
        hiddenLayers={hiddenLayers}
        onToggleLayerVisibility={onToggleLayerVisibility}
        poiIconSettings={poiIconSettings}
        onUpdatePoiIcons={onUpdatePoiIcons}
        intersectionAreaKm2={result?.intersectionAreaKm2}
        showRailwayOverlay={showRailwayOverlay}
        onToggleRailwayOverlay={handleToggleRailwayOverlay}
      />
    </div>
  );
};
