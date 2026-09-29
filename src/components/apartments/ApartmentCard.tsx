import React, { useState } from 'react';
import {
  ApartmentListing,
  ApartmentCommuteScore,
} from '../../types';
import {
  MapPin,
  ExternalLink,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  Building,
  Maximize2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ApartmentCardProps {
  listing: ApartmentListing;
  commuteScore?: ApartmentCommuteScore;
  isSelected?: boolean;
  onSelect?: (listing: ApartmentListing) => void;
  compact?: boolean;
}

const PORTAL_LABELS: Record<string, { label: string; badgeClass: string }> = {
  immoscout24: {
    label: 'ImmoScout24',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  immowelt: {
    label: 'Immowelt',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  },
  'wg-gesucht': {
    label: 'WG-Gesucht',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  kleinanzeigen: {
    label: 'Kleinanzeigen',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  custom: {
    label: 'Importiert',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
};

export const ApartmentCard: React.FC<ApartmentCardProps> = ({
  listing,
  commuteScore,
  isSelected = false,
  onSelect,
  compact = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const rentWarm = listing.priceWarm || listing.priceCold;
  const rentSqm = listing.sizeSqm > 0 ? (listing.priceCold / listing.sizeSqm).toFixed(1) : null;
  const portalMeta = PORTAL_LABELS[listing.source] || {
    label: listing.source,
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(listing);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected
          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-[#8ab4f8] shadow-md ring-2 ring-blue-500/20'
          : 'bg-white dark:bg-[#1e1f20] hover:bg-slate-50/90 dark:hover:bg-[#282a2c] border-slate-200/90 dark:border-[#3c4043] shadow-sm hover:shadow'
      }`}
    >
      <div className={`flex ${compact ? 'flex-row' : 'flex-col sm:flex-row'} gap-3 p-3`}>
        {/* Thumbnail / Image Container */}
        <div
          className={`relative shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#282a2c] ${
            compact ? 'w-24 h-24' : 'w-full sm:w-32 h-32 sm:h-28'
          }`}
        >
          {listing.thumbnailUrl && !imageError ? (
            <img
              src={listing.thumbnailUrl}
              alt={listing.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#9aa0a6] p-2">
              <Home className="w-6 h-6 stroke-[1.5]" />
              <span className="text-[10px] mt-1 font-medium text-center">Kein Bild</span>
            </div>
          )}

          {/* Price Tag Overlay on image */}
          <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            {rentWarm} € <span className="font-normal text-[9px] text-slate-300">warm</span>
          </div>
        </div>

        {/* Info Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Top row: Source badge & Room/Sqm quick specs */}
            <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${portalMeta.badgeClass}`}
              >
                {portalMeta.label}
              </span>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">
                <span>{listing.rooms} Zi.</span>
                <span className="text-slate-300 dark:text-[#5f6368]">•</span>
                <span>{listing.sizeSqm} m²</span>
                {rentSqm && (
                  <>
                    <span className="text-slate-300 dark:text-[#5f6368]">•</span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-[#9aa0a6]">
                      {rentSqm} €/m²
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Title */}
            <h4
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-[#8ab4f8] transition-colors"
              title={listing.title}
            >
              {listing.title}
            </h4>

            {/* Address & District */}
            <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">
                {listing.address}
                {listing.district ? ` · ${listing.district}` : ''}
              </span>
            </p>
          </div>

          {/* Features Pills */}
          {listing.features && listing.features.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 overflow-hidden flex-wrap">
              {listing.features.slice(0, 3).map((f) => (
                <span
                  key={f}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-[#282a2c] text-slate-600 dark:text-[#c4c7c5] rounded-full font-medium truncate"
                >
                  {f}
                </span>
              ))}
              {listing.features.length > 3 && (
                <span className="text-[9px] text-slate-400 dark:text-[#9aa0a6]">
                  +{listing.features.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Commute Overview Bar */}
          {commuteScore && commuteScore.personCommutes.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#3c4043] flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-2 overflow-hidden truncate">
                {commuteScore.personCommutes.map((c) => (
                  <div key={c.personId} className="flex items-center gap-1 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.personColor }}
                    />
                    <span className="truncate text-slate-600 dark:text-[#c4c7c5] font-medium">
                      {c.personName.split(' ')[0]}:
                    </span>
                    <span
                      className={`font-bold ${
                        c.isWithinLimit
                          ? 'text-slate-800 dark:text-[#e3e3e3]'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {c.travelTimeMinutes}m
                    </span>
                  </div>
                ))}
              </div>

              {/* Commute Average badge */}
              <div className="shrink-0 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>Ø {commuteScore.avgCommuteMinutes}m</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-2 flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6]">
              {listing.availableFrom ? `Frei: ${listing.availableFrom}` : 'Sofort frei'}
            </span>

            <div className="flex items-center gap-2">
              {listing.url && (
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-[#8ab4f8] hover:underline font-semibold"
                  title="Auf Portal öffnen"
                >
                  <span>Exposé</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
