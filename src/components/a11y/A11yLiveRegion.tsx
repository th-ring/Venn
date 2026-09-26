import React, { useEffect, useState, useRef } from 'react';
import { CalculationResult, PersonProfile } from '../../types';

interface A11yLiveRegionProps {
  result: CalculationResult | null;
  profiles: PersonProfile[];
  isCalculating: boolean;
}

/**
 * Screenreader Live Region (WCAG 4.1.3 Status Messages / Level AA)
 * Announces computation results, found residential zones, and empty states
 * politely to assistive technologies without visual disruption.
 */
export const A11yLiveRegion: React.FC<A11yLiveRegionProps> = ({
  result,
  profiles,
  isCalculating,
}) => {
  const [message, setMessage] = useState<string>('');
  const prevResultAreaRef = useRef<number | null>(null);

  useEffect(() => {
    if (isCalculating) {
      setMessage('Berechnung der gemeinsamen Wohnzonen läuft...');
      return;
    }

    if (!result) return;

    const activeCount = profiles.filter((p) => p.visible).length;
    if (activeCount < 2) {
      setMessage(`1 aktives Profil gewählt. Füge weitere Personen hinzu, um Schnittmengen zu berechnen.`);
      return;
    }

    const currentArea = result.intersectionAreaKm2 || 0;
    if (currentArea !== prevResultAreaRef.current) {
      prevResultAreaRef.current = currentArea;
      if (currentArea > 0) {
        setMessage(
          `Gemeinsame Wohnzone gefunden: ${currentArea} Quadratkilometer für ${activeCount} Personen erreichbar.`
        );
      } else {
        setMessage(
          `Keine gemeinsame Wohnzone für die aktuellen Reisezeiten gefunden. Überprüfe die Vorschläge in der Seitenleiste.`
        );
      }
    }
  }, [result, profiles, isCalculating]);

  return (
    <div
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      id="a11y-status-announcer"
    >
      {message}
    </div>
  );
};
