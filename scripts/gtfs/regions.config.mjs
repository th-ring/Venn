/**
 * scripts/gtfs/regions.config.mjs
 * Configuration for GTFS regional extraction and compilation.
 */

export const REGIONS_CONFIG = {
  'munich-mvv': {
    id: 'munich-mvv',
    name: 'München (MVV Gesamtnetz)',
    outputFileName: 'munich.json',
    walkshedFileName: 'munich-mvv.json',
    // Bounding Box: [minLng, minLat, maxLng, maxLat]
    bbox: [11.03, 47.88, 12.02, 48.41],
    attribution: 'Münchner Verkehrs- und Tarifverbund GmbH (MVV) unter CC BY 4.0',
    feedSourceUrl: 'https://opendata.muenchen.de/dataset/soll-fahrplandaten-mvv-gesamtnetz-gtfs',
    // Max footpath distance between clustered stations (meters)
    maxFootpathDistanceMeters: 400,
    // Average walking speed for inter-station footpaths in km/h
    footpathWalkSpeedKmh: 4.0,
    // Footpath urban detour factor
    footpathDetourFactor: 1.25,
    // Mode normalization helper
    classifyRoute: (route) => {
      const typeNum = parseInt(route.route_type, 10);
      const shortName = (route.route_short_name || '').trim();
      const longName = (route.route_long_name || '').trim();

      // Check S-Bahn
      if (
        /^S\s?[1-8,20]/i.test(shortName) ||
        typeNum === 109 ||
        /S-Bahn/i.test(longName)
      ) {
        return {
          type: 'sbahn',
          line: shortName.replace(/\s+/g, ''),
        };
      }

      // Check U-Bahn
      if (
        /^U\s?[1-8]/i.test(shortName) ||
        typeNum === 1 ||
        (typeNum >= 400 && typeNum <= 405) ||
        /U-Bahn/i.test(longName)
      ) {
        return {
          type: 'ubahn',
          line: shortName.replace(/\s+/g, ''),
        };
      }

      // Check Tram
      if (
        typeNum === 0 ||
        (typeNum >= 900 && typeNum <= 906) ||
        /Tram/i.test(shortName) ||
        /Straßenbahn/i.test(longName)
      ) {
        const cleanName = shortName.replace(/^Tram\s*/i, '').trim();
        return {
          type: 'tram',
          line: `Tram ${cleanName}`,
        };
      }

      // Check Rail (Regionalzug / RE / RB / BRB / alex)
      if (
        typeNum === 2 ||
        (typeNum >= 100 && typeNum <= 117) ||
        /^(RE|RB|BRB|ALX|ECE|IC|ICE)/i.test(shortName) ||
        /Regional/i.test(longName)
      ) {
        return {
          type: 'train',
          line: shortName || 'Regionalzug',
        };
      }

      // Check ExpressBus (X...)
      if (/^X\s?\d+/i.test(shortName)) {
        return {
          type: 'bus',
          line: shortName.replace(/\s+/g, ''),
        };
      }

      // Fallback Bus
      const cleanBusName = shortName.replace(/^Bus\s*/i, '').trim();
      return {
        type: 'bus',
        line: cleanBusName ? `Bus ${cleanBusName}` : 'Bus',
      };
    },
  },
};
