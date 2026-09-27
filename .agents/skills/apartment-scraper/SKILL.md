---
name: apartment-scraper
description: >-
  Scrapes and generates structured apartment listings (Wohnungsangebote) for Venn's
  common commute intersection area (Treffbereich). Use when the user requests to update,
  scrape, or fetch apartments for a specific geographic bounding box, polygon, or city.
---

# Apartment Scraper Skill for Venn

This skill automates the extraction and structured ingestion of apartment listings into Venn.

## When to Use
- The user asks to find, scrape, or search for apartments in the shared commute area ("Wohnungen suchen", "Scraper anwerfen", "aktive Wohnungssuche").
- An intersection area between commute isochrones has been established and apartments need to be ingested into `public/data/apartments.json`.
- The user provides a custom bounding box, city, or coordinates.

## Workflow

### 1. Extract Target Bounding Box / Geographic Scope
- Obtain the bounding box `[minLng, minLat, maxLng, maxLat]` of the intersection polygon from Venn or from the user's scenario.
- Example for Munich (Schwabing, Maxvorstadt, Neuhausen): `11.53,48.14,11.60,48.18`.

### 2. Execute the Scraper Script
Run the dedicated Node.js scraper tool via `run_command`:
```bash
node scripts/scrapeApartments.mjs --bbox <minLng,minLat,maxLng,maxLat> --city "<CityName>" --limit 15
```

Optional flags:
- `--limit <number>`: Desired number of listings (default 15).
- `--portal <name>`: Target portal (`kleinanzeigen`, `wg-gesucht`, `immowelt`, or `all`).
- `--output <path>`: Custom destination path (defaults to `public/data/apartments.json`).
- `--synthetic`: Direct generation of calibrated market listings matching current rent indices.

### 3. Verify Output
Check that `public/data/apartments.json` was generated and contains valid listings with:
- `id`, `title`, `address`, `district`, `city`
- `lat`, `lng` coordinates
- `priceCold`, `priceWarm`, `sizeSqm`, `rooms`
- `features` (e.g. Balkon, Einbauküche, Aufzug)
- `thumbnailUrl`, `images`, `url`, `source`

### 4. Provide Feedback to User
Summarize the ingested listings in a clean markdown table including:
- Apartment title & neighborhood/district
- Rent (€ warm / cold)
- Size (m²) & room count
- Commute advantages within the intersection area
