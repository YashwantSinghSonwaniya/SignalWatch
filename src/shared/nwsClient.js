import { SEVERITY_LEVELS, HAZARD_CATEGORIES } from './types.js';

const NWS_BASE_URL = 'https://api.weather.gov/alerts/active';
const DEFAULT_USER_AGENT = 'SignalWatch-HyperDart/1.0 (contact@signalwatch.org)';

/**
 * Builds standard NWS alerts URL based on coordinates or state area code
 */
export function buildNwsUrl({ latitude, longitude, stateAbb }) {
  if (latitude != null && longitude != null) {
    const lat = Number(latitude).toFixed(4);
    const lon = Number(longitude).toFixed(4);
    return `${NWS_BASE_URL}?point=${lat},${lon}&status=actual&message_type=alert,update`;
  }
  if (stateAbb) {
    return `${NWS_BASE_URL}?area=${stateAbb.toUpperCase()}&status=actual&message_type=alert,update`;
  }
  return null;
}

/**
 * Normalizes a single NWS GeoJSON feature into an immutable, structured alert object
 */
export function normalizeAlertFeature(feature, now = Date.now()) {
  if (!feature || !feature.properties) {
    return null;
  }
  const p = feature.properties;

  const rawSeverity = (p.severity || 'Unknown').trim();
  const severityKey = rawSeverity.toUpperCase();
  const severityMeta = SEVERITY_LEVELS[severityKey] || SEVERITY_LEVELS.UNKNOWN;

  const expiresTime = p.expires || p.ends || null;
  const isExpired = expiresTime ? new Date(expiresTime).getTime() <= now : false;

  const rawInstruction = p.instruction ? p.instruction.trim() : null;
  const plainInstruction = rawInstruction
    ? formatPlainInstruction(rawInstruction)
    : 'Monitor local NOAA Weather Radio or official municipal news broadcasts for critical emergency instructions.';

  return {
    id: feature.id || p.id || `${p.event}-${p.sent || p.effective}`,
    event: p.event || 'Weather Advisory',
    headline: p.headline || `${p.event || 'Alert'} issued for ${p.areaDesc || 'affected areas'}`,
    severity: severityMeta.label,
    severityRank: severityMeta.rank,
    urgency: p.urgency || 'Unknown',
    certainty: p.certainty || 'Unknown',
    areaDesc: p.areaDesc || 'Affected zone not specified in official bulletin',
    affectedZones: Array.isArray(p.affectedZones) ? p.affectedZones : [],
    effective: p.effective || p.sent || null,
    onset: p.onset || p.effective || null,
    expires: expiresTime,
    ends: p.ends || expiresTime,
    isExpired,
    instruction: rawInstruction,
    plainInstruction,
    description: p.description ? p.description.trim() : '',
    senderName: p.senderName || 'US National Weather Service',
    webUrl: p['@id'] || p.web || 'https://www.weather.gov',
    geometry: feature.geometry || null
  };
}

/**
 * Formats multi-paragraph or capitalized instructions into readable action sentences
 */
export function formatPlainInstruction(text) {
  if (!text) return '';
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Deduplicates alert features by unique event, headline and area
 */
export function deduplicateAlerts(alerts) {
  const seen = new Set();
  const result = [];

  for (const alert of alerts) {
    if (!alert) continue;
    // Deduplicate by event, headline, areaDesc, and expires
    const key = `${alert.event}|${alert.headline || ''}|${alert.areaDesc || ''}|${alert.expires || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(alert);
    }
  }

  return result;
}

/**
 * Filters alerts based on requested hazard category
 */
export function filterAlertsByHazard(alerts, hazardCategory = HAZARD_CATEGORIES.ALL) {
  if (!Array.isArray(alerts)) return [];
  if (!hazardCategory || hazardCategory === HAZARD_CATEGORIES.ALL) {
    return alerts;
  }

  return alerts.filter((alert) => {
    const text = `${alert.event} ${alert.headline} ${alert.description}`.toLowerCase();
    switch (hazardCategory) {
      case HAZARD_CATEGORIES.FLOOD:
        return /flood/i.test(text);
      case HAZARD_CATEGORIES.TORNADO:
        return /tornado/i.test(text);
      case HAZARD_CATEGORIES.HEAT:
        return /heat/i.test(text);
      case HAZARD_CATEGORIES.WINTER:
        return /winter|snow|blizzard|ice|freeze|frost|chill/i.test(text);
      case HAZARD_CATEGORIES.WIND:
        return /wind|gale/i.test(text);
      case HAZARD_CATEGORIES.FIRE:
        return /fire|red flag/i.test(text);
      case HAZARD_CATEGORIES.HURRICANE:
        return /hurricane|tropical|surge/i.test(text);
      case HAZARD_CATEGORIES.AIR_QUALITY:
        return /air quality|smoke/i.test(text);
      case HAZARD_CATEGORIES.SEVERE_WEATHER:
        return (
          alert.severityRank >= 3 ||
          /severe|warning|emergency|tornado|thunderstorm/i.test(alert.event)
        );
      default:
        return true;
    }
  });
}

/**
 * Fetches and processes real alerts from official NWS API
 */
export function fetchNwsAlerts({
  latitude,
  longitude,
  stateAbb,
  timeoutMs = 8000,
  fetchFn = fetch
}) {
  const url = buildNwsUrl({ latitude, longitude, stateAbb });
  if (!url) {
    return Promise.reject(new Error('Invalid query parameters: Missing coordinates or state code.'));
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  return fetchFn(url, {
    headers: {
      Accept: 'application/geo+json',
      'User-Agent': DEFAULT_USER_AGENT
    },
    signal: controller ? controller.signal : undefined
  })
    .then((res) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`National Weather Service API responded with HTTP ${res.status} (${res.statusText || 'Error'})`);
      }
      return res.json();
    })
    .then((geojson) => {
      if (!geojson || typeof geojson !== 'object' || !Array.isArray(geojson.features)) {
        throw new Error('Malformed GeoJSON: NWS response does not contain a valid features array.');
      }

      const now = Date.now();
      const rawNormalized = geojson.features
        .map((f) => normalizeAlertFeature(f, now))
        .filter(Boolean);

      // Deduplicate
      const deduplicated = deduplicateAlerts(rawNormalized);

      // Filter out actively expired alerts (unless they have no expiry timestamp)
      const activeAlerts = deduplicated.filter((a) => !a.isExpired);

      // Sort by severity rank descending, then expiry ascending
      activeAlerts.sort((a, b) => {
        if (b.severityRank !== a.severityRank) {
          return b.severityRank - a.severityRank;
        }
        const timeA = a.expires ? new Date(a.expires).getTime() : Infinity;
        const timeB = b.expires ? new Date(b.expires).getTime() : Infinity;
        return timeA - timeB;
      });

      const highestSeverity = activeAlerts.length > 0 ? activeAlerts[0].severity : 'None';

      return {
        url,
        totalActive: activeAlerts.length,
        highestSeverity,
        alerts: activeAlerts,
        updated: geojson.updated || new Date().toISOString()
      };
    })
    .catch((err) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000} seconds connecting to National Weather Service.`);
      }
      throw err;
    });
}
