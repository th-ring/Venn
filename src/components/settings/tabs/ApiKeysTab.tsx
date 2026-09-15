import React from 'react';
import { KeyCheckResult } from '../../../services/apiKeyValidator';
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  KeyRound,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { SecureApiKeyInput } from '../SecureApiKeyInput';
import { ApiKeyGuideSection } from '../ApiKeyGuideSection';
import { SettingsCard } from '../ui/SettingsCard';

interface ApiKeysTabProps {
  googleKeyInput: string;
  onChangeGoogleKeyInput: (val: string) => void;
  isCheckingGoogle: boolean;
  googleCheckResult: KeyCheckResult | null;
  onCheckGoogleKey: () => void;
  orsKeyInput: string;
  onChangeOrsKeyInput: (val: string) => void;
  isCheckingOrs: boolean;
  orsCheckResult: KeyCheckResult | null;
  onCheckOrsKey: () => void;
}

export const ApiKeysTab: React.FC<ApiKeysTabProps> = ({
  googleKeyInput,
  onChangeGoogleKeyInput,
  isCheckingGoogle,
  googleCheckResult,
  onCheckGoogleKey,
  orsKeyInput,
  onChangeOrsKeyInput,
  isCheckingOrs,
  orsCheckResult,
  onCheckOrsKey,
}) => {
  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h3 className="text-base font-medium text-slate-900 dark:text-[#e3e3e3]">
          API-Schlüssel & Schnittstellen
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
          Hinterlege eigene API-Schlüssel für die Google Maps Platform oder OpenRouteService.
          Schlüssel werden ausschließlich lokal in deinem Browser verschlüsselt im Speicher abgelegt.
        </p>
      </div>

      {/* 1. Google Maps Platform Card */}
      <SettingsCard
        title="Google Maps Platform API-Key"
        subtitle="Aktiviert die Google Maps Hintergrundkarte und die Google Maps Isochronen API"
        headerAction={
          <a
            href="https://console.cloud.google.com/google/maps-apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
            title="Google Cloud Console"
          >
            <span>GCP Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        }
      >
        <div className="p-4 space-y-3.5">
          {/* Secure Input + Test Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-[#c4c7c5]">
                API-Key (AIzaSy...):
              </label>
              <button
                type="button"
                onClick={onCheckGoogleKey}
                disabled={isCheckingGoogle || !googleKeyInput.trim()}
                className="px-3 py-1 rounded-full text-xs font-medium text-blue-600 dark:text-[#8ab4f8] bg-blue-50 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50 disabled:opacity-40 flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isCheckingGoogle ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3 h-3" />
                )}
                <span>{isCheckingGoogle ? 'Prüfe Key...' : 'Key testen'}</span>
              </button>
            </div>

            <SecureApiKeyInput
              value={googleKeyInput}
              onChange={onChangeGoogleKeyInput}
              placeholder="AIzaSy..."
            />
          </div>

          {/* Google Test Result Banner */}
          {googleCheckResult && (
            <div
              className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                googleCheckResult.valid
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {googleCheckResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{googleCheckResult.message}</span>
              </div>
              {googleCheckResult.details && (
                <p className="text-[11px] opacity-90 pl-6 leading-relaxed">
                  {googleCheckResult.details}
                </p>
              )}

              {/* Sub-API Breakdown */}
              {googleCheckResult.detailedGoogle && (
                <div className="pt-2 mt-1 border-t border-emerald-200/60 dark:border-emerald-800/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-[#1e1f20]/70 border border-emerald-200/50 dark:border-emerald-800/40">
                    <span>Maps JavaScript API:</span>
                    <span
                      className={`font-semibold ${
                        googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid' ? 'Aktiv' : 'Fehlt'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-[#1e1f20]/70 border border-emerald-200/50 dark:border-emerald-800/40">
                    <span>Isochrones API:</span>
                    <span
                      className={`font-semibold ${
                        googleCheckResult.detailedGoogle.isochronesApi.status === 'valid'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {googleCheckResult.detailedGoogle.isochronesApi.status === 'valid' ? 'Aktiv' : 'Deaktiviert'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Setup Guide Accordion */}
          <div className="pt-1">
            <ApiKeyGuideSection api="google" />
          </div>
        </div>
      </SettingsCard>

      {/* 2. OpenRouteService Card */}
      <SettingsCard
        title="OpenRouteService (ORS) API-Token"
        subtitle="Kostenlose Open-Source-Isochronen für Pkw, Fahrrad und Fußwege"
        headerAction={
          <a
            href="https://account.heigit.org/manage/key"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
            title="ORS Dashboard"
          >
            <span>ORS Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        }
      >
        <div className="p-4 space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-[#c4c7c5]">
                API-Token (5b3ce...):
              </label>
              <button
                type="button"
                onClick={onCheckOrsKey}
                disabled={isCheckingOrs || !orsKeyInput.trim()}
                className="px-3 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-[#e3e3e3] bg-slate-100 hover:bg-slate-200 dark:bg-[#282a2c] dark:hover:bg-[#323437] border border-slate-200 dark:border-[#3c4043] disabled:opacity-40 flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isCheckingOrs ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3 h-3" />
                )}
                <span>{isCheckingOrs ? 'Prüfe Key...' : 'Key testen'}</span>
              </button>
            </div>

            <SecureApiKeyInput
              value={orsKeyInput}
              onChange={onChangeOrsKeyInput}
              placeholder="5b3ce3597851110001cf6248..."
            />
          </div>

          {/* ORS Test Result */}
          {orsCheckResult && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                orsCheckResult.valid
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-300'
              }`}
            >
              {orsCheckResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-medium block">{orsCheckResult.message}</span>
                {orsCheckResult.details && (
                  <p className="text-[11px] opacity-90 mt-0.5">{orsCheckResult.details}</p>
                )}
              </div>
            </div>
          )}

          {/* Setup Guide Accordion */}
          <div className="pt-1">
            <ApiKeyGuideSection api="ors" />
          </div>
        </div>
      </SettingsCard>

      {/* Security Privacy Notice */}
      <div className="p-3.5 bg-slate-50 dark:bg-[#1e1f20] border border-slate-200/80 dark:border-[#3c4043] rounded-2xl flex items-start gap-2.5 text-xs text-slate-500 dark:text-[#9aa0a6]">
        <Lock className="w-4 h-4 text-slate-400 dark:text-[#747775] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 dark:text-[#e3e3e3]">Datenschutz-Garantie:</strong>{' '}
          Alle eingegebenen API-Schlüssel verbleiben ausschließlich im lokalen Speicher deines Browsers
          (Client-Side Storage) und werden niemals an unsere Server übermittelt oder protokolliert.
        </p>
      </div>
    </div>
  );
};
