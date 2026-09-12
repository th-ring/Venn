export interface GeocodingResult {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
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

  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

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

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();
    const results: GeocodingResult[] = data.map((item: {
      place_id: number | string;
      display_name: string;
      lat: string;
      lon: string;
      address?: Record<string, string>;
    }) => {
      // Build a concise display name (e.g. Street + City)
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
      };
    });

    searchCache.set(cacheKey, results);
    return results;
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      return [];
    }
    console.warn('Geocoding search failed:', err);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseCache.has(key)) {
    return reverseCache.get(key)!;
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
