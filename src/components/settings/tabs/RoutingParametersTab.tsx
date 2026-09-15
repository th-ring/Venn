import React from 'react';
import { IsochroneOptions, DEFAULT_ROUTING_PARAMETERS } from '../../../types';
import { Footprints, Train, Bike, RotateCcw, Info } from 'lucide-react';

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

  const isModifiedFromDefaults =
    walkingSpeed !== DEFAULT_ROUTING_PARAMETERS.walkingSpeedKmh ||
    urbanDetour !== DEFAULT_ROUTING_PARAMETERS.urbanDetourFactor ||
    minTransferBuffer !== DEFAULT_ROUTING_PARAMETERS.minTransferBufferMin ||
    transferRiskBuffer !== DEFAULT_ROUTING_PARAMETERS.transferRiskBufferMin ||
    enableHeadway !== DEFAULT_ROUTING_PARAMETERS.enableHeadwayPenalty ||
    cyclingSpeed !== DEFAULT_ROUTING_PARAMETERS.cyclingSpeedKmh ||
    parkingBuffer !== DEFAULT_ROUTING_PARAMETERS.drivingParkingBufferMin;

  return (
    <div className="space-y-4">
      {/* Intro info box */}
      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 rounded-xl flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-[#c4c7c5] leading-relaxed">
          Passe die Berechnungs-Parameter zentral an. Änderungen wirken sich direkt auf alle Erreichbarkeits-Polygone (Isochronen), Haltestelleneinzugsgebiete und Punkt-zu-Punkt-Fahrzeitschätzungen aus.
        </div>
      </div>

      {/* 1. Fußverkehr (Walking) */}
      <div className="p-3.5 bg-slate-50/90 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl space-y-3.5">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80 dark:border-[#3c4043]">
          <Footprints className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
            Fußverkehr (Walking & First/Last Mile)
          </h4>
        </div>

        {/* Walking Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="param-walking-speed" className="font-medium text-slate-700 dark:text-[#e3e3e3]">
              Fußgänger-Geschwindigkeit:
            </label>
            <span className="font-semibold text-blue-600 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-xs">
              {walkingSpeed.toFixed(1)} km/h
              <span className="text-[10px] font-normal text-slate-500 dark:text-[#9aa0a6] ml-1">
                ({(60 / walkingSpeed).toFixed(1)} min/km)
              </span>
            </span>
          </div>
          <input
            id="param-walking-speed"
            type="range"
            min="2.5"
            max="6.5"
            step="0.1"
            value={walkingSpeed}
            onChange={(e) => onUpdateOptions({ walkingSpeedKmh: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#747775]">
            <span>2.5 km/h (Gemütlich / Barrierearm)</span>
            <span>4.0 km/h (Standard)</span>
            <span>6.5 km/h (Zügiges Gehen)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-tight">
            Gilt für Zustiegswege von der Haustür zur Haltestelle sowie Ausstiegswege zum Büro.
          </p>
        </div>

        {/* Detour Factor Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-[#2e3134]">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="param-urban-detour" className="font-medium text-slate-700 dark:text-[#e3e3e3]">
              Städtischer Umwegfaktor (Detour-Faktor):
            </label>
            <span className="font-semibold text-blue-600 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-xs">
              {urbanDetour.toFixed(2)}×
            </span>
          </div>
          <input
            id="param-urban-detour"
            type="range"
            min="1.10"
            max="1.60"
            step="0.05"
            value={urbanDetour}
            onChange={(e) => onUpdateOptions({ urbanDetourFactor: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#747775]">
            <span>1.10× (Direkte Verbindungen)</span>
            <span>1.35× (Städtischer Standard)</span>
            <span>1.60× (Starke Umwege / Barrieren)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-tight">
            Verhältnis der tatsächlichen Straßen- und Gehwegdistanz zur Luftlinie (z. B. durch Häuserblocks, Schienenquerungen und Ampeln).
          </p>
        </div>
      </div>

      {/* 2. ÖPNV-Puffer & Taktzeit-Malus */}
      <div className="p-3.5 bg-slate-50/90 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl space-y-3.5">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80 dark:border-[#3c4043]">
          <Train className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8]" />
          <h4 className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
            ÖPNV-Puffer & Taktzeiten (Transit Realism)
          </h4>
        </div>

        {/* Headway Penalty Switch */}
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#1a1b1e] p-2.5 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">
              Taktzeit-Malus (Headway / 2) einrechnen
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] leading-tight mt-0.5">
              Schlägt die halbe durchschnittliche Taktzeit als rechnerische Wartezeit auf. Bevorzugt dichte Takte (z. B. 5-Min-Takt) gegenüber seltenen Verbindungen (z. B. 20-Min-Takt).
            </div>
          </div>
          <button
            id="switch-enable-headway-penalty"
            type="button"
            role="switch"
            aria-checked={enableHeadway}
            onClick={() => onUpdateOptions({ enableHeadwayPenalty: !enableHeadway })}
            className={`w-8 h-4.5 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              enableHeadway ? 'bg-blue-600 dark:bg-[#8ab4f8]' : 'bg-slate-200 dark:bg-[#3c4043]'
            }`}
          >
            <div
              className={`bg-white dark:bg-[#1e1f20] w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                enableHeadway ? 'translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Min Transfer Buffer Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="param-min-transfer-buffer" className="font-medium text-slate-700 dark:text-[#e3e3e3]">
              Mindest-Umsteigepuffer:
            </label>
            <span className="font-semibold text-blue-600 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-xs">
              {minTransferBuffer.toFixed(1)} Min
            </span>
          </div>
          <input
            id="param-min-transfer-buffer"
            type="range"
            min="1.0"
            max="8.0"
            step="0.5"
            value={minTransferBuffer}
            onChange={(e) => onUpdateOptions({ minTransferBufferMin: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#747775]">
            <span>1.0 Min (Knapp)</span>
            <span>4.0 Min (Empfohlen)</span>
            <span>8.0 Min (Komfortabel / Barrierefrei)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-tight">
            Mindestzeitaufwand für den physischen Wechsel zwischen Gleisen, Ebenen und Stationen.
          </p>
        </div>

        {/* Transfer Risk Buffer Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-[#2e3134]">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="param-transfer-risk-buffer" className="font-medium text-slate-700 dark:text-[#e3e3e3]">
              Verspätungsrisiko-Puffer:
            </label>
            <span className="font-semibold text-blue-600 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-xs">
              {transferRiskBuffer.toFixed(1)} Min
            </span>
          </div>
          <input
            id="param-transfer-risk-buffer"
            type="range"
            min="0.0"
            max="5.0"
            step="0.5"
            value={transferRiskBuffer}
            onChange={(e) => onUpdateOptions({ transferRiskBufferMin: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#747775]">
            <span>0.0 Min (Kein Aufschlag)</span>
            <span>2.0 Min (Standard)</span>
            <span>5.0 Min (Hohe Zuverlässigkeit)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-tight">
            Bestraft fragile Umsteigeverbindungen, um verlässliche Direkt- oder Taktverbindungen im Wohnbereich zu priorisieren.
          </p>
        </div>
      </div>

      {/* 3. Fahrrad & Pkw (Cycling & Driving) */}
      <div className="p-3.5 bg-slate-50/90 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-xl space-y-3.5">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80 dark:border-[#3c4043]">
          <Bike className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-semibold text-slate-900 dark:text-[#e3e3e3]">
            Fahrrad & Pkw (Individualverkehr)
          </h4>
        </div>

        {/* Cycling Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="param-cycling-speed" className="font-medium text-slate-700 dark:text-[#e3e3e3]">
              Fahrrad-Durchschnittsgeschwindigkeit:
            </label>
            <span className="font-semibold text-blue-600 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-xs">
              {cyclingSpeed.toFixed(1)} km/h
            </span>
          </div>
          <input
            id="param-cycling-speed"
            type="range"
            min="10.0"
            max="25.0"
            step="0.5"
            value={cyclingSpeed}
            onChange={(e) => onUpdateOptions({ cyclingSpeedKmh: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#747775]">
            <span>10.0 km/h (Stadtradeln)</span>
            <span>16.5 km/h (Standard)</span>
            <span>25.0 km/h (Schnelles E-Bike)</span>
          </div>
        </div>

        {/* Driving Parking Buffer Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-[#2e3134]">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="param-driving-parking" className="font-medium text-slate-700 dark:text-[#e3e3e3]">
              Pkw-Parkplatz- & Rüstzeitpuffer:
            </label>
            <span className="font-semibold text-blue-600 dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-xs">
              {parkingBuffer.toFixed(1)} Min
            </span>
          </div>
          <input
            id="param-driving-parking"
            type="range"
            min="0.0"
            max="10.0"
            step="0.5"
            value={parkingBuffer}
            onChange={(e) => onUpdateOptions({ drivingParkingBufferMin: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 dark:accent-[#8ab4f8] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#747775]">
            <span>0.0 Min (Nur Fahrzeit)</span>
            <span>3.0 Min (Standard)</span>
            <span>10.0 Min (Innenstadt-Parkplatzsuche)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] leading-tight">
            Wird bei Pkw-Pendelzeiten aufgeschlagen, um Parkplatzsuche, Ampelverzögerungen und Garagenausfahrt abzubilden.
          </p>
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-2 flex justify-end">
        <button
          id="btn-reset-routing-defaults"
          type="button"
          onClick={handleResetDefaults}
          disabled={!isModifiedFromDefaults}
          className={`px-3.5 py-1.5 text-xs rounded-full border flex items-center gap-1.5 transition-colors cursor-pointer ${
            isModifiedFromDefaults
              ? 'border-slate-300 dark:border-[#5f6368] text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c]'
              : 'border-slate-200 dark:border-[#3c4043] text-slate-400 dark:text-[#747775] cursor-not-allowed opacity-60'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Standardwerte wiederherstellen</span>
        </button>
      </div>
    </div>
  );
};
