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
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  Loader2,
  Check,
  Palette,
  AlertTriangle,
  X,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { getProfileLineSignature } from '../services/mapPatterns';

// WCAG 1.4.1: Colorblind-safe presets without emerald green (reserved for intersection)
const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#2563EB', // Royal Blue
  '#0EA5E9', // Sky Blue
  '#06B6D4', // Cyan
  '#0D9488', // Teal
  '#6366F1', // Indigo
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
  isochroneInfo?: {
    isFallback?: boolean;
    fallbackReason?: string;
    source?: string;
  } | null;
  onUpdate: (updated: Partial<PersonProfile>) => void;
  onRemove: () => void;
}

const TRANSPORT_MODES: Array<{
  id: TransportMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'transit', label: 'Öffentlicher Nahverkehr (ÖPNV)', icon: Train },
  { id: 'driving', label: 'Pkw / Auto', icon: Car },
  { id: 'cycling', label: 'Fahrrad', icon: Bike },
  { id: 'walking', label: 'Zu Fuß', icon: Footprints },
];

const TIME_PRESETS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90];

export const PersonCard: React.FC<PersonCardProps> = React.memo<PersonCardProps>(({
  profile,
  index,
  totalProfiles,
  isochroneInfo,
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

  // Buffer slider movement with local state to prevent re-render spikes across the tree
  const [localTravelTime, setLocalTravelTime] = useState(profile.travelTimeMinutes);
  const travelTimeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalTravelTime(profile.travelTimeMinutes);
  }, [profile.travelTimeMinutes]);

  useEffect(() => {
    return () => {
      if (travelTimeDebounceRef.current) {
        clearTimeout(travelTimeDebounceRef.current);
      }
    };
  }, []);

  const commitTravelTime = (val: number) => {
    if (travelTimeDebounceRef.current) {
      clearTimeout(travelTimeDebounceRef.current);
      travelTimeDebounceRef.current = null;
    }
    if (val !== profile.travelTimeMinutes) {
      onUpdate({ travelTimeMinutes: val });
    }
  };

  const handleTravelTimeChange = (newVal: number) => {
    setLocalTravelTime(newVal);
    if (travelTimeDebounceRef.current) {
      clearTimeout(travelTimeDebounceRef.current);
    }
    travelTimeDebounceRef.current = setTimeout(() => {
      commitTravelTime(newVal);
    }, 150);
  };

  const handleTravelTimeRelease = () => {
    commitTravelTime(localTravelTime);
  };

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

  const lineSig = getProfileLineSignature(index);

  // Identify current transit preset
  const activeTransitModes = profile.transitModes && profile.transitModes.length > 0
    ? profile.transitModes
    : DEFAULT_TRANSIT_SUBMODES;

  const currentPresetType = React.useMemo(() => {
    if (activeTransitModes.length === DEFAULT_TRANSIT_SUBMODES.length) return 'all';
    if (activeTransitModes.length === 2 && activeTransitModes.includes('ubahn') && activeTransitModes.includes('sbahn')) {
      return 'rail';
    }
    if (!activeTransitModes.includes('bus') && !activeTransitModes.includes('expressbus') && activeTransitModes.includes('ubahn')) {
      return 'no_bus';
    }
    return 'custom';
  }, [activeTransitModes]);

  const handleTransitPresetChange = (preset: string) => {
    if (preset === 'all') {
      onUpdate({ transitModes: DEFAULT_TRANSIT_SUBMODES });
    } else if (preset === 'rail') {
      onUpdate({ transitModes: ['ubahn', 'sbahn'] });
    } else if (preset === 'no_bus') {
      onUpdate({ transitModes: ['ubahn', 'sbahn', 'tram', 'train'] });
    } else if (preset === 'custom') {
      // keep current modes and open granular editor
    }
  };

  return (
    <div
      id={`person-card-${profile.id}`}
      className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-slate-200/90 dark:border-[#2f3336] shadow-xs p-3 sm:p-3.5 transition-all hover:shadow-sm relative space-y-2.5"
    >
      {/* 1. Header: Color badge, editable name, and streamlined icon actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Interactive Color Badge & Picker */}
          <div ref={colorPickerContainerRef} className="relative flex-shrink-0">
            <button
              id={`btn-color-picker-${profile.id}`}
              type="button"
              onClick={() => setIsColorPickerOpen((prev) => !prev)}
              className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-[#1a1b1e] shadow-2xs hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-transform"
              style={{ backgroundColor: profile.color }}
              title={`Farbe anpassen (${lineSig.label})`}
              aria-label={`Farbe für ${profile.name} anpassen`}
            />

            {/* Color Picker Popover */}
            {isColorPickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-[#25262a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#383b40] p-3 w-56 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-[#e3e3e3] flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    Farbe wählen
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {profile.color}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
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
                        className="w-8 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-105 border border-black/5 dark:border-white/10 cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Borderless Editable Name */}
          <input
            id={`input-name-${profile.id}`}
            type="text"
            value={profile.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={`Referenzort ${index + 1}`}
            className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-[#5f6368] focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full truncate transition-colors"
          />

          {/* Collapsed state mini-summary */}
          {isCardCollapsed && (
            <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-slate-500 dark:text-[#9aa0a6] font-medium">
              <span className="bg-slate-100 dark:bg-[#25262a] px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-[#c4c7c5]">
                {profile.travelTimeMinutes}m
              </span>
              <span>•</span>
              <span className="truncate max-w-[80px]">
                {profile.mode === 'transit' ? 'ÖPNV' : profile.mode === 'driving' ? 'Pkw' : profile.mode === 'cycling' ? 'Rad' : 'Fuß'}
              </span>
            </div>
          )}
        </div>

        {/* Clean Icon-Only Action Dock */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Advanced ÖPNV Options Trigger (Only when transit is selected) */}
          {profile.mode === 'transit' && !isCardCollapsed && (
            <button
              id={`btn-advanced-transit-${profile.id}`}
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              title="ÖPNV-Präferenzen & Umstiege anpassen"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative ${
                showAdvanced
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#8ab4f8]'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#25262a]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {currentPresetType !== 'all' && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          )}

          {/* Visibility Toggle */}
          <button
            id={`btn-toggle-visible-${profile.id}`}
            type="button"
            onClick={() => onUpdate({ visible: !profile.visible })}
            title={profile.visible ? 'Layer auf Karte ausblenden' : 'Layer einblenden'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              profile.visible
                ? 'text-slate-500 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#25262a]'
                : 'text-slate-300 dark:text-[#5f6368] hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-[#25262a]'
            }`}
          >
            {profile.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Remove Profile (if more than 1) */}
          {totalProfiles > 1 && (
            <button
              id={`btn-remove-person-${profile.id}`}
              type="button"
              onClick={onRemove}
              title="Referenzort entfernen"
              className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Collapse Card */}
          <button
            type="button"
            onClick={() => setIsCardCollapsed((prev) => !prev)}
            title={isCardCollapsed ? 'Details aufklappen' : 'Karte einklappen'}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#25262a] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isCardCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCardCollapsed && (
        <>
          {/* 2. Address Search Input */}
          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
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
                placeholder="Zielort eingeben (z. B. Büro, Campus, Straße)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-[#121315] dark:hover:bg-[#1a1b1e] dark:focus:bg-[#1a1b1e] text-slate-800 dark:text-[#e8eaed] rounded-xl border border-slate-200/80 dark:border-[#2f3336] focus:border-blue-500 dark:focus:border-[#8ab4f8] focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-[#9aa0a6]"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      onUpdate({ address: '' });
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 cursor-pointer"
                    title="Eingabe löschen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Search className="w-3.5 h-3.5 text-slate-300 dark:text-[#5f6368] pointer-events-none" />
                )}
              </div>
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && (
              searchResults.length > 0 ? (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#25262a] rounded-xl shadow-xl border border-slate-200 dark:border-[#383b40] z-50 overflow-hidden py-1 max-h-52 overflow-y-auto">
                  {searchResults.map((res) => (
                    <button
                      key={res.placeId}
                      type="button"
                      onClick={() => handleSelectResult(res)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-[#2f3336] transition-colors flex flex-col gap-0.5 border-b border-slate-100 dark:border-[#383b40] last:border-0 cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800 dark:text-[#e8eaed]">{res.shortName}</span>
                      <span className="text-[11px] text-slate-500 dark:text-[#9aa0a6] truncate">{res.displayName}</span>
                    </button>
                  ))}
                </div>
              ) : !isSearching && searchQuery.trim().length >= 3 ? (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#25262a] rounded-xl shadow-xl border border-slate-200 dark:border-[#383b40] z-50 p-2.5 text-xs text-slate-600 dark:text-[#9aa0a6]">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Kein Ort gefunden</span>
                  </div>
                  <p className="text-[11px] leading-tight">
                    Für „{searchQuery}“ konnte kein Treffer ermittelt werden.
                  </p>
                </div>
              ) : null
            )}
          </div>

          {/* 3. Controls Row: Icon-Only Segment + Travel Time Dropdown & Slider */}
          <div className="flex items-center gap-2 pt-0.5">
            {/* Icon-Only Mode Segment (No text, pure icon affordances with tooltips) */}
            <div
              className="bg-slate-100 dark:bg-[#121315] p-0.5 rounded-xl flex items-center gap-0.5 border border-slate-200/60 dark:border-[#2f3336] shrink-0"
              role="tablist"
              aria-label="Verkehrsmittel auswählen"
            >
              {TRANSPORT_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = profile.mode === mode.id;
                return (
                  <button
                    key={mode.id}
                    id={`btn-mode-${profile.id}-${mode.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => onUpdate({ mode: mode.id })}
                    title={mode.label}
                    aria-label={mode.label}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#25262a] text-blue-600 dark:text-[#8ab4f8] shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-white hover:bg-white/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>

            {/* Travel Time Slider + Quick Minutes Dropdown */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                id={`slider-time-${profile.id}`}
                type="range"
                min="10"
                max="90"
                step="5"
                value={localTravelTime}
                aria-label={`Maximale Reisezeit für ${profile.name}`}
                aria-valuetext={`${localTravelTime} Minuten`}
                onChange={(e) => handleTravelTimeChange(parseInt(e.target.value, 10))}
                onPointerUp={handleTravelTimeRelease}
                onKeyUp={handleTravelTimeRelease}
                className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer h-1.5 bg-slate-200 dark:bg-[#2f3336] rounded-lg appearance-none focus-visible:ring-1 focus-visible:ring-blue-500"
              />

              {/* Direct Minutes Dropdown Selection */}
              <div className="relative shrink-0">
                <select
                  value={TIME_PRESETS.includes(localTravelTime) ? localTravelTime : 'custom'}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      handleTravelTimeChange(val);
                      commitTravelTime(val);
                    }
                  }}
                  className="bg-slate-100 dark:bg-[#25262a] hover:bg-slate-200/70 dark:hover:bg-[#2f3336] text-slate-800 dark:text-[#e8eaed] font-semibold text-xs px-2 py-1 rounded-xl border border-slate-200/80 dark:border-[#383b40] focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none pr-5 transition-colors"
                  title="Reisezeit wählen"
                >
                  {!TIME_PRESETS.includes(localTravelTime) && (
                    <option value="custom">{localTravelTime}m</option>
                  )}
                  {TIME_PRESETS.map((t) => (
                    <option key={t} value={t}>
                      {t}m
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 pointer-events-none text-slate-400" />
              </div>
            </div>
          </div>

          {/* Engine Source Badge (if available, subtle & non-intrusive) */}
          {isochroneInfo?.isFallback && (
            <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Offline-Fallback aktiv</span>
            </div>
          )}

          {/* 4. Progressive Disclosure: Advanced Transit Settings (Dropdowns instead of button walls) */}
          {profile.mode === 'transit' && showAdvanced && (
            <div className="mt-2 bg-slate-50 dark:bg-[#121315] p-3 rounded-2xl border border-slate-200/80 dark:border-[#2f3336] space-y-2.5 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-[#2f3336]">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
                  ÖPNV-Präferenzen
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(false)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-[#8ab4f8] hover:underline cursor-pointer"
                >
                  Fertig
                </button>
              </div>

              {/* 2-Column Dropdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Dropdown 1: Verkehrsträger Bündel */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-[#9aa0a6] block mb-1">
                    Verkehrsmittel:
                  </label>
                  <select
                    value={currentPresetType}
                    onChange={(e) => handleTransitPresetChange(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-[#2f3336] rounded-xl px-2 py-1 text-xs text-slate-800 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Alle (U, S, Bus, Tram, Bahn)</option>
                    <option value="rail">Nur Schiene (U-Bahn & S-Bahn)</option>
                    <option value="no_bus">Ohne Busse</option>
                    <option value="custom">Individuell anpassen...</option>
                  </select>
                </div>

                {/* Dropdown 2: Max. Umstiege */}
                <div>
                  <label htmlFor={`select-transfers-${profile.id}`} className="text-[10px] font-medium text-slate-500 dark:text-[#9aa0a6] block mb-1">
                    Max. Umstiege:
                  </label>
                  <select
                    id={`select-transfers-${profile.id}`}
                    value={profile.maxTransfers ?? 1}
                    onChange={(e) =>
                      onUpdate({
                        maxTransfers: e.target.value === '99' ? undefined : parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-[#2f3336] rounded-xl px-2 py-1 text-xs text-slate-800 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="0">0 (Direktverbindung)</option>
                    <option value="1">Max. 1 Umstieg</option>
                    <option value="2">Max. 2 Umstiege</option>
                    <option value="3">Max. 3 Umstiege</option>
                    <option value="99">Beliebig viele</option>
                  </select>
                </div>

                {/* Dropdown 3: Gehzeit zur Haltestelle */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-[#9aa0a6] block mb-1">
                    Fußweg Einstieg:
                  </label>
                  <select
                    value={profile.maxWalkToStationMin ?? 5}
                    onChange={(e) => onUpdate({ maxWalkToStationMin: parseInt(e.target.value, 10) })}
                    className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-[#2f3336] rounded-xl px-2 py-1 text-xs text-slate-800 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="3">Max. 3 Minuten</option>
                    <option value="5">Max. 5 Minuten</option>
                    <option value="10">Max. 10 Minuten</option>
                    <option value="15">Max. 15 Minuten</option>
                  </select>
                </div>

                {/* Dropdown 4: Umstiegs-Puffer */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-[#9aa0a6] block mb-1">
                    Puffer beim Umstieg:
                  </label>
                  <select
                    value={profile.maxTransferWaitMin ?? 5}
                    onChange={(e) => onUpdate({ maxTransferWaitMin: parseInt(e.target.value, 10) })}
                    className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-[#2f3336] rounded-xl px-2 py-1 text-xs text-slate-800 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="2">2 Min (Schnell)</option>
                    <option value="5">5 Min (Normal)</option>
                    <option value="10">10 Min (Entspannt)</option>
                  </select>
                </div>
              </div>

              {/* Granular Transit Submode Widget (only if custom chosen) */}
              {currentPresetType === 'custom' && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-[#2f3336]">
                  <TransitSubmodeWidget
                    embedded
                    transitModes={profile.transitModes}
                    onChangeTransitModes={(modes) => onUpdate({ transitModes: modes })}
                    title="Einzelne Liniennetze"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});
