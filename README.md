# LivingAreaFinder 🗺️ 🚆 🚗

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**LivingAreaFinder** ist eine interaktive Webanwendung zur gemeinsamen Wohnortsuche für Paare, WGs und Familien. Anhand von **Reisezeit-Isochronen** für unterschiedliche Verkehrsmittel (Öffentlicher Nahverkehr, Pkw, Fahrrad und Fußwege) berechnet die App präzise geometrische Schnittmengen, um ideale Wohngebiete zu finden.

---

## ✨ Hauptfunktionen

- **Multi-Personen-Isochronen**: Berechne zeitgleiche Erreichbarkeits-Polygone für beliebig viele Personen mit individuellen Arbeits- oder Zielorten, Maximalfahrzeiten und Verkehrsmitteln.
- **Geometrische Schnittmengenberechnung**: Automatische Verschmelzung und Schnittmengen-Kalkulation aller Einzel-Isochronen mittels Turf.js.
- **Topologisches ÖPNV-Netzmodell**: Vollständige Modellierung des Münchner U- und S-Bahn-Netzes (DELFI / MVV) mit Gehzeiten zur Station, Taktzeiten und Umstiegsbeschränkungen.
- **Autobahn-Infrastruktur & Auffahrten**: Integrierte OpenStreetMap-Geodaten zu Autobahnkreuzen, Auffahrten und Anschlussstellen zur Pkw-Pendler-Optimierung.
- **Prioritäts-Heatmap**: Gewichtete Erreichbarkeitsanalyse für U-Bahn-, S-Bahn- und Autobahnzugänge direkt auf der Karte.
- **Mietpreis-Overlay**: Offizieller Mietspiegel der Landeshauptstadt München (Open Data) mit Wohnlagen- und Richtwert-Visualisierung.
- **Reversible Zustandsteilung**: Teile deine gesamte Konfiguration (Personen, Adressen, Abfahrtszeiten, Ebenen-Reihenfolge, Filter und Basemaps) nahtlos per URL (`#zone=...`) oder als JSON-Export/Import.
- **Datenschutz by Design**: 100% Client-Side im Browser ausgeführt. Deine privaten Suchadressen verbleiben ausschließlich im lokalen Speicher (`localStorage`) deines Browsers und werden niemals an Dritte übertragen.

---

## 🚀 Quickstart

### Voraussetzungen
- Node.js (Version 18 oder neuer)
- Paketmanager `npm` (oder `bun`)

### Lokale Installation
```bash
# 1. Repository klonen
git clone https://github.com/th-ring/LivingAreaFinder.git
cd LivingAreaFinder

# 2. Abhängigkeiten installieren
npm install

# 3. Entwicklungsserver starten
npm run dev
```

Die Anwendung ist nun unter `http://localhost:3000` im Browser erreichbar.

### Produktions-Build
```bash
npm run build
npm run preview
```

---

## 🔑 Karten & Routing-Provider (BYOK)

LivingAreaFinder ist **vollständig ohne Registrierung und ohne API-Keys** nutzbar:
- **Standard**: Freie OpenStreetMap-Kartenkacheln und das integrierte Offline-ÖPNV-Modell.
- **Optionale Provider** können im Einstellungs-Menü der App („Bring Your Own Key“) oder via Umgebungsvariablen (`.env`) hinterlegt werden:
  - **OpenRouteService (HeiGIT)**: Für Pkw-, Rad- und Fußgänger-Isochronen über die Heidelberger Geoinformatik-API ([Kostenloser Key](https://account.heigit.org/manage/key)).
  - **Google Maps Platform**: Für offizielle Google Maps Kartenlayer (Roadmap, Satellite, Terrain) und die Google Maps Isochrones API ([Google Cloud Console](https://console.cloud.google.com/google/maps-apis)).

Beispiel `.env` (optional, siehe `.env.example`):
```env
VITE_GOOGLE_MAPS_API_KEY=""
VITE_ORS_API_KEY=""
```

---

## 🛡️ Sicherheit & GitHub-Setup

- **Secret Scanning & Push Protection**: Wir empfehlen, in den Repository-Einstellungen unter *Settings -> Code security and analysis* das **Secret scanning** sowie die **Push protection** zu aktivieren.
- **Dependabot**: Eine Konfigurationsdatei (`.github/dependabot.yml`) ist vorkonfiguriert und prüft wöchentlich auf Abhängigkeits- und Sicherheitsaktualisierungen.

---

## 🙏 Danksagungen & Drittanbieter-Daten (Acknowledgements)

Dieses Projekt nutzt und verarbeitet Daten sowie Technologien folgender Anbieter:

- **[OpenStreetMap](https://www.openstreetmap.org/)**: Kartendaten und Geokodierung.  
  *© OpenStreetMap-Mitwirkende, lizenziert unter der [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/).*
- **[HeiGIT / OpenRouteService](https://openrouteservice.org/)**: Isochronen- und Routing-Berechnungen der Heidelberg Institute for Geoinformation Technology.
- **[DELFI e.V.](https://www.delfi.de/) & [Münchner Verkehrs- und Tarifverbund (MVV)](https://www.mvv-muenchen.de/)**: Haltestellen- und Netzdaten des öffentlichen Personennahverkehrs.
- **[Landeshauptstadt München](https://geoportal.muenchen.de/)**: Open Data Geoportal (Mietspiegel und Wohnlagen München).
- **[CARTO](https://carto.com/)**, **[OpenTopoMap](https://opentopomap.org/)**, **[OpenRailwayMap](https://www.openrailwaymap.org/)**: Zusätzliche Basemap- und Layer-Dienste.
- **[Leaflet](https://leafletjs.com/)** & **[Turf.js](https://turfjs.org/)**: Open-Source-Bibliotheken für interaktive Karten und räumliche Geometrieberechnungen.

---

## 📄 Lizenz

Dieses Projekt ist unter der **Apache License, Version 2.0** lizenziert. Weitere Details findest du in der [LICENSE](LICENSE)- und der [NOTICE](NOTICE)-Datei.

```text
LivingAreaFinder
Copyright 2026 Tobias Häring (th-ring)

Licensed under the Apache License, Version 2.0.
Original Repository: https://github.com/th-ring/LivingAreaFinder
```
