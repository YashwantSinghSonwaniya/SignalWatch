import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SignalWatch from './SignalWatch.jsx';
import './localTestHarness.css';
import {
  mockColoradoFloodsGeoJson,
  mockHoustonGeoJson,
  mockPhoenixHeatGeoJson,
  searchDataDelhi,
  searchDataHouston,
  searchDataColoradoFloods,
  searchDataPhoenixHeatQuestion
} from '../../tests/fixtures/alertsFixtures.js';

const scenarios = {
  'houston-active': {
    label: 'Houston — active flood alert',
    query: 'weather alerts in Houston',
    searchData: searchDataHouston,
    response: {
      type: 'FeatureCollection',
      features: [{
        id: 'signalwatch-demo-houston-flood',
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[-95.55, 29.65], [-95.25, 29.65], [-95.25, 29.9], [-95.55, 29.9], [-95.55, 29.65]]]
        },
        properties: {
          id: 'signalwatch-demo-houston-flood',
          event: 'Flash Flood Warning',
          headline: 'SIMULATED Flash Flood Warning for Harris County',
          severity: 'Severe',
          urgency: 'Immediate',
          certainty: 'Likely',
          areaDesc: 'Harris County, including Houston',
          senderName: 'SignalWatch Local Demo Fixture',
          instruction: 'SIMULATED: Move to higher ground and avoid driving through floodwater.',
          description: 'Synthetic local test alert. This is not an active NWS bulletin.'
        }
      }]
    }
  },
  'colorado-flood': {
    label: 'Colorado — flood warnings',
    query: 'flood warnings in Colorado',
    searchData: searchDataColoradoFloods,
    response: mockColoradoFloodsGeoJson
  },
  'phoenix-heat': {
    label: 'Phoenix — heat advisory question',
    query: 'is there a heat advisory in Phoenix',
    searchData: searchDataPhoenixHeatQuestion,
    response: mockPhoenixHeatGeoJson
  },
  delhi: {
    label: 'Delhi — unsupported coverage',
    query: 'weather alerts in Delhi',
    searchData: searchDataDelhi,
    response: null
  },
  'houston-no-alerts': {
    label: 'Houston — supported, no matching alerts',
    query: 'weather alerts in Houston',
    searchData: searchDataHouston,
    response: mockHoustonGeoJson
  },
  'network-failure': {
    label: 'API/network failure (simulated)',
    query: 'weather alerts in Houston',
    searchData: searchDataHouston,
    response: null,
    fail: true
  }
};

const nativeFetch = window.fetch.bind(window);
let activeTest = { scenarioId: 'houston-active', mode: 'simulated' };

// This fetch shim exists only on the separate local-test.html page. The normal
// HyperDart sandbox and the published component retain their real fetch path.
window.fetch = (input, init) => {
  if (activeTest.mode === 'live') return nativeFetch(input, init);

  const scenario = scenarios[activeTest.scenarioId];
  if (scenario.fail) {
    return Promise.reject(new TypeError('Simulated local network failure. No live request was made.'));
  }

  const response = scenario.response
    ? freshActiveResponse(scenario.response)
    : { type: 'FeatureCollection', features: [], updated: new Date().toISOString() };

  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => response
  });
};

function freshActiveResponse(template) {
  const now = Date.now();
  const fresh = structuredClone(template);
  fresh.updated = new Date(now).toISOString();
  fresh.features = fresh.features.map((feature, index) => {
    const properties = feature.properties || (feature.properties = {});
    properties.headline = `SIMULATED: ${properties.headline || properties.event || 'Test alert'}`;
    properties.description = `SIMULATED FIXTURE — not an active NWS bulletin. ${properties.description || ''}`.trim();
    properties.senderName = 'SignalWatch Local Demo Fixture';
    properties['@id'] = 'https://www.weather.gov/';
    properties.web = 'https://www.weather.gov/';
    if (properties.instruction && !/^SIMULATED/i.test(properties.instruction)) {
      properties.instruction = `SIMULATED TEST ACTION: ${properties.instruction}`;
    }
    properties.effective = new Date(now - 60_000).toISOString();
    properties.sent = properties.effective;
    properties.onset = properties.effective;
    properties.expires = new Date(now + (index + 6) * 60 * 60_000).toISOString();
    properties.ends = properties.expires;
    return feature;
  });
  return fresh;
}

function withComponentName(searchData, query) {
  const records = Array.isArray(searchData) ? searchData : [searchData];
  return records.map((record) => ({
    ...record,
    component: 'signalwatch',
    query: record.query || query
  }));
}

function LocalTestHarness() {
  const [scenarioId, setScenarioId] = useState(activeTest.scenarioId);
  const [mode, setMode] = useState(activeTest.mode);
  const scenario = scenarios[scenarioId];
  const canRunLive = !scenario.fail && scenarioId !== 'delhi';

  function chooseScenario(nextScenarioId) {
    const nextMode = ['network-failure', 'delhi'].includes(nextScenarioId) ? 'simulated' : mode;
    activeTest = { scenarioId: nextScenarioId, mode: nextMode };
    setScenarioId(nextScenarioId);
    setMode(nextMode);
  }

  function chooseMode(nextMode) {
    activeTest = { scenarioId, mode: nextMode };
    setMode(nextMode);
  }

  const isSimulated = mode === 'simulated';

  return (
    <main className="local-test-page">
      <header className="local-test-header">
        <div>
          <p className="local-test-eyebrow">SIGNALWATCH · LOCAL DEVELOPER WORKFLOW</p>
          <h1>Test a location and alert state</h1>
          <p className="local-test-help">
            Choose a documented HyperDart search-data scenario. Simulated mode uses fixed fixtures;
            live mode makes a real request through the configured NWS integration.
          </p>
        </div>
        <label className={`local-test-mode ${isSimulated ? 'simulated' : 'live'}`}>
          <span>Data source</span>
          <select
            aria-label="Data source"
            value={mode}
            disabled={!canRunLive}
            onChange={(event) => chooseMode(event.target.value)}
          >
            <option value="simulated">Simulated fixtures</option>
            <option value="live">Live NWS request</option>
          </select>
        </label>
      </header>

      <section className={`local-test-notice ${isSimulated ? 'is-simulated' : 'is-live'}`} role="status">
        {scenarioId === 'delhi'
          ? 'OFFLINE FIXTURE — Delhi is outside NWS coverage; no alert request was sent.'
          : isSimulated
          ? 'SIMULATION — synthetic test data; these are not live alerts.'
          : 'LIVE INTEGRATION — the selected supported location will be queried through the configured alert API.'}
      </section>

      <section className="local-test-controls" aria-label="Test scenario controls">
        <label>
          Scenario
          <select aria-label="Scenario" value={scenarioId} onChange={(event) => chooseScenario(event.target.value)}>
            {Object.entries(scenarios).map(([id, option]) => (
              <option key={id} value={id}>{option.label}</option>
            ))}
          </select>
        </label>
        <p>Search data: <code>{scenario.query}</code></p>
      </section>

      <SignalWatch
        key={`${scenarioId}-${mode}`}
        searchData={withComponentName(scenario.searchData, scenario.query)}
        searchQuery={scenario.query}
        format="mainline"
        theme={{ mode: 'dark' }}
        UIOptions={{ themeName: 'dark', format: 'mainline', sandbox: true }}
        dataSourceLabel={scenarioId === 'delhi' ? 'NWS NOT QUERIED' : isSimulated ? 'SIMULATED FIXTURE' : 'LIVE NWS API'}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<LocalTestHarness />);
