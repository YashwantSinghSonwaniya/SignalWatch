import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignalWatch from '../src/frontend/SignalWatch.jsx';
import {
  mockHoustonGeoJson,
  mockColoradoFloodsGeoJson,
  mockPhoenixHeatGeoJson,
  searchDataHouston,
  searchDataColoradoFloods,
  searchDataDelhi,
  searchDataPhoenixHeatQuestion,
  searchDataMissingLocation
} from './fixtures/alertsFixtures.js';

describe('SignalWatch Component Integration', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders unsupported geographic coverage state for Delhi, India without giving false reassurance', async () => {
    const componentLoadedMock = vi.fn();

    render(
      <SignalWatch
        searchData={searchDataDelhi}
        searchQuery="weather alerts in Delhi"
        format="mainline"
        messageHandlers={{ componentLoaded: componentLoadedMock }}
      />
    );

    // Verify unsupported coverage message
    expect(screen.getByText(/Location Outside NWS Area/i)).toBeInTheDocument();
    expect(screen.getByText(/Requested Place:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Delhi/i).length).toBeGreaterThan(0);

    // Verify it does NOT claim all clear
    expect(screen.queryByText(/No Active Disruption/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Outside NWS Coverage/i)).toBeInTheDocument();
    expect(componentLoadedMock).toHaveBeenCalledTimes(1);
  });

  it('shows unresolved location instead of an all-clear state when search data has no location', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(
      <SignalWatch
        searchData={searchDataMissingLocation}
        searchQuery="are there any warnings"
        format="mainline"
      />
    );

    expect(await screen.findByText(/Location Unresolved/i)).toBeInTheDocument();
    expect(screen.getByText(/Unknown Location/i)).toBeInTheDocument();
    expect(screen.queryByText(/No Active Disruption/i)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders "No Matching Active Alerts" for a supported location with zero alerts (Houston)', async () => {
    const componentLoadedMock = vi.fn();

    // Mock fetch returning empty features
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHoustonGeoJson
    });

    render(
      <SignalWatch
        searchData={searchDataHouston}
        searchQuery="weather alerts in Houston"
        format="mainline"
        messageHandlers={{ componentLoaded: componentLoadedMock }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No Matching Active Alerts/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Houston, TX/i)).toBeInTheDocument();
    expect(componentLoadedMock).toHaveBeenCalled();
  });

  it('labels a simulated empty response as test data instead of attributing it to the NWS', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHoustonGeoJson
    });

    render(
      <SignalWatch
        searchData={searchDataHouston}
        searchQuery="weather alerts in Houston"
        dataSourceLabel="SIMULATED FIXTURE"
      />
    );

    expect(await screen.findByText(/No Matching Active Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/No simulated warning, watch, or advisory records/i)).toBeInTheDocument();
    expect(screen.getByText(/does not describe current conditions/i)).toBeInTheDocument();
    expect(screen.queryByText(/were returned .*National Weather Service/i)).not.toBeInTheDocument();
  });

  it('renders active alerts and details for Colorado flood warnings', async () => {
    const componentLoadedMock = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockColoradoFloodsGeoJson
    });

    render(
      <SignalWatch
        searchData={searchDataColoradoFloods}
        searchQuery="flood warnings in Colorado"
        format="mainline"
        messageHandlers={{ componentLoaded: componentLoadedMock }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Flash Flood Warning/i })).toBeInTheDocument();
    });

    // Check severity badge
    expect(screen.getByText(/Severe Severity/i)).toBeInTheDocument();

    // Check affected area
    expect(screen.getByText(/Boulder County; Larimer County/i)).toBeInTheDocument();

    // Check recommended action guidance
    expect(screen.getByText(/Turn around, do not drown/i)).toBeInTheDocument();

    // Check official link
    const officialLink = screen.getByText(/Verify Official NWS Bulletin/i).closest('a');
    expect(officialLink).toHaveAttribute('href', expect.stringContaining('api.weather.gov'));
  });

  it('answers direct questions like "is there a heat advisory in Phoenix" with a YES banner', async () => {
    const componentLoadedMock = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPhoenixHeatGeoJson
    });

    render(
      <SignalWatch
        searchData={searchDataPhoenixHeatQuestion}
        searchQuery="is there a heat advisory in Phoenix"
        format="mainline"
        messageHandlers={{ componentLoaded: componentLoadedMock }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('YES')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Excessive Heat Warning/i).length).toBeGreaterThan(0);
  });

  it('renders cleanly in sidebar format without errors', async () => {
    const componentLoadedMock = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockColoradoFloodsGeoJson
    });

    const { container } = render(
      <SignalWatch
        searchData={searchDataColoradoFloods}
        searchQuery="flood warnings in Colorado"
        format="sidebar"
        messageHandlers={{ componentLoaded: componentLoadedMock }}
      />
    );

    expect(container.querySelector('.sw-format-sidebar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Flash Flood Warning/i })).toBeInTheDocument();
    });
  });

  it('toggles between dark and light themes smoothly', async () => {
    const { container } = render(
      <SignalWatch
        searchData={searchDataHouston}
        searchQuery="weather alerts in Houston"
        format="mainline"
        theme={{ mode: 'dark' }}
      />
    );

    expect(container.querySelector('.sw-theme-dark')).toBeInTheDocument();

    const themeToggleBtn = screen.getByRole('button', { name: /switch to light mode/i });
    fireEvent.click(themeToggleBtn);

    expect(container.querySelector('.sw-theme-light')).toBeInTheDocument();
  });

  it('displays API error view with retry button on network communication failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection dropped'));

    render(
      <SignalWatch
        searchData={searchDataHouston}
        searchQuery="weather alerts in Houston"
        format="mainline"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Telemetry Service Unavailable/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Network connection dropped/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeInTheDocument();
    expect(screen.getByText(/Service Communication Alert/i)).toBeInTheDocument();
    expect(screen.queryByText(/No Active Disruption/i)).not.toBeInTheDocument();
  });
});
