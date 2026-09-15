import React, { useState, useEffect } from 'react';
import { TransitSubMode, TransitRegionMetadata } from '../../../types';
import { getCityDataPackagesCatalog } from '../../../data/cityPackagesCatalog';
import { AVAILABLE_REGIONS_CATALOG, CatalogRegion } from '../../../data/availableRegions';
import { listInstalledRegions } from '../../../services/transitStorage';
import { switchTransitRegion, getTransitRegion } from '../../../services/mvvMatrixService';
import {
  getHighwayMetadata,
  syncHighwayDataFromOSM,
  resetHighwayDataToDefault,
  subscribeHighwayData,
} from '../../../services/highwayService';
import {
  Car,
  Train,
  RefreshCw,
  Loader2,
  CheckCircle2,
  RotateCcw,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  Bus,
  Zap,
  Building2,
  HardDrive,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { SettingsCard } from '../ui/SettingsCard';
import { SettingsRow } from '../ui/SettingsRow';

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

const TRANSIT_MODES: Array<{
  id: TransitSubMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'sbahn', label: 'S-Bahn', icon: TrainFront },
  { id: 'ubahn', label: 'U-Bahn', icon: TrainFrontTunnel },
  { id: 'train', label: 'Regionalbahn', icon: Train },
  { id: 'tram', label: 'Tram', icon: TramFront },
  { id: 'expressbus', label: 'Expressbus', icon: Zap },
  { id: 'bus', label: 'Bus', icon: Bus },
];

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

  // Highway OSM state
  const [highwayMeta, setHighwayMeta] = useState(() => getHighwayMetadata());
  const [isSyncingHighway, setIsSyncingHighway] = useState(false);
  const [highwayMessage, setHighwayMessage] = useState<string | null>(null);

  const [showOtherRegions, setShowOtherRegions] = useState(false);

  const currentRegion = getTransitRegion();
  const cityPackages = getCityDataPackagesCatalog(currentRegion.id);
  const activeCity = cityPackages.find((c) => c.isCurrentActive) || cityPackages[0];
  const otherCities = cityPackages.filter((c) => c.id !== activeCity.id);

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
      setTransitMessage(`Lade Datensatz für ${cat.name}...`);
      await switchTransitRegion(cat.id);
      await loadInstalled();
      setTransitMessage(`${cat.name} ist jetzt aktiv und lokal verfügbar.`);
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
    setHighwayMessage('Frage aktuelle Autobahndaten von OpenStreetMap Overpass ab...');
    try {
      const updated = await syncHighwayDataFromOSM();
      setHighwayMeta(updated.metadata);
      setHighwayMessage(
        `Erfolgreich aktualisiert: ${updated.metadata.junctionCount} Anschlussstellen und ${updated.metadata.rampCount} Rampen gespeichert.`
      );
      if (onRefreshIsochrones) {
        onRefreshIsochrones();
      }
      setTimeout(() => setHighwayMessage(null), 4000);
    } catch (err: any) {
      setHighwayMessage(`Aktualisierung fehlgeschlagen: ${err?.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsSyncingHighway(false);
    }
  };

  const handleResetHighway = () => {
    const def = resetHighwayDataToDefault();
    setHighwayMeta(def.metadata);
    setHighwayMessage('Autobahndaten wurden auf den Auslieferungsstand zurückgesetzt.');
    setTimeout(() => setHighwayMessage(null), 3000);
  };

  const formattedHighwayDate = (() => {
    try {
      const d = new Date(highwayMeta.lastUpdated);
      return isNaN(d.getTime()) ? highwayMeta.lastUpdated : d.toLocaleDateString('de-DE');
    } catch {
      return highwayMeta.lastUpdated;
    }
  })();

  const feedbackMsg = highwayMessage || transitMessage || mvvSyncMessage;

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
          Datenpakete & Regionen
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
          Verwalte lokale Verkehrsdaten, Fahrplandatensätze und Autobahnkorridore für die Offline-Berechnung.
        </p>
      </div>

      {/* Global Status Banner if syncing */}
      {feedbackMsg && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 1. Active Region Card */}
      <SettingsCard
        title={`Aktives Betrachtungsgebiet: ${activeCity.name}`}
        headerAction={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Aktiv & Offline verfügbar</span>
          </span>
        }
      >
        {/* ÖPNV Fahrplandaten */}
        <SettingsRow
          icon={Train}
          iconColor="text-blue-600 dark:text-[#8ab4f8]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          title="ÖPNV-Fahrplandaten & Haltestellenmatrix"
          description={`${mvvMeta.stationCount} Haltestellen • ${mvvMeta.connectionCount} Streckenkanten • Quelle: ${mvvMeta.source} (${mvvMeta.version})`}
          control={
            <button
              type="button"
              onClick={onSyncMvv}
              disabled={isSyncingMvv}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-[#e3e3e3] bg-slate-100 hover:bg-slate-200 dark:bg-[#282a2c] dark:hover:bg-[#323437] border border-slate-200 dark:border-[#3c4043] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSyncingMvv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-[#8ab4f8]" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6]" />
              )}
              <span>{isSyncingMvv ? 'Aktualisiere...' : 'Aktualisieren'}</span>
            </button>
          }
        />

        {/* Autobahnnetz */}
        <SettingsRow
          icon={Car}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          title="Autobahn-Netz & Rampen (OpenStreetMap)"
          description={`${highwayMeta.junctionCount} Anschlussstellen • ${highwayMeta.rampCount} Rampen • Stand: ${formattedHighwayDate} • Quelle: ${highwayMeta.source}`}
          control={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSyncHighway}
                disabled={isSyncingHighway}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-[#e3e3e3] bg-slate-100 hover:bg-slate-200 dark:bg-[#282a2c] dark:hover:bg-[#323437] border border-slate-200 dark:border-[#3c4043] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSyncingHighway ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6]" />
                )}
                <span>{isSyncingHighway ? 'Lade OSM...' : 'OSM aktualisieren'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetHighway}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
                title="Auf Standard zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        />

        {/* ÖPNV-Verkehrsmittel Filter Chips */}
        <div className="p-4 bg-slate-50/40 dark:bg-[#1a1b1d]/40 space-y-2">
          <div className="text-xs font-medium text-slate-800 dark:text-[#e3e3e3]">
            Aktive Verkehrsträger für die ÖPNV-Reisezeitberechnung:
          </div>
          <div className="flex flex-wrap gap-2">
            {TRANSIT_MODES.map((mode) => {
              const isActive = activeTransitModes.includes(mode.id);
              const Icon = mode.icon;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onToggleTransitMode(mode.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-blue-600 text-white dark:bg-[#8ab4f8] dark:text-[#131314] shadow-xs'
                      : 'bg-white dark:bg-[#282a2c] text-slate-600 dark:text-[#9aa0a6] border border-slate-200/90 dark:border-[#3c4043] hover:border-slate-300 dark:hover:border-[#5f6368]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsCard>

      {/* 2. Additional Regions Accordion Card */}
      <SettingsCard
        title="Weitere Regionen & Betrachtungsgebiete"
        subtitle="Erweiterbare Datenpakete für zukünftige Metropolregionen"
        headerAction={
          <button
            type="button"
            onClick={() => setShowOtherRegions((prev) => !prev)}
            className="text-xs font-medium text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showOtherRegions ? 'Ausblenden' : 'Anzeigen'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOtherRegions ? 'rotate-180' : ''}`} />
          </button>
        }
      >
        {showOtherRegions && (
          <div className="divide-y divide-slate-100 dark:divide-[#2d2f31]">
            {otherCities.map((city) => {
              const catEntry = AVAILABLE_REGIONS_CATALOG.find((c) => c.id === city.id);
              const isInstalled = installedList.some((r) => r.id === city.id);
              const isDownloading = downloadingRegionId === city.id;

              return (
                <SettingsRow
                  key={city.id}
                  icon={Building2}
                  iconColor="text-slate-500 dark:text-[#9aa0a6]"
                  iconBg="bg-slate-100 dark:bg-[#282a2c]"
                  title={city.name}
                  description={city.description}
                  badge={
                    isInstalled ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Installiert
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-[#282a2c] dark:text-[#9aa0a6]">
                        Katalog
                      </span>
                    )
                  }
                  control={
                    catEntry ? (
                      <button
                        type="button"
                        onClick={() => handleSelectOrDownloadRegion(catEntry)}
                        disabled={Boolean(isDownloading)}
                        className="px-3 py-1 rounded-full text-xs font-medium text-blue-600 dark:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isDownloading ? 'Lade...' : isInstalled ? 'Aktivieren' : 'Herunterladen'}
                      </button>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </SettingsCard>
    </div>
  );
};
