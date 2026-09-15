import React, { useState, useEffect } from 'react';
import { TransitSubMode, ALL_TRANSIT_SUBMODES, TransitRegionMetadata } from '../../../types';
import { AVAILABLE_REGIONS_CATALOG, CatalogRegion } from '../../../data/availableRegions';
import {
  listInstalledRegions,
  saveRegionToStorage,
} from '../../../services/transitStorage';
import {
  switchTransitRegion,
  getTransitRegion,
} from '../../../services/mvvMatrixService';
import {
  Train,
  RefreshCw,
  Loader2,
  CheckCircle2,
  DownloadCloud,
  Check,
  MapPin,
  Info,
  Layers,
  HardDrive,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  Bus,
  Zap,
} from 'lucide-react';

interface MvvMatrixTabProps {
  mvvMeta: {
    id?: string;
    name?: string;
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
  onRefreshIsochrones?: () => void;
}

export const MvvMatrixTab: React.FC<MvvMatrixTabProps> = ({
  mvvMeta,
  isSyncingMvv,
  mvvSyncMessage,
  onSyncMvv,
  activeTransitModes,
  onToggleTransitMode,
  onRefreshIsochrones,
}) => {
  const [installedList, setInstalledList] = useState<TransitRegionMetadata[]>([]);
  const [downloadingRegionId, setDownloadingRegionId] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const currentRegion = getTransitRegion();

  const loadInstalled = async () => {
    try {
      const list = await listInstalledRegions();
      setInstalledList(list);
    } catch {}
  };

  useEffect(() => {
    loadInstalled();
  }, [mvvMeta]);

  const handleSelectOrDownloadRegion = async (cat: CatalogRegion) => {
    try {
      setDownloadingRegionId(cat.id);
      setDownloadMessage(`Lade ${cat.name}...`);
      await switchTransitRegion(cat.id);
      await loadInstalled();
      setDownloadMessage(`${cat.name} ist jetzt aktiv und offline verfügbar!`);
      if (onRefreshIsochrones) {
        onRefreshIsochrones();
      }
      setTimeout(() => setDownloadMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDownloadMessage(`Fehler: ${msg}`);
    } finally {
      setDownloadingRegionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Region Header Card */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {currentRegion.name || 'München & Metropolregion (MVV)'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Aktiv
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                {currentRegion.source} • Ebene 2 (Verbund & Metropolregion)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSyncMvv}
            disabled={isSyncingMvv}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Aktuelle Region aktualisieren / validieren"
          >
            {isSyncingMvv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isSyncingMvv ? 'Aktualisiere...' : 'Sync'}</span>
          </button>
        </div>

        {(mvvSyncMessage || downloadMessage) && (
          <div className="mt-2 p-2 bg-white rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadMessage || mvvSyncMessage}</span>
          </div>
        )}
      </div>

      {/* Network Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-500">Haltestellen</div>
          <div className="text-base font-semibold text-slate-800 mt-0.5">{mvvMeta.stationCount}</div>
          <div className="text-[10px] text-slate-500">Knotenpunkte & Bahnhöfe</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-500">Fahrstrecken</div>
          <div className="text-base font-semibold text-slate-800 mt-0.5">{mvvMeta.connectionCount}</div>
          <div className="text-[10px] text-slate-500">Fahrzeit-Kanten</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-500">Speicher</div>
          <div className="text-base font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span>IndexedDB</span>
          </div>
          <div className="text-[10px] text-slate-500">Offline persistent</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-500">Version / Stand</div>
          <div className="text-xs font-semibold text-slate-800 mt-1 truncate">{mvvMeta.version}</div>
          <div className="text-[10px] text-slate-500 truncate">{mvvMeta.lastUpdated}</div>
        </div>
      </div>

      {/* Regions Package Catalog (Ebene 2: Metropolregionen) */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Bundesweite ÖPNV-Metropolregionen (Ebene 2):</span>
          </div>
          <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            DELFI / Bundesdatenbank
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal">
          Wähle deine Suchregion oder lade weitere Städtepakete herunter. Jedes Paket umfasst die gesamte Metropolregion mit Kernstadt, Vorortbussen und S-/Regionalbahnen.
        </p>

        <div className="space-y-2 pt-1">
          {AVAILABLE_REGIONS_CATALOG.map((cat) => {
            const isActive = currentRegion.id === cat.id;
            const isInstalled = installedList.some((r) => r.id === cat.id) || cat.isBuiltIn;
            const isDownloading = downloadingRegionId === cat.id;

            return (
              <div
                key={cat.id}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{cat.name}</span>
                    {isActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Aktiv
                      </span>
                    ) : isInstalled ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Bereit
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {cat.downloadSizeApprox}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    {cat.description}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {cat.majorLines.map((line) => (
                      <span
                        key={line}
                        className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isActive ? (
                    <div className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100/60 rounded-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> In Benutzung
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectOrDownloadRegion(cat)}
                      disabled={isDownloading}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <DownloadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>{isDownloading ? 'Lade...' : isInstalled ? 'Aktivieren' : 'Download & Start'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modalitäten-Filter */}
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
          Wähle aus, welche Verkehrsmittel für die Isochronen und Fahrzeiten berücksichtigt werden sollen. Mindestens ein Verkehrsmittel bleibt immer aktiv.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {(
            [
              { id: 'sbahn', label: 'S-Bahn', icon: TrainFront, desc: 'Stammstrecke & Außenäste' },
              { id: 'ubahn', label: 'U-Bahn', icon: TrainFrontTunnel, desc: 'U-Bahn Kernnetz' },
              { id: 'train', label: 'Regionalbahn', icon: Train, desc: 'RE / BRB / Regionalzüge' },
              { id: 'tram', label: 'Tram', icon: TramFront, desc: 'Straßenbahnlinien' },
              { id: 'expressbus', label: 'Expressbus', icon: Zap, desc: 'X-Busse (z.B. X30, X80)' },
              { id: 'bus', label: 'Bus', icon: Bus, desc: 'Stadt- & Regionalbusse' },
            ] as const
          ).map((modeItem) => {
            const isChecked = activeTransitModes.includes(modeItem.id as TransitSubMode);
            const Icon = modeItem.icon;
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
                    <Icon className="w-3.5 h-3.5 text-slate-600" />
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

      {/* Info Box */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 space-y-1.5 leading-relaxed">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Wie die ÖPNV-Isochrone berechnet wird:</span>
        </div>
        <ul className="list-disc pl-4 space-y-1 text-[11px]">
          <li><strong>Erste Meile (Fußweg):</strong> Berechnet die Gehzeit zur nächsten Station (unter Berücksichtigung des gewählten Maximums, z. B. 10 Min).</li>
          <li><strong>Echte Fahrzeiten:</strong> Nutzt die Soll-Fahrzeitkanten der Linien (z. B. S-Bahn Stammstrecke, Regionalbahn ins Umland).</li>
          <li><strong>Gezielte A*-Punktinspektion:</strong> Bei Klicks auf die Karte ermittelt ein zielgerichteter A*-Algorithmus sofort die schnellste Verbindung.</li>
          <li><strong>Letzte Meile (Umkreis):</strong> An jeder erreichten Station wird mit der verbleibenden Restreisezeit die Fußgänger-Erreichbarkeit aufgespannt.</li>
        </ul>
      </div>
    </div>
  );
};
