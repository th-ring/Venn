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
      <div className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#3c4043] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#e3e3e3]">Wohnortsuche teilen & verwalten</h3>
              <p className="text-xs text-slate-500 dark:text-[#9aa0a6]">Profile, Adressen, Filter & Ebenen als Code oder Link</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-[#9aa0a6] hover:text-slate-600 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-[#131314] p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white dark:bg-[#282a2c] text-slate-900 dark:text-[#e3e3e3] shadow-xs'
                : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Link & Export</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white dark:bg-[#282a2c] text-slate-900 dark:text-[#e3e3e3] shadow-xs'
                : 'text-slate-600 dark:text-[#9aa0a6] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Konfiguration importieren</span>
          </button>
        </div>

        {/* Tab 1: Export / Share Link */}
        {activeTab === 'export' && (
          <div className="space-y-4 overflow-y-auto pr-0.5">
            <p className="text-xs text-slate-600 dark:text-[#c4c7c5] leading-relaxed">
              Mit diesem Link werden alle Personen, Adressen, Pendelzeiten, Ebenen-Filter und Karteneinstellungen
              1:1 geteilt und können direkt in jedem Browser aufgerufen werden:
            </p>

            {/* Profiles Summary Chips */}
            <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-[#131314] p-3 rounded-2xl border border-slate-200/80 dark:border-[#3c4043]">
              {profiles.map((p, idx) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#282a2c] border border-slate-200 dark:border-[#3c4043] text-xs shadow-2xs font-medium text-slate-800 dark:text-[#e3e3e3]"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-semibold">{p.name || `Person ${idx + 1}`}</span>
                  <span className="text-slate-400 dark:text-[#9aa0a6]">({p.travelTimeMinutes}m)</span>
                </div>
              ))}
            </div>

            {/* URL Input with Copy Button */}
            <div className="relative">
              <div className="flex items-center border border-slate-200 dark:border-[#3c4043] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#131314] p-1">
                <div className="pl-2.5 pr-1 text-slate-400 dark:text-[#9aa0a6]">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full text-xs bg-transparent py-2 text-slate-600 dark:text-[#c4c7c5] font-mono truncate focus:outline-none"
                />
                <button
                  id="btn-copy-share-url"
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] text-white dark:text-[#131314]'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Kopiert!' : 'Link kopieren'}</span>
                </button>
              </div>
            </div>

            {/* Extra Options: JSON Copy */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#131314] border border-slate-200/80 dark:border-[#3c4043] rounded-2xl">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-slate-500 dark:text-[#9aa0a6]" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">JSON-Konfiguration</div>
                  <div className="text-[10px] text-slate-400 dark:text-[#9aa0a6]">Zur Sicherung oder Weitergabe als Text</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#3c4043] bg-white dark:bg-[#282a2c] hover:bg-slate-100 dark:hover:bg-[#3c4043] text-slate-700 dark:text-[#e3e3e3] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'JSON kopiert!' : 'JSON kopieren'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === 'import' && (
          <div className="space-y-3 overflow-y-auto pr-0.5">
            <p className="text-xs text-slate-600 dark:text-[#c4c7c5] leading-relaxed">
              Füge hier eine geteilte Such-URL (z. B. mit <code className="bg-slate-100 dark:bg-[#282a2c] text-slate-800 dark:text-[#e3e3e3] px-1 py-0.5 rounded text-[11px]">#zone=...</code>)
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
              className="w-full text-xs p-3 border border-slate-300 dark:border-[#3c4043] rounded-2xl focus:outline-none focus:border-blue-500 dark:focus:border-[#8ab4f8] font-mono resize-none bg-slate-50 dark:bg-[#131314] text-slate-800 dark:text-[#e3e3e3]"
            />

            {importError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Konfiguration erfolgreich angewendet! Fenster schließt...</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!importText.trim() || importSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] text-white dark:text-[#131314] disabled:bg-slate-200 dark:disabled:bg-[#282a2c] disabled:text-slate-400 dark:disabled:text-[#9aa0a6] text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Konfiguration jetzt anwenden</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-[#9aa0a6] pt-3 mt-4 border-t border-slate-100 dark:border-[#3c4043]">
          <span className="flex items-center gap-1 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-[#9aa0a6]" />
            100% Client-Side & datenschutzkonform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-600 dark:text-[#c4c7c5] hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
