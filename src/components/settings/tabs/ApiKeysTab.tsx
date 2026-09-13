import React from 'react';
import { KeyCheckResult } from '../../../services/apiKeyValidator';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { SecureApiKeyInput } from '../SecureApiKeyInput';
import { ApiKeyGuideSection } from '../ApiKeyGuideSection';

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
    <div className="space-y-4">
      {/* Google Maps API Key Card */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-slate-900">
              Google Maps API Key
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* External Management Link */}
            <a
              href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition-colors"
              title="Google Cloud Console öffnen (API-Keys verwalten, Quotas & Einschränkungen prüfen)"
            >
              <span>GCP Console</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Test Key Button */}
            <button
              type="button"
              onClick={onCheckGoogleKey}
              disabled={isCheckingGoogle || !googleKeyInput.trim()}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100/80 disabled:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Diesen API-Key jetzt live auf Gültigkeit testen"
            >
              {isCheckingGoogle ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-blue-600" />
              )}
              <span>{isCheckingGoogle ? 'Prüfe Key...' : 'Key testen'}</span>
            </button>
          </div>
        </div>

        {/* Masked & Protected Input */}
        <SecureApiKeyInput
          value={googleKeyInput}
          onChange={onChangeGoogleKeyInput}
          placeholder="AIzaSy..."
        />

        {/* Google Key Test Result Banner with Individual Sub-Service Status */}
        {googleCheckResult && (
          <div className="space-y-2">
            <div
              className={`p-2.5 rounded-xl text-xs border flex flex-col gap-1 transition-all ${
                googleCheckResult.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {googleCheckResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{googleCheckResult.message}</span>
              </div>
              {googleCheckResult.details && (
                <p className="text-[11px] opacity-90 pl-5.5 leading-snug">
                  {googleCheckResult.details}
                </p>
              )}
            </div>

            {/* Split Diagnosis: Individual API Badges */}
            {googleCheckResult.detailedGoogle && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-xs">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  API-Berechtigungen im GCP-Projekt:
                </div>

                {/* 1. Maps JS API */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    {googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-800">
                        Maps JavaScript API
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Kartenanzeige, Satellit & Google Basemap
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {googleCheckResult.detailedGoogle.mapsJsApi.status === 'valid'
                      ? 'Aktiviert ✔'
                      : 'Fehlt / Beschränkt'}
                  </span>
                </div>

                {/* 2. Google Maps Isochrones API */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    {googleCheckResult.detailedGoogle.isochronesApi.status === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-800">
                        Google Maps Isochrones API
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Pkw-, Rad- & Fußwege-Polygone
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {googleCheckResult.detailedGoogle.isochronesApi.status !== 'valid' && (
                      <a
                        href="https://console.cloud.google.com/apis/library/isochrones.googleapis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                        title="Isochrones API in Google Cloud aktivieren"
                      >
                        Aktivieren <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        googleCheckResult.detailedGoogle.isochronesApi.status === 'valid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {googleCheckResult.detailedGoogle.isochronesApi.status === 'valid'
                        ? 'Aktiviert ✔'
                        : 'Deaktiviert'}
                    </span>
                  </div>
                </div>

                {/* 3. Transit Explanation */}
                <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 leading-snug">
                  <span className="font-semibold">ÖPNV-Besonderheit: </span>
                  Google bietet in seiner Isochrones API grundsätzlich keinen ÖPNV-Modus. Dafür wird die MVV/MVG-Matrix herangezogen.
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-1.5 bg-blue-50/80 border border-blue-200/60 rounded-lg p-2 text-[11px] text-blue-900 leading-snug">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Dieser Key aktiviert sowohl die <strong>Google Maps Hintergrundkarte</strong> (Maps JavaScript API) als auch die <strong>Google Maps Isochronen API</strong>.
          </span>
        </div>

        {/* Expandable Setup & Permissions Guide */}
        <ApiKeyGuideSection api="google" />
      </div>

      {/* OpenRouteService API Key Card */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-xs font-bold text-slate-900">
              OpenRouteService API Key (optional)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* External Management Link */}
            <a
              href="https://account.heigit.org/manage/key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition-colors"
              title="HeiGIT / ORS Dashboard öffnen (Keys verwalten, erstellen & Kontingente prüfen)"
            >
              <span>ORS Dashboard</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Test Key Button */}
            <button
              type="button"
              onClick={onCheckOrsKey}
              disabled={isCheckingOrs || !orsKeyInput.trim()}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 disabled:text-slate-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/60 hover:bg-slate-200 disabled:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="ORS API-Key live testen"
            >
              {isCheckingOrs ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-slate-600" />
              )}
              <span>{isCheckingOrs ? 'Prüfe Key...' : 'Key testen'}</span>
            </button>
          </div>
        </div>

        {/* Masked & Protected Input */}
        <SecureApiKeyInput
          value={orsKeyInput}
          onChange={onChangeOrsKeyInput}
          placeholder="5b3ce3597851110001cf6248..."
        />

        {/* ORS Test Result Banner */}
        {orsCheckResult && (
          <div
            className={`p-2.5 rounded-xl text-xs border flex flex-col gap-1 transition-all ${
              orsCheckResult.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              {orsCheckResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{orsCheckResult.message}</span>
            </div>
            {orsCheckResult.details && (
              <p className="text-[11px] opacity-90 pl-5.5 leading-snug">
                {orsCheckResult.details}
              </p>
            )}
          </div>
        )}

        <div className="flex items-start gap-1.5 bg-slate-100/80 border border-slate-200/80 rounded-lg p-2 text-[11px] text-slate-600 leading-snug">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            OpenRouteService liefert genaue Auto-, Fahrrad- und Fußgänger-Isochronen. Einen kostenlosen Token kannst du im{' '}
            <a
              href="https://openrouteservice.org/dev/#/home"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
            >
              ORS Portal <ExternalLink className="w-2.5 h-2.5" />
            </a>{' '}
            beantragen.
          </span>
        </div>

        {/* Expandable Setup & Permissions Guide */}
        <ApiKeyGuideSection api="ors" />
      </div>
    </div>
  );
};
