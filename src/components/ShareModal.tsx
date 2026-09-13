import React, { useState } from 'react';
import { PersonProfile, CommuteSchedule } from '../types';
import { Share2, Copy, Check, X, Link, Globe } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: PersonProfile[];
  schedule: CommuteSchedule;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  profiles,
  schedule,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate shareable link
  const payload = {
    p: profiles.map((p) => ({
      n: p.name,
      a: p.address,
      lat: p.lat,
      lng: p.lng,
      t: p.travelTimeMinutes,
      m: p.mode,
      c: p.color,
      v: p.visible,
      mt: p.maxTransfers,
      mw: p.maxWalkToStationMin,
      mfw: p.maxWalkFromStationMin,
    })),
    s: {
      d: schedule.direction,
      w: schedule.dayOfWeek,
      t: schedule.time,
      lt: schedule.options?.liveTraffic,
      sm: schedule.options?.enableSmoothing,
      fi: schedule.options?.fidelity,
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  const shareUrl = `${window.location.origin}${window.location.pathname}#zone=${encoded}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Wohnortsuche teilen</h3>
              <p className="text-xs text-slate-500">Alle Profile, Zielorte & Reisezeiten als Link</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Mit diesem Link können deine Partnerin, Familie oder Mitbewohner die berechnete Schnittmenge
          direkt im Browser aufrufen und interaktiv erkunden:
        </p>

        {/* Profiles Summary Chips */}
        <div className="flex flex-wrap gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          {profiles.map((p, idx) => (
            <div
              key={p.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs font-medium text-slate-800"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="font-semibold">{p.name || `Person ${idx + 1}`}</span>
              <span className="text-slate-400">({p.travelTimeMinutes}m)</span>
            </div>
          ))}
        </div>

        {/* URL Input with Copy Button */}
        <div className="relative mb-5">
          <div className="flex items-center border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-1">
            <div className="pl-2.5 pr-1 text-slate-400">
              <Link className="w-4 h-4" />
            </div>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full text-xs bg-transparent py-2 text-slate-600 font-mono truncate focus:outline-none"
            />
            <button
              id="btn-copy-share-url"
              type="button"
              onClick={handleCopy}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Keine Registrierung erforderlich
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-600 hover:text-slate-900"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
