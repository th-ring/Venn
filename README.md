<p align="center">
  <img src="public/venn-logo.svg" alt="Venn Logo" width="380" />
</p>

<p align="center">
  <strong>Finding common ground</strong><br>
  <em>Interactive Travel-Time Isochrone Residential Zone Finder</em>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black" alt="React" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6-646cff.svg?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
</p>

---

**Venn** is an interactive web application for finding a shared place to live — built for couples, flatmates, and families. Using **travel-time isochrones** for different modes of transport (public transit, car, bicycle, and walking), the app calculates precise geometric intersections to identify ideal residential areas.

---

## ✨ Key Features

- **Multi-person isochrones**: Calculate simultaneous reachability polygons for any number of people, each with their own workplace or destination, maximum travel time, and mode of transport.
- **Geometric intersection engine**: Automatic union and intersection of all individual isochrones using Turf.js.
- **Topological public-transit network model**: Full model of Munich's U-Bahn and S-Bahn network (DELFI / MVV) including walking times to stations, service frequencies, and transfer constraints.
- **Motorway infrastructure & junctions**: Integrated OpenStreetMap geodata for motorway interchanges, on-ramps, and exits to optimise car-commute routing.
- **Priority heatmap**: Weighted accessibility analysis for U-Bahn, S-Bahn, and motorway access points displayed directly on the map.
- **Rent overlay**: Official rent index (*Mietspiegel*) of the City of Munich (Open Data) with residential-zone and reference-value visualisation.
- **Reversible state sharing**: Share your entire configuration (people, addresses, departure times, layer order, filters, and basemaps) seamlessly via URL (`#zone=...`) or as a JSON export / import.
- **Privacy by design**: 100% client-side in the browser. Your private search addresses remain exclusively in your browser's `localStorage` and are never transmitted to third parties.

---

## 🚀 Quickstart

### Prerequisites
- Node.js (version 18 or newer)
- Package manager `npm` (or `bun`)

### Local installation
```bash
# 1. Clone the repository
git clone https://github.com/th-ring/Venn.git
cd Venn

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The application is now available at `http://localhost:3000`.

### Production build
```bash
npm run build
npm run preview
```

---

## 🔑 Map & Routing Providers (BYOK)

Venn is **fully usable without registration or API keys**:
- **Default**: Free OpenStreetMap map tiles and the built-in offline public-transit model.
- **Optional providers** can be configured in the app's settings menu ("Bring Your Own Key") or via environment variables (`.env`):
  - **OpenRouteService (HeiGIT)**: For car, cycling, and pedestrian isochrones via the Heidelberg Geoinformatics API ([Free key](https://account.heigit.org/manage/key)).
  - **Google Maps Platform**: For official Google Maps layers (Roadmap, Satellite, Terrain) and the Google Maps Isochrones API ([Google Cloud Console](https://console.cloud.google.com/google/maps-apis)).

Example `.env` (optional, see `.env.example`):
```env
VITE_GOOGLE_MAPS_API_KEY=""
VITE_ORS_API_KEY=""
```

---

## 🛡️ Security & GitHub Setup

- **Secret Scanning & Push Protection**: We recommend enabling **Secret scanning** and **Push protection** in the repository settings under *Settings → Code security and analysis*.
- **Dependabot**: A configuration file (`.github/dependabot.yml`) is pre-configured and checks for dependency and security updates weekly.

---

## 🙏 Acknowledgements & Third-Party Data

This project integrates and processes open geodata, routing services, and open-source software from various providers.

### 🌐 General Services & Core Technologies

- **[Leaflet](https://leafletjs.com/)** & **[Turf.js](https://turfjs.org/)**: Core open-source libraries for interactive web mapping, spatial analysis, and geometric intersection calculations.
- **[OpenStreetMap](https://www.openstreetmap.org/)**: Global street and infrastructure geodata, highway networks, and Nominatim geocoding.  
  *© OpenStreetMap contributors, licensed under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/).*
- **[HeiGIT / OpenRouteService](https://openrouteservice.org/)**: Isochrone and multi-modal routing calculations by the Heidelberg Institute for Geoinformation Technology.
- **[Google Maps Platform](https://developers.google.com/maps)**: Optional provider for official Google Maps basemap layers (Roadmap, Satellite, Terrain) and Google Maps Isochrone APIs.
- **[CARTO](https://carto.com/)**, **[OpenTopoMap](https://opentopomap.org/)**, **[OpenRailwayMap](https://www.openrailwaymap.org/)**: Specialized tile layer and basemap services.
- **[DELFI e.V.](https://www.delfi.de/)**: Nationwide public transport data initiative providing cross-regional schedule and stop feeds (*DELFI Bundesfeed*).

### 📍 Location-Specific Data

City- and region-specific features in Venn rely on three specialized data categories per metropolitan area:
1. **Public Transit Networks**: Topological graph models, scheduled timetables, and stop coordinates (GTFS / Open Data feeds).
2. **Rent Indices & Housing Zones**: Official municipal rent indices (*Mietspiegel*) and statistical district geometries.
3. **Motorway Infrastructure**: Detailed OpenStreetMap vector extracts of motorway interchanges, junctions, and on-/off-ramps for commute optimization.

#### Supported Cities & Regional Sources

- **München (Munich & MVV)**:
  - **Public Transit**: [Münchner Verkehrs- und Tarifverbund (MVV)](https://www.mvv-muenchen.de/) & [Münchner Verkehrsgesellschaft (MVG)](https://www.mvg.de/) via DELFI Bundesfeed and Open Data (S-Bahn, U-Bahn, Tram, Bus).
  - **Rent Index & Housing Zones**: [Landeshauptstadt München](https://opendata.muenchen.de/) – Open Data Geoportal (GeodatenService & Sozialreferat), licensed under *Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0)*.
  - **Motorway Infrastructure**: OpenStreetMap geodata for Munich orbital and radial motorways (A99, A9, A8, A96, A95, A94, B2R Mittlerer Ring).

- **Berlin (Berlin & Brandenburg / VBB)**:
  - **Public Transit**: [Verkehrsverbund Berlin-Brandenburg (VBB)](https://www.vbb.de/) via DELFI Bundesfeed and VBB Open Data (S-Bahn Berlin, U-Bahn, MetroTram, MetroBus), licensed under *dl-de/by-2-0*.
  - **Rent Index & Planning Areas**: [Geoportal Berlin (FIS-Broker)](https://fbinter.stadt-berlin.de/) & Berliner Mietspiegel (LOR-Planungsräume).
  - **Motorway Infrastructure**: OpenStreetMap geodata for Berlin urban motorways (A100, A111, A113, A115, A10 Berliner Ring).

- **Hamburg (Hamburg & Metropolregion / HVV)**:
  - **Public Transit**: [Hamburger Verkehrsverbund (HVV)](https://www.hvv.de/) via DELFI Bundesfeed and HVV Open Data (U-Bahn, S-Bahn, MetroBus, HADAG-Hafenfähren), licensed under *dl-de/by-2-0*.
  - **Rent Index & Districts**: [Transparenzportal Hamburg](https://transparenz.hamburg.de/) & Hamburger Mietenspiegel, licensed under *dl-de/by-2-0*.
  - **Motorway Infrastructure**: OpenStreetMap geodata for Hamburg arterial motorways (A7, A1, A23, A24, A25).

- **Nürnberg (Nürnberg & Franken / VGN)**:
  - **Public Transit**: [Verkehrsverbund Großraum Nürnberg (VGN)](https://www.vgn.de/) via DELFI Bundesfeed and VGN Open Data (U-Bahn Nürnberg, S-Bahn, Straßenbahn, Regionalbusse), licensed under *dl-de/by-2-0*.
  - **Rent Index**: [Open Data Nürnberg](https://opendata.nuernberg.de/) & Nürnberger Mietspiegel, licensed under *dl-de/by-2-0*.
  - **Motorway Infrastructure**: OpenStreetMap geodata for the Franconian motorway network (A3, A6, A9, A73).

- **Frankfurt am Main (Frankfurt / Rhein-Main / RMV)**:
  - **Public Transit**: [Rhein-Main-Verkehrsverbund (RMV)](https://www.rmv.de/) via DELFI Bundesfeed and RMV Open Data (S-Bahn Rhein-Main, U-Bahn Frankfurt, Straßenbahnen, Busse), licensed under *dl-de/by-2-0*.
  - **Rent Index**: [Geoportal Frankfurt](https://geoportal.frankfurt.de/) & Frankfurter Mietspiegel, licensed under *dl-de/by-2-0*.
  - **Motorway Infrastructure**: OpenStreetMap geodata for Frankfurt motorway network and Frankfurter Kreuz (A3, A5, A66).

---

## 📄 License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.

```text
Venn
Copyright 2026 Tobias Häring (th-ring)

Licensed under the Apache License, Version 2.0.
Repository: https://github.com/th-ring/Venn
```
