import React from 'react';
import { TransitSubMode, ALL_TRANSIT_SUBMODES } from '../../../types';
import { Train, RefreshCw, Loader2, CheckCircle2, Info } from 'lucide-react';

interface MvvMatrixTabProps {
  mvvMeta: {
    version: string;
    lastUpdated: string;
    source: string;
    stationCount: number;
    connectionCount: number;
  };
  isSyncingMvv: boolean;
  mvvSyncMessage: string | null;
  onSyncMvv: () => void;
  activeTransitModes: TransitSubMode[];
  onToggleTransitMode: (mode: TransitSubMode) => void;
}

export const MvvMatrixTab: React.FC<MvvMatrixTabProps> = ({
  mvvMeta,
  isSyncingMvv,
  mvvSyncMessage,
  onSyncMvv,
  activeTransitModes,
  onToggleTransitMode,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-600 text-white rounded-md">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">
                Münchner Verkehrsverbund (MVV / MVG)
              </span>
              <div className="text-[11px] text-slate-600">
                U-Bahn, S-Bahn, Tram & Express-/Metrobusse
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSyncMvv}
            disabled={isSyncingMvv}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Fahrplan- und Haltestellendaten jetzt aktualisieren"
          >
            {isSyncingMvv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isSyncingMvv ? 'Aktualisiere...' : 'Jetzt aktualisieren'}</span>
          </button>
        </div>

        {mvvSyncMessage && (
          <div className="mt-2 p-2 bg-white rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mvvSyncMessage}</span>
          </div>
        )}
      </div>

      {/* Matrix Statistics & Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Haltestellen</div>
          <div className="text-base font-extrabold text-slate-800 mt-0.5">{mvvMeta.stationCount}</div>
          <div className="text-[10px] text-slate-500">Knotenpunkte & Bahnhöfe</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Verbindungen</div>
          <div className="text-base font-extrabold text-slate-800 mt-0.5">{mvvMeta.connectionCount}</div>
          <div className="text-[10px] text-slate-500">Fahrzeit-Kanten</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Verkehrsträger</div>
          <div className="text-base font-extrabold text-slate-800 mt-0.5">S, U, Tram, Bus</div>
          <div className="text-[10px] text-slate-500">Multimodal integriert</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Stand / Version</div>
          <div className="text-xs font-bold text-slate-800 mt-1 truncate">{mvvMeta.version}</div>
          <div className="text-[10px] text-slate-500 truncate">{mvvMeta.lastUpdated}</div>
        </div>
      </div>

      {/* Verkehrsmittel / Modalitäten Filter */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5 text-blue-600" />
            <span>ÖPNV-Verkehrsträger einbeziehen:</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {activeTransitModes.length} von {ALL_TRANSIT_SUBMODES.length} aktiv
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal">
          Wähle aus, welche Verkehrsmittel für die MVV-Isochronen und Fahrzeiten berücksichtigt werden sollen. Mindestens ein Verkehrsmittel bleibt immer aktiv.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {(
            [
              { id: 'tram', label: 'Tram', icon: '🚋', desc: 'Straßenbahnlinien' },
              { id: 'ubahn', label: 'U-Bahn', icon: '🚇', desc: 'U1 – U8 Netz' },
              { id: 'bus', label: 'Bus', icon: '🚌', desc: 'Stadt- & Regionalbusse' },
              { id: 'expressbus', label: 'Expressbus', icon: '⚡', desc: 'X-Busse (z.B. X30, X50)' },
              { id: 'sbahn', label: 'S-Bahn', icon: '🚆', desc: 'S1 – S8 Stammstrecke & Außenäste' },
            ] as const
          ).map((modeItem) => {
            const isChecked = activeTransitModes.includes(modeItem.id as TransitSubMode);
            return (
              <label
                key={modeItem.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleTransitMode(modeItem.id as TransitSubMode)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                    <span>{modeItem.icon}</span>
                    <span>{modeItem.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight truncate">
                    {modeItem.desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Info Box explaining transit mechanics */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 space-y-1.5 leading-relaxed">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Wie die MVV-Isochrone berechnet wird:</span>
        </div>
        <ul className="list-disc pl-4 space-y-1 text-[11px]">
          <li><strong>Erste Meile (Fußweg):</strong> Berechnet die Gehzeit von der Haustür zur nächsten Station (unter Berücksichtigung des gewählten Maximums, z. B. 10 Min).</li>
          <li><strong>Echte Fahrzeiten:</strong> Nutzt die Soll-Fahrzeitkanten der Linien (z. B. Tram 23 Domagkstr. ➔ Münchner Freiheit in 6 Min; S8 Pasing ➔ Gilching in 16 Min).</li>
          <li><strong>Umstiege & Puffer:</strong> Berücksichtigt deine Parameter <em>Max. Umstiege</em> und <em>Max. Umstiegszeit</em> (Takt-Wartezeit & Bahnsteigwechsel).</li>
          <li><strong>Letzte Meile (Umkreis):</strong> An jeder erreichten Station wird mit der verbleibenden Restreisezeit die Fußgänger-Erreichbarkeit aufgespannt.</li>
        </ul>
      </div>
    </div>
  );
};
