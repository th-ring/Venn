import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  ExternalLink,
  X,
  CheckCircle2,
  Shield,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export interface ApiKeyGuideTooltipProps {
  api: 'google' | 'ors';
  className?: string;
  variant?: 'badge' | 'icon-only';
}

export const ApiKeyGuideTooltip: React.FC<ApiKeyGuideTooltipProps> = ({
  api,
  className = '',
  variant = 'badge',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const handleMouseLeave = useCallback(() => {
    if (isPinned) return; // Stay open if clicked/pinned
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250); // slight grace delay to permit moving mouse into popover
  }, [clearCloseTimeout, isPinned]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearCloseTimeout();
      if (isOpen && isPinned) {
        setIsOpen(false);
        setIsPinned(false);
      } else {
        setIsOpen(true);
        setIsPinned(true);
      }
    },
    [clearCloseTimeout, isOpen, isPinned]
  );

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsPinned(false);
  }, []);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      clearCloseTimeout();
    };
  }, [isOpen, clearCloseTimeout]);

  const isGoogle = api === 'google';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 transition-all rounded-md cursor-pointer ${
          variant === 'badge'
            ? isGoogle
              ? 'text-[11px] font-medium text-blue-700 bg-blue-100/70 hover:bg-blue-100 px-2 py-0.5 border border-blue-200 shadow-2xs'
              : 'text-[11px] font-medium text-slate-700 bg-slate-200/70 hover:bg-slate-200 px-2 py-0.5 border border-slate-300 shadow-2xs'
            : 'p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full'
        } ${isOpen ? 'ring-2 ring-blue-400/40 ring-offset-1' : ''}`}
        title={
          isGoogle
            ? 'Anleitung: Google Maps API-Key mit benötigten APIs und Berechtigungen erstellen'
            : 'Anleitung: OpenRouteService API-Key mit Berechtigungen und Services erstellen'
        }
        aria-label={
          isGoogle
            ? 'Anleitung zur Erstellung des Google Maps API-Keys'
            : 'Anleitung zur Erstellung des OpenRouteService API-Keys'
        }
        aria-expanded={isOpen}
      >
        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        {variant === 'badge' && <span>Anleitung</span>}
      </button>

      {/* Floating Popover Tooltip */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={
            isGoogle
              ? 'Anleitung Google Maps API-Key'
              : 'Anleitung OpenRouteService API-Key'
          }
          className="absolute left-0 sm:left-auto sm:-left-2 top-full mt-2 z-50 w-80 sm:w-96 max-w-[calc(100vw-2.5rem)] bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 text-slate-800 p-3.5 text-xs leading-relaxed animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  isGoogle
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>{isGoogle ? 'Google Maps API-Key' : 'OpenRouteService Key'}</span>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isGoogle
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Setup-Guide
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Benötigte APIs, Berechtigungen & Erstellung
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              title="Schließen"
              aria-label="Schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Guide Steps */}
          {isGoogle ? (
            <div className="space-y-3 pt-2.5 text-[11px]">
              {/* Step 1: GCP Console & Project */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    GCP-Projekt anlegen & Abrechnung verknüpfen
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Öffne die{' '}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    , erstelle ein Projekt (oder wähle eins) und verknüpfe ein
                    Rechnungskonto (Google gewährt monatlich{' '}
                    <strong className="text-slate-800">200&nbsp;$ kostenloses Guthaben</strong>).
                  </p>
                </div>
              </div>

              {/* Step 2: Enable Required APIs */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dahinterliegende APIs aktivieren</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Aktiviere unter <em>„APIs & Dienste“ → „Bibliothek“</em> zwingend
                    diese <strong>zwei APIs</strong>:
                  </p>
                  <ul className="mt-1.5 space-y-1 pl-1">
                    <li className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-200/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Maps JavaScript API</strong>
                        <span className="block text-[10px] text-slate-500">
                          Für Kartenanzeige, Satellitenkarte & Basemap-Ebenen.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-200/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Google Maps Isochrones API</strong>
                        <span className="block text-[10px] text-slate-500">
                          (isochrones.googleapis.com) für Pkw-, Fahrrad- & Fußweg-Zonen.
                        </span>
                      </div>
                    </li>
                  </ul>
                  <div className="text-[10px] text-amber-700 mt-1 pl-1">
                    ℹ <em>ÖPNV:</em> Google Isochrones unterstützt prinzipbedingt keinen ÖPNV. LivingAreaFinder nutzt dafür automatisch die MVV/MVG-Haltestellenmatrix.
                  </div>
                </div>
              </div>

              {/* Step 3: Key Permissions & Restrictions */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Berechtigungen & Einschränkungen festlegen</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Unter <em>„Anmeldedaten“ → „+ Anmeldedaten erstellen“ → „API-Schlüssel“</em>:
                  </p>
                  <div className="mt-1 space-y-1 pl-1 text-[10px]">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                      <span className="font-semibold text-slate-800">API-Einschränkungen (API Restrictions):</span>
                      <p className="text-slate-600 mt-0.5">
                        Wähle <em>„Schlüssel einschränken“</em> und hake ausschließlich{' '}
                        <strong>Maps JavaScript API</strong> und{' '}
                        <strong>Google Maps Isochrones API</strong> an.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                      <span className="font-semibold text-slate-800">Anwendungseinschränkungen:</span>
                      <p className="text-slate-600 mt-0.5">
                        Für Webnutzung <em>„Websites (HTTP-Referrer)“</em> wählen (z.&nbsp;B.{' '}
                        <code className="bg-white px-1 py-0.2 rounded border border-slate-200">http://localhost:*/*</code>{' '}
                        oder deine Domain). Für lokale Tests kann vorerst <em>„Keine“</em> gewählt werden.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2.5 text-[11px]">
              {/* Step 1: ORS Account */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    HeiGIT / ORS-Account erstellen
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Gehe zum{' '}
                    <a
                      href="https://openrouteservice.org/dev/#/home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      OpenRouteService Portal <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    (oder direkt ins{' '}
                    <a
                      href="https://account.heigit.org/manage/key"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      Dashboard <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    ), registriere ein kostenfreies Konto und bestätige deine E-Mail.
                  </p>
                </div>
              </div>

              {/* Step 2: Token Creation & Token Type */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Token anfordern & Berechtigungen</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Klicke im Menü unter <em>„Tokens“</em> auf{' '}
                    <strong className="text-slate-800">„Request a token“</strong>:
                  </p>
                  <ul className="mt-1.5 space-y-1 pl-1 text-[10px]">
                    <li className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                      <strong className="text-slate-800">Token type:</strong> Wähle{' '}
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                        Standard
                      </span>{' '}
                      (100% kostenloser Free-Tier mit 2.000 Requests/Tag & 40 Isochronen/Minute).
                    </li>
                    <li className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                      <strong className="text-slate-800">Token name:</strong> Beliebigen Namen
                      eingeben (z.&nbsp;B.{' '}
                      <code className="bg-white px-1 py-0.2 rounded border border-slate-200">LivingAreaFinder</code>).
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3: Dahinterliegende APIs */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dahinterliegende APIs & Endpunkte</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Der Standard-Token deckt automatisch alle benötigten Isochronen-Endpunkte ab:
                  </p>
                  <div className="mt-1 bg-slate-50 p-1.5 rounded border border-slate-200/80 text-[10px] space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>v2/isochrones (Auto, Rad, Fußgänger)</span>
                    </div>
                    <p className="text-slate-500 pl-4.5">
                      Keine manuelle Freischaltung einzelner APIs nötig – der Key ist direkt einsatzbereit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Callout / Hint */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 bg-slate-50 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl text-[10px] text-slate-600">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {isGoogle
                ? 'Sicherheit: Der Key wird ausschließlich lokal in deinem Browser (localStorage) gespeichert und niemals an Drittserver übermittelt.'
                : 'Hinweis: OpenRouteService basiert auf OpenStreetMap und ist ideal als kostenlose, schlüssellose Fallback-Option.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
