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
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-[#e3e3e3]">Wohnortsuche teilen & verwalten</h3>
            <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5">Profile, Adressen, Filter & Ebenen als Link oder Code</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-[#9aa0a6] hover:text-slate-600 dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-full bg-slate-100 dark:bg-[#131314] p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
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
            <div className="flex flex-wrap gap-1.5 py-1">
              {profiles.map((p, idx) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-[#3c4043] bg-slate-50/70 dark:bg-[#131314]/70 text-xs font-medium text-slate-800 dark:text-[#e3e3e3]"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name || `Person ${idx + 1}`}</span>
                  <span className="text-slate-400 dark:text-[#9aa0a6] font-normal">({p.travelTimeMinutes}m)</span>
                </div>
              ))}
            </div>

            {/* URL Input with Copy Button */}
            <div className="relative">
              <div className="flex items-center border border-slate-300 dark:border-[#5f6368] rounded-full overflow-hidden bg-slate-50/50 dark:bg-[#131314]/50 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 p-1">
                <div className="pl-3 pr-1 text-slate-400 dark:text-[#9aa0a6]">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full text-xs bg-transparent py-1.5 px-1 text-slate-700 dark:text-[#c4c7c5] font-mono truncate focus:outline-none"
                />
                <button
                  id="btn-copy-share-url"
                  type="button"
                  onClick={handleCopyLink}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#131314]'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Kopiert!' : 'Link kopieren'}</span>
                </button>
              </div>
            </div>

            {/* Extra Options: JSON Copy */}
            <div className="flex items-center justify-between p-3 bg-slate-50/70 dark:bg-[#131314]/70 border border-slate-200/80 dark:border-[#3c4043] rounded-2xl">
              <div className="flex items-center gap-2.5">
                <FileCode2 className="w-4 h-4 text-slate-500 dark:text-[#9aa0a6]" />
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-[#e3e3e3]">JSON-Konfiguration</div>
                  <div className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">Zur Sicherung oder Weitergabe als Text</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-[#5f6368] bg-white dark:bg-[#282a2c] hover:bg-slate-50 dark:hover:bg-[#3c4043] text-slate-700 dark:text-[#e3e3e3] flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] text-white dark:text-[#131314] disabled:bg-slate-200 dark:disabled:bg-[#282a2c] disabled:text-slate-400 dark:disabled:text-[#9aa0a6] text-xs font-medium py-2.5 rounded-full shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Konfiguration jetzt anwenden</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-[#9aa0a6] pt-3 mt-4 border-t border-slate-100 dark:border-[#3c4043]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-[#9aa0a6]" />
            Client-Side & datenschutzkonform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
