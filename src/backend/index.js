import express from 'express';
import cors from 'cors';
import { httpServerHandler } from 'cloudflare:node';
import { env } from 'cloudflare:workers';

// Create Express app
const app = express();

// Middleware: JSON body parsing
app.use(express.json());

const devDomain = env.DEV_DOMAIN;
const stagingDomain = env.STAGING_DOMAIN;
const prodDomain = env.PROD_DOMAIN;

// Middleware: CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  devDomain,
  stagingDomain,
  prodDomain
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

// Placeholder for DB access
const getDB = () => env.DB;

const NWS_BASE_URL = 'https://api.weather.gov/alerts/active';
const USER_AGENT = 'SignalWatch-HyperDart/1.0 (contact@signalwatch.org)';

const SEVERITY_RANKS = {
  EXTREME: 4,
  SEVERE: 3,
  MODERATE: 2,
  MINOR: 1,
  UNKNOWN: 0
};

// Route: Live Disruption & Safety Alerts endpoint
app.get('/api/alerts', async (req, res) => {
  const { lat, lon, area, hazard } = req.query;

  if ((!lat || !lon) && !area) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameters: Provide either (lat, lon) or area (state abbreviation).'
    });
  }

  let nwsUrl = '';
  if (lat && lon) {
    const latitude = Number(lat).toFixed(4);
    const longitude = Number(lon).toFixed(4);
    nwsUrl = `${NWS_BASE_URL}?point=${latitude},${longitude}&status=actual&message_type=alert,update`;
  } else {
    nwsUrl = `${NWS_BASE_URL}?area=${encodeURIComponent(area.toUpperCase())}&status=actual&message_type=alert,update`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const upstreamResponse = await fetch(nwsUrl, {
      headers: {
        Accept: 'application/geo+json',
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!upstreamResponse.ok) {
      return res.status(502).json({
        success: false,
        error: `Upstream NWS API responded with status ${upstreamResponse.status}`
      });
    }

    const geojson = await upstreamResponse.json();
    if (!geojson || !Array.isArray(geojson.features)) {
      return res.status(502).json({
        success: false,
        error: 'Malformed response received from upstream National Weather Service'
      });
    }

    const now = Date.now();
    const alerts = [];
    const seen = new Set();

    for (const f of geojson.features) {
      const p = f.properties || {};
      const id = f.id || p.id || `${p.event}-${p.sent}`;
      const expires = p.expires || p.ends || null;

      // Filter out actively expired items
      if (expires && new Date(expires).getTime() <= now) {
        continue;
      }

      // Deduplicate
      const dedupeKey = `${p.event}|${p.headline}|${p.areaDesc}|${expires}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const sev = (p.severity || 'Unknown').trim();
      const rank = SEVERITY_RANKS[sev.toUpperCase()] || 0;

      // Hazard filter if requested
      if (hazard && hazard !== 'all') {
        const text = `${p.event} ${p.headline} ${p.description}`.toLowerCase();
        if (hazard === 'flood' && !/flood/i.test(text)) continue;
        if (hazard === 'tornado' && !/tornado/i.test(text)) continue;
        if (hazard === 'heat' && !/heat/i.test(text)) continue;
        if (hazard === 'winter' && !/winter|snow|blizzard|ice|freeze|frost|chill/i.test(text)) continue;
        if (hazard === 'wind' && !/wind|gale/i.test(text)) continue;
        if (hazard === 'fire' && !/fire|red flag/i.test(text)) continue;
        if (hazard === 'hurricane' && !/hurricane|tropical|surge/i.test(text)) continue;
        if (hazard === 'air_quality' && !/air quality|smoke/i.test(text)) continue;
        if (hazard === 'severe_weather' && rank < 3 && !/severe|warning|emergency/i.test(p.event || '')) continue;
      }

      alerts.push({
        id,
        event: p.event || 'Weather Advisory',
        headline: p.headline || `${p.event} in effect`,
        severity: sev,
        severityRank: rank,
        urgency: p.urgency || 'Unknown',
        certainty: p.certainty || 'Unknown',
        areaDesc: p.areaDesc || 'Affected zone not specified',
        effective: p.effective || p.sent || null,
        onset: p.onset || p.effective || null,
        expires,
        instruction: p.instruction ? p.instruction.trim() : null,
        description: p.description ? p.description.trim() : '',
        senderName: p.senderName || 'US National Weather Service',
        webUrl: p['@id'] || p.web || 'https://www.weather.gov',
        geometry: f.geometry || null
      });
    }

    // Sort by severity rank desc, then expires asc
    alerts.sort((a, b) => {
      if (b.severityRank !== a.severityRank) return b.severityRank - a.severityRank;
      const tA = a.expires ? new Date(a.expires).getTime() : Infinity;
      const tB = b.expires ? new Date(b.expires).getTime() : Infinity;
      return tA - tB;
    });

    const highestSeverity = alerts.length > 0 ? alerts[0].severity : 'None';

    res.json({
      success: true,
      count: alerts.length,
      highestSeverity,
      alerts,
      updated: geojson.updated || new Date().toISOString()
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'National Weather Service request timed out after 8 seconds.'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal service error while retrieving safety disruption alerts.'
    });
  }
});

// Route: Basic Test
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from SignalWatch Express on Workers!' });
});

// Route: Dynamic Hello
app.get('/api/hello/:name', (req, res) => {
  const environment = global.ENVIRONMENT || 'unknown';
  res.json({ message: `Hello, ${req.params.name} ${environment}` });
});

app.listen(3000);
export default httpServerHandler({ port: 3000 });
