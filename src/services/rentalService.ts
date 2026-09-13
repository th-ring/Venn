import * as turf from '@turf/turf';
import {
  RentalDistrictProperties,
  RentalDistrictFeatureCollection,
  RentalOverlaySettings,
  RentalRegionCatalogEntry,
} from '../types';
import { MUNICH_RENTAL_DISTRICTS_GEOJSON } from '../data/rental/munichRentalDistricts';
import { RENTAL_REGIONS_CATALOG } from '../data/rental/rentalCatalog';

const RENTAL_SETTINGS_KEY = 'commute_rental_overlay_settings_v1';

export const DEFAULT_RENTAL_OVERLAY_SETTINGS: RentalOverlaySettings = {
  enabled: false,
  opacity: 0.35,
  selectedRegionId: 'munich-mvv',
};

export interface RentalLegendItem {
  min?: number;
  max?: number;
  label: string;
  subLabel: string;
  color: string;
}

export const RENTAL_LEGEND_TIERS: RentalLegendItem[] = [
  {
    max: 17.0,
    label: '< 17,00 €',
    subLabel: 'Günstige Lage (z. B. Feldmoching, Aubing)',
    color: '#10B981', // Emerald
  },
  {
    min: 17.0,
    max: 18.99,
    label: '17,00 – 18,99 €',
    subLabel: 'Moderate Lage (z. B. Laim, Moosach, Trudering)',
    color: '#84CC16', // Lime
  },
  {
    min: 19.0,
    max: 20.99,
    label: '19,00 – 20,99 €',
    subLabel: 'Gehobene Lage (z. B. Sendling, Westend, Solln)',
    color: '#F59E0B', // Amber
  },
  {
    min: 21.0,
    max: 22.99,
    label: '21,00 – 22,99 €',
    subLabel: 'Teure Lage (z. B. Schwabing-West, Au-Haidhausen)',
    color: '#F43F5E', // Rose
  },
  {
    min: 23.0,
    label: '≥ 23,00 €',
    subLabel: 'Spitzenlage (z. B. Altstadt-Lehel, Maxvorstadt)',
    color: '#8B5CF6', // Purple
  },
];

/**
 * Returns the hex color for a given average net cold rent per sqm.
 */
export function getRentalChoroplethColor(avgRentColdSqm: number): string {
  if (avgRentColdSqm < 17.0) return '#10B981';
  if (avgRentColdSqm < 19.0) return '#84CC16';
  if (avgRentColdSqm < 21.0) return '#F59E0B';
  if (avgRentColdSqm < 23.0) return '#F43F5E';
  return '#8B5CF6';
}

/**
 * Retrieves the GeoJSON FeatureCollection for the selected region.
 */
export function getRentalGeoJsonForRegion(
  regionId: string = 'munich-mvv'
): RentalDistrictFeatureCollection | null {
  if (regionId === 'munich-mvv') {
    return MUNICH_RENTAL_DISTRICTS_GEOJSON;
  }
  return null;
}

/**
 * Determines which rental district contains a given geographic coordinate [lat, lng].
 */
export function getRentalDistrictAtPoint(
  lat: number,
  lng: number,
  regionId: string = 'munich-mvv'
): RentalDistrictProperties | null {
  const geojson = getRentalGeoJsonForRegion(regionId);
  if (!geojson) return null;

  const pt = turf.point([lng, lat]);

  for (const feature of geojson.features) {
    try {
      if (turf.booleanPointInPolygon(pt, feature as any)) {
        return feature.properties;
      }
    } catch {
      // Ignore geometry errors
    }
  }

  return null;
}

/**
 * Gets all catalog entries.
 */
export function getRentalRegionsCatalog(): RentalRegionCatalogEntry[] {
  return RENTAL_REGIONS_CATALOG;
}

/**
 * Reads rental overlay settings from localStorage.
 */
export function getSavedRentalOverlaySettings(): RentalOverlaySettings {
  try {
    const raw = localStorage.getItem(RENTAL_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_RENTAL_OVERLAY_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return DEFAULT_RENTAL_OVERLAY_SETTINGS;
}

/**
 * Saves rental overlay settings to localStorage.
 */
export function saveRentalOverlaySettings(settings: Partial<RentalOverlaySettings>): void {
  try {
    const current = getSavedRentalOverlaySettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(RENTAL_SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage write errors
  }
}
