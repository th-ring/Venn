import L from 'leaflet';
import { PersonProfile } from '../../types';

/**
 * Creates a draggable custom pin icon for a person profile
 */
export function createPersonPinIcon(name: string, color: string): L.DivIcon {
  const initial = (name.trim().charAt(0) || 'P').toUpperCase();
  const markerHtml = `
    <div style="
      background-color: ${color};
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 13px;
      cursor: grab;
      user-select: none;
      transition: transform 0.15s ease;
    " title="${name} (Verschieben um Standort zu ändern)">
      ${initial}
    </div>
  `;

  return L.divIcon({
    className: 'custom-person-pin',
    html: markerHtml,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/**
 * Creates an inspection point pin icon (green checkmark or red exclamation)
 */
export function createInspectionPinIcon(allWithinLimit: boolean): L.DivIcon {
  const pinBg = allWithinLimit ? '#059669' : '#dc2626';
  const pinIconHtml = `
    <div style="
      background-color: ${pinBg};
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2.5px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 14px;
        font-weight: bold;
      ">
        ${allWithinLimit ? '✓' : '!'}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-inspection-pin',
    html: pinIconHtml,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

/**
 * Creates a circular station/junction badge for priority heatmap points
 */
export function createPriorityTargetIcon(type: 'ubahn' | 'sbahn' | 'highway'): L.DivIcon {
  const bg =
    type === 'ubahn' ? '#2563eb' : type === 'sbahn' ? '#059669' : '#ea580c';
  const letter = type === 'ubahn' ? 'U' : type === 'sbahn' ? 'S' : 'A';

  const markerHtml = `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${bg};
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
    ">
      ${letter}
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    className: 'priority-target-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/**
 * Builds HTML markup for the person marker popup
 */
export function createPersonPopupHtml(profile: PersonProfile): string {
  const modeLabel =
    profile.mode === 'transit'
      ? 'ÖPNV'
      : profile.mode === 'driving'
      ? 'Auto'
      : profile.mode === 'cycling'
      ? 'Fahrrad'
      : 'Zu Fuß';

  return `
    <div style="font-family: sans-serif; min-width: 170px;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; color: ${profile.color};">
        ${profile.name}
      </div>
      <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
        ${profile.address || 'Gewählter Standort'}
      </div>
      <div style="display: flex; gap: 4px; align-items: center; font-size: 11px; font-weight: 600; color: #1e293b;">
        <span>⏱️ Max. ${profile.travelTimeMinutes} Min</span>
        <span>•</span>
        <span>${modeLabel}</span>
      </div>
      <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
        Pin ziehen, um Wohnort zu ändern
      </div>
    </div>
  `;
}
