import L from 'leaflet';
import { PersonProfile } from '../../types';

/**
 * Creates a draggable Google-style vector teardrop pin for a person profile
 */
export function createPersonPinIcon(name: string, color: string): L.DivIcon {
  const initial = (name.trim().charAt(0) || 'P').toUpperCase();
  const markerHtml = `
    <div style="cursor: grab; display: inline-block; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.32)); transition: transform 0.15s ease;" title="${name} (Verschieben um Standort zu ändern)">
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 39C14 34 3 24 3 15C3 7.82 8.82 2 16 2C23.18 2 29 7.82 29 15C29 24 18 34 16 39Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="16" cy="14.5" r="8" fill="#FFFFFF" />
        <text x="16" y="18.2" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="${color}" text-anchor="middle">${initial}</text>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-person-pin',
    html: markerHtml,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -38],
  });
}

/**
 * Creates an inspection point pin icon (Google-style green checkmark or red alert teardrop)
 */
export function createInspectionPinIcon(allWithinLimit: boolean): L.DivIcon {
  const pinBg = allWithinLimit ? '#1e8e3e' : '#d93025';
  const iconMarkup = allWithinLimit
    ? `<path d="M12 14.5L14.8 17.5L20 11.5" stroke="#1e8e3e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    : `<path d="M16 10.5V15M16 17.8V18.3" stroke="#d93025" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;

  const pinIconHtml = `
    <div style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.32)); display: inline-block;">
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 39C14 34 3 24 3 15C3 7.82 8.82 2 16 2C23.18 2 29 7.82 29 15C29 24 18 34 16 39Z" fill="${pinBg}" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="16" cy="14.5" r="8" fill="#FFFFFF"/>
        ${iconMarkup}
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-inspection-pin',
    html: pinIconHtml,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -38],
  });
}

/**
 * Creates a circular station/junction badge for priority heatmap points
 */
export function createPriorityTargetIcon(type: 'ubahn' | 'sbahn' | 'highway'): L.DivIcon {
  const bg =
    type === 'ubahn' ? '#1a73e8' : type === 'sbahn' ? '#1e8e3e' : '#e37400';
  const letter = type === 'ubahn' ? 'U' : type === 'sbahn' ? 'S' : 'A';

  const markerHtml = `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${bg};
      border: 1.8px solid #ffffff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10.5px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      ${letter}
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    className: 'priority-target-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
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
    <div class="min-w-[170px] text-slate-800 dark:text-[#e3e3e3] p-0.5">
      <div class="font-semibold text-sm mb-0.5" style="color: ${profile.color};">
        ${profile.name}
      </div>
      <div class="text-[11px] text-slate-500 dark:text-[#9aa0a6] mb-1.5 leading-snug">
        ${profile.address || 'Gewählter Standort'}
      </div>
      <div class="flex gap-1.5 items-center text-[11px] font-medium text-slate-700 dark:text-[#c4c7c5]">
        <span>Max. ${profile.travelTimeMinutes} Min</span>
        <span>•</span>
        <span>${modeLabel}</span>
      </div>
      <div class="text-[10px] text-slate-400 dark:text-[#9aa0a6] mt-2 border-t border-slate-100 dark:border-[#3c4043] pt-1">
        Pin verschieben, um Standort anzupassen
      </div>
    </div>
  `;
}
