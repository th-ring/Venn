---
name: agentic-apartment-browser
description: >-
  Performs an agentic apartment search via the integrated browser (Antigravity, Codex, Cloud Code)
  to navigate commercial real estate portals (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen)
  when raw HTTP scrapers are blocked by WAF/bot protection. Extracts live listings strictly within the Venn
  commute intersection area, enforces strict real ID extraction, filters swap offers, performs pre-flight
  availability checks, and writes valid listings directly to public/data/apartments.json.
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

## Core Extraction & Verification Rules

Damit in `public/data/apartments.json` ausschließlich valide, direkt aufrufbare Angebote verbleiben, gelten zwingend folgende drei Kernregeln:

### 1. Strikte ID- und URL-Extraktion (Keine künstlichen IDs)
- Die echte Exposé-ID muss **direkt** aus dem DOM extrahiert werden:
  - **Primär**: Aus dem Attribut `data-obid` des Listen-Containers (`article.result-list-entry`):
    ```javascript
    const obid = article.getAttribute('data-obid');
    ```
  - **Sekundär**: Per Regex `r"/expose/(\d+)"` aus dem eigentlichen Hyperlink (`a.result-list-entry__brand-title-container` bzw. `a[href*="/expose/"]`):
    ```javascript
    const href = article.querySelector('a.result-list-entry__brand-title-container')?.getAttribute('href') || '';
    const match = href.match(/\/expose\/(\d+)/);
    const exposeId = obid || (match ? match[1] : null);
    ```
- **Streng verboten**: Niemals IDs künstlich zusammensetzen (z. B. keine Zufallsfolgen wie `apt-mujl0weo-01` oder spekulative Suffixe). Kann keine valide numerische Exposé-ID ermittelt werden, wird der Eintrag verworfen.
- Die eindeutige ID wird im Format `${sourcePrefix}-${exposeId}` (z. B. `is24-152849201`) und die URL als kanonischer Direktlink gespeichert:
  `https://www.immobilienscout24.de/expose/${exposeId}`

### 2. Ausschluss von Tauschangeboten (Im Parser verwerfen)
- Tauschangebote verlangen eine bestehende Wohnung im Gegenzug und sind für reguläre Mietwohnungssuchen ungeeignet.
- Der Parser prüft Titel und Beschreibung auf einschlägige Signalwörter:
  - **Signalwörter**: `Tauschwohnung`, `Wohnungstausch`, `nur zum Tausch`, `Tauschangebot`
  - **Regex**: `/(?:tauschwohnung|wohnungstausch|nur\s+zum\s+tausch|tauschangebot)/i`
- Wird ein Signalwort in `title` oder `description` gefunden, wird das Angebot **sofort im Parser verworfen** und nicht in die Kandidatenliste aufgenommen.

### 3. Pre-Flight-Verfügbarkeitsprüfung (Vor dem Schreiben in JSON)
Vor dem finalen Schreiben eines Datensatzes in `public/data/apartments.json` muss das Skript bzw. der Browser-Agent jedes Angebot auf aktive Verfügbarkeit prüfen:
1. **HTTP-Statuscode**: Der Aufruf des Exposés (`url`) muss HTTP **200** zurückgeben (kein 404, kein 410, keine Umleitung auf Fehlerseiten).
2. **Keine Deaktivierungs-Banner / Offline-Meldungen**:
   - Die Zielseite darf keine Deaktivierungs-Selektoren enthalten, insbesondere:
     - `.is24-deactivated-banner`
     - `.is24-banner-deactivated`
     - `[data-qa="deactivated-banner"]`
   - Die Seite darf keine Signaltexte enthalten wie:
     - `"Angebot wurde deaktiviert"`
     - `"vorübergehend offline"`
     - `"Das Inserat ist leider nicht mehr online"`
     - `"Dieses Angebot ist leider nicht mehr verfügbar"`
3. Ergibt der Pre-Flight-Check einen Status $\ne 200$ oder wird ein Deaktivierungs-Hinweis detektiert, wird das Inserat aussortiert.

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
- STRIKTE ID- UND URL-EXTRAKTION: data-obid oder /expose/(\d+)
- AUSSCHLUSS VON TAUSCHANGEBOTEN: Keine Tauschwohnungen
- PRE-FLIGHT-PRÜFUNG: HTTP 200 und keine Deaktivierungs-Banner
- WICHTIGE GEO-FILTERUNG: Akzeptiere NUR Inserate innerhalb der Bounding Box bzw. des Radius!

=== 3. ZIELDATEI & ZIELDATENFORMAT ===
Zieldatei: public/data/apartments.json
```

### 2. Navigate via Integrated Browser
1. Open the target portal URL using the integrated browser tool (`/browser`).
2. Dismiss cookie consent dialogs if prompted.
3. If search filters on the portal allow adjusting price or room count to match the criteria in Section 2, apply them.
4. Wait for the listing result elements to render in the DOM.

### 3. Extract & Filter Candidates (Console Snippet)
Execute or evaluate the extraction script in the browser session:

```javascript
// Browser-Konsole / Evaluate Snippet
const articles = Array.from(document.querySelectorAll('article.result-list-entry'));
const candidates = [];

for (const art of articles) {
  // 1. Strikte ID- & URL-Extraktion
  const obid = art.getAttribute('data-obid');
  const titleLink = art.querySelector('a.result-list-entry__brand-title-container, a[href*="/expose/"]');
  const href = titleLink?.getAttribute('href') || '';
  const match = href.match(/\/expose\/(\d+)/);
  const exposeId = obid || (match ? match[1] : null);
  if (!exposeId) continue; // Künstliche IDs strikt vermeiden!

  // 2. Tauschangebot-Ausschluss
  const title = (art.querySelector('.result-list-entry__brand-title, .result-list-entry__title')?.textContent || '').trim();
  const desc = (art.querySelector('.result-list-entry__description, .result-list-entry__data')?.textContent || '').trim();
  if (/(?:tauschwohnung|wohnungstausch|nur\s+zum\s+tausch|tauschangebot)/i.test(`${title} ${desc}`)) {
    console.log(`[Filter] Tauschangebot übersprungen: ${title}`);
    continue;
  }

  // 3. Attribute extrahieren
  const fullUrl = `https://www.immobilienscout24.de/expose/${exposeId}`;
  // ... (Geodaten, Miete, Zimmer, Fläche extrahieren)
}
```

### 4. Run Pre-Flight Availability Check
Before writing entries to `public/data/apartments.json`, execute pre-flight checks:
```bash
node .agents/skills/agentic-apartment-browser/scripts/verify_apartments.mjs public/data/apartments.json
```
The script:
1. Verifies HTTP status 200 for every listing.
2. Checks HTML bodies for `.is24-deactivated-banner` or text `"Angebot wurde deaktiviert"`, `"vorübergehend offline"`.
3. Purges any swap listings or entries with invalid/artificial IDs.

### 5. Merge into `public/data/apartments.json`
Read existing listings from [public/data/apartments.json](file:///c:/Users/haeri/OneDrive/Coding/Coding/Venn/public/data/apartments.json), deduplicate by real `id` or `url`, append verified listings, and save the envelope:

```json
{
  "version": "1.1.0",
  "lastUpdated": "2026-09-29T21:50:00.000Z",
  "source": "Agentic Browser Extraction (ImmoScout24)",
  "city": "München",
  "bbox": [11.535, 48.14, 11.595, 48.175],
  "status": "ready",
  "message": "Erfolgreich 8 verifizierte Inserate im Treffbereich extrahiert.",
  "count": 8,
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
      "scrapedAt": "2026-09-29T21:50:00.000Z"
    }
  ]
}
```

### 6. Validate & Venn Refresh
1. Ensure all listings pass Venn's `validateApartmentListing` requirements (valid positive coordinates, price, rooms, size).
2. Save the formatted JSON to `public/data/apartments.json`.
3. Venn immediately integrates the listings into its commute computation, isochrone intersection filtering, and fairness scoring.
