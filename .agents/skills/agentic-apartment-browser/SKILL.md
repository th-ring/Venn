---
name: agentic-apartment-browser
description: >-
  Performs an agentic apartment search via the integrated browser (Antigravity, Codex, Cloud Code)
  to navigate commercial real estate portals (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen)
  when raw HTTP scrapers are blocked by WAF/bot protection. Extracts live listings strictly within the Venn
  commute intersection area and writes them directly to public/data/apartments.json.
---

# Agentic Apartment Browser Skill for Venn

This skill is invoked when automated HTTP scraping fails due to anti-bot / WAF protections (Cloudflare, Akamai, Captchas), or when the user triggers an agentic browser search for a specific commute intersection or sub-area in Venn.

Instead of raw HTTP requests, the agent operates directly through an **integrated browser session** (e.g., using `/browser`, Codex, or Cloud Code browser automation tools) to load the portal, render JavaScript, extract live listings strictly inside the target commute bounds, and persist them into Venn's structured dataset.

---

## When to Use

1. **Anti-Bot Fallback**: Venn reports `bot_protection_active` or HTTP 403 on commercial portals, and the user wants live listings for the intersection area.
2. **User Trigger**: The user clicks **"Agentische Browser-Suche"** in Venn, copying an all-inclusive prompt that provides:
   - **Target Portal & Pre-filtered URL**
   - **Exact Geographical Bounding Box (`[minLng, minLat, maxLng, maxLat]`)**
   - **Center Coordinates (`lat, lng`) & Radius (`km`)**
   - **Active Venn Search Filters (Max rent, min rooms, min sqm)**
   - **Target File Path (`public/data/apartments.json`) & Strict Schema**

---

## Browser Search Workflow

### 1. Ingest Prompt Context & Target Boundaries
Every prompt produced by Venn includes full context:
```text
/browser Öffne ImmoScout24 (https://...) und nutze den agentic-apartment-browser Skill...

=== 1. GEOGRAFISCHER ZIELBEREICH (TREFFBEREICH) ===
- Bereich: Bereich 1 (ca. 1.85 km²)
- Stadt: München / Lage: Karl-Theodor-Straße (Schwabing-West)
- Zentrum: Breitengrad 48.1550, Längengrad 11.5650
- Suchradius: ca. 1.5 km um das Zentrum
- Bounding Box [minLng, minLat, maxLng, maxLat]: [11.5350, 48.1400, 11.5950, 48.1750]

=== 2. FILTER- & EXTRAKTIONSKRITERIEN ===
- Maximalanzahl: Bis zu 15 Inserate
- Mietart: Wohnung zur Miete
- Suchkriterien aus Venn:
  - Maximale Warmmiete: bis zu 1800 €
  - Mindestzimmeranzahl: ab 2 Zimmer
- WICHTIGE GEO-FILTERUNG: Akzeptiere NUR Inserate innerhalb der Bounding Box bzw. des Radius!

=== 3. ZIELDATEI & ZIELDATENFORMAT ===
Zieldatei: public/data/apartments.json
```

### 2. Navigate via Integrated Browser
1. Open the target portal URL using the integrated browser tool (`/browser`).
2. Dismiss cookie consent dialogs if prompted.
3. If search filters on the portal allow adjusting price or room count to match the criteria in Section 2, apply them.
4. Wait for the listing result elements to render in the DOM.

### 3. Extract & Geo-Filter Candidates
For each listing visible on the page:
1. Extract coordinates (`lat`, `lng`):
   - From map pin attributes, inline JSON state (`application/ld+json`, `window.__INITIAL_STATE__`), or street/district center.
2. **Strict Geo-Filtering (Crucial Step)**:
   - Verify that:
     $$\text{minLng} \le \text{lng} \le \text{maxLng} \quad \text{and} \quad \text{minLat} \le \text{lat} \le \text{maxLat}$$
     or distance to center $\le \text{radiusKm}$.
   - **Discard listings from other parts of the city** that appear as sponsored or broader portal recommendations.
3. Extract listing data points:
   - **`id`**: Unique string (e.g. `'is24-152849201'`, `'iw-2948194'`, `'ka-91823719'`).
   - **`title`**: Descriptive headline.
   - **`address`**: Street and house number (or `"Adresse auf Anfrage"`).
   - **`district`**: City district / neighborhood.
   - **`city`**: City name (e.g. `"München"`).
   - **`lat`, `lng`**: Numbers (floats).
   - **`priceCold`**: Positive number in EUR.
   - **`priceWarm`**: Warm rent in EUR (optional, number).
   - **`sizeSqm`**: Living area in m² (positive number).
   - **`rooms`**: Number of rooms (positive number, e.g. `2` or `2.5`).
   - **`features`**: Array of string tags (e.g. `['Balkon', 'Einbauküche']`).
   - **`thumbnailUrl`**: Image URL (HTTP/HTTPS).
   - **`url`**: Direct link to exposé.
   - **`source`**: `'immoscout24' | 'immowelt' | 'wg-gesucht' | 'kleinanzeigen'`.
   - **`scrapedAt`**: Current ISO-8601 timestamp.

### 4. Merge into `public/data/apartments.json`
Read existing listings from [public/data/apartments.json](file:///c:/Users/haeri/OneDrive/Coding/Coding/Venn/public/data/apartments.json) (if present), deduplicate by `id` or `url`, append the new listings, and write the file in the exact envelope format:

```json
{
  "version": "1.1.0",
  "lastUpdated": "2026-09-27T19:00:00.000Z",
  "source": "Agentic Browser Extraction (ImmoScout24)",
  "city": "München",
  "bbox": [11.535, 48.14, 11.595, 48.175],
  "status": "ready",
  "message": "Erfolgreich 12 Inserate im Treffbereich extrahiert.",
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
      "features": ["Balkon", "Einbauküche", "Aufzug"],
      "thumbnailUrl": "https://...",
      "url": "https://www.immobilienscout24.de/expose/152849201",
      "source": "immoscout24",
      "scrapedAt": "2026-09-27T19:00:00.000Z"
    }
  ]
}
```

### 5. Validate & Venn Refresh
1. Ensure all listings pass Venn's `validateApartmentListing` requirements (valid positive coordinates, price, rooms, size).
2. Save the formatted JSON to `public/data/apartments.json`.
3. Venn immediately integrates the listings into its commute computation, isochrone intersection filtering, and fairness scoring.
