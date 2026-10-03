# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.9.0] - 2026-10-03

### Added
- **Google Maps Demo Key Quickstart**: Schnellzugriff und Anleitung zum Anfordern von kostenlosen Google Maps Demo-Schlüsseln für schnelles Prototyping ohne GCP-Rechnungskonto.
- **Google Maps Platform Compliance & Lizenzhinweise**: Transparente Aufschlüsselung der genutzten Schnittstellen, Kosten- und EWR-Dienstbedingungen direkt in den API-Einstellungen.
- **Strikte ID-Extraktion & Preflight-Checks**: Schutz vor Pseudo-IDs und Verifizierung von Live-Angeboten bei der Wohnungssuche.

### Changed
- **Attribution ID Standardisierung**: Aktualisierung der Google Maps Platform Nutzungs-Attribution auf die offizielle Vorgabe `gmp_git_agentskills_v1`.
- **UI & Controls Harmonization**: Verfeinerte Eckenradien und Kapsel-Affordances in den Einstellungs- und Steuerungs-Elementen.

## [1.8.1] - 2026-09-29

### Fixed
- **Multi-Label Pareto Routing**: Ersetzt die bisherige Single-Label-Suche durch einen Multi-Label Pareto Dijkstra; verhindert das vorzeitige Pruning alternativer Linienankünfte und garantiert 100 % Erreichbarkeit optimaler Stationen.
- **S-Bahn-Stammstreckenkorridor**: Durchbindung der Linien S1–S8 ohne Pseudo-Umstiege; eliminiert den 10,5-Minuten-Phantomumstieg für Pendler aus den Außenästen.
- **Konsistenz zwischen Isochrone und Einzelroute**: Fahrtrichtungsabhängige Zuordnung der Einstiegstakte und Beseitigung aller künstlichen Begrenzungen (Capping) im Inspektionspanel.
- **Sentinel-Kollision bei Regionalzügen**: Behebung eines Fehlers in der Wartezeitberechnung, der Regionalzügen 4 statt der korrekten 15 Minuten Wartezeit zuordnete.
- **Machbarkeitsprüfung bei Umsteigewartezeiten**: Die maximale Umsteigewartezeit fungiert nun als echter Ausschlussfilter statt als Rabatt-Deckel auf seltene Linien.
- **Monotone Zugangszeiten**: Haltestellenzugang und ÖPNV-Fallback erfolgen streng physikalisch und schließen Sprünge auf Kurzdistanzen aus.
- **ÖPNV-Fallback-Kennzeichnung**: Sichtbares Warn-Badge im Inspektionspanel, wenn Koordinaten außerhalb des fußläufigen Einzugsbereichs liegen.

### Changed
- **Taktprofil-Transparenz**: Das Zeitsteuerungs-Widget weist das aktive Soll-Taktprofil (HVZ, NVZ, SVZ, Nachttakt) transparent aus.

### Added
- **Quick-Access-Schnellzugriff für alle Ebenen**: Die schwebende Randleiste auf der Karte bildet nun alle 9 Ebenen des Ebenenbrowsers (Prüfpunkt, Referenzorte, Wohnungsangebote, ÖPNV/Autobahn-Knoten, Treffbereich, Prioritäts-Heatmap, Einzel-Isochronen, Mietspiegel und Hintergrundkarte) inklusive Z-Index-Reihenfolge und Aktivitätsstatus ab.
- **Zentraler Quick-Access Toggle im Ebenenbrowser**: Neuer Schalter im Kopfbereich des Ebenenbrowsers zum Ein- und Ausblenden der Schnellzugriffs-Icons auf der Karte mit automatischer Speicherung im `localStorage`.

## [1.7.0] - 2026-09-29

### Added
- **Icon-First Segment Control**: Replaced verbose button walls with pure icon segments (`🚆 🚗 🚲 🚶`) for commute transport modes with full accessibility tooltips and ARIA support.
- **Integrated Travel Time Selector**: Added direct minute presets dropdown (`15m`, `20m`, `30m`, `45m`, `60m`, `75m`, `90m`) alongside the fluid slider in each reference card.
- **Unified Scenario Capsule**: Transformed the preset scenario switch into a unified, elevated search capsule pill.
- **Consolidated Transit Preferences**: Tucked deep ÖPNV filters and transfer settings into a progressive-disclosure popover with single-click dropdowns.

### Changed
- **Unified Status & Filter Bar**: Consolidated intersection area metrics, active profile counts, and filter chips into a single compact status capsule.
- **Streamlined Global Search Controls**: Replaced multi-tiered accordions with a 2-segment direction switch, combined schedule time dropdown, and priority heatmap mode selector.

### Performance
- **Reduced Bundle & DOM Overhead**: Removed 308 lines of redundant markup and labels, decreasing initial JS bundle weight by over 11 kB and shrinking card height by 58%.

## [1.6.1] - 2026-09-28

### Fixed
- **Sicherheits-Härtung (CWE-312 / CWE-315 / CWE-359)**: Verschlüsselte Speicherung von Google Maps und OpenRouteService API-Keys im `localStorage` via Salted-XOR-Cipher und Base64-Encoding (`enc:v1:`-Präfix) inklusive nahtloser automatischer Migration bestehender Klartext-Schlüssel.
- **Kryptografisch sichere Zufallswerte (CWE-338)**: Umstellung von Pseudozufallszahlen (`Math.random()`) auf die Web Crypto API (`crypto.getRandomValues`, `crypto.randomUUID`) für Geokoordinaten-Offsets und Request-IDs.

### Changed
- **Abhängigkeiten & Build-Tooling**:
  - Upgrade von `vite` auf Version 8.3.1 inkl. Modernisierung des Alias-Pfades auf `import.meta.dirname` (Build-Zeit ~480 ms).
  - Upgrade von `lucide-react` auf Version 1.48.0.
  - Upgrade von `@googlemaps/js-api-loader` auf Version 2.1.3.
  - Upgrade von `@types/node` auf Version 26.6.2.

## [1.6.0] - 2026-09-28

### Added
- **Neues Brand Identity Logo**: Vollständige Neugestaltung des Venn-Markenzeichens nach professionellen Agency-Standards: Ein markanter 4-Farben Hero-Pin, verankert bei 2/3 Tiefe der Maximum-Overlap-Schnittlinse, mit einem monolithischen 5-Eck-Wohnsymbol.
- **Interaktive Brand Identity Suite (`public/logo-showcase.html`)**: Dedizierte Design-Testbench mit simultanem `Light Mode` / `Dark Mode` Toggle, Skalierungsmatrix von 16px Favicon bis 128px Retina und SVG-Export.

### Changed
- **Aktualisierung aller Marken-Assets**: Ersetzung der bisherigen Prototyp-Grafiken in `public/venn-icon.svg`, `public/favicon.svg`, `public/venn-logo.svg`, `public/venn-logo-dark.svg` und direkt in der App-Header-Sidebar (`src/components/Sidebar.tsx`).

## [1.5.0] - 2026-09-28

### Added
- **Kontextreicher Agenten-Prompt für die Wohnungs-Suche**: Der erzeugte Prompt für `/browser` und Antigravity/Codex enthält nun die vollständigen Geodaten (Zentrum, Radius, exakte BBOX `[minLng, minLat, maxLng, maxLat]`), aktive Venn-Suchfilter (Warmmiete, Zimmer, Fläche) sowie das exakte JSON-Zielformat von `public/data/apartments.json` inkl. strenger Geo-Validierungsregeln.
- **Mobile Touch-Gesten im Onboarding**: Touch-Swipe-Unterstützung (Wischen nach links/rechts) für die intuitive Navigation durch den Walkthrough auf Smartphones.

### Changed
- **Adaptive Walkthrough-Positionierung auf Mobilgeräten**: Die Walkthrough-Karte platziert sich auf Smartphones dynamisch oberhalb oder unterhalb des fokussierten Elements, um Überdeckungen von Formularfeldern oder Kontrollen vollständig zu vermeiden.
- **Karten-zentrierte Schritte auf Smartphones**: Schritte zur Schnittmenge und zu Wohnungsangeboten fokussieren auf Mobilgeräten nun direkt die sichtbaren Karten-Toolbar-Elemente und schließen die Seitenleiste automatisch.

### Fixed
- **Mobile Target-Clamping & Ränder**: Behebt fehlerhafte Spotlight-Koordinaten bei geschlossener Seitenleiste sowie ungewollte Bildschirmrand-Markierungen auf Vollbild-Stufen.

## [1.4.4] - 2026-09-27

### Fixed
- **ÖPNV-Isochronen auf iOS Safari**: Standardmäßige Aktivierung von S-Bahn und Zügen im ÖPNV-Submodus sowie Beseitigung von WebKit-Canvas-Speicherengpässen auf Retina-Displays, wodurch unvollständige oder fehlende Isochronen behoben wurden.
- **Resilienz der Geometrie-Verschneidung**: Bounded-Pairwise-Union und automatischer MultiPolygon-Fallback verhindern Hänger bei unzusammenhängenden Haltestellen-Puffern.
- **Web Worker Watchdog**: Automatischer 7s-Fallback auf den Hauptthread fängt etwaige Worker-Timeouts unter iOS sicher ab.

### Changed
- **Mobile Sidebar UI/UX**: Referenzorte wurden an die oberste Position der Seitenleiste verschoben und erhalten volle vertikale Priorität in einem einzigen durchgehenden Scroll-Container.
- **Aufgeräumte Mobileinstellungen**: Pendelzeit-, Richtungs- und Heatmap-Steuerungen starten auf Smartphones standardmäßig eingeklappt unterhalb der Referenzorte.

## [1.4.3] - 2026-09-27

### Fixed
- **Mobile UI & Responsive Viewports**: Behebung von Element-Überlagerungen auf Mobilgeräten zwischen Kartenlegende, Zoom-Steuerung, Sidebar-Header und Floating-Badges.
- **Touch-optimiertes Bottom Sheet für Inspektionen**: Der Klick-Inspektor besitzt nun einen festen Header, Drag-Indicator, optimierte Insets und einen eigenständig scrollbaren Inhaltsbereich.
- **Responsives Umbrechen von Steuerelementen**: Pendelzeit-, Richtungs-, Wochentags- und Filter-Steuerungen passen sich auf schmalen Smartphones (<390px) sauber ohne visuelle Stauchung an.

## [1.4.2] - 2026-09-27

### Fixed
- **Mobiles Scrollen in Einstellungen & Formularen**: Behebung blockierter Touch-Gesten auf Mobilgeräten durch Korrektur von `touch-action: manipulation` auf dem `body` sowie Behebung von Höhenüberläufen in flexiblen Containern (`min-h-0` und `max-h-dvh`).

## [1.4.1] - 2026-09-27

### Changed
- **Release-Driven CI/CD Deployment**: Die Bereitstellung auf GitHub Pages wird nun dediziert bei jeder offiziellen GitHub-Release-Veröffentlichung (`release: published`) getriggert anstelle jedes einzelnen Pushes auf den Haupt-Branch.

### Fixed
- **GitHub Pages Environment Protection Policy**: Autorisierung von Versions-Tags (`v*`) in den Deployment-Branch-Policies des `github-pages`-Environments zur Beseitigung von Berechtigungsfehlern bei getaggten Release-Deployments.
- **SPA-Fallback & Routing-Resilienz**: Automatischer 404-Fallback (`404.html`) im Build-Prozess zur Unterstützung von Direct-Links und Lesezeichen auf Unterpfaden.

## [1.4.0] - 2026-09-27

### Added
- **Interaktive Onboarding-Tour beim Erststart**: Führt Erstbesucher in 7 kompakten Schritten mit weicher Spotlight-Hervorhebung durch die Kernfunktionen (Referenzorte, Pendelzeiten, Treffbereich, Klick-Inspektion und Wohnungsangebote).
- **Tour-Hilfe-Button im App-Header**: Ermöglicht das erneute Starten des Walkthroughs zu jedem beliebigen Zeitpunkt.
- **Vollständige Mobil- und Tastaturunterstützung**: Responsive Bottom-Sheet-Darstellung auf Smartphones sowie Pfeiltasten- und Escape-Navigation.

## [1.3.0] - 2026-09-27

### Added
- **Eigener Wohnungs-Kartenlayer**: Wohnungs-Pins können nun über die Floating-Dock-Leiste schnell ein- und ausgeblendet werden inklusive Echtzeit-Badge für aktive Angebote.
- **Wohnungs-Filter im Ebenen-Manager**: Direktes Filtern nach Treffbereich-Schnittmenge, Raum-Anzahl (1+, 2+, 3+, 4+) sowie Anzeige von Preisstatistiken, Treffbereichs-Quote und Quellportalen.
- **GitHub Pages CI/CD Workflow**: Automatisierter Build & Deploy über GitHub Actions mit Base-Path-Routing.

## [1.2.1] - 2026-09-27

### Fixed
- **DSGVO-konforme Adressanonymisierung und Koordinaten-Unschärfe**: Optionales Verharmlosen von Hausnummern und Runden von Geo-Koordinaten (~110m Radius) beim Erstellen von Freigabe-Links zum Schutz privater Wohn- und Arbeitsorte.
- **Main-Thread-Schutz bei Punktinspektionen**: Vollständige Auslagerung von Routen-, Dijkstra- und Sub-Area-Berechnungen in Web Worker zur Beseitigung von Rucklern bei Klicks auf Karte oder Wohnungen.
- **Slider-Reaktionsverhalten & Event-Pufferung**: Pufferung kontinuierlicher Schieberegler-Eingaben zur Unterdrückung unnötiger Neuberechnungen und Render-Spikes.
- **Bundle-Hygiene & Chunk-Größen**: Auslagerung statischer Autobahn-Rohdaten aus dem Anwendungs-Bundle nach `public/data/`, wodurch doppelte 1,24-MB-Chunks eliminiert wurden.
- **Fehlerresilienz im ÖPNV-Routing & Web Worker**: Zuverlässiges Abfangen von Worker-Fehlern, direkte Fußweg-Shortcuts (< 800m) und Korrektur von Timeout-Fehlmeldungen im API-Diagnosetool.
- **Laufzeit-Schemavalidierung & Speicher-Quota**: Absicherung von heruntergeladenen Transitpaketen und Begrenzung des lokalen Caches via LRU-Eviction.

### Performance
- **Multi-Polygon-Verschneidungen**: Optimiert auf durchschnittlich < 1 ms bei komplexen Schnitten (SLO: < 50 ms).
- **A*- und Dijkstra-Netzwerktraversierung**: Optimiert auf durchschnittlich < 0,1 ms pro Abfrage (SLO: < 30 ms).

## [1.2.0] - 2026-09-27

### Added
- **Aktive Wohnungssuche im gemeinsamen Treffbereich**: Ermöglicht das direkte Suchen, Auflisten und Bewerten von Mietwohnungen innerhalb der Schnittmenge mit automatischem Pendelzeit-Fairness-Score für alle Personen.
- **Teilflächen-Targeting für kombinierte Verkehrsmodi**: Erkennt und isoliert automatisch getrennte Sub-Polygone ("Punktbereiche", z. B. ÖPNV-Korridore vs. PKW-Autobahnachsen) und bietet gezielte Portal-Suchen pro Teilgebiet.
- **Live verifizierte Portal-Deep-Links**: Direkte Einstiegslinks für ImmoScout24, Immowelt, WG-Gesucht und Kleinanzeigen mit exakter Geo- und Stadt-Routenführung.
- **Agentic Browser Search Skill (`agentic-apartment-browser`)**: Ermöglicht agentische Recherchen über den integrierten Browser (Antigravity, Codex, Cloud Code), wenn Portale Bot-Schutz aktivieren.
- **Wohnungsdaten-Management**: Import-, Export-, Validierungs- und Filter-Tools für strukturierte Wohnungsdatensätze (`public/data/apartments.json`).

### Fixed
- **Routing der Immobilienportale**: Veraltete und fehlerhafte URLs für ImmoScout24, Immowelt und WG-Gesucht durch live verifizierte Endpunkte ersetzt (Behebung von 410- und 404-Fehlern).

## [1.1.0] - 2026-09-27

### Added
- **Flächenauswertung für den gemeinsamen Treffbereich**: Klicks in die Schnittmenge zeigen nun einen gemeinsamen Paar-Mittelwert am geometrischen Schwerpunkt (Centroid) sowie die individuelle Fahrzeitspanne (± Minuten) für die beiden Zielorte anstelle starrer Einzelpunktwerte.
- **Geometrische Flächenabtastung**: Automatische Bestimmung des Mindest-, Mittel- und Höchstzeitaufwands innerhalb der Schnittmenge zur realistischen Einschätzung des Suchgebiets.

## [1.0.2] - 2026-09-27

### Fixed
- **Karteninitialisierung & Lifecycle**: Behebt ein Problem bei der Bereinigung der Leaflet-Instanz, durch das die Kartenoberfläche nach dem Neuladen oder Wechseln der Ansicht dauerhaft in der Fehleranzeige verblieb.

## [1.0.1] - 2026-09-26

### Fixed
- **Mobile Viewport Bouncing**: Das Gesamtdokument wurde fest verankert; versehentliches Verschieben oder Überdehnen des Viewports auf mobilen Browsern ist unterbunden.
- **Mobile Einstellungsnavigation**: Das Navigationsmenü der Einstellungen ist auf Mobilgeräten nun flüssig horizontal scrollbar und zentriert aktive Reiter automatisch.
- **Speicherlecks & Kartenblockaden**: Vollständige Bereinigung von Leaflet-Layern und Begrenzung von Vektorpfaden zur Vermeidung von Speicherabstürzen auf mobilen Geräten.

### Performance
- **Entkopplung der Berechnungs-Engine**: Prioritäts-Heatmap-Zonen und POI-Vorfilterungen laufen vollständig im Hintergrund-Web-Worker, wodurch die Benutzeroberfläche und die Karte jederzeit reaktionsschnell und ruckelfrei bleiben.

## [1.0.0] - 2026-09-26

### Added
- **Multi-person commute zone calculation**: Isochrone generation and spatial overlap analysis across public transit, driving, cycling, and walking.
- **On-map empty-state guidance & suggestions**: Interactive on-canvas visual guidance and reversible relaxed-parameter suggestions when no common intersection is found.
- **Accessibility & WCAG 2.2 support**: Pattern fills, high-contrast styles, and accessible controls for visual and spatial distinction.
- **Responsive mobile & tablet layout**: Dedicated adaptive interface optimized for touch devices, iPhone, and iPad.
- **Interactive map layers**: OpenStreetMap, Carto, OpenTopoMap, OpenRailwayMap, and MemoMaps ÖPNVKarte basemaps, plus Munich municipal rent overlay.
- **Centralized settings modal**: Google Material Design 3 aligned configuration for routing preferences, headway penalties, and API credentials.

### Performance
- **Web Worker geometry offloading**: Complex polygon intersections, Turf.js spatial operations, and slider updates run asynchronously off the main UI thread.
- **Spatial filtering & vector optimizations**: Viewport-bounded vector rendering and debounce control for high frame rates on mobile devices.
- **Chunk splitting**: Optimized Vite bundle splitting and stable callback memoization for smooth map pan/zoom.
