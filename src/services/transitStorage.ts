/**
 * IndexedDB Transit Region Storage
 * Provides high-capacity, persistent local storage for transit region packages
 * (such as Munich Metropolitan Region, Berlin, Hamburg etc.)
 * with thousands of stations and connections, eliminating the 5MB localStorage limit.
 */

import { TransitRegion, TransitRegionMetadata } from '../types';

const DB_NAME = 'living_area_transit_v2';
const DB_VERSION = 1;
const STORE_REGIONS = 'regions';
const STORE_SETTINGS = 'settings';
const KEY_ACTIVE_REGION = 'active_region_id';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
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
 * Saves or updates a transit region package in IndexedDB
 */
export async function saveRegionToStorage(region: TransitRegion): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_REGIONS], 'readwrite');
      const store = tx.objectStore(STORE_REGIONS);
      const req = store.put(region);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[TransitStorage] Failed to save region to IndexedDB:', err);
  }
}

/**
 * Loads a transit region package by id
 */
export async function loadRegionFromStorage(regionId: string): Promise<TransitRegion | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_REGIONS], 'readonly');
      const store = tx.objectStore(STORE_REGIONS);
      const req = store.get(regionId);

      req.onsuccess = () => {
        resolve(req.result || null);
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
