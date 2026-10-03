/**
 * scripts/gtfs/zip.mjs
 * High-performance streaming zip extraction based on fflate.
 */

import fs from 'node:fs';
import * as fflate from 'fflate';

/**
 * Reads specific smaller text files from a GTFS zip archive into memory.
 * @param {string} zipPath Path to the GTFS .zip file
 * @param {string[]} targetFiles Array of filenames to extract (e.g. ['stops.txt', 'routes.txt'])
 * @returns {Promise<Record<string, string>>} Object mapping filename to UTF-8 string
 */
export async function readZipTextFiles(zipPath, targetFiles) {
  const targetSet = new Set(targetFiles);
  const result = {};

  return new Promise((resolve, reject) => {
    let unzipper;
    try {
      unzipper = new fflate.Unzip((stream) => {
        if (targetSet.has(stream.name)) {
          const chunks = [];
          stream.ondata = (err, chunk, final) => {
            if (err) {
              reject(err);
              return;
            }
            if (chunk) chunks.push(chunk);
            if (final) {
              const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
              const merged = new Uint8Array(totalLen);
              let offset = 0;
              for (const c of chunks) {
                merged.set(c, offset);
                offset += c.length;
              }
              result[stream.name] = new TextDecoder('utf-8').decode(merged);
            }
          };
          stream.start();
        }
      });
      unzipper.register(fflate.UnzipInflate);
    } catch (err) {
      reject(err);
      return;
    }

    const fileStream = fs.createReadStream(zipPath);
    fileStream.on('data', (chunk) => {
      try {
        unzipper.push(chunk);
      } catch (err) {
        fileStream.destroy();
        reject(err);
      }
    });
    fileStream.on('error', (err) => reject(err));
    fileStream.on('end', () => resolve(result));
  });
}

/**
 * Streams a specific large entry from the zip archive in chunks (e.g., stop_times.txt).
 * @param {string} zipPath Path to the GTFS .zip file
 * @param {string} targetFileName File name inside zip to stream
 * @param {(chunk: Uint8Array, isFinal: boolean) => void} onChunk Callback for incoming chunks
 * @returns {Promise<void>}
 */
export async function streamZipFile(zipPath, targetFileName, onChunk) {
  return new Promise((resolve, reject) => {
    let matched = false;

    const unzipper = new fflate.Unzip((stream) => {
      if (stream.name === targetFileName) {
        matched = true;
        stream.ondata = (err, chunk, final) => {
          if (err) {
            reject(err);
            return;
          }
          if (chunk) onChunk(chunk, final);
          if (final) {
            resolve();
          }
        };
        stream.start();
      }
    });
    unzipper.register(fflate.UnzipInflate);

    const fileStream = fs.createReadStream(zipPath);
    fileStream.on('data', (chunk) => {
      try {
        unzipper.push(chunk);
      } catch (err) {
        fileStream.destroy();
        reject(err);
      }
    });
    fileStream.on('error', (err) => reject(err));
    fileStream.on('end', () => {
      if (!matched) {
        reject(new Error(`File "${targetFileName}" not found in zip archive ${zipPath}`));
      }
    });
  });
}
