import React, { useState, useRef } from 'react';
import * as turf from '@turf/turf';
import { ApartmentListing } from '../../types';
import {
  validateApartmentDataset,
  saveCustomApartments,
  clearCustomApartments,
  loadApartmentCatalog,
} from '../../services/apartmentService';
import {
  X,
  Upload,
  Download,
  Copy,
  Check,
  RotateCcw,
  FileJson,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Home,
  Info,
} from 'lucide-react';

interface ApartmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: ApartmentListing[];
  intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  onRefreshListings?: () => void;
}

export const ApartmentManagerModal: React.FC<ApartmentManagerModalProps> = ({
  isOpen,
  onClose,
  listings,
  intersection,
  onRefreshListings,
}) => {
  const [copiedBbox, setCopiedBbox] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Compute intersection BBOX
  let bboxString = '11.535,48.140,11.595,48.175';
  if (intersection) {
    try {
      const rawBbox = turf.bbox(intersection as any);
      bboxString = rawBbox.map((n) => Math.round(n * 10000) / 10000).join(',');
    } catch {}
  }

  const scraperCommand = `node scripts/scrapeApartments.mjs --bbox ${bboxString} --limit 15`;

  const handleCopyBbox = async () => {
    try {
      await navigator.clipboard.writeText(bboxString);
      setCopiedBbox(true);
      setTimeout(() => setCopiedBbox(false), 2000);
    } catch {}
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(scraperCommand);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const result = validateApartmentDataset(parsed);

        if (result.valid) {
          saveCustomApartments(result.listings);
          setImportStatus({
            success: true,
            message: `${result.listings.length} Wohnungen erfolgreich geladen und validiert!`,
            errors: result.errors.length > 0 ? result.errors.slice(0, 3) : undefined,
          });
          if (onRefreshListings) {
            onRefreshListings();
          }
        } else {
          setImportStatus({
            success: false,
            message: 'Import fehlgeschlagen: Die Datei enthält keine gültigen Wohnungsdaten.',
            errors: result.errors,
          });
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: `JSON-Syntaxfehler: ${err.message || 'Ungültiges Dateiformat'}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      source: 'Venn Housing Export',
      listings,
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `venn-apartments-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDefaults = async () => {
    clearCustomApartments();
    await loadApartmentCatalog();
    setImportStatus({
      success: true,
      message: 'Standard-Wohnungsdaten für München erfolgreich wiederhergestellt.',
    });
    if (onRefreshListings) {
      onRefreshListings();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e1f20] rounded-3xl border border-slate-200 dark:border-[#3c4043] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Wohnungssuche & Datenschnittstelle
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#9aa0a6]">
                Strukturierte Wohnungsdaten für den gemeinsamen Treffbereich verwalten
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Message if any */}
          {importStatus && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                importStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold">{importStatus.message}</div>
                {importStatus.errors && importStatus.errors.length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] opacity-90">
                    {importStatus.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Aktive Daten */}
          <div className="bg-slate-50 dark:bg-[#131314] rounded-2xl p-4 border border-slate-200/80 dark:border-[#3c4043] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 dark:text-[#9aa0a6] font-medium">Geladene Angebote</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {listings.length} Wohnungen im Katalog
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Aktuelle Wohnungsdaten als JSON exportieren"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportieren</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Münchner Musterdaten neu laden"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>
            </div>
          </div>

          {/* Section 2: JSON Datei importieren */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa0a6]">
              Weg 1: Eigene JSON-Datei importieren
            </h4>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-[#3c4043] hover:border-blue-500 dark:hover:border-[#8ab4f8] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-white dark:bg-[#1e1f20] group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-6 h-6 mx-auto text-slate-400 group-hover:text-blue-600 dark:group-hover:text-[#8ab4f8] transition-colors" />
              <div className="text-xs font-bold text-slate-800 dark:text-[#e3e3e3] mt-2">
                Klicken zum Auswählen oder JSON hier ablegen
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6] mt-0.5">
                Strenge Schema-Validierung: id, title, lat, lng, priceCold, sizeSqm, rooms
              </p>
            </div>
          </div>

          {/* Section 3: Scraper & Treffbereich-Koordinaten */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa0a6]">
                Weg 2: Web-Scraper im Treffbereich
              </h4>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Antigravity Skill bereit
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  Terminal-Befehl (CLI Scraper)
                </span>
                <button
                  type="button"
                  onClick={handleCopyCommand}
                  className="hover:text-white flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  {copiedCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommand ? 'Kopiert!' : 'Kopieren'}</span>
                </button>
              </div>

              <div className="text-emerald-400 break-all select-all font-semibold">
                {scraperCommand}
              </div>

              <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>BBOX der Schnittmenge: <code className="text-white font-mono">{bboxString}</code></span>
                <button
                  type="button"
                  onClick={handleCopyBbox}
                  className="text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {copiedBbox ? 'Kopiert' : 'BBOX kopieren'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8] shrink-0 mt-0.5" />
              <span>
                Der Scraper schreibt direkt in <code className="font-semibold font-mono">public/data/apartments.json</code>.
                Venn synchronisiert diese Datei automatisch mit dem Kartenlayer und der Treffbereich-Inspektion.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#131314] border-t border-slate-200 dark:border-[#3c4043] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
