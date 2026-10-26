import { describe, it, expect, vi } from 'vitest';
import {
  buildNwsUrl,
  normalizeAlertFeature,
  deduplicateAlerts,
  filterAlertsByHazard,
  fetchNwsAlerts
} from '../src/shared/nwsClient.js';
import {
  mockColoradoFloodsGeoJson,
  mockDuplicateAndExpiredGeoJson
} from './fixtures/alertsFixtures.js';
import { HAZARD_CATEGORIES } from '../src/shared/types.js';

describe('nwsClient buildNwsUrl', () => {
  it('builds point-based URL when latitude and longitude are supplied', () => {
    const url = buildNwsUrl({ latitude: 29.76328, longitude: -95.36327 });
    expect(url).toBe('https://api.weather.gov/alerts/active?point=29.7633,-95.3633&status=actual&message_type=alert,update');
  });

  it('builds area-based URL when only state code is supplied', () => {
    const url = buildNwsUrl({ stateAbb: 'TX' });
    expect(url).toBe('https://api.weather.gov/alerts/active?area=TX&status=actual&message_type=alert,update');
  });

  it('returns null if neither coordinates nor state code is supplied', () => {
    expect(buildNwsUrl({})).toBeNull();
  });
});

describe('nwsClient normalizeAlertFeature', () => {
  it('correctly maps all official properties', () => {
    const feature = mockColoradoFloodsGeoJson.features[0];
    const alert = normalizeAlertFeature(feature, new Date('2026-10-26T13:00:00Z').getTime());

    expect(alert).toBeDefined();
    expect(alert.event).toBe('Flash Flood Warning');
    expect(alert.severity).toBe('Severe');
    expect(alert.severityRank).toBe(3);
    expect(alert.urgency).toBe('Immediate');
    expect(alert.certainty).toBe('Likely');
    expect(alert.areaDesc).toContain('Boulder County');
    expect(alert.instruction).toContain('Turn around, do not drown');
    expect(alert.isExpired).toBe(false);
    expect(alert.geometry).toBeDefined();
    expect(alert.geometry.type).toBe('Polygon');
  });

  it('handles missing optional fields safely', () => {
    const minimalFeature = {
      id: 'test-minimal',
      properties: {
        event: 'Wind Advisory',
        severity: 'Minor'
      }
    };
    const alert = normalizeAlertFeature(minimalFeature);
    expect(alert.event).toBe('Wind Advisory');
    expect(alert.severity).toBe('Minor');
    expect(alert.severityRank).toBe(1);
    expect(alert.instruction).toBeNull();
    expect(alert.plainInstruction).toBeDefined();
    expect(alert.headline).toBeDefined();
    expect(alert.geometry).toBeNull();
  });
});

describe('nwsClient deduplication and expiration', () => {
  it('deduplicates alerts with matching ID and headline', () => {
    const alerts = mockDuplicateAndExpiredGeoJson.features.map((f) =>
      normalizeAlertFeature(f, new Date('2026-10-26T12:00:00Z').getTime())
    );

    const deduped = deduplicateAlerts(alerts);
    // Should remove alert-active-1-dupe
    const floodWatches = deduped.filter((a) => a.event === 'Flood Watch');
    expect(floodWatches.length).toBe(1);
  });

  it('identifies expired alerts based on expiry timestamp', () => {
    const now = new Date('2026-10-26T12:00:00Z').getTime();
    const expiredFeature = mockDuplicateAndExpiredGeoJson.features.find((f) => f.id === 'alert-expired-2');
    const alert = normalizeAlertFeature(expiredFeature, now);

    expect(alert.isExpired).toBe(true);
  });
});

describe('nwsClient hazard filtering', () => {
  const alerts = [
    { event: 'Flash Flood Warning', headline: 'Flood in area', description: 'Heavy rain' },
    { event: 'Tornado Warning', headline: 'Tornado spotted', description: 'Take shelter' },
    { event: 'Excessive Heat Warning', headline: 'Dangerous heat', description: '115 degrees' },
    { event: 'Winter Storm Warning', headline: 'Snow and ice', description: 'Blizzard conditions' }
  ];

  it('filters flood alerts correctly', () => {
    const filtered = filterAlertsByHazard(alerts, HAZARD_CATEGORIES.FLOOD);
    expect(filtered.length).toBe(1);
    expect(filtered[0].event).toBe('Flash Flood Warning');
  });

  it('filters tornado alerts correctly', () => {
    const filtered = filterAlertsByHazard(alerts, HAZARD_CATEGORIES.TORNADO);
    expect(filtered.length).toBe(1);
    expect(filtered[0].event).toBe('Tornado Warning');
  });

  it('filters heat alerts correctly', () => {
    const filtered = filterAlertsByHazard(alerts, HAZARD_CATEGORIES.HEAT);
    expect(filtered.length).toBe(1);
    expect(filtered[0].event).toBe('Excessive Heat Warning');
  });

  it('returns all alerts when category is ALL', () => {
    const filtered = filterAlertsByHazard(alerts, HAZARD_CATEGORIES.ALL);
    expect(filtered.length).toBe(4);
  });
});

describe('nwsClient fetchNwsAlerts network and error handling', () => {
  it('throws descriptive error on HTTP 500 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(
      fetchNwsAlerts({
        latitude: 29.76,
        longitude: -95.36,
        fetchFn: mockFetch
      })
    ).rejects.toThrow('National Weather Service API responded with HTTP 500');
  });

  it('throws descriptive error on malformed JSON features', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ badKey: 123 })
    });

    await expect(
      fetchNwsAlerts({
        latitude: 29.76,
        longitude: -95.36,
        fetchFn: mockFetch
      })
    ).rejects.toThrow('Malformed GeoJSON');
  });
});
