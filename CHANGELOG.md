# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
