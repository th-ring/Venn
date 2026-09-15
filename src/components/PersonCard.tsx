import React, { useState, useEffect, useRef } from 'react';
import {
  PersonProfile,
  TransportMode,
  TransitSubMode,
  ALL_TRANSIT_SUBMODES,
  DEFAULT_TRANSIT_SUBMODES,
} from '../types';
import { TransitSubmodeWidget } from './commute/TransitSubmodeWidget';
import { searchAddress, GeocodingResult } from '../services/geocoding';
import {
  Train,
  Car,
  Bike,
  Footprints,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  Loader2,
  Check,
  Palette,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
} from 'lucide-react';

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#2563EB', // Royal Blue
  '#0EA5E9', // Sky Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald Green
  '#059669', // Dark Green
  '#84CC16', // Lime
  '#EAB308', // Amber / Yellow
  '#F97316', // Orange
  '#EA580C', // Rust Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#D946EF', // Fuchsia
  '#A855F7', // Purple
  '#8B5CF6', // Violet
  '#64748B', // Slate
];

interface PersonCardProps {
  profile: PersonProfile;
  index: number;
  totalProfiles: number;
  isochroneFeature?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  onUpdate: (updated: Partial<PersonProfile>) => void;
  onRemove: () => void;
}

const TRANSPORT_MODES: Array<{
  id: TransportMode;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'transit', label: 'ÖPNV (Bahn / Bus)', shortLabel: 'ÖPNV', icon: Train },
  { id: 'driving', label: 'Pkw (Auto)', shortLabel: 'Pkw', icon: Car },
  { id: 'cycling', label: 'Fahrrad', shortLabel: 'Fahrrad', icon: Bike },
  { id: 'walking', label: 'Zu Fuß', shortLabel: 'Zu Fuß', icon: Footprints },
];

interface MinutePickerProps {
  id?: string;
  value: number | undefined;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
}

const MinutePicker: React.FC<MinutePickerProps> = ({
  id,
  value,
  defaultValue = 5,
  min = 0,
  max = 60,
  step = 1,
  onChange,
}) => {
  const currentVal = value ?? defaultValue;
  const [localVal, setLocalVal] = useState<string>(String(currentVal));

  useEffect(() => {
    setLocalVal(String(value ?? defaultValue));
  }, [value, defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);
    if (raw === '') return;
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)));
    }
  };

  const handleBlur = () => {
    const num = parseInt(localVal, 10);
    if (isNaN(num)) {
      setLocalVal(String(defaultValue));
      onChange(defaultValue);
    } else {
      const clamped = Math.max(min, Math.min(max, num));
      setLocalVal(String(clamped));
      onChange(clamped);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full bg-slate-50/80 dark:bg-[#131314] border border-slate-200 dark:border-[#3c4043] rounded-md px-2 py-1 text-xs text-slate-700 dark:text-[#e3e3e3] focus:outline-none focus:border-blue-500 dark:focus:border-[#8ab4f8] focus:bg-white dark:focus:bg-[#1e1f20] transition-colors"
      />
      <span className="text-xs text-slate-500 dark:text-[#9aa0a6] font-medium select-none">Min</span>
    </div>
  );
};

export const PersonCard: React.FC<PersonCardProps> = ({
  profile,
  index,
  totalProfiles,
  isochroneFeature,
  onUpdate,
  onRemove,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(profile.address || '');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isCardCollapsed, setIsCardCollapsed] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const colorPickerContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal search input when address prop changes
  useEffect(() => {
    setSearchQuery(profile.address || '');
  }, [profile.address]);

  // Debounced geocoding search
  useEffect(() => {
    if (!isSearchOpen || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchAddress(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 380);

    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (colorPickerContainerRef.current && !colorPickerContainerRef.current.contains(e.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (res: GeocodingResult) => {
    onUpdate({
      address: res.shortName || res.displayName,
      lat: res.lat,
      lng: res.lng,
    });
    setSearchQuery(res.shortName || res.displayName);
    setIsSearchOpen(false);
  };

  return (
    <div
      id={`person-card-${profile.id}`}
      className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-[#3c4043] shadow-sm p-4 transition-all hover:shadow-md relative"
    >
      {/* Header: Name, interactive color badge & popover, toggle & delete */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Interactive Color Badge & Picker */}
          <div ref={colorPickerContainerRef} className="relative flex-shrink-0">
            <button
              id={`btn-color-picker-${profile.id}`}
              type="button"
              onClick={() => setIsColorPickerOpen((prev) => !prev)}
              className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#1e1f20] shadow-sm flex items-center justify-center transition-all opacity-90 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              style={{ backgroundColor: profile.color }}
              title="Klicken, um Farbe anzupassen"
            >
              <span className="sr-only">Farbe anpassen</span>
            </button>

            {/* Color Picker Popover */}
            {isColorPickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-[#282a2c] rounded-2xl shadow-xl border border-slate-200 dark:border-[#3c4043] p-3 w-56 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-[#e3e3e3] flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6]" />
                    Farbe wählen
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-[#9aa0a6] uppercase">
                    {profile.color}
                  </span>
                </div>

                {/* Preset Palette */}
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {COLOR_PRESETS.map((color) => {
                    const isSelected = profile.color.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          onUpdate({ color });
                          setIsColorPickerOpen(false);
                        }}
                        className="w-9 h-7 rounded-lg flex items-center justify-center shadow-xs transition-opacity hover:opacity-90 border border-black/5 dark:border-white/10 cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#3c4043]">
                  <label
                    htmlFor={`input-custom-color-${profile.id}`}
                    className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-medium whitespace-nowrap"
                  >
                    Eigene Farbe:
                  </label>
                  <input
                    id={`input-custom-color-${profile.id}`}
                    type="color"
                    value={profile.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
                    title="Freie Farbauswahl"
                  />
                  <input
                    type="text"
                    value={profile.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="text-[11px] font-mono px-1.5 py-0.5 border border-slate-200 dark:border-[#3c4043] rounded text-slate-700 dark:text-[#e3e3e3] bg-white dark:bg-[#1e1f20] w-16 text-center uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          <input
            id={`input-name-${profile.id}`}
            type="text"
            value={profile.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={`Referenzort ${index + 1}`}
            className="font-semibold text-slate-800 dark:text-[#e3e3e3] text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-[#5f6368] focus:border-blue-500 dark:focus:border-[#8ab4f8] focus:outline-none px-1 py-0.5 w-full truncate transition-colors"
          />
          {isCardCollapsed && (
            <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-slate-500 dark:text-[#9aa0a6] font-medium">
              <span className="bg-slate-100 dark:bg-[#282a2c] px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-[#c4c7c5]">
                {profile.travelTimeMinutes} Min
              </span>
              <span className="text-slate-400 dark:text-[#9aa0a6]">•</span>
              <span className="truncate max-w-[90px]">{profile.mode === 'transit' ? 'ÖPNV' : profile.mode === 'driving' ? 'Pkw' : profile.mode === 'cycling' ? 'Fahrrad' : 'Zu Fuß'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            id={`btn-toggle-visible-${profile.id}`}
            type="button"
            onClick={() => onUpdate({ visible: !profile.visible })}
            title={profile.visible ? 'Layer auf Karte ausblenden' : 'Layer einblenden'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              profile.visible ? 'text-slate-600 dark:text-[#c4c7c5] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282a2c]' : 'text-slate-300 dark:text-[#5f6368] hover:text-slate-500 dark:hover:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#282a2c]'
            }`}
          >
            {profile.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {totalProfiles > 1 && (
            <button
              id={`btn-remove-person-${profile.id}`}
              type="button"
              onClick={onRemove}
              title="Referenzort entfernen"
              className="p-1.5 rounded-lg text-slate-400 dark:text-[#9aa0a6] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCardCollapsed((prev) => !prev)}
            title={isCardCollapsed ? 'Details aufklappen' : 'Karte einklappen'}
            className="p-1.5 rounded-lg text-slate-400 dark:text-[#9aa0a6] hover:text-slate-700 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            {isCardCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCardCollapsed && (
        <>
          {/* Address Search with Autocomplete */}
          <div ref={searchContainerRef} className="relative mb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-[#9aa0a6]">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            id={`input-address-${profile.id}`}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Zielort suchen (z. B. Büro, Campus, Straße)..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white dark:bg-[#131314] dark:hover:bg-[#282a2c] dark:focus:bg-[#1e1f20] text-slate-800 dark:text-[#e3e3e3] rounded-xl border border-slate-200 dark:border-[#3c4043] focus:border-blue-500 dark:focus:border-[#8ab4f8] focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-[#9aa0a6]"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 dark:text-[#8ab4f8]" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#9aa0a6]" />
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#282a2c] rounded-xl shadow-xl border border-slate-200 dark:border-[#3c4043] z-50 overflow-hidden py-1 max-h-56 overflow-y-auto">
            {searchResults.map((res) => (
              <button
                key={res.placeId}
                type="button"
                onClick={() => handleSelectResult(res)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-[#3c4043] transition-colors flex flex-col gap-0.5 border-b border-slate-100 dark:border-[#3c4043] last:border-0"
              >
                <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">{res.shortName}</span>
                <span className="text-[11px] text-slate-400 dark:text-[#9aa0a6] truncate">{res.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transport Mode Selection */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-600 dark:text-[#9aa0a6] mb-1.5">
          Verkehrsmittel
        </label>
        <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-[#131314] p-1 rounded-xl">
          {TRANSPORT_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = profile.mode === mode.id;
            return (
              <button
                key={mode.id}
                id={`btn-mode-${profile.id}-${mode.id}`}
                type="button"
                onClick={() => onUpdate({ mode: mode.id })}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#282a2c] text-blue-700 dark:text-[#8ab4f8] shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e8eaed] hover:bg-white/60 dark:hover:bg-[#282a2c]/60'
                }`}
                title={mode.label}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] leading-tight truncate">{mode.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Travel Time Slider */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-600 dark:text-[#9aa0a6]">
              Maximale Reisezeit
            </span>
            {isochroneFeature && (
              <>
                {isochroneFeature.properties?.isFallback ? (
                  <span
                    className="text-[9px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                    title={isochroneFeature.properties?.fallbackReason || 'API-Fehler: Offline-Fallback aktiv'}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Fallback</span>
                  </span>
                ) : isochroneFeature.properties?.source === 'ors' ? (
                  <span
                    className="text-[9px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded-full"
                    title="Berechnet über OpenRouteService (OSM)"
                  >
                    ORS (OSM)
                  </span>
                ) : isochroneFeature.properties?.source === 'google' || isochroneFeature.properties?.source === 'google_maps_isochrones' ? (
                  <span
                    className="text-[9px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-full"
                    title="Berechnet über Google Maps Isochrones API"
                  >
                    Google Maps
                  </span>
                ) : isochroneFeature.properties?.source === 'transit_metro_matrix' ? (
                  <span
                    className="text-[9px] font-medium text-blue-700 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded-full"
                    title="Berechnet über regionale ÖPNV-Fahrplanmatrix"
                  >
                    ÖPNV-Matrix
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-normal text-slate-500 dark:text-[#9aa0a6] bg-slate-100 dark:bg-[#282a2c] border border-slate-200 dark:border-[#3c4043] px-1.5 py-0.2 rounded-full"
                    title="Integrierte Offline-Heuristik"
                  >
                    Offline
                  </span>
                )}
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#282a2c] text-slate-900 dark:text-[#e8eaed]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.color }} />
            {profile.travelTimeMinutes} Min
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 dark:text-[#9aa0a6]">10m</span>
          <input
            id={`slider-time-${profile.id}`}
            type="range"
            min="10"
            max="90"
            step="5"
            value={profile.travelTimeMinutes}
            onChange={(e) => onUpdate({ travelTimeMinutes: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer h-1.5 bg-slate-200 dark:bg-[#3c4043] rounded-lg appearance-none"
          />
          <span className="text-[11px] text-slate-400 dark:text-[#9aa0a6]">90m</span>
        </div>
      </div>

      {/* Advanced Transit Filters (FR-2.4) - only when ÖPNV selected */}
      {profile.mode === 'transit' && (() => {
        const activeTransitModes =
          profile.transitModes && profile.transitModes.length > 0
            ? profile.transitModes
            : DEFAULT_TRANSIT_SUBMODES;

        return (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#3c4043]">
            <button
              id={`btn-advanced-transit-${profile.id}`}
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-[#e8eaed] font-medium py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Erweiterte ÖPNV-Einstellungen</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-blue-700 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                  {activeTransitModes.length} von {ALL_TRANSIT_SUBMODES.length} aktiv
                </span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="mt-2 bg-slate-50 dark:bg-[#131314] p-3 rounded-2xl text-xs space-y-3 border border-slate-200/80 dark:border-[#3c4043]">
                {/* ÖPNV-Verkehrsträger / Modalitäten (Tram, U-Bahn, Bus, X-Bus, S-Bahn, Regio) */}
                <TransitSubmodeWidget
                  embedded
                  transitModes={profile.transitModes}
                  onChangeTransitModes={(modes) => onUpdate({ transitModes: modes })}
                  title="Verkehrsmittel für diese Adresse"
                />

                {/* Sub-settings in unified Google M3 list */}
                <div className="bg-white dark:bg-[#1e1f20] rounded-xl border border-slate-200/80 dark:border-[#3c4043] divide-y divide-slate-100 dark:divide-[#3c4043] overflow-hidden">
                  {/* 1. First Mile: Wohnort -> Haltestelle */}
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`picker-walk-to-station-${profile.id}`} className="text-xs font-medium text-slate-800 dark:text-[#e8eaed] flex items-center gap-1.5 cursor-pointer">
                        <Footprints className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6] shrink-0" />
                        <span>Fußweg zur Haltestelle</span>
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-tight">
                        Max. Gehzeit von der Haustür zum Einstieg
                      </p>
                    </div>
                    <div className="w-24 shrink-0">
                      <MinutePicker
                        id={`picker-walk-to-station-${profile.id}`}
                        value={profile.maxWalkToStationMin}
                        defaultValue={5}
                        onChange={(val) => onUpdate({ maxWalkToStationMin: val })}
                      />
                    </div>
                  </div>

                  {/* 2. Last Mile: Haltestelle -> Arbeitsplatz / Ziel */}
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`picker-walk-from-station-${profile.id}`} className="text-xs font-medium text-slate-800 dark:text-[#e8eaed] flex items-center gap-1.5 cursor-pointer">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6] shrink-0" />
                        <span>Fußweg ab Zielhaltestelle</span>
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-tight">
                        Max. Gehzeit vom Ausstieg zum Ziel
                      </p>
                    </div>
                    <div className="w-24 shrink-0">
                      <MinutePicker
                        id={`picker-walk-from-station-${profile.id}`}
                        value={profile.maxWalkFromStationMin}
                        defaultValue={5}
                        onChange={(val) => onUpdate({ maxWalkFromStationMin: val })}
                      />
                    </div>
                  </div>

                  {/* 3. Max. Umstiege */}
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`select-transfers-${profile.id}`} className="text-xs font-medium text-slate-800 dark:text-[#e8eaed] flex items-center gap-1.5 cursor-pointer">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6] shrink-0" />
                        <span>Max. Umstiege</span>
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-tight">
                        Maximal tolerierte Linienwechsel
                      </p>
                    </div>
                    <div className="w-36 shrink-0">
                      <select
                        id={`select-transfers-${profile.id}`}
                        value={profile.maxTransfers ?? 1}
                        onChange={(e) =>
                          onUpdate({
                            maxTransfers: e.target.value === '99' ? undefined : parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-[#131314] border border-slate-200 dark:border-[#3c4043] rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-[#e8eaed] focus:outline-none focus:border-blue-600 dark:focus:border-[#8ab4f8] cursor-pointer"
                      >
                        <option value="0">Direkt (0 Umstiege)</option>
                        <option value="1">Max. 1 Umstieg</option>
                        <option value="2">Max. 2 Umstiege</option>
                        <option value="3">Max. 3 Umstiege</option>
                        <option value="99">Beliebig</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Max. Umstiegszeit */}
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`picker-transfer-wait-${profile.id}`} className="text-xs font-medium text-slate-800 dark:text-[#e8eaed] flex items-center gap-1.5 cursor-pointer">
                        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6] shrink-0" />
                        <span>Puffer beim Umstieg</span>
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-tight">
                        Zeitpuffer beim Wechsel der Linie
                      </p>
                    </div>
                    <div className="w-24 shrink-0">
                      <MinutePicker
                        id={`picker-transfer-wait-${profile.id}`}
                        value={profile.maxTransferWaitMin}
                        defaultValue={5}
                        onChange={(val) => onUpdate({ maxTransferWaitMin: val })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  )}
</div>
);
};
