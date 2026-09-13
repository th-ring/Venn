# LivingAreaFinder 🗺️ 🚆 🚗

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**LivingAreaFinder** is an interactive web application for finding a shared place to live — built for couples, flatmates, and families. Using **travel-time isochrones** for different modes of transport (public transit, car, bicycle, and walking), the app calculates precise geometric intersections to identify ideal residential areas.

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
git clone https://github.com/th-ring/LivingAreaFinder.git
cd LivingAreaFinder

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

LivingAreaFinder is **fully usable without registration or API keys**:
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

This project uses and processes data and technologies from the following providers:

- **[OpenStreetMap](https://www.openstreetmap.org/)**: Map data and geocoding.  
  *© OpenStreetMap contributors, licensed under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/).*
- **[HeiGIT / OpenRouteService](https://openrouteservice.org/)**: Isochrone and routing calculations by the Heidelberg Institute for Geoinformation Technology.
- **[DELFI e.V.](https://www.delfi.de/) & [Münchner Verkehrs- und Tarifverbund (MVV)](https://www.mvv-muenchen.de/)**: Stop and network data for public transport.
- **[City of Munich](https://geoportal.muenchen.de/)**: Open Data Geoportal (rent index and residential zones for Munich).
- **[CARTO](https://carto.com/)**, **[OpenTopoMap](https://opentopomap.org/)**, **[OpenRailwayMap](https://www.openrailwaymap.org/)**: Additional basemap and layer services.
- **[Leaflet](https://leafletjs.com/)** & **[Turf.js](https://turfjs.org/)**: Open-source libraries for interactive maps and spatial geometry calculations.

---

## 📄 License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.

```text
LivingAreaFinder
Copyright 2026 Tobias Häring (th-ring)

Licensed under the Apache License, Version 2.0.
Original Repository: https://github.com/th-ring/LivingAreaFinder
```
