import React, { useState, useEffect, useRef } from 'react';
import { PersonProfile, TransportMode } from '../types';
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

export const PersonCard: React.FC<PersonCardProps> = ({
  profile,
  index,
  totalProfiles,
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
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 transition-all hover:shadow-md relative"
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
              className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              style={{ backgroundColor: profile.color }}
              title="Klicken, um Farbe anzupassen"
            >
              <span className="sr-only">Farbe anpassen</span>
            </button>

            {/* Color Picker Popover */}
            {isColorPickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 w-56 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    Farbe wählen
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
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
                        className="w-9 h-7 rounded-lg flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 border border-black/5"
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <label
                    htmlFor={`input-custom-color-${profile.id}`}
                    className="text-[10px] text-slate-500 font-medium whitespace-nowrap"
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
                    className="text-[11px] font-mono px-1.5 py-0.5 border border-slate-200 rounded text-slate-700 w-16 text-center uppercase"
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
            className="font-semibold text-slate-800 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full truncate transition-colors"
          />
          {isCardCollapsed && (
            <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-slate-500 font-medium">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                {profile.travelTimeMinutes} Min
              </span>
              <span className="text-slate-400">•</span>
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
              profile.visible ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCardCollapsed((prev) => !prev)}
            title={isCardCollapsed ? 'Details aufklappen' : 'Karte einklappen'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
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
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 max-h-56 overflow-y-auto">
            {searchResults.map((res) => (
              <button
                key={res.placeId}
                type="button"
                onClick={() => handleSelectResult(res)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors flex flex-col gap-0.5 border-b border-slate-100 last:border-0"
              >
                <span className="font-semibold text-slate-800">{res.shortName}</span>
                <span className="text-[11px] text-slate-400 truncate">{res.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transport Mode Selection */}
      <div className="mb-3">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Verkehrsmittel
        </label>
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
          {TRANSPORT_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = profile.mode === mode.id;
            return (
              <button
                key={mode.id}
                id={`btn-mode-${profile.id}-${mode.id}`}
                type="button"
                onClick={() => onUpdate({ mode: mode.id })}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Max. Reisezeit
          </span>
          <span
            className="font-bold px-2 py-0.5 rounded-md text-xs text-white"
            style={{ backgroundColor: profile.color }}
          >
            {profile.travelTimeMinutes} Min
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">10m</span>
          <input
            id={`slider-time-${profile.id}`}
            type="range"
            min="10"
            max="90"
            step="5"
            value={profile.travelTimeMinutes}
            onChange={(e) => onUpdate({ travelTimeMinutes: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
          />
          <span className="text-[11px] text-slate-400">90m</span>
        </div>
      </div>

      {/* Advanced Transit Filters (FR-2.4) - only when ÖPNV selected */}
      {profile.mode === 'transit' && (
        <div className="mt-2.5 pt-2 border-t border-slate-100">
          <button
            id={`btn-advanced-transit-${profile.id}`}
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-[11px] text-slate-500 hover:text-slate-800 font-medium py-1"
          >
            <span className="flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              Erweiterte ÖPNV-Filter
            </span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-2 bg-slate-50 p-2.5 rounded-xl text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. First Mile: Wohnort -> Haltestelle */}
                <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                      <span>🚶 Wohnort ➔ Station</span>
                    </label>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {profile.maxWalkToStationMin ?? 10} Min
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mb-1.5 leading-tight">
                    Max. Gehzeit von der Haustür zur Einstiegshaltestelle
                  </p>
                  <select
                    value={profile.maxWalkToStationMin ?? 10}
                    onChange={(e) =>
                      onUpdate({
                        maxWalkToStationMin: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="5">5 Min (sehr nah)</option>
                    <option value="10">10 Min (Standard)</option>
                    <option value="15">15 Min (erweitert)</option>
                    <option value="20">20 Min (weit)</option>
                  </select>
                </div>

                {/* 2. Last Mile: Haltestelle -> Arbeitsplatz / Ziel */}
                <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                      <span>🏁 Station ➔ Zielort</span>
                    </label>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {profile.maxWalkFromStationMin ?? 10} Min
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mb-1.5 leading-tight">
                    Max. Gehzeit von der Ausstiegshaltestelle zum Büro
                  </p>
                  <select
                    value={profile.maxWalkFromStationMin ?? 10}
                    onChange={(e) =>
                      onUpdate({
                        maxWalkFromStationMin: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="5">5 Min (direkt vor der Tür)</option>
                    <option value="10">10 Min (Standard)</option>
                    <option value="15">15 Min (erweitert)</option>
                    <option value="20">20 Min (weit)</option>
                  </select>
                </div>

                {/* 3. Max. Umstiege */}
                <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-slate-800">
                      🔄 Max. Umstiege
                    </label>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {profile.maxTransfers !== undefined ? profile.maxTransfers : 'Beliebig'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mb-1.5 leading-tight">
                    Maximal tolerierte Umstiege auf der Gesamtstrecke
                  </p>
                  <select
                    value={profile.maxTransfers ?? 3}
                    onChange={(e) =>
                      onUpdate({
                        maxTransfers: e.target.value === '99' ? undefined : parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="0">0 (Nur Direktverbindungen)</option>
                    <option value="1">Max. 1 Umstieg</option>
                    <option value="2">Max. 2 Umstiege</option>
                    <option value="3">Max. 3 Umstiege (Standard)</option>
                    <option value="99">Beliebig viele Umstiege</option>
                  </select>
                </div>

                {/* 4. Max. Umstiegszeit */}
                <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-slate-800">
                      ⏱️ Wartezeit Umstieg
                    </label>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {profile.maxTransferWaitMin ?? 10} Min
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mb-1.5 leading-tight">
                    Tolerierter Zeitpuffer beim Wechseln der Linie
                  </p>
                  <select
                    value={profile.maxTransferWaitMin ?? 10}
                    onChange={(e) =>
                      onUpdate({
                        maxTransferWaitMin: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="5">5 Min (Sportlich/Knapp)</option>
                    <option value="10">10 Min (Standard)</option>
                    <option value="15">15 Min (Komfortabel)</option>
                    <option value="20">20 Min (Hoher Puffer)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
};
