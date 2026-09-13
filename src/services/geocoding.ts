import { DEFAULT_MVV_DATASET } from '../data/mvvDataset';

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  isStation?: boolean;
}

const searchCache = new Map<string, GeocodingResult[]>();
const reverseCache = new Map<string, string>();

let currentAbortController: AbortController | null = null;

export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // 1. Instant local MVV station match
  const localStationMatches: GeocodingResult[] = [];
  const qLower = trimmed.toLowerCase();
  for (const st of DEFAULT_MVV_DATASET.stations) {
    if (st.name.toLowerCase().includes(qLower)) {
      const typesStr = st.types.map(t => t.toUpperCase()).join(' / ');
      localStationMatches.push({
        placeId: `mvv-station-${st.id}`,
        displayName: `${st.name} (${typesStr}), München & Region`,
        shortName: `${st.name} [${typesStr}]`,
        lat: st.lat,
        lng: st.lng,
        isStation: true,
      });
      if (localStationMatches.length >= 4) break;
    }
  }

  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  let onlineResults: GeocodingResult[] = [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&addressdetails=1&limit=6&accept-language=de,en`;

    const response = await fetch(url, {
      signal: currentAbortController.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      onlineResults = data.map((item: {
        place_id: number | string;
        display_name: string;
        lat: string;
        lon: string;
        address?: Record<string, string>;
      }) => {
        const road = item.address?.road || item.address?.pedestrian || item.address?.suburb || '';
        const houseNumber = item.address?.house_number || '';
        const city = item.address?.city || item.address?.town || item.address?.village || item.address?.county || '';
        const streetPart = road ? `${road} ${houseNumber}`.trim() : '';
        const shortName = streetPart && city ? `${streetPart}, ${city}` : (streetPart || city || item.display_name.split(',')[0]);

        return {
          placeId: String(item.place_id),
          displayName: item.display_name,
          shortName,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          isStation: false,
        };
      });
    }
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      return localStationMatches;
    }
  }

  // Combine station matches first, then online results, deduplicating by coordinates
  const combined: GeocodingResult[] = [...localStationMatches];
  for (const item of onlineResults) {
    const exists = combined.some(c => Math.abs(c.lat - item.lat) < 0.0005 && Math.abs(c.lng - item.lng) < 0.0005);
    if (!exists) {
      combined.push(item);
    }
  }

  searchCache.set(cacheKey, combined);
  return combined;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseCache.has(key)) {
    return reverseCache.get(key)!;
  }

  // Check if coordinates closely match a known MVV station (< 220m)
  for (const st of DEFAULT_MVV_DATASET.stations) {
    const dLat = Math.abs(st.lat - lat);
    const dLng = Math.abs(st.lng - lng);
    if (dLat < 0.0018 && dLng < 0.0025) {
      const stationLabel = `${st.name}, München`;
      reverseCache.set(key, stationLabel);
      return stationLabel;
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=de,en`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const data = await response.json();
    const addr = data.address || {};
    const road = addr.road || addr.pedestrian || addr.suburb || '';
    const houseNumber = addr.house_number || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';
    const district = addr.suburb || addr.city_district || '';

    let formatted = '';
    if (road) {
      formatted = `${road} ${houseNumber}`.trim();
      if (district && district !== city) formatted += ` (${district})`;
      if (city) formatted += `, ${city}`;
    } else if (district && city) {
      formatted = `${district}, ${city}`;
    } else if (city) {
      formatted = city;
    } else {
      formatted = data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    reverseCache.set(key, formatted);
    return formatted;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
