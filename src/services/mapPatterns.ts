/**
 * SVG Patterns and Dash Styles for Isochrone Accessibility (WCAG 2.2 / DIN EN 301 549)
 * Ensures overlapping reachability polygons and intersections are distinguished by
 * patterns and line signatures in addition to color alone (WCAG 1.4.1).
 */

export interface ProfileLineSignature {
  dashArray?: string;
  weight: number;
  label: string;
  patternId: string;
}

export const PROFILE_SIGNATURES: ProfileLineSignature[] = [
  {
    dashArray: undefined, // Solid
    weight: 3,
    label: 'Durchgezogene Kontur',
    patternId: 'venn-pat-stripe-45',
  },
  {
    dashArray: '9, 6', // Dashed
    weight: 3,
    label: 'Gestrichelte Kontur',
    patternId: 'venn-pat-stripe-135',
  },
  {
    dashArray: '3, 6', // Dotted
    weight: 3,
    label: 'Gepunktete Kontur',
    patternId: 'venn-pat-dots',
  },
  {
    dashArray: '12, 4, 3, 4', // Dash-dot
    weight: 3,
    label: 'Strich-Punkt-Kontur',
    patternId: 'venn-pat-horizontal',
  },
  {
    dashArray: '16, 6', // Long dash
    weight: 3,
    label: 'Langstrich-Kontur',
    patternId: 'venn-pat-grid',
  },
];

export function getProfileLineSignature(index: number, isDark = false): ProfileLineSignature {
  const sig = PROFILE_SIGNATURES[index % PROFILE_SIGNATURES.length];
  return {
    ...sig,
    weight: isDark ? sig.weight + 0.5 : sig.weight,
  };
}

/**
 * Injects SVG <defs> into the Leaflet overlay SVG pane to provide crosshatching
 * and accessible SVG fill patterns.
 */
export function injectMapPatternDefs(container: HTMLElement, isDark = false): void {
  const svg = container.querySelector('svg.leaflet-zoom-animated') || container.querySelector('.leaflet-overlay-pane svg');
  if (!svg) return;

  const existingDefs = svg.querySelector('#venn-pattern-defs');
  if (existingDefs) return;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.id = 'venn-pattern-defs';

  const strokeColor = isDark ? '#34d399' : '#047857';

  defs.innerHTML = `
    <!-- Crosshatch pattern for Golden Intersection (Schnittmenge) -->
    <pattern id="venn-pat-intersection" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M 0 0 L 12 12 M 12 0 L 0 12" stroke="${strokeColor}" stroke-width="2" opacity="0.65" />
    </pattern>
    <!-- Diagonal right pattern -->
    <pattern id="venn-pat-stripe-45" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="2" opacity="0.4" />
    </pattern>
    <!-- Diagonal left pattern -->
    <pattern id="venn-pat-stripe-135" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="2" opacity="0.4" />
    </pattern>
    <!-- Dots pattern -->
    <pattern id="venn-pat-dots" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.5" />
    </pattern>
    <!-- Horizontal lines -->
    <pattern id="venn-pat-horizontal" width="8" height="8" patternUnits="userSpaceOnUse">
      <line x1="0" y1="4" x2="8" y2="4" stroke="currentColor" stroke-width="1.5" opacity="0.45" />
    </pattern>
    <!-- Grid pattern -->
    <pattern id="venn-pat-grid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 0 5 L 10 5 M 5 0 L 5 10" stroke="currentColor" stroke-width="1.5" opacity="0.45" />
    </pattern>
  `;

  svg.insertBefore(defs, svg.firstChild);
}
