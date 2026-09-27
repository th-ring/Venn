---
name: apartment-scraper
description: >-
  Scrapes, triggers, or creates structured apartment listings and portal deep-links for Venn's
  common commute intersection areas (Treffbereich & Überlappungsfelder). Use when the user requests to update,
  scrape, or fetch apartments for a specific geographic bounding box, sub-polygon, or city.
---

# Apartment Scraper Skill for Venn

This skill automates the extraction and structured ingestion of apartment listings and direct portal search links into Venn.

## When to Use
- The user asks to find, scrape, or search for apartments in the shared commute area ("Wohnungen suchen", "Scraper anwerfen", "aktive Wohnungssuche", "Überlappungsfeld durchsuchen").
- An intersection area between commute isochrones has been established and specific sub-areas / islands need to be targeted.
- The user asks for direct portal links (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen) for a specific commute pocket.

## Workflow

### 1. Extract Target Bounding Box / Sub-Area Scope
- Obtain the bounding box `[minLng, minLat, maxLng, maxLat]` of the intersection polygon (or the specific sub-area island) from Venn or from the user's scenario.
- In multi-modal setups (e.g. ÖPNV + Pkw), identify whether there are multiple disjoint sub-areas.
- Example for Munich (Schwabing, Maxvorstadt): `11.53,48.14,11.60,48.18`.

### 2. Execute the Scraper Script
Run the dedicated Node.js scraper tool via `run_command`:
```bash
node scripts/scrapeApartments.mjs --bbox <minLng,minLat,maxLng,maxLat> --city "<CityName>" --limit 15
```

Optional flags:
- `--limit <number>`: Desired number of listings (default 15).
- `--portal <name>`: Target portal (`kleinanzeigen`, `wg-gesucht`, `immowelt`, or `all`).
- `--output <path>`: Custom destination path (defaults to `public/data/apartments.json`).
- `--sample`: Generate verified benchmark sample listings (e.g. for demonstration or offline development).

### 3. Transparent Bot-Protection & Portal Deep-Links Policy
- Commercial housing portals employ strict bot protection (Cloudflare WAF / Captchas).
- **Rule**: Never make silent assumptions or invent fake listings when portal scraping is blocked!
- Instead, the script transparently reports the bot-protection state and outputs direct, pre-configured portal search deep-links for that specific area:
  - **ImmoScout24**: Radius search around the area center (`centerlat`, `centerlon`, `radius`)
  - **Immowelt**: Radius search (`lat`, `lon`, `distance`)
  - **WG-Gesucht**: City & distance search
  - **Kleinanzeigen**: Geolocation radius search
- These links are written directly to `public/data/apartments.json` and rendered in Venn's UI so the user can open live listings with 1 click.

### 4. Provide Feedback to User
Summarize the ingested listings or portal links in a clean markdown table including:
- Sub-area / polygon examined
- Direct 1-click links to ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen
- Number of valid listings in `public/data/apartments.json`
- Commute fairness advantages
