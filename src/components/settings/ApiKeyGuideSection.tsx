import React, { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Shield,
  Layers,
  HelpCircle,
  Info,
} from 'lucide-react';

export interface ApiKeyGuideSectionProps {
  api: 'google' | 'ors';
  defaultExpanded?: boolean;
}

export const ApiKeyGuideSection: React.FC<ApiKeyGuideSectionProps> = ({
  api,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isGoogle = api === 'google';

  return (
    <div className="pt-1">
      {/* Expand/Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
          isGoogle
            ? 'bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-[#8ab4f8] border-blue-200/60 dark:border-blue-800/60'
            : 'bg-slate-100/80 hover:bg-slate-200/70 dark:bg-[#202124] dark:hover:bg-[#303134] text-slate-700 dark:text-[#e3e3e3] border-slate-200 dark:border-[#3c4043]'
        }`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <HelpCircle
            className={`w-3.5 h-3.5 shrink-0 ${
              isGoogle ? 'text-blue-600 dark:text-[#8ab4f8]' : 'text-slate-600 dark:text-[#9aa0a6]'
            }`}
          />
          <span>
            {isGoogle
              ? 'Anleitung: Google Maps Key erstellen & APIs freischalten'
              : 'Anleitung: Kostenlosen ORS-Key erstellen & Berechtigungen'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] opacity-80">
          <span>{isExpanded ? 'Ausblenden' : 'Anzeigen'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Inline Instruction Content */}
      {isExpanded && (
        <div className="mt-2 p-3.5 bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#3c4043] rounded-xl space-y-3 text-xs leading-relaxed shadow-2xs animate-in fade-in-50 duration-150 text-slate-800 dark:text-[#e3e3e3]">
          {isGoogle ? (
            /* GOOGLE MAPS GUIDE */
            <div className="space-y-3 text-[11px]">
              {/* Step 1: Project & Billing */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-[#8ab4f8] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-[#e3e3e3]">
                    GCP-Projekt anlegen & Abrechnung verknüpfen
                  </div>
                  <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                    Öffne die{' '}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-[#8ab4f8] hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    , erstelle ein Projekt (oder wähle ein bestehendes) und verknüpfe ein
                    Rechnungskonto (Google schenkt monatlich{' '}
                    <strong className="text-slate-800 dark:text-[#e3e3e3]">200&nbsp;$ kostenloses Guthaben</strong> für Maps Platform).
                  </p>
                </div>
              </div>

              {/* Step 2: Enable Required APIs */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-[#8ab4f8] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
                    <span>Dahinterliegende APIs aktivieren</span>
                  </div>
                  <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                    Aktiviere unter <em>„APIs & Dienste“ → „Bibliothek“</em> zwingend
                    diese <strong>zwei APIs</strong>:
                  </p>
                  <div className="mt-1.5 grid sm:grid-cols-2 gap-1.5">
                    <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-[#e3e3e3] block">Maps JavaScript API</strong>
                        <span className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">
                          Für Kartenanzeige, Satellitenkarte & Basemap-Ebenen.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-[#e3e3e3] block">Google Maps Isochrones API</strong>
                        <span className="text-[10px] text-slate-500 dark:text-[#9aa0a6]">
                          (isochrones.googleapis.com) für Pkw-, Rad- & Fußweg-Zonen.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-1.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 p-1.5 rounded-md">
                    ℹ <strong>ÖPNV-Hinweis:</strong> Google Isochrones unterstützt prinzipbedingt keinen ÖPNV. Venn nutzt für Bus & Bahn automatisch die integrierte MVV/MVG-Haltestellenmatrix.
                  </div>
                </div>
              </div>

              {/* Step 3: Key Permissions & Restrictions */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-[#8ab4f8] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
                    <span>Berechtigungen & Einschränkungen festlegen</span>
                  </div>
                  <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                    Gehe zu <em>„Anmeldedaten“ → „+ Anmeldedaten erstellen“ → „API-Schlüssel“</em>:
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    <div className="bg-slate-50 dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
                      <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">API-Einschränkungen (API Restrictions):</span>
                      <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                        Wähle <em>„Schlüssel einschränken“</em> und hake ausschließlich{' '}
                        <strong>Maps JavaScript API</strong> und{' '}
                        <strong>Google Maps Isochrones API</strong> an.
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
                      <span className="font-semibold text-slate-800 dark:text-[#e3e3e3]">Anwendungseinschränkungen:</span>
                      <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                        Für Web-Schutz <em>„Websites (HTTP-Referrer)“</em> wählen (z.&nbsp;B.{' '}
                        <code className="bg-white dark:bg-[#1e1f20] px-1 py-0.2 rounded border border-slate-200 dark:border-[#3c4043]">http://localhost:*/*</code>{' '}
                        oder deine Domain). Für lokale Tests kann vorübergehend <em>„Keine“</em> gewählt werden.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Hint */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#3c4043] flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-[#9aa0a6]">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8] shrink-0 mt-0.5" />
                <span>
                  Sicherheit: Dein API-Key wird ausschließlich lokal in deinem Browser (localStorage) gespeichert und niemals an Dritte oder Server übermittelt.
                </span>
              </div>
            </div>
          ) : (
            /* OPENROUTESERVICE GUIDE */
            <div className="space-y-3 text-[11px]">
              {/* Step 1: ORS Account */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-[#e3e3e3]">
                    HeiGIT / ORS-Account erstellen
                  </div>
                  <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                    Gehe zum{' '}
                    <a
                      href="https://openrouteservice.org/dev/#/home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-[#8ab4f8] hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      OpenRouteService Portal <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    (oder direkt ins{' '}
                    <a
                      href="https://account.heigit.org/manage/key"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-[#8ab4f8] hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      Dashboard <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    ), registriere ein kostenfreies Konto und bestätige deine E-Mail-Adresse.
                  </p>
                </div>
              </div>

              {/* Step 2: Token Creation & Token Type */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Token anfordern & Berechtigungen</span>
                  </div>
                  <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                    Klicke im Menü unter <em>„Tokens“</em> auf{' '}
                    <strong className="text-slate-800 dark:text-[#e3e3e3]">„Request a token“</strong>:
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    <div className="bg-slate-50 dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
                      <strong className="text-slate-800 dark:text-[#e3e3e3]">Token type:</strong> Wähle{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                        Standard
                      </span>{' '}
                      (Kostenfreier Tarif mit 2.000 Anfragen/Tag & 40 Isochronen/Minute).
                    </div>
                    <div className="bg-slate-50 dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043]">
                      <strong className="text-slate-800 dark:text-[#e3e3e3]">Token name:</strong> Beliebigen Namen
                      eingeben (z.&nbsp;B.{' '}
                      <code className="bg-white dark:bg-[#1e1f20] px-1 py-0.2 rounded border border-slate-200 dark:border-[#3c4043]">Venn</code>).
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Dahinterliegende APIs */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Dahinterliegende APIs & Endpunkte</span>
                  </div>
                  <p className="text-slate-600 dark:text-[#9aa0a6] mt-0.5">
                    Der Standard-Token deckt automatisch alle benötigten Isochronen-Endpunkte ab:
                  </p>
                  <div className="mt-1.5 bg-slate-50 dark:bg-[#282a2c] p-2 rounded-lg border border-slate-200/80 dark:border-[#3c4043] space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-[#e3e3e3] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>v2/isochrones (Auto, Rad, Fußgänger)</span>
                    </div>
                    <p className="text-slate-500 dark:text-[#9aa0a6] pl-5 text-[10px]">
                      Keine manuelle Freischaltung einzelner APIs nötig – der Key ist direkt einsatzbereit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Hint */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#3c4043] flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-[#9aa0a6]">
                <Info className="w-3.5 h-3.5 text-slate-500 dark:text-[#9aa0a6] shrink-0 mt-0.5" />
                <span>
                  Hinweis: OpenRouteService basiert auf OpenStreetMap und ist ideal als kostenlose Alternative oder Fallback ohne Kreditkarte.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
