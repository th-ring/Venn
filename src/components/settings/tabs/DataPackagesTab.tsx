import React, { useState, useEffect } from 'react';
import { TransitSubMode, TransitRegionMetadata } from '../../../types';
import { getCityDataPackagesCatalog } from '../../../data/cityPackagesCatalog';
import { AVAILABLE_REGIONS_CATALOG, CatalogRegion } from '../../../data/availableRegions';
import {
  listInstalledRegions,
} from '../../../services/transitStorage';
import {
  switchTransitRegion,
  getTransitRegion,
} from '../../../services/mvvMatrixService';
import {
  getHighwayMetadata,
  syncHighwayDataFromOSM,
  resetHighwayDataToDefault,
  subscribeHighwayData,
} from '../../../services/highwayService';
import {
  Car,
  Train,
  Euro,
  RefreshCw,
  Loader2,
  CheckCircle2,
  DownloadCloud,
  Check,
  Building2,
  Layers,
  HardDrive,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  Bus,
  Zap,
} from 'lucide-react';

interface DataPackagesTabProps {
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

export const DataPackagesTab: React.FC<DataPackagesTabProps> = ({
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
  const [transitMessage, setTransitMessage] = useState<string | null>(null);

  // Highway state
  const [highwayMeta, setHighwayMeta] = useState(() => getHighwayMetadata());
  const [isSyncingHighway, setIsSyncingHighway] = useState(false);
  const [highwayMessage, setHighwayMessage] = useState<string | null>(null);

  // Expanded city blocks (other regions)
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});

  const currentRegion = getTransitRegion();
  const cityPackages = getCityDataPackagesCatalog(currentRegion.id);

  const loadInstalled = async () => {
    try {
      const list = await listInstalledRegions();
      setInstalledList(list);
    } catch {}
  };

  useEffect(() => {
    loadInstalled();
  }, [mvvMeta]);

  useEffect(() => {
    return subscribeHighwayData((newDataset) => {
      setHighwayMeta(newDataset.metadata);
    });
  }, []);

  const handleSelectOrDownloadRegion = async (cat: CatalogRegion) => {
    try {
      setDownloadingRegionId(cat.id);
      setTransitMessage(`Lade ${cat.name}...`);
      await switchTransitRegion(cat.id);
      await loadInstalled();
      setTransitMessage(`${cat.name} ist jetzt aktiv und offline verfügbar!`);
      if (onRefreshIsochrones) {
        onRefreshIsochrones();
      }
      setTimeout(() => setTransitMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTransitMessage(`Fehler: ${msg}`);
    } finally {
      setDownloadingRegionId(null);
    }
  };

  const handleSyncHighway = async () => {
    setIsSyncingHighway(true);
    setHighwayMessage('Frage aktuelle Autobahndaten von OpenStreetMap ab...');
    try {
      const updated = await syncHighwayDataFromOSM();
      setHighwayMeta(updated.metadata);
      setHighwayMessage(
        `Erfolgreich aktualisiert: ${updated.metadata.junctionCount} Anschlussstellen und ${updated.metadata.rampCount} Rampen gespeichert.`
      );
      if (onRefreshIsochrones) {
        onRefreshIsochrones();
      }
      setTimeout(() => setHighwayMessage(null), 4500);
    } catch (err: any) {
      setHighwayMessage(`Aktualisierung fehlgeschlagen: ${err?.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsSyncingHighway(false);
    }
  };

  const handleResetHighway = () => {
    const def = resetHighwayDataToDefault();
    setHighwayMeta(def.metadata);
    setHighwayMessage('Autobahndaten wurden auf den Standard-Lieferstand zurückgesetzt.');
    setTimeout(() => setHighwayMessage(null), 3000);
  };

  const toggleCityExpanded = (cityId: string) => {
    setExpandedCities((prev) => ({
      ...prev,
      [cityId]: !prev[cityId],
    }));
  };

  const formattedHighwayDate = (() => {
    try {
      const d = new Date(highwayMeta.lastUpdated);
      return isNaN(d.getTime())
        ? highwayMeta.lastUpdated
        : `${d.toLocaleDateString('de-DE')} um ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
    } catch {
      return highwayMeta.lastUpdated;
    }
  })();

  const activeCity = cityPackages.find((c) => c.isCurrentActive) || cityPackages[0];
  const otherCities = cityPackages.filter((c) => c.id !== activeCity.id);

  return (
    <div className="space-y-6">
      {/* Tab Introduction */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Zentrale Datenpakete & Betrachtungsgebiete</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-1">
          Alle geografischen Datensätze (Autobahnanschlüsse, ÖPNV-Fahrpläne, amtliche Mietspiegel)
          sind als städtebezogene Pakete strukturiert. Aktuell ist München vollständig aktiv und offline verfügbar.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. AKTIVES BETRACHTUNGSGEBIET: MÜNCHEN                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#1e1f20] border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-4 shadow-xs space-y-4">
        {/* City Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#3c4043]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#e3e3e3]">{activeCity.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Aktiv gewählt
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                Metropolitanraum München • 3 Datenpakete integriert & offline einsatzbereit
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {(transitMessage || mvvSyncMessage || highwayMessage) && (
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0" />
            <span>{highwayMessage || transitMessage || mvvSyncMessage}</span>
          </div>
        )}

        {/* Autobahn & Rampen */}
        <div className="bg-slate-50/60 dark:bg-[#202124] border border-slate-200/90 dark:border-[#3c4043] rounded-xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5 border border-amber-200/60 dark:border-amber-800/40">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
                    Autobahn-Netz & Rampen
                  </span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#303134] text-slate-700 dark:text-[#c4c7c5] border border-slate-200 dark:border-[#3c4043]">
                    OpenStreetMap
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                  Quelle: <span className="font-medium text-slate-700 dark:text-[#e3e3e3]">{highwayMeta.source}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleSyncHighway}
                disabled={isSyncingHighway}
                className="px-2.5 py-1.5 bg-white dark:bg-[#282a2c] hover:bg-slate-50 dark:hover:bg-[#3c4043] disabled:opacity-50 text-slate-700 dark:text-[#e3e3e3] border border-slate-300 dark:border-[#5f6368] text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Aktuelle Daten von Overpass API abrufen"
              >
                {isSyncingHighway ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6]" />
                )}
                <span>{isSyncingHighway ? 'Lade OSM...' : 'Aus OSM aktualisieren'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetHighway}
                className="p-1.5 text-slate-400 dark:text-[#747775] hover:text-slate-600 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] rounded-lg transition-colors cursor-pointer"
                title="Auf Standard zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="bg-white/80 dark:bg-[#282a2c] p-2 rounded-lg border border-orange-100 dark:border-orange-900/40">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Umfang</span>
              <span className="font-bold text-slate-800 dark:text-[#e3e3e3]">{highwayMeta.junctionCount} AS / {highwayMeta.rampCount} Rampen</span>
            </div>
            <div className="bg-white/80 dark:bg-[#282a2c] p-2 rounded-lg border border-orange-100 dark:border-orange-900/40">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Letzter Pull</span>
              <span className="font-bold text-slate-800 dark:text-[#e3e3e3] truncate block">{formattedHighwayDate}</span>
            </div>
            <div className="bg-white/80 dark:bg-[#282a2c] p-2 rounded-lg border border-orange-100 dark:border-orange-900/40">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Visualisierung</span>
              <span className="font-bold text-orange-700 dark:text-orange-400">Straßenlinien & Umkreisung</span>
            </div>
            <div className="bg-white/80 dark:bg-[#282a2c] p-2 rounded-lg border border-orange-100 dark:border-orange-900/40">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Lizenz</span>
              <span className="font-bold text-slate-700 dark:text-[#e3e3e3]">ODbL (Open Data)</span>
            </div>
          </div>
        </div>

        {/* ÖPNV-Fahrplan & Netz */}
        <div className="bg-slate-50/60 dark:bg-[#202124] border border-slate-200/90 dark:border-[#3c4043] rounded-xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] rounded-lg shrink-0 mt-0.5 border border-blue-200/60 dark:border-blue-800/40">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
                    ÖPNV-Fahrplan & Netz
                  </span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#303134] text-slate-700 dark:text-[#c4c7c5] border border-slate-200 dark:border-[#3c4043]">
                    DELFI & MVV
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                  Quelle: <span className="font-medium text-slate-700 dark:text-[#e3e3e3]">{mvvMeta.source}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSyncMvv}
              disabled={isSyncingMvv}
              className="px-2.5 py-1.5 bg-white dark:bg-[#282a2c] hover:bg-slate-50 dark:hover:bg-[#3c4043] disabled:opacity-50 text-slate-700 dark:text-[#e3e3e3] border border-slate-300 dark:border-[#5f6368] text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-center shrink-0"
              title="MVV-Sollfahrplan aktualisieren"
            >
              {isSyncingMvv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6]" />
              )}
              <span>{isSyncingMvv ? 'Aktualisiere...' : 'Fahrplan aktualisieren'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Haltestellen</span>
              <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">{mvvMeta.stationCount} Bahnhöfe/Halte</span>
            </div>
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Streckenkanten</span>
              <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">{mvvMeta.connectionCount} Verbindungen</span>
            </div>
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Version / Stand</span>
              <span className="font-semibold text-slate-800 dark:text-[#e3e3e3] truncate block">{mvvMeta.version} ({mvvMeta.lastUpdated})</span>
            </div>
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Speicher</span>
              <span className="font-semibold text-blue-700 dark:text-[#8ab4f8] flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> IndexedDB Offline
              </span>
            </div>
          </div>

          {/* Modalitäten-Filter Pills */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-[#3c4043]">
            <span className="text-[10px] font-semibold text-slate-700 dark:text-[#e3e3e3] block mb-1.5">
              Aktive ÖPNV-Verkehrsmittel für Fahrzeit-Matrix:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'sbahn' as TransitSubMode, label: 'S-Bahn', icon: TrainFront },
                { id: 'ubahn' as TransitSubMode, label: 'U-Bahn', icon: TrainFrontTunnel },
                { id: 'train' as TransitSubMode, label: 'Regionalbahn', icon: Train },
                { id: 'tram' as TransitSubMode, label: 'Tram', icon: TramFront },
                { id: 'expressbus' as TransitSubMode, label: 'Expressbus', icon: Zap },
                { id: 'bus' as TransitSubMode, label: 'Bus', icon: Bus },
              ].map((sub) => {
                const isActive = activeTransitModes.includes(sub.id);
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onToggleTransitMode(sub.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 dark:bg-[#8ab4f8] text-white dark:text-[#131314] shadow-2xs'
                        : 'bg-white dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6] border border-slate-200 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mietspiegel & Wohnlagen */}
        <div className="bg-slate-50/60 dark:bg-[#202124] border border-slate-200/90 dark:border-[#3c4043] rounded-xl p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] rounded-lg shrink-0 mt-0.5 border border-blue-200/60 dark:border-blue-800/40">
                <Euro className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
                    Mietspiegel & Wohnlagen
                  </span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#303134] text-slate-700 dark:text-[#c4c7c5] border border-slate-200 dark:border-[#3c4043]">
                    dl-de/by-2-0
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                  Quelle: <span className="font-medium text-slate-700 dark:text-[#e3e3e3]">Landeshauptstadt München Open Data (GeodatenService)</span>
                </div>
              </div>
            </div>

            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3 h-3" /> Amtlich
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Umfang</span>
              <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">25 Stadtbezirke</span>
            </div>
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Kaltmieten</span>
              <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">14,80 € – 24,50 €/m²</span>
            </div>
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Gültigkeit</span>
              <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">Mietspiegel 2025/2026</span>
            </div>
            <div className="bg-white dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
              <span className="text-[10px] text-slate-400 dark:text-[#747775] block font-semibold uppercase">Kartenebene</span>
              <span className="font-semibold text-blue-600 dark:text-[#8ab4f8]">Im Tab "Mietspiegel" konfigurierbar</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. WEITERE BETRACHTUNGSGEBIETE (ERWEITERBARKEIT)               */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-50 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-[#e3e3e3] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-600 dark:text-[#9aa0a6]" />
              <span>Weitere Betrachtungsgebiete & Städte:</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
              Das modulare Datenmodell unterstützt die nahtlose Erweiterung um zusätzliche Regionen.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-[#9aa0a6] bg-white dark:bg-[#282a2c] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#3c4043]">
            Erweiterbar
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {otherCities.map((city) => {
            const isExpanded = !!expandedCities[city.id];
            const catEntry = AVAILABLE_REGIONS_CATALOG.find((c) => c.id === city.id);
            const isInstalled = installedList.some((r) => r.id === city.id);
            const isDownloading = downloadingRegionId === city.id;

            return (
              <div
                key={city.id}
                className="bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#3c4043] rounded-xl transition-all overflow-hidden"
              >
                <div
                  onClick={() => toggleCityExpanded(city.id)}
                  className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#282a2c] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3]">{city.name}</span>
                      {isInstalled ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#282a2c] text-slate-700 dark:text-[#e3e3e3] border border-slate-200 dark:border-[#3c4043]">
                          ÖPNV geladen
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          Vorbereitet
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6] truncate mt-0.5">
                      {city.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {catEntry && !isInstalled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOrDownloadRegion(catEntry);
                        }}
                        disabled={isDownloading}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <DownloadCloud className="w-3 h-3" />
                        )}
                        <span>{isDownloading ? 'Lade...' : 'ÖPNV-Paket laden'}</span>
                      </button>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 dark:text-[#747775]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#747775]" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-[#3c4043] bg-slate-50/50 dark:bg-[#202124] space-y-2">
                    <div className="text-[11px] font-medium text-slate-600 dark:text-[#9aa0a6]">
                      Artefakte für {city.cityName}:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {city.artifacts.map((art) => (
                        <div
                          key={art.id}
                          className="bg-white dark:bg-[#282a2c] p-2.5 rounded-lg border border-slate-200 dark:border-[#3c4043] text-[11px] space-y-1"
                        >
                          <div className="font-bold text-slate-800 dark:text-[#e3e3e3] flex items-center gap-1.5">
                            {art.id === 'highway' && <Car className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
                            {art.id === 'transit' && <Train className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />}
                            {art.id === 'rental' && <Euro className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                            <span>{art.category}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] leading-tight">
                            {art.source}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-[#747775] pt-0.5">
                            Status: <span className="font-medium text-slate-600 dark:text-[#9aa0a6]">{art.lastUpdated}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
