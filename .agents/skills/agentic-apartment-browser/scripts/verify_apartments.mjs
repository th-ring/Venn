#!/usr/bin/env node
/**
 * verify_apartments.mjs
 *
 * Pre-Flight Verification & Strict Ingestion Tool for Venn's Apartment Aggregator.
 * 
 * Enforces:
 * 1. Strict ID & URL extraction (data-obid or regex /expose/(\d+)).
 * 2. Exclusion of swap listings (Tauschwohnung, Wohnungstausch, nur zum Tausch).
 * 3. Pre-flight availability check (HTTP 200, no .is24-deactivated-banner or deactivated strings).
 *
 * Usage:
 *   node .agents/skills/agentic-apartment-browser/scripts/verify_apartments.mjs [path-to-apartments.json]
 *   node .agents/skills/agentic-apartment-browser/scripts/verify_apartments.mjs --clean
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SWAP_OFFER_REGEX = /(?:tauschwohnung|wohnungstausch|nur\s+zum\s+tausch|tauschangebot)/i;

export const DEACTIVATION_INDICATORS = [
  '.is24-deactivated-banner',
  'is24-deactivated-banner',
  'Angebot wurde deaktiviert',
  'vorübergehend offline',
  'Das Inserat ist leider nicht mehr online',
  'Dieses Angebot ist leider nicht mehr verfügbar',
  'Angebot nicht mehr verfügbar',
  'Dieses Inserat ist nicht mehr verfügbar',
];

/**
 * Checks whether an apartment title or description signals a swap-only offer.
 */
export function isSwapOffer(title, description) {
  if (typeof title === 'string' && SWAP_OFFER_REGEX.test(title)) return true;
  if (typeof description === 'string' && SWAP_OFFER_REGEX.test(description)) return true;
  return false;
}

/**
 * Extracts numeric expose ID directly from data-obid or URL regex /expose/(\d+).
 */
export function extractExposeId(entry) {
  if (!entry) return null;
  if (typeof entry === 'object') {
    if (entry.dataObid && /^\d+$/.test(String(entry.dataObid).trim())) {
      return String(entry.dataObid).trim();
    }
    const urlStr = entry.href || entry.url;
    if (typeof urlStr === 'string') {
      const match = urlStr.match(/\/expose\/(\d+)/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    if (typeof entry.id === 'string') {
      const match = entry.id.match(/(?:is24|iw|wg|ka)?-?(\d{6,12})/i);
      if (match && match[1]) {
        return match[1];
      }
    }
  } else if (typeof entry === 'string') {
    const match = entry.match(/\/expose\/(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
    if (/^\d{6,12}$/.test(entry.trim())) {
      return entry.trim();
    }
  }
  return null;
}

/**
 * Performs a pre-flight availability check on the exposé URL:
 * - Checks HTTP status === 200
 * - Inspects HTML response for deactivation banners or offline text
 */
export async function checkExposeAvailability(url, options = {}) {
  const timeoutMs = options.timeoutMs || 5000;
  if (!url || !url.startsWith('http')) {
    return {
      available: false,
      statusCode: 0,
      reason: 'Ungültige oder fehlende URL',
    };
  }

  // Artificial non-numeric IDs (like apt-mujl0weo-01) on commercial portals are known to 404
  if (url.includes('immoscout24.de/expose/') && !/\/expose\/\d+/.test(url)) {
    return {
      available: false,
      statusCode: 404,
      reason: 'Künstliche ID / ungültiges Exposé-URL-Format',
    };
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.status !== 200) {
      return {
        available: false,
        statusCode: res.status,
        reason: `HTTP Status ${res.status} (erwartet: 200)`,
      };
    }

    const html = await res.text();

    for (const indicator of DEACTIVATION_INDICATORS) {
      if (html.includes(indicator)) {
        return {
          available: false,
          statusCode: 200,
          reason: `Deaktivierungs-Hinweis erkannt: "${indicator}"`,
        };
      }
    }

    return {
      available: true,
      statusCode: 200,
    };
  } catch (err) {
    return {
      available: false,
      statusCode: 0,
      reason: `Netzwerkfehler: ${err.message}`,
    };
  }
}

/**
 * Verifies and filters an apartment dataset array.
 */
export async function verifyAndFilterDataset(listings, options = {}) {
  const { performHttpCheck = true, logger = console.log } = options;
  const verifiedListings = [];
  const rejected = [];

  for (const listing of listings) {
    // 1. Tauschangebot-Prüfung
    if (isSwapOffer(listing.title, listing.description)) {
      rejected.push({
        listing,
        reason: 'Tauschangebot verworfen (Signalwörter in Titel/Beschreibung)',
      });
      continue;
    }

    // 2. ID- & URL-Prüfung
    const exposeId = extractExposeId(listing);
    const hasNumericUrl = listing.url && /\/expose\/\d+/.test(listing.url);

    if (listing.source === 'immoscout24' && !exposeId && !hasNumericUrl) {
      rejected.push({
        listing,
        reason: 'Keine echte Exposé-ID (künstlich zusammengesetzte ID)',
      });
      continue;
    }

    // 3. Pre-Flight HTTP Check (optional / if enabled)
    if (performHttpCheck && listing.url) {
      const probe = await checkExposeAvailability(listing.url);
      if (!probe.available) {
        rejected.push({
          listing,
          reason: `Pre-Flight fehlgeschlagen: ${probe.reason}`,
        });
        continue;
      }
    }

    verifiedListings.push(listing);
  }

  return { verifiedListings, rejected };
}

// -------------------------------------------------------------
// CLI Execution
// -------------------------------------------------------------
async function runCli() {
  const args = process.argv.slice(2);
  const targetPath = args[0] && !args[0].startsWith('--')
    ? path.resolve(process.cwd(), args[0])
    : path.resolve(__dirname, '../../../../public/data/apartments.json');

  const cleanOnly = args.includes('--clean');
  const skipHttp = args.includes('--skip-http');

  console.log('='.repeat(65));
  console.log(' Venn Apartment Pre-Flight Verification & Filter');
  console.log('='.repeat(65));
  console.log(`Zieldatei: ${targetPath}`);

  if (!fs.existsSync(targetPath)) {
    console.error(`Datei nicht gefunden: ${targetPath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
  const originalListings = Array.isArray(raw.listings) ? raw.listings : [];

  console.log(`Gefundene Inserate zur Prüfung: ${originalListings.length}`);

  const { verifiedListings, rejected } = await verifyAndFilterDataset(originalListings, {
    performHttpCheck: !skipHttp,
    logger: console.log,
  });

  console.log(`\nErgebnis:`);
  console.log(`  • Valide & aktiv verbleibend: ${verifiedListings.length}`);
  console.log(`  • Verworfene Angebote: ${rejected.length}`);

  rejected.forEach((r, idx) => {
    console.log(`    [${idx + 1}] "${r.listing.title || r.listing.id}": ${r.reason}`);
  });

  raw.listings = verifiedListings;
  raw.count = verifiedListings.length;
  raw.lastUpdated = new Date().toISOString();

  fs.writeFileSync(targetPath, JSON.stringify(raw, null, 2), 'utf-8');
  console.log(`\nAktualisierte Datei gespeichert: ${targetPath}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli().catch((err) => {
    console.error('Fehler bei der Verifikation:', err);
    process.exit(1);
  });
}
