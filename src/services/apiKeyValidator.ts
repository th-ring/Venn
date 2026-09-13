/**
 * API Key Validation Service
 * Validates Google Maps API Keys and OpenRouteService (HeiGIT) API Keys
 * by sending lightweight test requests and analyzing response codes & error messages.
 */

import { runDetailedGoogleDiagnostic, DetailedGoogleCheckResult } from './googleDiagnosticService';

export interface KeyCheckResult {
  valid: boolean;
  provider: 'google' | 'ors';
  message: string;
  details?: string;
  statusCode?: number;
  detailedGoogle?: DetailedGoogleCheckResult;
}

/**
 * Checks an OpenRouteService (ORS / HeiGIT) API key
 * Uses a minimal isochrone request on driving-car (range 300s)
 */
export async function validateOrsApiKey(apiKey: string): Promise<KeyCheckResult> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return {
      valid: false,
      provider: 'ors',
      message: 'Bitte gib zuerst einen OpenRouteService API-Key ein.',
    };
  }

  try {
    const url = 'https://api.heigit.org/openrouteservice/v2/isochrones/driving-car';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': trimmed,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations: [[11.58, 48.14]], // Munich center test point
        range: [300], // 5 minutes
        units: 'm',
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.features && data.features.length > 0) {
        return {
          valid: true,
          provider: 'ors',
          message: 'Gültig! Verbindung zu OpenRouteService erfolgreich hergestellt.',
          statusCode: res.status,
        };
      }
      return {
        valid: true,
        provider: 'ors',
        message: 'Gültig! API-Key wurde akzeptiert.',
        statusCode: res.status,
      };
    }

    // Handle known HTTP error codes
    const errorBody = await res.json().catch(() => null);
    const errorMessage =
      errorBody?.error?.message ||
      errorBody?.error ||
      (typeof errorBody === 'string' ? errorBody : '');

    if (res.status === 401 || res.status === 403) {
      return {
        valid: false,
        provider: 'ors',
        statusCode: res.status,
        message: 'Ungültig oder nicht autorisiert.',
        details:
          errorMessage ||
          'Der API-Key wurde von OpenRouteService abgelehnt. Bitte prüfe den Key unter https://account.heigit.org/manage/key.',
      };
    }

    if (res.status === 429) {
      return {
        valid: false,
        provider: 'ors',
        statusCode: res.status,
        message: 'Rate-Limit erreicht.',
        details: 'Das Kontingent für diesen API-Key ist vorübergehend erschöpft.',
      };
    }

    return {
      valid: false,
      provider: 'ors',
      statusCode: res.status,
      message: `Fehler bei der Prüfung (Status ${res.status}).`,
      details: errorMessage || res.statusText,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      provider: 'ors',
      message: 'Netzwerkfehler beim Erreichen von OpenRouteService.',
      details: message,
    };
  }
}

/**
 * Checks a Google Maps API Key
 * Uses Google Isochrones API endpoint with a minimal test location
 */
export async function validateGoogleMapsApiKey(apiKey: string): Promise<KeyCheckResult> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return {
      valid: false,
      provider: 'google',
      message: 'Bitte gib zuerst einen Google Maps API-Key ein.',
    };
  }

  const detailed = await runDetailedGoogleDiagnostic(trimmed);

  if (detailed.mapsJsApi.status === 'valid' && detailed.isochronesApi.status === 'valid') {
    return {
      valid: true,
      provider: 'google',
      message: 'Vollständig gültig! Maps JavaScript API & Isochrones API sind aktiv.',
      details: 'Kartenanzeige und Erreichbarkeitsberechnung für Pkw/Rad/Fuß sind freigeschaltet.',
      detailedGoogle: detailed,
    };
  }

  if (detailed.mapsJsApi.status === 'valid' && detailed.isochronesApi.status !== 'valid') {
    return {
      valid: false,
      provider: 'google',
      message: 'Teilweise aktiv: Maps JS aktiv, aber Isochrones API fehlt.',
      details: detailed.isochronesApi.details || 'Aktiviere die "Google Maps Isochrones API" in deiner GCP Console.',
      detailedGoogle: detailed,
    };
  }

  if (detailed.mapsJsApi.status !== 'valid' && detailed.isochronesApi.status === 'valid') {
    return {
      valid: true,
      provider: 'google',
      message: 'Isochrones API aktiv, Maps JS eingeschränkt.',
      details: detailed.mapsJsApi.details,
      detailedGoogle: detailed,
    };
  }

  return {
    valid: false,
    provider: 'google',
    message: 'Google Maps Prüfung fehlgeschlagen.',
    details: detailed.isochronesApi.details || detailed.mapsJsApi.details || 'Bitte prüfe den Key in der Google Cloud Console.',
    detailedGoogle: detailed,
  };
}
