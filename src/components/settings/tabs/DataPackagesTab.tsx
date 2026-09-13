import React, { useState, useEffect } from 'react';
import { TransitSubMode, ALL_TRANSIT_SUBMODES, TransitRegionMetadata } from '../../../types';
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
  Info,
  Layers,
  Sparkles,
  HardDrive,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
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
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Zentrale Datenpakete & Betrachtungsgebiete</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Alle geografischen Datensätze (Autobahnanschlüsse, ÖPNV-Fahrpläne, amtliche Mietspiegel)
          sind als städtebezogene Pakete strukturiert. Aktuell ist München vollständig aktiv und offline verfügbar.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. AKTIVES BETRACHTUNGSGEBIET: MÜNCHEN                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-xs space-y-4">
        {/* City Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{activeCity.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Aktiv gewählt
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Metropolitanraum München • 3 Datenpakete integriert & offline einsatzbereit
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {(transitMessage || mvvSyncMessage || highwayMessage) && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-xs text-blue-900 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{highwayMessage || transitMessage || mvvSyncMessage}</span>
          </div>
        )}

        {/* Sub-Artifact 1: 🚗 AUTOBAHN & AUFFAHRTEN (OSM) */}
        <div className="bg-orange-50/40 border border-orange-200 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-orange-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    1. Autobahnanschlussstellen & Auffahrtsrampen
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                    OpenStreetMap
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Quelle: <span className="font-medium text-slate-700">{highwayMeta.source}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleSyncHighway}
                disabled={isSyncingHighway}
                className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                title="Aktuelle Daten von Overpass API abrufen"
              >
                {isSyncingHighway ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{isSyncingHighway ? 'Lade OSM...' : 'Aus OSM aktualisieren'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetHighway}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Auf Standard zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="bg-white/80 p-2 rounded-lg border border-orange-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Umfang</span>
              <span className="font-bold text-slate-800">{highwayMeta.junctionCount} AS / {highwayMeta.rampCount} Rampen</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-orange-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Letzter Pull</span>
              <span className="font-bold text-slate-800 truncate block">{formattedHighwayDate}</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-orange-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Visualisierung</span>
              <span className="font-bold text-orange-700">Straßenlinien & Umkreisung</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-orange-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Lizenz</span>
              <span className="font-bold text-slate-700">ODbL (Open Data)</span>
            </div>
          </div>
        </div>

        {/* Sub-Artifact 2: 🚆 ÖPNV-FAHRPLAN & NETZ (MVV / DELFI) */}
        <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    2. ÖPNV-Fahrplan & Verkehrsnetz
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    DELFI & MVV
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Quelle: <span className="font-medium text-slate-700">{mvvMeta.source}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSyncMvv}
              disabled={isSyncingMvv}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer self-end sm:self-center shrink-0"
              title="MVV-Sollfahrplan aktualisieren"
            >
              {isSyncingMvv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{isSyncingMvv ? 'Aktualisiere...' : 'Fahrplan aktualisieren'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Haltestellen</span>
              <span className="font-bold text-slate-800">{mvvMeta.stationCount} Bahnhöfe/Halte</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Streckenkanten</span>
              <span className="font-bold text-slate-800">{mvvMeta.connectionCount} Verbindungen</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Version / Stand</span>
              <span className="font-bold text-slate-800 truncate block">{mvvMeta.version} ({mvvMeta.lastUpdated})</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Speicher</span>
              <span className="font-bold text-blue-700 flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> IndexedDB Offline
              </span>
            </div>
          </div>

          {/* Modalitäten-Filter Pills */}
          <div className="pt-2 border-t border-blue-100">
            <span className="text-[10px] font-bold text-slate-700 block mb-1.5">
              Aktive ÖPNV-Verkehrsmittel für Fahrzeit-Matrix:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'sbahn' as TransitSubMode, label: 'S-Bahn', icon: '🚆' },
                { id: 'ubahn' as TransitSubMode, label: 'U-Bahn', icon: '🚇' },
                { id: 'train' as TransitSubMode, label: 'Regionalbahn', icon: '🚄' },
                { id: 'tram' as TransitSubMode, label: 'Tram', icon: '🚋' },
                { id: 'expressbus' as TransitSubMode, label: 'Expressbus', icon: '⚡' },
                { id: 'bus' as TransitSubMode, label: 'Bus', icon: '🚌' },
              ].map((sub) => {
                const isActive = activeTransitModes.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onToggleTransitMode(sub.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sub-Artifact 3: 💶 MIETSPIEGEL & WOHNLAGEN (MÜNCHEN OPEN DATA) */}
        <div className="bg-purple-50/40 border border-purple-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-purple-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
                <Euro className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    3. Amtlicher Mietspiegel & Wohnlagen
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                    dl-de/by-2-0
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Quelle: <span className="font-medium text-slate-700">Landeshauptstadt München Open Data (GeodatenService)</span>
                </div>
              </div>
            </div>

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3 h-3" /> Amtlich
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Umfang</span>
              <span className="font-bold text-slate-800">25 Stadtbezirke</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Kaltmieten</span>
              <span className="font-bold text-slate-800">14,80 € – 24,50 €/m²</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Gültigkeit</span>
              <span className="font-bold text-slate-800">Mietspiegel 2025/2026</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Kartenebene</span>
              <span className="font-bold text-purple-700">In Tab 6 konfigurierbar</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. WEITERE BETRACHTUNGSGEBIETE (ERWEITERBARKEIT)               */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Weitere Betrachtungsgebiete & Städte (Architektur-Ausblick):</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dieselbe 3-teilige Artefakt-Struktur steht für weitere Städte zur Verfügung.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
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
                className="bg-white border border-slate-200 rounded-xl transition-all overflow-hidden"
              >
                <div
                  onClick={() => toggleCityExpanded(city.id)}
                  className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{city.name}</span>
                      {isInstalled ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          ÖPNV geladen
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Vorbereitet
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
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
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Artefakte für {city.cityName}:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {city.artifacts.map((art) => (
                        <div
                          key={art.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1"
                        >
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            {art.id === 'highway' && <Car className="w-3.5 h-3.5 text-orange-600" />}
                            {art.id === 'transit' && <Train className="w-3.5 h-3.5 text-blue-600" />}
                            {art.id === 'rental' && <Euro className="w-3.5 h-3.5 text-purple-600" />}
                            <span>{art.category}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight">
                            {art.source}
                          </div>
                          <div className="text-[10px] text-slate-400 pt-0.5">
                            Status: <span className="font-medium text-slate-600">{art.lastUpdated}</span>
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
