# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Kontextreicher Agenten-Prompt für die Browser-Suche**: Der erzeugte Prompt für `/browser` und Antigravity/Codex enthält nun die vollständigen Geodaten (Zentrum, Radius, exakte BBOX `[minLng, minLat, maxLng, maxLat]`), aktive Venn-Suchfilter (Warmmiete, Zimmer, Fläche) sowie das exakte JSON-Zielformat von `public/data/apartments.json` inkl. strenger Geo-Validierungsregeln.

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
