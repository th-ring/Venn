import React from 'react';
import { IsochroneOptions, DEFAULT_ROUTING_PARAMETERS } from '../../../types';
import { Footprints, Train, Bike, RotateCcw } from 'lucide-react';
import { SettingsCard } from '../ui/SettingsCard';
import { SettingsRow } from '../ui/SettingsRow';
import { SettingsSwitch } from '../ui/SettingsSwitch';
import { SettingsSlider } from '../ui/SettingsSlider';

interface RoutingParametersTabProps {
  options: IsochroneOptions;
  onUpdateOptions: (updated: Partial<IsochroneOptions>) => void;
}

export const RoutingParametersTab: React.FC<RoutingParametersTabProps> = ({
  options,
  onUpdateOptions,
}) => {
  const walkingSpeed = options.walkingSpeedKmh ?? DEFAULT_ROUTING_PARAMETERS.walkingSpeedKmh;
  const urbanDetour = options.urbanDetourFactor ?? DEFAULT_ROUTING_PARAMETERS.urbanDetourFactor;
  const minTransferBuffer = options.minTransferBufferMin ?? DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin;
  const transferRiskBuffer = options.transferRiskBufferMin ?? DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin;
  const enableHeadway = options.enableHeadwayPenalty ?? DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty;
  const cyclingSpeed = options.cyclingSpeedKmh ?? DEFAULT_ROUTING_PARAMETERS.cyclingSpeedKmh;
  const parkingBuffer = options.drivingParkingBufferMin ?? DEFAULT_ROUTING_PARAMETERS.drivingParkingBufferMin;

  const handleResetDefaults = () => {
    onUpdateOptions({
      walkingSpeedKmh: DEFAULT_ROUTING_PARAMETERS.walkingSpeedKmh,
      urbanDetourFactor: DEFAULT_ROUTING_PARAMETERS.urbanDetourFactor,
      minTransferBufferMin: DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin,
      transferRiskBufferMin: DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin,
      enableHeadwayPenalty: DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty,
      cyclingSpeedKmh: DEFAULT_ROUTING_PARAMETERS.cyclingSpeedKmh,
      drivingParkingBufferMin: DEFAULT_ROUTING_PARAMETERS.drivingParkingBufferMin,
    });
  };

  const isModified =
    walkingSpeed !== DEFAULT_ROUTING_PARAMETERS.walkingSpeedKmh ||
    urbanDetour !== DEFAULT_ROUTING_PARAMETERS.urbanDetourFactor ||
    minTransferBuffer !== DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin ||
    transferRiskBuffer !== DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin ||
    enableHeadway !== DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty ||
    cyclingSpeed !== DEFAULT_ROUTING_PARAMETERS.cyclingSpeedKmh ||
    parkingBuffer !== DEFAULT_ROUTING_PARAMETERS.drivingParkingBufferMin;

  return (
    <div className="space-y-6">
      {/* Tab Header & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
            Mobilität & Routing-Parameter
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
            Passe Geschwindigkeiten, Umsteigezeiten und Sicherheitszuschläge für die Reisezeitberechnung an.
          </p>
        </div>

        {isModified && (
          <button
            type="button"
            onClick={handleResetDefaults}
            className="self-start sm:self-center px-3 py-1.5 rounded-full text-xs font-medium text-blue-600 dark:text-[#8ab4f8] bg-blue-50 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Auf Standard zurücksetzen</span>
          </button>
        )}
      </div>

      {/* 1. Fußverkehr */}
      <SettingsCard
        title="Fußverkehr (Walking & First/Last Mile)"
        subtitle="Zustiegswege von der Wohnung zur Haltestelle und Ausstiegswege zum Zielort"
      >
        <div className="p-4 space-y-4">
          <SettingsSlider
            id="walking-speed-slider"
            label="Gehgeschwindigkeit"
            value={walkingSpeed}
            min={2.5}
            max={6.5}
            step={0.1}
            unit="km/h"
            formatValue={(v) => `${v.toFixed(1)} km/h (${(60 / v).toFixed(1)} min/km)`}
            minLabel="2.5 km/h (Gemütlich)"
            maxLabel="6.5 km/h (Zügig)"
            description="Durchschnittliches Gehtempo auf Fußwegen und Bürgersteigen."
            onChange={(v) => onUpdateOptions({ walkingSpeedKmh: v })}
          />

          <div className="pt-2 border-t border-slate-100 dark:border-[#2d2f31]">
            <SettingsSlider
              id="urban-detour-slider"
              label="Städtischer Umwegfaktor (Detour-Faktor)"
              value={urbanDetour}
              min={1.1}
              max={1.6}
              step={0.05}
              formatValue={(v) => `${v.toFixed(2)}×`}
              minLabel="1.10× (Direkt)"
              maxLabel="1.60× (Starke Umwege)"
              description="Verhältnis der tatsächlichen Straßennetzdistanz zur direkten Luftlinie (z. B. durch Häuserblocks und Schienenquerungen)."
              onChange={(v) => onUpdateOptions({ urbanDetourFactor: v })}
            />
          </div>
        </div>
      </SettingsCard>

      {/* 2. ÖPNV-Puffer & Taktzeiten */}
      <SettingsCard
        title="ÖPNV-Puffer & Taktzeiten (Transit Realism)"
        subtitle="Realistische Modellierung von Umstiegen, Taktintervallen und Fahrplanrisiken"
      >
        <SettingsRow
          icon={Train}
          iconColor="text-blue-600 dark:text-[#8ab4f8]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          title="Taktzeit-Malus (Headway / 2) einrechnen"
          description="Schlägt die halbe durchschnittliche Taktzeit als rechnerische Wartezeit auf. Bevorzugt dichte Takte (z. B. 5-Min-Takt) gegenüber seltenen Verbindungen (z. B. 20-Min-Takt)."
          control={
            <SettingsSwitch
              checked={enableHeadway}
              onChange={(checked) => onUpdateOptions({ enableHeadwayPenalty: checked })}
              ariaLabel="Taktzeit-Malus umschalten"
            />
          }
        />

        <div className="p-4 space-y-4">
          <SettingsSlider
            id="min-transfer-slider"
            label="Mindest-Umsteigepuffer"
            value={minTransferBuffer}
            min={1.0}
            max={8.0}
            step={0.5}
            unit="Min"
            formatValue={(v) => `${v.toFixed(1)} Min`}
            minLabel="1.0 Min (Knapp)"
            maxLabel="8.0 Min (Komfortabel)"
            description="Erforderlicher Mindestzeitaufwand für Treppen, Gleiswechsel und Ebenenwechsel an Bahnhöfen."
            onChange={(v) => onUpdateOptions({ minTransferBufferMin: v })}
          />

          <div className="pt-2 border-t border-slate-100 dark:border-[#2d2f31]">
            <SettingsSlider
              id="transfer-risk-slider"
              label="Verspätungsrisiko-Puffer"
              value={transferRiskBuffer}
              min={0.0}
              max={5.0}
              step={0.5}
              unit="Min"
              formatValue={(v) => `${v.toFixed(1)} Min`}
              minLabel="0.0 Min (Kein Aufschlag)"
              maxLabel="5.0 Min (Hohe Zuverlässigkeit)"
              description="Bestraft fragile Anschlüsse mit knapper Umsteigezeit, um verlässliche Direktverbindungen zu priorisieren."
              onChange={(v) => onUpdateOptions({ transferRiskBufferMin: v })}
            />
          </div>
        </div>
      </SettingsCard>

      {/* 3. Individualverkehr */}
      <SettingsCard
        title="Individualverkehr (Fahrrad & Pkw)"
        subtitle="Geschwindigkeiten und Zeitaufwand für Rad und Auto"
      >
        <div className="p-4 space-y-4">
          <SettingsSlider
            id="cycling-speed-slider"
            label="Fahrrad-Geschwindigkeit"
            value={cyclingSpeed}
            min={10.0}
            max={25.0}
            step={0.5}
            unit="km/h"
            formatValue={(v) => `${v.toFixed(1)} km/h`}
            minLabel="10.0 km/h (Cityrad)"
            maxLabel="25.0 km/h (E-Bike)"
            description="Durchschnittliches Reisetempo inklusive Ampelstopps und Radwege."
            onChange={(v) => onUpdateOptions({ cyclingSpeedKmh: v })}
          />

          <div className="pt-2 border-t border-slate-100 dark:border-[#2d2f31]">
            <SettingsSlider
              id="driving-parking-slider"
              label="Pkw-Parkplatz- & Rüstzeitpuffer"
              value={parkingBuffer}
              min={0.0}
              max={10.0}
              step={0.5}
              unit="Min"
              formatValue={(v) => `${v.toFixed(1)} Min`}
              minLabel="0.0 Min (Nur reine Fahrt)"
              maxLabel="10.0 Min (Innenstadt-Suche)"
              description="Zeitaufschlag für Garagenausfahrt, Ampelverzögerungen und Parkplatzsuche am Zielort."
              onChange={(v) => onUpdateOptions({ drivingParkingBufferMin: v })}
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};
