import React, { useState, useRef, useMemo } from 'react';
import * as turf from '@turf/turf';
import { ApartmentListing, IntersectionSubArea, IntersectionAreaStats } from '../../types';
import {
  validateApartmentDataset,
  saveCustomApartments,
  clearCustomApartments,
  loadApartmentCatalog,
  extractIntersectionSubAreas,
  getPortalSearchLinks,
  buildAgenticBrowserSearchPrompt,
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
  Layers,
  ExternalLink,
  Compass,
  Bot,
  Sparkles,
} from 'lucide-react';

interface ApartmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: ApartmentListing[];
  intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.GeometryCollection> | null;
  intersectionStats?: IntersectionAreaStats;
  onRefreshListings?: () => void;
}

export const ApartmentManagerModal: React.FC<ApartmentManagerModalProps> = ({
  isOpen,
  onClose,
  listings,
  intersection,
  intersectionStats,
  onRefreshListings,
}) => {
  const [copiedBbox, setCopiedBbox] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedAgentPrompt, setCopiedAgentPrompt] = useState(false);
  const [selectedPortalKey, setSelectedPortalKey] = useState<string>('immoscout24');
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract individual sub-areas / islands from the intersection
  const subAreas = useMemo(() => {
    return extractIntersectionSubAreas(intersection, listings);
  }, [intersection, listings]);

  const activeSubArea = useMemo<IntersectionSubArea | null>(() => {
    if (!selectedSubAreaId) return null;
    return subAreas.find((sa) => sa.id === selectedSubAreaId) || null;
  }, [subAreas, selectedSubAreaId]);

  if (!isOpen) return null;

  // Compute BBOX string based on active sub-area or full intersection
  let bboxString = '11.535,48.140,11.595,48.175';
  let activeCenter = { lat: 48.155, lng: 11.565 };
  let activeRadiusKm = 2;

  if (activeSubArea) {
    bboxString = activeSubArea.bbox.map((n) => Math.round(n * 10000) / 10000).join(',');
    activeCenter = activeSubArea.center;
    activeRadiusKm = activeSubArea.radiusKm;
  } else if (intersection) {
    try {
      const rawBbox = turf.bbox(intersection as any);
      bboxString = rawBbox.map((n) => Math.round(n * 10000) / 10000).join(',');
      activeCenter = { lat: (rawBbox[1] + rawBbox[3]) / 2, lng: (rawBbox[0] + rawBbox[2]) / 2 };
      const areaM2 = turf.area(intersection as any);
      activeRadiusKm = Math.max(1, Math.round(Math.sqrt(areaM2 / Math.PI / 1_000_000) * 10) / 10);
    } catch {}
  }

  const portalLinks = activeSubArea
    ? activeSubArea.portalLinks
    : getPortalSearchLinks(activeCenter, bboxString.split(',').map(Number) as any, activeRadiusKm);

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

  const [jsonText, setJsonText] = useState('');
  const [jsonInputMode, setJsonInputMode] = useState<'upload' | 'text'>('upload');

  const processJsonString = (rawJson: string, sourceLabel: string = 'Eingabe') => {
    try {
      const parsed = JSON.parse(rawJson);
      const result = validateApartmentDataset(parsed);

      if (result.valid) {
        saveCustomApartments(result.listings);
        setImportStatus({
          success: true,
          message: `${result.listings.length} Wohnungen erfolgreich geladen und validiert! (${sourceLabel})`,
          errors: result.errors.length > 0 ? result.errors.slice(0, 3) : undefined,
        });
        if (onRefreshListings) {
          onRefreshListings();
        }
      } else {
        setImportStatus({
          success: false,
          message: 'Import fehlgeschlagen: Die Daten enthalten keine gültigen Wohnungsangebote.',
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processJsonString(text, file.name);
    };
    reader.readAsText(file);
    // Reset file input value so re-uploading the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyJsonText = () => {
    if (!jsonText.trim()) {
      setImportStatus({
        success: false,
        message: 'Bitte füge zuerst JSON-Daten in das Textfeld ein.',
      });
      return;
    }
    processJsonString(jsonText, 'Textfeld');
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            version: '1.1.0',
            exportedAt: new Date().toISOString(),
            count: listings.length,
            portalLinks,
            listings,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `venn-apartments-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDefaults = () => {
    clearCustomApartments();
    setImportStatus({
      success: true,
      message: 'Münchner Standard-Musterwohnungen wiederhergestellt.',
    });
    if (onRefreshListings) {
      onRefreshListings();
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1f20] rounded-3xl border border-slate-200 dark:border-[#3c4043] shadow-2xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Wohnungsangebote & Ingestion-Manager
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#9aa0a6] truncate">
                Zwei Ingestion-Pfade: Strukturierte JSON-Dateien & Scraper für Überlappungsfelder
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Message Alert */}
          {importStatus && (
            <div
              className={`p-3.5 rounded-2xl flex items-start gap-2.5 ${
                importStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-bold">{importStatus.message}</div>
                {importStatus.errors && (
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] opacity-80">
                    {importStatus.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Aktiver Datenbestand */}
          <div className="bg-slate-50 dark:bg-[#131314] rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-[#3c4043] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileJson className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  Aktueller Datenbestand
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">
                  {listings.length} Wohnungen geladen und im Cache hinterlegt
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Aktuelle Wohnungsdaten als JSON herunterladen"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Münchner Musterdaten neu laden"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>
            </div>
          </div>

          {/* Section 2: Sub-Area / Überlappungsfeld Auswahl */}
          {subAreas.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Überlappungsfelder (Getrennte Isochronen-Inseln)</span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  {subAreas.length} getrennte Bereiche erkannt
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedSubAreaId(null)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    selectedSubAreaId === null
                      ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500'
                      : 'bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#c4c7c5] border-slate-200 dark:border-[#3c4043] hover:bg-slate-100'
                  }`}
                >
                  Gesamte Schnittmenge ({listings.length} Whg.)
                </button>
                {subAreas.map((sa) => (
                  <button
                    key={sa.id}
                    type="button"
                    onClick={() => setSelectedSubAreaId(sa.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      selectedSubAreaId === sa.id
                        ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500'
                        : 'bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#c4c7c5] border-slate-200 dark:border-[#3c4043] hover:bg-slate-100'
                    }`}
                  >
                    {sa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Live Portal Links für den Bereich */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-orange-500" />
                <span>Portal-Direktsuche ({activeSubArea ? activeSubArea.label.split('(')[0].trim() : 'Gesamter Treffbereich'})</span>
              </h4>
              <span className="text-[10px] text-slate-400">1-Klick Live-Suche</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {portalLinks.map((link) => (
                <a
                  key={link.portal}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] hover:bg-slate-50 dark:hover:bg-[#282a2c] flex items-center justify-between text-left transition-colors group cursor-pointer"
                  title={link.description}
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-[#8ab4f8]">
                      {link.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{link.badge}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Section 4: JSON Datei oder Text eingeben */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa0a6]">
                Weg 1: Eigene JSON-Daten importieren
              </h4>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#131314] border border-slate-200/80 dark:border-[#3c4043]">
                <button
                  type="button"
                  onClick={() => setJsonInputMode('upload')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                    jsonInputMode === 'upload'
                      ? 'bg-white dark:bg-[#282a2c] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-white'
                  }`}
                >
                  Datei-Upload
                </button>
                <button
                  type="button"
                  onClick={() => setJsonInputMode('text')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                    jsonInputMode === 'text'
                      ? 'bg-white dark:bg-[#282a2c] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-[#9aa0a6] dark:hover:text-white'
                  }`}
                >
                  Texteingabe (JSON)
                </button>
              </div>
            </div>

            {jsonInputMode === 'upload' ? (
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
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] p-3 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#9aa0a6]">
                  <span>Füge hier ein JSON-Array oder ein Objekt mit <code>"listings": [...]</code> ein:</span>
                  {jsonText && (
                    <button
                      type="button"
                      onClick={() => setJsonText('')}
                      className="text-slate-400 hover:text-rose-500 text-[10px] cursor-pointer"
                    >
                      Leeren
                    </button>
                  )}
                </div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "id": "apt-101",\n    "title": "2-Zimmer Wohnung Maxvorstadt",\n    "lat": 48.151,\n    "lng": 11.569,\n    "priceCold": 1250,\n    "sizeSqm": 62,\n    "rooms": 2\n  }\n]`}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 dark:border-[#3c4043] bg-slate-50 dark:bg-[#131314] text-slate-900 dark:text-[#e3e3e3] font-mono text-xs p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-y"
                  spellCheck={false}
                />
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[10px] text-slate-400 dark:text-[#9aa0a6]">
                    Unterstützt rohe Arrays oder Exporte mit Metadaten
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyJsonText}
                    disabled={!jsonText.trim()}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                      jsonText.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#282a2c] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>JSON übernehmen</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Web-Scraper im Treffbereich */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa0a6]">
                Weg 2: Web-Scraper für dieses Überlappungsfeld
              </h4>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Antigravity Skill bereit
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>CLI-Befehl {activeSubArea ? `(${activeSubArea.label.split('(')[0].trim()})` : '(Treffbereich)'}</span>
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
                <span>BBOX: <code className="text-white font-mono">{bboxString}</code></span>
                <button
                  type="button"
                  onClick={handleCopyBbox}
                  className="text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {copiedBbox ? 'Kopiert' : 'BBOX kopieren'}
                </button>
              </div>
            </div>

            {/* Transparent Bot-Protection Policy Card */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Hinweis zum Bot-Schutz:</strong> Kommerzielle Portale schützen ihre Daten per WAF & Captcha.
                Venn trifft bewusst keine Schein-Annahmen: Nutze die Direktlinks oben, um aktuelle Live-Inserate für dieses Feld direkt im Browser zu öffnen, oder importiere eine JSON-Datei.
              </span>
            </div>
          </div>

          {/* Section 6: Weg 3: Agentische Browser-Suche */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa0a6] flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Weg 3: Agentische Browser-Suche (Antigravity, Codex & Cloud Code)</span>
              </h4>
              <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Integriertes Browser-Tool</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
              <p className="text-xs text-slate-600 dark:text-[#c4c7c5]">
                Wenn Portale automatisierte API-Anfragen per Bot-Schutz blockieren, kann der KI-Agent den
                <strong> integrierten Browser</strong> (über <code className="font-semibold text-purple-700 dark:text-purple-300">/browser</code>) öffnen, die Angebote interaktiv rendern und die Daten direkt nach <code className="font-mono text-[11px] font-semibold">public/data/apartments.json</code> schreiben.
              </p>

              {/* Portal Selector for Browser Search */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-[#9aa0a6]">Ziel-Portal:</span>
                {portalLinks.map((link) => (
                  <button
                    key={link.portal}
                    type="button"
                    onClick={() => setSelectedPortalKey(link.portal)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                      selectedPortalKey === link.portal
                        ? 'bg-purple-600 text-white border-purple-600 dark:bg-purple-500'
                        : 'bg-white dark:bg-[#1e1f20] text-slate-700 dark:text-[#c4c7c5] border-slate-200 dark:border-[#3c4043] hover:bg-slate-100'
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
              </div>

              {/* Generated Agent Prompt Box */}
              {(() => {
                const chosenLink = portalLinks.find((l) => l.portal === selectedPortalKey) || portalLinks[0];
                const areaLabel = activeSubArea ? activeSubArea.label.split('(')[0].trim() : 'Gemeinsamer Treffbereich';
                const areaKm2 = activeSubArea ? activeSubArea.areaKm2 : intersectionStats?.areaKm2;
                const rawBboxParts = bboxString.split(',').map((n) => parseFloat(n.trim()));
                const bboxNumbers: [number, number, number, number] =
                  rawBboxParts.length === 4 && rawBboxParts.every((n) => !isNaN(n))
                    ? (rawBboxParts as [number, number, number, number])
                    : [11.535, 48.140, 11.595, 48.175];

                const promptString = buildAgenticBrowserSearchPrompt({
                  portalName: chosenLink?.name || 'ImmoScout24',
                  portalUrl: chosenLink?.url || 'https://www.immobilienscout24.de',
                  portalKey: chosenLink?.portal || selectedPortalKey,
                  areaLabel,
                  areaKm2,
                  center: activeCenter,
                  bbox: bboxNumbers,
                  radiusKm: activeRadiusKm,
                  addressOrDistrict: intersectionStats?.centerAddress,
                });

                const handleCopyAgentPrompt = async () => {
                  try {
                    await navigator.clipboard.writeText(promptString);
                    setCopiedAgentPrompt(true);
                    setTimeout(() => setCopiedAgentPrompt(false), 2000);
                  } catch {}
                };

                return (
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-purple-400" />
                        <span>Prompt für deinen KI-Agenten (vollständiger Kontext & Schema):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAgentPrompt}
                        className="hover:text-white flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer text-purple-300"
                      >
                        {copiedAgentPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAgentPrompt ? 'Kopiert!' : 'Prompt kopieren'}</span>
                      </button>
                    </div>
                    <div className="text-purple-300 text-[11px] leading-relaxed break-words select-all font-mono whitespace-pre-wrap max-h-56 overflow-y-auto bg-slate-950/70 p-2.5 rounded-lg border border-purple-900/40">
                      {promptString}
                    </div>
                  </div>
                );
              })()}
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
