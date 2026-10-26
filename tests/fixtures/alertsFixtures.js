/**
 * Deterministic Test Fixtures for SignalWatch Tests
 */

export const mockHoustonGeoJson = {
  type: 'FeatureCollection',
  features: [],
  updated: '2026-10-26T07:00:00+00:00'
};

export const mockColoradoFloodsGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'urn:oid:2.49.0.1.840.0.co-flood-001',
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-105.3, 40.0],
            [-105.1, 40.0],
            [-105.1, 40.2],
            [-105.3, 40.2],
            [-105.3, 40.0]
          ]
        ]
      },
      properties: {
        id: 'urn:oid:2.49.0.1.840.0.co-flood-001',
        '@id': 'https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.co-flood-001',
        event: 'Flash Flood Warning',
        headline: 'Flash Flood Warning issued October 26 at 6:00AM MDT until October 26 at 2:00PM MDT by NWS Boulder CO',
        severity: 'Severe',
        urgency: 'Immediate',
        certainty: 'Likely',
        areaDesc: 'Boulder County; Larimer County',
        sent: '2026-10-26T12:00:00Z',
        effective: '2026-10-26T12:00:00Z',
        onset: '2026-10-26T12:00:00Z',
        expires: '2026-10-26T20:00:00Z',
        ends: '2026-10-26T20:00:00Z',
        status: 'Actual',
        messageType: 'Alert',
        category: 'Met',
        senderName: 'NWS Boulder CO',
        instruction: 'Turn around, do not drown when encountering flooded roads. Most flood deaths occur in vehicles. Move to higher ground immediately.',
        description: 'Excessive runoff from heavy rainfall will cause flooding of small creeks and streams, urban areas, highways, streets and underpasses.'
      }
    }
  ],
  updated: '2026-10-26T12:05:00Z'
};

export const mockAlaskaSevereGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'urn:oid:2.49.0.1.840.0.ak-blizzard-001',
      type: 'Feature',
      geometry: null,
      properties: {
        id: 'urn:oid:2.49.0.1.840.0.ak-blizzard-001',
        event: 'Blizzard Warning',
        headline: 'Blizzard Warning issued for Western Arctic Coast',
        severity: 'Extreme',
        urgency: 'Expected',
        certainty: 'Observed',
        areaDesc: 'Northern and Western Alaska Coastal Zones',
        effective: '2026-10-26T10:00:00Z',
        expires: '2026-10-27T10:00:00Z',
        instruction: 'A Blizzard Warning means severe winter weather conditions are expected or occurring. Falling and blowing snow with strong winds will bring near-zero visibility. Deeply discourage travel.',
        description: 'Whiteout conditions expected. Winds gusting up to 60 mph with wind chills to 35 below zero.',
        senderName: 'NWS Fairbanks AK'
      }
    },
    {
      id: 'urn:oid:2.49.0.1.840.0.ak-wind-002',
      type: 'Feature',
      geometry: null,
      properties: {
        id: 'urn:oid:2.49.0.1.840.0.ak-wind-002',
        event: 'High Wind Warning',
        headline: 'High Wind Warning in effect until midnight',
        severity: 'Moderate',
        urgency: 'Expected',
        certainty: 'Likely',
        areaDesc: 'Anchorage Bowl',
        effective: '2026-10-26T11:00:00Z',
        expires: '2026-10-26T23:00:00Z',
        instruction: 'Fasten loose outdoor objects. Watch for falling tree limbs.',
        description: 'East winds 40 to 55 mph with gusts up to 75 mph along the hillside.',
        senderName: 'NWS Anchorage AK'
      }
    }
  ],
  updated: '2026-10-26T11:30:00Z'
};

export const mockPhoenixHeatGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'urn:oid:2.49.0.1.840.0.az-heat-001',
      type: 'Feature',
      geometry: null,
      properties: {
        id: 'urn:oid:2.49.0.1.840.0.az-heat-001',
        event: 'Excessive Heat Warning',
        headline: 'Excessive Heat Warning remains in effect from 10 AM to 8 PM MST',
        severity: 'Extreme',
        urgency: 'Expected',
        certainty: 'Likely',
        areaDesc: 'Central Phoenix; Northwest Valley; Southeast Valley',
        effective: '2026-10-26T17:00:00Z',
        expires: '2026-10-27T03:00:00Z',
        instruction: 'Drink plenty of fluids, stay in an air-conditioned room, stay out of the sun, and check up on relatives and neighbors. Young children and pets should never be left unattended in vehicles under any circumstances.',
        description: 'Dangerously hot conditions with temperatures up to 115 degrees expected.',
        senderName: 'NWS Phoenix AZ'
      }
    }
  ],
  updated: '2026-10-26T16:00:00Z'
};

export const mockDuplicateAndExpiredGeoJson = {
  type: 'FeatureCollection',
  features: [
    // Active alert
    {
      id: 'alert-active-1',
      properties: {
        id: 'alert-active-1',
        event: 'Flood Watch',
        headline: 'Flood Watch in effect',
        severity: 'Moderate',
        urgency: 'Future',
        certainty: 'Possible',
        areaDesc: 'Zone A',
        effective: '2026-10-26T00:00:00Z',
        expires: '2026-10-28T00:00:00Z'
      }
    },
    // Duplicate of active alert
    {
      id: 'alert-active-1-dupe',
      properties: {
        id: 'alert-active-1-dupe',
        event: 'Flood Watch',
        headline: 'Flood Watch in effect',
        severity: 'Moderate',
        urgency: 'Future',
        certainty: 'Possible',
        areaDesc: 'Zone A',
        effective: '2026-10-26T00:00:00Z',
        expires: '2026-10-28T00:00:00Z'
      }
    },
    // Expired alert (expired yesterday)
    {
      id: 'alert-expired-2',
      properties: {
        id: 'alert-expired-2',
        event: 'Tornado Warning',
        headline: 'Tornado Warning expired',
        severity: 'Extreme',
        urgency: 'Past',
        certainty: 'Observed',
        areaDesc: 'Zone B',
        effective: '2026-10-20T00:00:00Z',
        expires: '2026-10-21T00:00:00Z'
      }
    },
    // Missing optional fields (no instruction, no headline, no description)
    {
      id: 'alert-minimal-3',
      properties: {
        id: 'alert-minimal-3',
        event: 'Wind Advisory',
        severity: 'Minor',
        expires: '2026-10-29T00:00:00Z'
      }
    }
  ]
};

// SearchData scenarios
export const searchDataHouston = [
  {
    query: 'weather alerts in Houston',
    entities: [
      {
        word: 'Houston',
        collectionName: 'CITIES',
        collectionType: 'HD_LOCATION',
        entityInfo: {
          geo: {
            lat: 29.76328,
            long: -95.36327,
            city: 'Houston',
            state: 'Texas',
            stateAbb: 'TX',
            country: 'United States',
            countryCode: 'US',
            tz: 'America/Chicago'
          }
        }
      }
    ],
    userLocation: {
      position: { coords: { latitude: 29.76328, longitude: -95.36327 }, countryCode: 'US' },
      source: 'ip'
    }
  }
];

export const searchDataColoradoFloods = {
  query: 'flood warnings in Colorado',
  entities: [
    {
      word: 'Colorado',
      collectionName: 'STATES',
      collectionType: 'HD_LOCATION',
      entityInfo: {
        geo: {
          lat: 39.5501,
          long: -105.7821,
          state: 'Colorado',
          stateAbb: 'CO',
          country: 'United States',
          countryCode: 'US',
          tz: 'America/Denver'
        }
      }
    }
  ]
};

export const searchDataAlaskaSevere = [
  {
    query: 'severe weather alerts in Alaska',
    entities: [
      {
        word: 'Alaska',
        collectionName: 'STATES',
        collectionType: 'HD_LOCATION',
        entityInfo: {
          geo: {
            lat: 64.2008,
            long: -149.4937,
            state: 'Alaska',
            stateAbb: 'AK',
            country: 'United States',
            countryCode: 'US',
            tz: 'America/Anchorage'
          }
        }
      }
    ]
  }
];

export const searchDataPhoenixHeatQuestion = {
  query: 'is there a heat advisory in Phoenix',
  entities: [
    {
      word: 'Phoenix',
      collectionName: 'CITIES',
      collectionType: 'HD_LOCATION',
      entityInfo: {
        geo: {
          lat: 33.4484,
          long: -112.074,
          city: 'Phoenix',
          state: 'Arizona',
          stateAbb: 'AZ',
          country: 'United States',
          countryCode: 'US',
          tz: 'America/Phoenix'
        }
      }
    }
  ]
};

export const searchDataNearMe = [
  {
    query: 'weather alerts near me',
    entities: [],
    userLocation: {
      position: {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        countryCode: 'US'
      },
      source: 'geolocation'
    }
  }
];

export const searchDataDelhi = [
  {
    query: 'weather alerts in Delhi',
    entities: [
      {
        word: 'Delhi',
        collectionName: 'CITIES',
        collectionType: 'HD_LOCATION',
        entityInfo: {
          geo: {
            lat: 28.6139,
            long: 77.209,
            city: 'Delhi',
            country: 'India',
            countryCode: 'IN',
            tz: 'Asia/Kolkata'
          }
        }
      }
    ],
    userLocation: {
      position: { coords: { latitude: 28.6139, longitude: 77.209 }, countryCode: 'IN' },
      source: 'ip'
    }
  }
];

export const searchDataMissingLocation = {
  query: 'are there any warnings',
  entities: []
};
