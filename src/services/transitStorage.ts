/**
 * IndexedDB Transit Region Storage
 * Provides high-capacity, persistent local storage for transit region packages
 * (such as Munich Metropolitan Region, Berlin, Hamburg etc.)
 * with thousands of stations and connections, eliminating the 5MB localStorage limit.
 */

import type { TransitRegion, TransitRegionMetadata, TransitStation, TransitConnection } from '../types.ts';

const DB_NAME = 'living_area_transit_v2';
const DB_VERSION = 1;
const STORE_REGIONS = 'regions';
const STORE_SETTINGS = 'settings';
const KEY_ACTIVE_REGION = 'active_region_id';
const MAX_CACHED_REGIONS = 4;

/**
 * Validates external or stored TransitRegion data against structural and coordinate constraints.
 */
export function validateTransitRegion(raw: any): TransitRegion | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!id || !name) return null;

  if (!Array.isArray(raw.stations) || !Array.isArray(raw.connections)) return null;

  if (
    !Array.isArray(raw.bbox) ||
    raw.bbox.length !== 4 ||
    !raw.bbox.every((n: any) => typeof n === 'number' && !isNaN(n))
  ) {
    return null;
  }

  const validStations: TransitStation[] = [];
  for (const s of raw.stations) {
    if (
      !s ||
      typeof s.id !== 'string' ||
      !s.id.trim() ||
      typeof s.name !== 'string' ||
      typeof s.lat !== 'number' ||
      typeof s.lng !== 'number' ||
      isNaN(s.lat) ||
      isNaN(s.lng) ||
      s.lat < -90 ||
      s.lat > 90 ||
      s.lng < -180 ||
      s.lng > 180
    ) {
      return null;
    }
    validStations.push({
      id: s.id.trim(),
      name: s.name.trim(),
      lat: s.lat,
      lng: s.lng,
      lines: Array.isArray(s.lines) ? s.lines.filter((l: any) => typeof l === 'string') : [],
      types: Array.isArray(s.types) ? s.types.filter((t: any) => typeof t === 'string') : ['ubahn'],
    });
  }

  const stationIdSet = new Set(validStations.map((s) => s.id));
  const validConnections: TransitConnection[] = [];
  for (const c of raw.connections) {
    if (
      !c ||
      typeof c.from !== 'string' ||
      typeof c.to !== 'string' ||
      typeof c.minutes !== 'number' ||
      isNaN(c.minutes) ||
      c.minutes <= 0 ||
      !stationIdSet.has(c.from) ||
      !stationIdSet.has(c.to)
    ) {
      continue;
    }
    let tph: [number, number, number, number, number] | undefined = undefined;
    if (Array.isArray(c.tph) && c.tph.length === 5) {
      const allValid = c.tph.every((n: any) => typeof n === 'number' && !isNaN(n) && n >= 0);
      if (allValid) {
        tph = c.tph as [number, number, number, number, number];
      }
    }

    validConnections.push({
      from: c.from,
      to: c.to,
      minutes: Math.max(0.2, c.minutes),
      lines: Array.isArray(c.lines) ? c.lines.filter((l: any) => typeof l === 'string') : [],
      type: typeof c.type === 'string' ? c.type : 'ubahn',
      tph,
    });
  }

  const validFootpaths: any[] = [];
  if (Array.isArray(raw.footpaths)) {
    for (const f of raw.footpaths) {
      if (
        f &&
        typeof f.from === 'string' &&
        typeof f.to === 'string' &&
        typeof f.minutes === 'number' &&
        !isNaN(f.minutes) &&
        f.minutes > 0 &&
        stationIdSet.has(f.from) &&
        stationIdSet.has(f.to)
      ) {
        validFootpaths.push({
          from: f.from,
          to: f.to,
          minutes: Math.max(0.1, f.minutes),
        });
      }
    }
  }

  if (validStations.length === 0 || validConnections.length === 0) {
    return null;
  }

  return {
    id,
    name,
    version: typeof raw.version === 'string' ? raw.version : '1.0',
    lastUpdated: typeof raw.lastUpdated === 'string' ? raw.lastUpdated : new Date().toISOString(),
    source: typeof raw.source === 'string' ? raw.source : 'OpenTransit',
    bbox: raw.bbox as [number, number, number, number],
    stationCount: validStations.length,
    connectionCount: validConnections.length,
    footpathCount: validFootpaths.length > 0 ? validFootpaths.length : (typeof raw.footpathCount === 'number' ? raw.footpathCount : undefined),
    downloadSizeApprox: typeof raw.downloadSizeApprox === 'string' ? raw.downloadSizeApprox : undefined,
    downloadUrl: typeof raw.downloadUrl === 'string' ? raw.downloadUrl : undefined,
    isBuiltIn: !!raw.isBuiltIn,
    schemaVersion: raw.schemaVersion === 2 ? 2 : 1,
    directed: !!raw.directed,
    attribution: typeof raw.attribution === 'string' ? raw.attribution : undefined,
    feedVersion: typeof raw.feedVersion === 'string' ? raw.feedVersion : undefined,
    feedSourceUrl: typeof raw.feedSourceUrl === 'string' ? raw.feedSourceUrl : undefined,
    serviceDates: raw.serviceDates && typeof raw.serviceDates === 'object' ? raw.serviceDates : undefined,
    stations: validStations,
    connections: validConnections,
    footpaths: validFootpaths.length > 0 ? validFootpaths : undefined,
  };
}

async function checkStorageQuota(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        const remainingBytes = estimate.quota - estimate.usage;
        if (remainingBytes < 5 * 1024 * 1024) {
          console.warn('[TransitStorage] Storage space constrained, available bytes:', remainingBytes);
          return false;
        }
      }
    } catch {}
  }
  return true;
}

export function isStorageAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isStorageAvailable()) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_REGIONS)) {
        db.createObjectStore(STORE_REGIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves or updates a transit region package in IndexedDB with quota check and LRU eviction
 */
export async function saveRegionToStorage(region: TransitRegion): Promise<void> {
  if (!isStorageAvailable()) return;

  const validated = validateTransitRegion(region);
  if (!validated) {
    console.warn('[TransitStorage] Rejected malformed transit region:', region?.id);
    return;
  }

  await checkStorageQuota();

  try {
    const db = await openDatabase();
    const installed = await listInstalledRegions();
    if (installed.length >= MAX_CACHED_REGIONS && !installed.some((r) => r.id === validated.id)) {
      const evictCandidate = installed.find((r) => !r.isBuiltIn && r.id !== validated.id);
      if (evictCandidate) {
        await deleteRegionFromStorage(evictCandidate.id);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_REGIONS], 'readwrite');
      const store = tx.objectStore(STORE_REGIONS);
      const req = store.put(validated);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[TransitStorage] Failed to save region to IndexedDB:', err);
  }
}

/**
 * Loads a transit region package by id with runtime schema validation
 */
export async function loadRegionFromStorage(regionId: string): Promise<TransitRegion | null> {
  if (!isStorageAvailable()) return null;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_REGIONS], 'readonly');
      const store = tx.objectStore(STORE_REGIONS);
      const req = store.get(regionId);

      req.onsuccess = () => {
        if (!req.result) {
          resolve(null);
          return;
        }
        const validated = validateTransitRegion(req.result);
        if (!validated) {
          console.warn('[TransitStorage] Corrupted region detected in storage, clearing:', regionId);
          deleteRegionFromStorage(regionId).catch(() => {});
          resolve(null);
        } else {
          resolve(validated);
        }
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[TransitStorage] Failed to load region from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes a transit region package by id
 */
export async function deleteRegionFromStorage(regionId: string): Promise<void> {
  if (!isStorageAvailable()) return;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_REGIONS], 'readwrite');
      const store = tx.objectStore(STORE_REGIONS);
      const req = store.delete(regionId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[TransitStorage] Failed to delete region from IndexedDB:', err);
  }
}

/**
 * Lists metadata of all locally installed regions
 */
export async function listInstalledRegions(): Promise<TransitRegionMetadata[]> {
  if (!isStorageAvailable()) return [];
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_REGIONS], 'readonly');
      const store = tx.objectStore(STORE_REGIONS);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result || []) as TransitRegion[];
        const metaList: TransitRegionMetadata[] = results.map((r) => ({
          id: r.id,
          name: r.name,
          version: r.version,
          lastUpdated: r.lastUpdated,
          source: r.source,
          bbox: r.bbox,
          stationCount: r.stations ? r.stations.length : r.stationCount,
          connectionCount: r.connections ? r.connections.length : r.connectionCount,
          downloadSizeApprox: r.downloadSizeApprox,
          isBuiltIn: r.isBuiltIn,
          schemaVersion: r.schemaVersion,
          directed: r.directed,
          attribution: r.attribution,
        }));
        resolve(metaList);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[TransitStorage] Failed to list installed regions:', err);
    return [];
  }
}

/**
 * Gets the active region ID
 */
export async function getActiveRegionId(): Promise<string | null> {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('living_area_active_region_id');
      if (stored) return stored;
    }

    if (!isStorageAvailable()) return null;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SETTINGS], 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(KEY_ACTIVE_REGION);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

/**
 * Sets the active region ID
 */
export async function setActiveRegionId(regionId: string): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('living_area_active_region_id', regionId);
    }

    if (!isStorageAvailable()) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SETTINGS], 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put(regionId, KEY_ACTIVE_REGION);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[TransitStorage] Failed to set active region:', err);
  }
}
