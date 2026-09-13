import * as turf from '@turf/turf';
import { PriorityHeatmapMode, PriorityHeatmapItem, HeatmapSettings } from '../types';
import { getTransitRegion } from './mvvMatrixService';
import { MUNICH_HIGHWAY_JUNCTIONS, HighwayJunction } from '../data/highwayJunctions';

export interface PriorityTarget {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'ubahn' | 'sbahn' | 'highway';
  linesOrRoad?: string;
}

/**
 * Returns the relevant target stations or motorway junctions for the selected priority modes.
 */
export function getPriorityTargets(
  modeOrItems: PriorityHeatmapMode | PriorityHeatmapItem | (PriorityHeatmapItem | PriorityHeatmapMode)[]
): PriorityTarget[] {
  let items: PriorityHeatmapItem[] = [];
  if (Array.isArray(modeOrItems)) {
    items = modeOrItems.filter((i): i is PriorityHeatmapItem => i !== 'none');
  } else if (modeOrItems && modeOrItems !== 'none') {
    items = [modeOrItems as PriorityHeatmapItem];
  }

  if (items.length === 0) return [];

  const targets: PriorityTarget[] = [];
  const activeRegion = getTransitRegion();

  if (items.includes('ubahn')) {
    targets.push(
      ...activeRegion.stations
        .filter((s) => s.types.includes('ubahn'))
        .map((s) => ({
          id: s.id,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          type: 'ubahn' as const,
          linesOrRoad: s.lines.filter((l) => l.startsWith('U')).join(', '),
        }))
    );
  }

  if (items.includes('sbahn')) {
    targets.push(
      ...activeRegion.stations
        .filter((s) => s.types.includes('sbahn'))
        .map((s) => ({
          id: s.id,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          type: 'sbahn' as const,
          linesOrRoad: s.lines.filter((l) => l.startsWith('S')).join(', '),
        }))
    );
  }

  if (items.includes('highway')) {
    targets.push(
      ...MUNICH_HIGHWAY_JUNCTIONS.map((j) => ({
        id: j.id,
        name: j.name,
        lat: j.lat,
        lng: j.lng,
        type: 'highway' as const,
        linesOrRoad: j.autobahn,
      }))
    );
  }

  return targets;
}

export interface HeatmapZoneFeature {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  tier: 'tier1' | 'tier2' | 'tier3'; // tier1 = closest/best (e.g. < 500m), tier2 = < 1000m, tier3 = < 1500m
  color: string;
  fillOpacity: number;
  label: string;
  description: string;
  itemType: PriorityHeatmapItem;
}

function generateSingleItemZones(
  intersectionGeometry: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection>,
  settings: HeatmapSettings,
  itemType: PriorityHeatmapItem
): HeatmapZoneFeature[] {
  const targets = getPriorityTargets(itemType);
  if (targets.length === 0) return [];

  let bbox: number[];
  try {
    bbox = turf.bbox(intersectionGeometry as any);
  } catch {
    return [];
  }

  const searchBbox: [number, number, number, number] = [
    bbox[0] - 0.03, // ~2.2 km margin
    bbox[1] - 0.02,
    bbox[2] + 0.03,
    bbox[3] + 0.02,
  ];

  const relevantTargets = targets.filter(
    (t) =>
      t.lng >= searchBbox[0] &&
      t.lng <= searchBbox[2] &&
      t.lat >= searchBbox[1] &&
      t.lat <= searchBbox[3]
  );

  if (relevantTargets.length === 0) {
    return [];
  }

  const maxRadius = Math.max(0.6, settings.radiusKm || 1.5);
  const r1 = maxRadius * 0.35; // e.g. 0.52 km
  const r2 = maxRadius * 0.70; // e.g. 1.05 km
  const r3 = maxRadius * 1.00; // e.g. 1.50 km

  const makeTierBuffer = (radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null => {
    const circles = relevantTargets.map((t) =>
      turf.circle(turf.point([t.lng, t.lat]), radiusKm, { steps: 20, units: 'kilometers' })
    );

    let current: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = [...circles];
    while (current.length > 1) {
      const next: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>> = [];
      for (let i = 0; i < current.length; i += 2) {
        if (i + 1 < current.length) {
          try {
            const fc = turf.featureCollection([current[i] as any, current[i + 1] as any]);
            const u = (turf.union as any)(fc);
            next.push(u || current[i]);
          } catch {
            next.push(current[i]);
          }
        } else {
          next.push(current[i]);
        }
      }
      current = next;
    }
    return current[0] || null;
  };

  const buffer3 = makeTierBuffer(r3);
  const buffer2 = makeTierBuffer(r2);
  const buffer1 = makeTierBuffer(r1);

  const zones: HeatmapZoneFeature[] = [];

  let colors = {
    tier1: '#2563eb', // intense blue
    tier2: '#38bdf8', // sky blue
    tier3: '#bae6fd', // light ice blue
    modeLabel: 'U-Bahn',
  };

  if (itemType === 'sbahn') {
    colors = {
      tier1: '#15803d', // intense forest green
      tier2: '#22c55e', // bright green
      tier3: '#86efac', // mint green
      modeLabel: 'S-Bahn',
    };
  } else if (itemType === 'highway') {
    colors = {
      tier1: '#ea580c', // intense orange
      tier2: '#f59e0b', // amber
      tier3: '#fde68a', // light yellow
      modeLabel: 'Autobahnanschluss',
    };
  }

  const baseOpacity = settings.intensity || 0.55;

  // Tier 3: outer ring clipped to intersection
  if (buffer3) {
    try {
      const fc = turf.featureCollection([intersectionGeometry as any, buffer3 as any]);
      const clipped3 = (turf.intersect as any)(fc);
      if (clipped3 && clipped3.geometry) {
        zones.push({
          geometry: clipped3.geometry,
          tier: 'tier3',
          color: colors.tier3,
          fillOpacity: baseOpacity * 0.45,
          label: `${colors.modeLabel} Reichweite (< ${(r3 * 1000).toFixed(0)}m)`,
          description: `Gute Erreichbarkeit von ${colors.modeLabel}-Stationen im Treffbereich`,
          itemType,
        });
      }
    } catch {}
  }

  // Tier 2: medium ring clipped to intersection
  if (buffer2) {
    try {
      const fc = turf.featureCollection([intersectionGeometry as any, buffer2 as any]);
      const clipped2 = (turf.intersect as any)(fc);
      if (clipped2 && clipped2.geometry) {
        zones.push({
          geometry: clipped2.geometry,
          tier: 'tier2',
          color: colors.tier2,
          fillOpacity: baseOpacity * 0.70,
          label: `${colors.modeLabel} Nahbereich (< ${(r2 * 1000).toFixed(0)}m)`,
          description: `Kurze Wege (ca. 8-10 Min Fußweg) zur nächsten Haltestelle`,
          itemType,
        });
      }
    } catch {}
  }

  // Tier 1: core top proximity ring clipped to intersection
  if (buffer1) {
    try {
      const fc = turf.featureCollection([intersectionGeometry as any, buffer1 as any]);
      const clipped1 = (turf.intersect as any)(fc);
      if (clipped1 && clipped1.geometry) {
        zones.push({
          geometry: clipped1.geometry,
          tier: 'tier1',
          color: colors.tier1,
          fillOpacity: baseOpacity * 0.95,
          label: `⭐ Top-Lage: Direkte ${colors.modeLabel}-Nähe (< ${(r1 * 1000).toFixed(0)}m)`,
          description: `Unmittelbare Fußnähe (< 5 Min) zum Einstieg!`,
          itemType,
        });
      }
    } catch {}
  }

  return zones;
}

/**
 * Generates layered, graded proximity zones clipped specifically to the common intersection polygon
 * for the chosen priority modes (U-Bahn, S-Bahn or Autobahn).
 */
export function generatePriorityHeatmapZones(
  intersectionGeometry: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null,
  settings: HeatmapSettings
): HeatmapZoneFeature[] {
  if (!intersectionGeometry) {
    return [];
  }

  const items: PriorityHeatmapItem[] =
    settings.selectedItems && settings.selectedItems.length > 0
      ? settings.selectedItems
      : settings.mode && settings.mode !== 'none'
      ? [settings.mode as PriorityHeatmapItem]
      : [];

  if (items.length === 0) {
    return [];
  }

  const allZones: HeatmapZoneFeature[] = [];

  for (const item of items) {
    const singleZones = generateSingleItemZones(intersectionGeometry, settings, item);
    allZones.push(...singleZones);
  }

  return allZones;
}
