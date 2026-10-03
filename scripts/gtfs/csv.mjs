/**
 * scripts/gtfs/csv.mjs
 * RFC 4180 compliant CSV parser with streaming chunk support.
 */

/**
 * Parses a single CSV line into an array of strings, respecting quotes and double-quote escapes.
 * @param {string} line
 * @returns {string[]}
 */
export function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  const len = line.length;

  for (let i = 0; i < len; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && i + 1 < len && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses an entire CSV string into an array of key-value objects.
 * Strips UTF-8 BOM if present.
 * @param {string} content
 * @returns {Array<Record<string, string>>}
 */
export function parseCsvString(content) {
  if (!content) return [];
  const clean = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];
  const headerCount = headers.length;

  for (let i = 1; i < lines.length; i++) {
    const rowValues = parseCsvLine(lines[i]);
    if (rowValues.length < headerCount) continue;
    const obj = {};
    for (let h = 0; h < headerCount; h++) {
      obj[headers[h]] = rowValues[h] ?? '';
    }
    rows.push(obj);
  }

  return rows;
}

/**
 * Creates a memory-efficient streaming CSV parser that processes chunks and emits rows.
 * @param {{
 *   onHeader?: (headers: string[]) => void,
 *   onRow: (values: string[], headers: string[]) => void
 * }} handlers
 */
export function createCsvStreamParser({ onHeader, onRow }) {
  let remainder = '';
  let headers = null;
  let inQuotes = false;
  const decoder = new TextDecoder('utf-8');

  function processText(text, isFinal = false) {
    let combined = remainder + text;
    if (combined.charCodeAt(0) === 0xFEFF) combined = combined.slice(1);

    let i = 0;
    let lineStart = 0;
    const len = combined.length;

    while (i < len) {
      const c = combined[i];
      if (c === '"') {
        if (inQuotes && i + 1 < len && combined[i + 1] === '"') {
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
      } else if (!inQuotes && (c === '\n' || c === '\r')) {
        const line = combined.slice(lineStart, i).trim();
        if (line.length > 0) {
          if (!headers) {
            headers = parseCsvLine(line);
            if (onHeader) onHeader(headers);
          } else {
            const vals = parseCsvLine(line);
            onRow(vals, headers);
          }
        }
        if (c === '\r' && i + 1 < len && combined[i + 1] === '\n') {
          i++;
        }
        lineStart = i + 1;
      }
      i++;
    }

    if (isFinal) {
      if (lineStart < len) {
        const line = combined.slice(lineStart).trim();
        if (line.length > 0) {
          if (!headers) {
            headers = parseCsvLine(line);
            if (onHeader) onHeader(headers);
          } else {
            const vals = parseCsvLine(line);
            onRow(vals, headers);
          }
        }
      }
      remainder = '';
    } else {
      remainder = combined.slice(lineStart);
    }
  }

  return {
    push(chunk) {
      if (typeof chunk === 'string') {
        processText(chunk, false);
      } else {
        processText(decoder.decode(chunk, { stream: true }), false);
      }
    },
    end() {
      processText(decoder.decode(), true);
    },
  };
}
