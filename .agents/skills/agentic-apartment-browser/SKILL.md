---
name: agentic-apartment-browser
description: >-
  Performs an agentic apartment search via the integrated browser (Antigravity, Codex, Cloud Code)
  to navigate commercial real estate portals (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen)
  when raw HTTP scrapers are blocked by WAF/bot protection. Extracts live listings within the Venn
  commute intersection area and writes them directly to public/data/apartments.json.
---

# Agentic Apartment Browser Skill for Venn

This skill is invoked when automated HTTP scraping fails due to anti-bot / WAF protections (Cloudflare, Akamai, Captchas), or when the user explicitly requests an agentic browser search for a specific commute intersection or sub-area in Venn.

Instead of raw HTTP requests, the agent operates directly through an **integrated browser session** (e.g., using `/browser`, Codex, or Cloud Code browser automation tools) to load the portal, render JavaScript, extract live listings, and persist them into Venn's structured dataset.

---

## When to Use

1. **Anti-Bot Fallback**: Venn reports `bot_protection_active` or HTTP 403 on commercial portals, and the user wants live listings for the intersection area.
2. **User Trigger**: The user clicks **"Agentische Browser-Suche anfordern"** in Venn, or types prompts like:
   - *"Suche mit dem Browser nach Wohnungen für Bereich 1"*
   - *"Extrahiere ImmoScout24 Angebote für den aktuellen Treffbereich"*
   - *"Nutze den Browser für Immowelt im Pendelbereich"*

---

## Browser Search Workflow

### 1. Identify Target Area & Portal Deep-Link
Retrieve the pre-generated portal deep-link for the target sub-area or full intersection:
- **ImmoScout24**: `https://www.immobilienscout24.de/Suche/radius/wohnung-mieten?centerlat=<LAT>&centerlon=<LNG>&radius=<RADIUS>&userGeoAttributes=true`
- **Immowelt**: `https://www.immowelt.de/liste/wohnungen/mieten?lat=<LAT>&lon=<LNG>&distance=<RADIUS>`
- **WG-Gesucht**: `https://www.wg-gesucht.de/wohnungen-in-<CITY>.html?distance=<RADIUS>`
- **Kleinanzeigen**: `https://www.kleinanzeigen.de/s-wohnung-mieten/c203?distance=<RADIUS>&latitude=<LAT>&longitude=<LNG>`

### 2. Navigate via Integrated Browser
1. Open the target portal URL using the integrated browser tool (`/browser`, Puppeteer, Playwright, or agent browser interface).
2. Allow cookies / dismiss standard consent modals if prompted.
3. Wait for the listing result elements to render in the DOM.

### 3. Extract Listing Data Points
For each visible apartment listing in the search results (up to 10–15 items), extract:
- **Title**: Headline of the listing (e.g., *"Helle 2-Zimmer-Wohnung mit Südbalkon"*).
- **Address & District**: Street, house number (if available), postal code, and neighborhood.
- **Coordinates (`lat`, `lng`)**: Extracted from map pins, schema markup (`application/ld+json`), or estimated from the street/district center.
- **Price**: Cold rent (`priceCold`) and Warm rent (`priceWarm`) in EUR.
- **Size & Rooms**: Living area in m² (`sizeSqm`) and room count (`rooms`).
- **Features**: List of amenity tags (e.g. `['Balkon', 'Einbauküche', 'Aufzug']`).
- **Media**: Image/thumbnail URL (`thumbnailUrl`).
- **Exposé Link**: Direct link to the listing (`url`).
- **Source**: `'immoscout24'`, `'immowelt'`, `'wg-gesucht'`, or `'kleinanzeigen'`.

### 4. Merge into `public/data/apartments.json`
Read existing listings from [public/data/apartments.json](file:///c:/Users/haeri/OneDrive/Coding/Coding/Venn/public/data/apartments.json), deduplicate by `id` or `url`, and append the newly extracted listings:

```json
{
  "version": "1.1.0",
  "lastUpdated": "2026-09-27T12:00:00.000Z",
  "source": "Agentic Browser Extraction",
  "city": "München",
  "status": "ready",
  "message": "Live-Inserate erfolgreich über den integrierten Browser extrahiert.",
  "portalLinks": [...],
  "count": 12,
  "listings": [
    {
      "id": "is24-152849201",
      "title": "Moderne 3-Zimmer-Wohnung am Luitpoldpark",
      "address": "Karl-Theodor-Straße 34",
      "district": "Schwabing-West",
      "city": "München",
      "lat": 48.1632,
      "lng": 11.5714,
      "priceCold": 1650,
      "priceWarm": 1920,
      "currency": "EUR",
      "sizeSqm": 74,
      "rooms": 3,
      "features": ["Balkon", "Einbauküche", "Keller"],
      "thumbnailUrl": "https://...",
      "url": "https://www.immobilienscout24.de/expose/152849201",
      "source": "immoscout24",
      "scrapedAt": "2026-09-27T12:00:00.000Z"
    }
  ]
}
```

### 5. Validate & Trigger Venn Refresh
1. Ensure all entries pass `validateApartmentListing`.
2. Save the file to `public/data/apartments.json`.
3. In Venn, the apartment layer and inspection panel automatically reflect the new listings with live commute times and fairness scores.
