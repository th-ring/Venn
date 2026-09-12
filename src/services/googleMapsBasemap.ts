import GoogleMutant from 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import L from 'leaflet';
import { BasemapPlatform, MapVariant } from '../types';

let currentLoadedKey: string | null = null;
let loaderPromise: Promise<void> | null = null;

// Subclass to inject mandatory Google Maps Platform AI Studio attribution ID
// @ts-ignore GoogleMutant untyped constructor
class AttributedGoogleMutant extends (GoogleMutant as any) {
  constructor(options?: any) {
    super(options);
  }

  _initMutant() {
    if (this._mutant) return;
    if (typeof window !== 'undefined' && window.google?.maps?.Map) {
      const origMap = window.google.maps.Map;
      try {
        window.google.maps.Map = function (container: any, opts: any) {
          const mapOpts = {
            ...opts,
            internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
          };
          return new origMap(container, mapOpts);
        } as any;
        super._initMutant();
      } finally {
        window.google.maps.Map = origMap;
      }
    } else {
      super._initMutant();
    }
  }
}

/**
 * Loads the Google Maps JavaScript API with the provided API key
 */
export async function loadGoogleMapsJsApi(apiKey: string): Promise<void> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('Kein Google Maps API-Key hinterlegt.');
  }

  // Already loaded with this key
  if (typeof window !== 'undefined' && window.google?.maps?.Map && currentLoadedKey === trimmedKey) {
    return;
  }

  if (currentLoadedKey !== trimmedKey || !loaderPromise) {
    currentLoadedKey = trimmedKey;
    setOptions({
      key: trimmedKey,
      v: 'weekly',
    });
    loaderPromise = importLibrary('maps').then(() => undefined);
  }

  return loaderPromise;
}

/**
 * Creates Google Maps basemap layer based on selected variant:
 * - normal: Standard Roadmap
 * - satellite: Hybrid (satellite imagery with labels and roads)
 * - streets: Roadmap optimized for streets / high contrast
 * - transit: Roadmap with Google TransitLayer overlaid
 */
export function createGoogleBasemapLayer(variant: MapVariant): L.Layer {
  let mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain' = 'roadmap';
  let isTransit = false;

  if (variant === 'satellite') {
    mapType = 'hybrid';
  } else if (variant === 'transit') {
    mapType = 'roadmap';
    isTransit = true;
  } else if (variant === 'streets') {
    mapType = 'roadmap';
  } else {
    mapType = 'roadmap';
  }

  const mutant = new AttributedGoogleMutant({
    type: mapType,
    maxZoom: 21,
    styles: [],
  });

  if (isTransit) {
    // Add TransitLayer via GoogleMutant built-in method
    mutant.addGoogleLayer('TransitLayer');
  }

  return mutant as unknown as L.Layer;
}

/**
 * Creates OpenStreetMap basemap layer based on selected variant:
 * - normal: Standard OpenStreetMap (carto style)
 * - satellite: ESRI World Imagery (high-resolution satellite with OSM labels if applicable)
 * - streets: ESRI World Street Map (focused street & road network)
 * - transit: CyclOSM / OpenRailwayMap hybrid focusing on public transport (trains, trams, subways, busways)
 */
export function createOsmBasemapLayer(variant: MapVariant): L.Layer {
  if (variant === 'satellite') {
    // ESRI World Imagery (free high-res satellite tiles)
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    );
  }

  if (variant === 'streets') {
    // ESRI World Street Map
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        maxZoom: 19,
      }
    );
  }

  if (variant === 'transit') {
    // CyclOSM - contains public transit routes, train/metro lines, tram stations & bike/bus highways
    // Combined with standard transit attribution
    return L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.cyclosm.org">CyclOSM</a> (ÖPNV & Rad)',
      maxZoom: 20,
    });
  }

  // Default / Normal: Standard OpenStreetMap
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  });
}

/**
 * Unified factory for creating any basemap layer based on platform & variant
 */
export function createBasemapLayer(platform: BasemapPlatform, variant: MapVariant): L.Layer {
  if (platform === 'google') {
    return createGoogleBasemapLayer(variant);
  }
  return createOsmBasemapLayer(variant);
}
