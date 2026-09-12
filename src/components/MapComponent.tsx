import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  PersonProfile,
  CalculationResult,
  InspectionPoint,
  BasemapProvider,
  BasemapPlatform,
  MapVariant,
} from '../types';
import {
  Crosshair,
  Eye,
  EyeOff,
  Loader2,
  Layers,
  Map as MapIcon,
  Satellite,
  Train,
  Navigation,
  AlertCircle,
  Key,
  Check,
  ChevronDown,
  Globe,
} from 'lucide-react';
import {
  getGoogleMapsApiKey,
  getBasemapPlatform,
  getMapVariant,
  setBasemapPlatform,
  setMapVariant,
  getSelectedBasemap,
  setSelectedBasemap,
} from '../services/isochroneEngine';
import {
  loadGoogleMapsJsApi,
  createBasemapLayer,
} from '../services/googleMapsBasemap';

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
  onMapLoaded?: () => void;
  basemap?: BasemapProvider;
  onBasemapChange?: (provider: BasemapProvider) => void;
  onOpenApiKeySettings?: () => void;
}

export const MAP_VARIANTS: Array<{
  id: MapVariant;
  label: string;
  subLabel: string;
  icon: typeof MapIcon;
}> = [
  {
    id: 'normal',
    label: 'Normal',
    subLabel: 'Standard-Karte mit Ortschaften & Flächen',
    icon: MapIcon,
  },
  {
    id: 'satellite',
    label: 'Satellit',
    subLabel: 'Echte Luftbilder & Satellitenaufnahmen',
    icon: Satellite,
  },
  {
    id: 'streets',
    label: 'Straße',
    subLabel: 'Fokus auf Straßennetz, Autobahnen & Trassen',
    icon: Navigation,
  },
  {
    id: 'transit',
    label: 'ÖPNV',
    subLabel: 'Bahnlinien, Tram, Bus & Haltestellen',
    icon: Train,
  },
];

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
  basemap: externalBasemap,
  onBasemapChange,
  onOpenApiKeySettings,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Basemap platform & variant management
  const [activePlatform, setActivePlatform] = useState<BasemapPlatform>(() => getBasemapPlatform());
  const [activeVariant, setActiveVariant] = useState<MapVariant>(() => getMapVariant());

  const [isBasemapLoading, setIsBasemapLoading] = useState(false);
  const [basemapError, setBasemapError] = useState<string | null>(null);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const layerMenuRef = useRef<HTMLDivElement>(null);

  // Sync if external composite basemap prop changes (e.g. from modal)
  useEffect(() => {
    if (externalBasemap) {
      const isGoogle = externalBasemap.startsWith('google');
      const platform: BasemapPlatform = isGoogle ? 'google' : 'osm';
      let variant: MapVariant = 'normal';
      if (externalBasemap.includes('satellite')) variant = 'satellite';
      else if (externalBasemap.includes('transit')) variant = 'transit';
      else if (externalBasemap.includes('streets') || externalBasemap.includes('terrain')) variant = 'streets';
      else variant = 'normal';

      if (platform !== activePlatform || variant !== activeVariant) {
        setActivePlatform(platform);
        setActiveVariant(variant);
      }
    }
  }, [externalBasemap]);

  // Layer groups
  const basemapLayerRef = useRef<L.Layer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const isochronesLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectionMarkerRef = useRef<L.Marker | null>(null);

  // Close layer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize map once
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

    const isochronesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    isochronesLayerRef.current = isochronesGroup;
    markersLayerRef.current = markersGroup;
    mapRef.current = map;

    // Handle map clicks for inspection
    map.on('click', (e: L.LeafletMouseEvent) => {
      onSelectInspectionPoint(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      basemapLayerRef.current = null;
    };
  }, []);

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
            // Fallback to OSM for selected variant
            newLayer = createBasemapLayer('osm', activeVariant);
          } else {
            // Load Google Maps JS API script if not yet loaded
            await loadGoogleMapsJsApi(apiKey);
            if (isCancelled) return;
            newLayer = createBasemapLayer('google', activeVariant);
          }
        } else {
          // OpenStreetMap platform
          newLayer = createBasemapLayer('osm', activeVariant);
        }

        if (isCancelled) return;

        // Remove old basemap layer safely
        if (basemapLayerRef.current) {
          try {
            map.removeLayer(basemapLayerRef.current);
          } catch (e) {
            console.warn('Error removing old basemap layer:', e);
          }
          basemapLayerRef.current = null;
        }

        newLayer.addTo(map);
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
        // Fallback to standard OSM normal
        if (!basemapLayerRef.current) {
          const fallback = createBasemapLayer('osm', 'normal').addTo(map);
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

  // Handle switching platform (OSM <-> Google Maps)
  const handleSelectPlatform = (platform: BasemapPlatform) => {
    setActivePlatform(platform);
    setBasemapPlatform(platform);
    const composite = `${platform}_${activeVariant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
  };

  // Handle switching map variant (Normal, Satellit, Straße, ÖPNV)
  const handleSelectVariant = (variant: MapVariant) => {
    setActiveVariant(variant);
    setMapVariant(variant);
    const composite = `${activePlatform}_${variant}` as BasemapProvider;
    setSelectedBasemap(composite);
    if (onBasemapChange) {
      onBasemapChange(composite);
    }
  };

  // Update draggable person markers
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    if (!markersGroup || !mapRef.current) return;

    markersGroup.clearLayers();

    profiles.forEach((profile) => {
      if (!profile.visible) return;

      const markerHtml = `
        <div style="
          background-color: ${profile.color};
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
          cursor: grab;
          user-select: none;
          transition: transform 0.15s ease;
        " title="${profile.name} (Verschieben um Standort zu ändern)">
          ${profile.name.charAt(0).toUpperCase()}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-person-pin',
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([profile.lat, profile.lng], {
        icon: customIcon,
        draggable: true,
        title: `${profile.name} - Ziehen um Standort zu verändern`,
      });

      marker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        onUpdatePersonPosition(profile.id, newLatLng.lat, newLatLng.lng);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 170px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; color: ${profile.color};">
            ${profile.name}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            ${profile.address || 'Gewählter Standort'}
          </div>
          <div style="display: flex; gap: 4px; align-items: center; font-size: 11px; font-weight: 600; color: #1e293b;">
            <span>⏱️ Max. ${profile.travelTimeMinutes} Min</span>
            <span>•</span>
            <span>${
              profile.mode === 'transit'
                ? 'ÖPNV'
                : profile.mode === 'driving'
                ? 'Auto'
                : profile.mode === 'cycling'
                ? 'Fahrrad'
                : 'Zu Fuß'
            }</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
            Pin ziehen, um Wohnort zu ändern
          </div>
        </div>
      `);

      marker.addTo(markersGroup);
    });
  }, [profiles, onUpdatePersonPosition]);

  // Update inspection point pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!inspectionPoint) {
      if (inspectionMarkerRef.current) {
        inspectionMarkerRef.current.remove();
        inspectionMarkerRef.current = null;
      }
      return;
    }

    const pinBg = inspectionPoint.allWithinLimit ? '#059669' : '#dc2626';
    const pinIconHtml = `
      <div style="
        background-color: ${pinBg};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2.5px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">
          ${inspectionPoint.allWithinLimit ? '✓' : '!'}
        </div>
      </div>
    `;

    const customPin = L.divIcon({
      className: 'custom-inspection-pin',
      html: pinIconHtml,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    if (inspectionMarkerRef.current) {
      inspectionMarkerRef.current.setLatLng([inspectionPoint.lat, inspectionPoint.lng]);
      inspectionMarkerRef.current.setIcon(customPin);
    } else {
      const marker = L.marker([inspectionPoint.lat, inspectionPoint.lng], {
        icon: customPin,
        zIndexOffset: 1000,
      }).addTo(map);
      inspectionMarkerRef.current = marker;
    }
  }, [inspectionPoint]);

  // Render Isochrones and Intersection on the map
  useEffect(() => {
    const isochronesGroup = isochronesLayerRef.current;
    if (!isochronesGroup || !mapRef.current) return;

    isochronesGroup.clearLayers();

    if (!result) return;

    // 1. Draw individual person isochrones
    profiles.forEach((profile) => {
      if (!profile.visible) return;
      const poly = result.isochrones[profile.id];
      if (!poly) return;

      const layer = L.geoJSON(poly as any, {
        style: {
          color: profile.color,
          weight: 2,
          opacity: 0.85,
          fillColor: profile.color,
          fillOpacity: 0.15,
          dashArray: '4, 4',
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

    // 2. Draw Golden Intersection zone (FR-2.1)
    if (showIntersectionLayer && result.intersection) {
      const intersectionLayer = L.geoJSON(result.intersection as any, {
        style: {
          color: '#047857', // Emerald green
          weight: 3.5,
          opacity: 0.95,
          fillColor: '#10b981',
          fillOpacity: 0.38,
          lineJoin: 'round',
        },
      });

      intersectionLayer.bindTooltip(
        `<div style="font-weight: bold; color: #065f46; font-size: 13px;">🎯 Gemeinsamer Treffbereich</div><div style="font-size: 11px; color: #047857;">Fläche: ca. ${result.intersectionAreaKm2} km²<br/>Für alle erreichbar!</div>`,
        { sticky: true }
      );

      intersectionLayer.addTo(isochronesGroup);
    }
  }, [result, profiles, showIntersectionLayer]);

  // Center bounds on visible markers / isochrones
  const handleFitBounds = () => {
    const map = mapRef.current;
    if (!map) return;

    const visibleProfiles = profiles.filter((p) => p.visible);
    if (visibleProfiles.length === 0) return;

    const bounds = L.latLngBounds(visibleProfiles.map((p) => [p.lat, p.lng]));

    // Include intersection in bounds if exists
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

  const currentVariantInfo =
    MAP_VARIANTS.find((v) => v.id === activeVariant) || MAP_VARIANTS[0];

  return (
    <div className="relative w-full h-full select-none">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100" />

      {/* Calculating overlay spinner */}
      {(isCalculating || isPending) && (
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/90 flex items-center gap-2.5 text-xs font-semibold text-slate-800 animate-in fade-in duration-200">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0 transition-colors flex items-center gap-1 shadow-xs"
            >
              <Key className="w-3 h-3" />
              <span>Key eingeben</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Map Controls & Multi-Variant Basemap Switcher */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {/* Basemap Switcher Dropdown */}
        <div className="relative" ref={layerMenuRef}>
          <button
            id="btn-basemap-switcher"
            type="button"
            onClick={() => setShowLayerMenu((prev) => !prev)}
            title="Kartendienst & Kartentyp wählen"
            className="bg-white/95 hover:bg-white text-slate-800 p-2 sm:px-3 sm:py-2 rounded-xl shadow-md border border-slate-200/90 transition-all flex items-center gap-2 backdrop-blur-xs text-xs font-semibold hover:shadow-lg cursor-pointer"
          >
            {isBasemapLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Layers className="w-4 h-4 text-blue-600" />
            )}
            <span className="hidden sm:inline">
              {activePlatform === 'google' ? 'Google Maps' : 'OpenStreetMap'} • {currentVariantInfo.label}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 z-30 animate-in fade-in zoom-in-95 duration-150">
              {/* STUFE 1: KARTENDIENST WÄHLEN */}
              <div className="mb-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>1. Kartendienst (Dienst)</span>
                  {getGoogleMapsApiKey() && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      Google Key aktiv
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {/* Option OSM */}
                  <button
                    type="button"
                    onClick={() => handleSelectPlatform('osm')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activePlatform === 'osm'
                        ? 'bg-white text-blue-900 shadow-xs border border-blue-200 ring-1 ring-blue-400/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-700" />
                    <span>OpenStreetMap</span>
                  </button>

                  {/* Option Google Maps */}
                  <button
                    type="button"
                    onClick={() => handleSelectPlatform('google')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activePlatform === 'google'
                        ? 'bg-white text-blue-900 shadow-xs border border-blue-200 ring-1 ring-blue-400/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Maps</span>
                  </button>
                </div>

                {activePlatform === 'google' && !getGoogleMapsApiKey() && (
                  <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg flex items-center justify-between">
                    <span>Google Maps Key erforderlich</span>
                    {onOpenApiKeySettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowLayerMenu(false);
                          onOpenApiKeySettings();
                        }}
                        className="text-amber-900 underline font-semibold text-[10px]"
                      >
                        Eingeben
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* STUFE 2: KARTENTYP WÄHLEN (Normal, Satellit, Straße, ÖPNV) */}
              <div className="pt-2.5 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  2. Kartentyp ({activePlatform === 'google' ? 'Google' : 'OSM'})
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {MAP_VARIANTS.map((variant) => {
                    const Icon = variant.icon;
                    const isSelected = activeVariant === variant.id;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelectVariant(variant.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{variant.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5 line-clamp-1">
                            {variant.subLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {onOpenApiKeySettings && (
                <div className="mt-3 pt-2 border-t border-slate-100 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLayerMenu(false);
                      onOpenApiKeySettings();
                    }}
                    className="w-full py-1.5 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/70 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>API-Keys & Einstellungen verwalten</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2">
          <button
            id="btn-fit-bounds"
            type="button"
            onClick={handleFitBounds}
            title="Gesamten Suchbereich zentrieren"
            className="bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 p-2.5 rounded-xl shadow-md border border-slate-200/80 transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer"
          >
            <Crosshair className="w-5 h-5 text-slate-700" />
          </button>

          <button
            id="btn-toggle-intersection-layer"
            type="button"
            onClick={onToggleIntersectionLayer}
            title={showIntersectionLayer ? 'Schnittmenge ausblenden' : 'Schnittmenge einblenden'}
            className={`p-2.5 rounded-xl shadow-md border transition-all flex items-center justify-center backdrop-blur-xs hover:shadow-lg cursor-pointer ${
              showIntersectionLayer
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                : 'bg-white/95 hover:bg-white text-slate-500 border-slate-200/80'
            }`}
          >
            {showIntersectionLayer ? (
              <Eye className="w-5 h-5 text-white" />
            ) : (
              <EyeOff className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
