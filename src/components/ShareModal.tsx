import React, { useState } from 'react';
import { PersonProfile, CommuteSchedule } from '../types';
import {
  FullShareConfig,
  serializeConfigToUrl,
  serializeConfigToJson,
  parseConfigFromInput,
} from '../services/configShareService';
import {
  Share2,
  Copy,
  Check,
  X,
  Link as LinkIcon,
  Globe,
  FileCode2,
  Download,
  Upload,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: PersonProfile[];
  schedule: CommuteSchedule;
  fullConfig?: FullShareConfig;
  onApplyConfig?: (config: FullShareConfig) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  profiles,
  schedule,
  fullConfig,
  onApplyConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  // Build full config fallback if not passed directly
  const activeConfig: FullShareConfig = fullConfig || {
    version: 2,
    profiles,
    schedule,
  };

  const shareUrl = serializeConfigToUrl(activeConfig);
  const jsonString = serializeConfigToJson(activeConfig);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleExecuteImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Bitte füge zuerst eine Share-URL oder einen JSON-Konfigurationscode ein.');
      return;
    }

    const parsed = parseConfigFromInput(importText.trim());
    if (!parsed || !parsed.profiles || parsed.profiles.length === 0) {
      setImportError('Ungültiges Format. Bitte prüfe, ob die vollständige URL oder der gültige JSON-Block kopiert wurde.');
      return;
    }

    if (onApplyConfig) {
      onApplyConfig(parsed);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Wohnortsuche teilen & verwalten</h3>
              <p className="text-xs text-slate-500">Profile, Adressen, Filter & Ebenen als Code oder Link</p>
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

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'export'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Link & Export</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Konfiguration importieren</span>
          </button>
        </div>

        {/* Tab 1: Export / Share Link */}
        {activeTab === 'export' && (
          <div className="space-y-4 overflow-y-auto pr-0.5">
            <p className="text-xs text-slate-600 leading-relaxed">
              Mit diesem Link werden alle Personen, Adressen, Pendelzeiten, Ebenen-Filter und Karteneinstellungen
              1:1 geteilt und können direkt in jedem Browser aufgerufen werden:
            </p>

            {/* Profiles Summary Chips */}
            <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
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
            <div className="relative">
              <div className="flex items-center border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-1">
                <div className="pl-2.5 pr-1 text-slate-400">
                  <LinkIcon className="w-4 h-4" />
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
                  onClick={handleCopyLink}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Kopiert!' : 'Link kopieren'}</span>
                </button>
              </div>
            </div>

            {/* Extra Options: JSON Copy */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">JSON-Konfiguration</div>
                  <div className="text-[10px] text-slate-400">Zur Sicherung oder Weitergabe als Text</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'JSON kopiert!' : 'JSON kopieren'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === 'import' && (
          <div className="space-y-3 overflow-y-auto pr-0.5">
            <p className="text-xs text-slate-600 leading-relaxed">
              Füge hier eine geteilte Such-URL (z. B. mit <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">#zone=...</code>)
              oder einen JSON-Konfigurationscode ein, um die Suche auf diesem Rechner 1:1 wiederherzustellen:
            </p>

            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              placeholder="https://...#zone=... oder { &quot;v&quot;: 2, &quot;p&quot;: [...] }"
              rows={5}
              className="w-full text-xs p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500 font-mono resize-none bg-slate-50"
            />

            {importError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Konfiguration erfolgreich angewendet! Fenster schließt...</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!importText.trim() || importSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Konfiguration jetzt anwenden</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 mt-4 border-t border-slate-100">
          <span className="flex items-center gap-1 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            100% Client-Side & datenschutzkonform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-600 hover:text-slate-900"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
