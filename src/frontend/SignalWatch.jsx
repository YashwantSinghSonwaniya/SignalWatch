import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './styles.css';
import { ALERT_STATUS, HAZARD_CATEGORIES } from '../shared/types.js';
import { normalizeSearchData } from '../shared/normalizeSearchData.js';
import {
  fetchNwsAlerts,
  filterAlertsByHazard,
  normalizeAlertFeature,
  deduplicateAlerts
} from '../shared/nwsClient.js';

import Header from './components/Header.jsx';
import DirectAnswerBanner from './components/DirectAnswerBanner.jsx';
import HeroStatusCard from './components/HeroStatusCard.jsx';
import AlertFilterBar from './components/AlertFilterBar.jsx';
import AlertCard from './components/AlertCard.jsx';
import RadarZoneMap from './components/RadarZoneMap.jsx';
import SafetyDisclaimer from './components/SafetyDisclaimer.jsx';
import {
  UnsupportedCoverageView,
  NoActiveAlertsView,
  InvalidLocationView,
  ApiErrorView,
  LoadingSkeletonView
} from './components/StateViews.jsx';

export default function SignalWatch(props) {
  // Extract configuration and injected props
  const {
    searchData,
    searchQuery,
    format = 'mainline',
    theme,
    deployedBackendURL,
    messageHandlers
  } = props;

  const isCompact = format === 'sidebar';

  // Backend API URL resolver following HyperDart guidelines
  const API_URL =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
      ? deployedBackendURL || ''
      : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';

  // Theme state
  const initialTheme = theme?.palette?.mode || theme?.mode || 'dark';
  const [themeMode, setThemeMode] = useState(initialTheme);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Parse location and query
  const normalized = useMemo(() => {
    return normalizeSearchData(searchData, searchQuery);
  }, [searchData, searchQuery]);

  // Alert state
  const [status, setStatus] = useState(ALERT_STATUS.LOADING);
  const [alerts, setAlerts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // User filters & sorting
  const [selectedHazard, setSelectedHazard] = useState(
    normalized.targetHazard || HAZARD_CATEGORIES.ALL
  );
  const [sortBy, setSortBy] = useState('severity');

  // Sync selected hazard if query changes
  useEffect(() => {
    if (normalized.targetHazard) {
      setSelectedHazard(normalized.targetHazard);
    }
  }, [normalized.targetHazard]);

  // Primary data-fetching effect
  const loadAlerts = useCallback(async () => {
    // 1. Check geographic coverage
    if (!normalized.isSupportedCoverage) {
      setStatus(ALERT_STATUS.UNSUPPORTED_COVERAGE);
      setAlerts([]);
      messageHandlers?.componentLoaded?.();
      return;
    }

    // 2. Check location resolution
    if (!normalized.isValidLocation) {
      setStatus(ALERT_STATUS.INVALID_LOCATION);
      setAlerts([]);
      messageHandlers?.componentLoaded?.();
      return;
    }

    setStatus(ALERT_STATUS.LOADING);
    setErrorMessage('');

    try {
      let fetchedAlerts = [];
      let updatedTime = '';

      // Try backend if API_URL is available
      if (API_URL) {
        try {
          const params = new URLSearchParams();
          if (normalized.latitude != null && normalized.longitude != null) {
            params.append('lat', String(normalized.latitude));
            params.append('lon', String(normalized.longitude));
          } else if (normalized.stateAbb) {
            params.append('area', normalized.stateAbb);
          }

          const resp = await fetch(`${API_URL}/api/alerts?${params.toString()}`);
          if (!resp.ok) {
            throw new Error(`Backend service error: ${resp.status}`);
          }
          const json = await resp.json();

          if (Array.isArray(json.alerts)) {
            fetchedAlerts = json.alerts;
            updatedTime = json.updated || new Date().toISOString();
          } else if (Array.isArray(json.features)) {
            // Direct GeoJSON format (e.g. from mock or proxy)
            const raw = json.features.map((f) => normalizeAlertFeature(f, Date.now())).filter(Boolean);
            fetchedAlerts = deduplicateAlerts(raw).filter((a) => !a.isExpired);
            updatedTime = json.updated || new Date().toISOString();
          } else if (json.success === false) {
            throw new Error(json.error || 'Failed to retrieve safety alerts from backend.');
          }
        } catch (backendErr) {
          // Graceful fallback to direct NWS client if backend is unreachable locally
          const res = await fetchNwsAlerts({
            latitude: normalized.latitude,
            longitude: normalized.longitude,
            stateAbb: normalized.stateAbb
          });
          fetchedAlerts = res.alerts || [];
          updatedTime = res.updated;
        }
      } else {
        // Direct browser client to official NWS endpoint
        const res = await fetchNwsAlerts({
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          stateAbb: normalized.stateAbb
        });
        fetchedAlerts = res.alerts || [];
        updatedTime = res.updated;
      }

      setAlerts(fetchedAlerts);
      setLastUpdated(updatedTime);

      if (fetchedAlerts.length === 0) {
        setStatus(ALERT_STATUS.NO_ALERTS);
      } else {
        setStatus(ALERT_STATUS.ACTIVE_ALERTS);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to retrieve live alerts.');
      setStatus(ALERT_STATUS.API_ERROR);
    } finally {
      // Signal HyperDart platform that component is ready to display
      messageHandlers?.componentLoaded?.();
    }
  }, [normalized, API_URL, messageHandlers]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Filtered and sorted alerts
  const processedAlerts = useMemo(() => {
    let result = filterAlertsByHazard(alerts, selectedHazard);

    if (sortBy === 'severity') {
      result.sort((a, b) => {
        if (b.severityRank !== a.severityRank) {
          return b.severityRank - a.severityRank;
        }
        const timeA = a.expires ? new Date(a.expires).getTime() : Infinity;
        const timeB = b.expires ? new Date(b.expires).getTime() : Infinity;
        return timeA - timeB;
      });
    } else if (sortBy === 'expiry') {
      result.sort((a, b) => {
        const timeA = a.expires ? new Date(a.expires).getTime() : Infinity;
        const timeB = b.expires ? new Date(b.expires).getTime() : Infinity;
        return timeA - timeB;
      });
    }

    return result;
  }, [alerts, selectedHazard, sortBy]);

  return (
    <div
      className={`sw-container sw-theme-${themeMode} ${isCompact ? 'sw-format-sidebar' : 'sw-format-mainline'}`}
      data-theme={themeMode}
      data-format={format}
    >
      <Header
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        format={format}
      />

      {/* Direct Question Answering Banner (e.g. "is there a heat advisory in Phoenix") */}
      {normalized.questionInfo && status !== ALERT_STATUS.LOADING && (
        <DirectAnswerBanner
          questionInfo={normalized.questionInfo}
          alerts={alerts}
          placeName={normalized.placeName}
          timezone={normalized.timezone}
        />
      )}

      {/* Hero Status Banner */}
      <HeroStatusCard
        normalizedLocation={normalized}
        status={status}
        alerts={processedAlerts}
        lastUpdated={lastUpdated}
        format={format}
      />

      {/* Conditional State Views */}
      {status === ALERT_STATUS.LOADING && <LoadingSkeletonView />}

      {status === ALERT_STATUS.UNSUPPORTED_COVERAGE && (
        <UnsupportedCoverageView
          location={normalized}
          query={normalized.rawQuery}
        />
      )}

      {status === ALERT_STATUS.INVALID_LOCATION && (
        <InvalidLocationView query={normalized.rawQuery} />
      )}

      {status === ALERT_STATUS.API_ERROR && (
        <ApiErrorView error={errorMessage} onRetry={loadAlerts} />
      )}

      {status === ALERT_STATUS.NO_ALERTS && (
        <NoActiveAlertsView
          location={normalized}
          targetHazard={normalized.targetHazard}
        />
      )}

      {status === ALERT_STATUS.ACTIVE_ALERTS && (
        <>
          <AlertFilterBar
            selectedHazard={selectedHazard}
            onSelectHazard={setSelectedHazard}
            sortBy={sortBy}
            onChangeSort={setSortBy}
            totalCount={processedAlerts.length}
          />

          {processedAlerts.length === 0 ? (
            <div className="sw-state-card" style={{ padding: '24px' }}>
              <p className="sw-state-desc">
                No active alerts match the filter <strong>{selectedHazard.toUpperCase()}</strong>.
              </p>
              <button
                type="button"
                className="sw-theme-btn"
                style={{ marginTop: '8px' }}
                onClick={() => setSelectedHazard(HAZARD_CATEGORIES.ALL)}
              >
                Show All Active Alerts ({alerts.length})
              </button>
            </div>
          ) : isCompact ? (
            /* Sidebar layout: Stacked single column */
            <div className="sw-alerts-column">
              <RadarZoneMap
                location={normalized}
                alerts={processedAlerts}
                isCompact={true}
              />
              {processedAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  timezone={normalized.timezone}
                />
              ))}
            </div>
          ) : (
            /* Mainline layout: 2-column split with Tactical Map on the right */
            <div className="sw-main-split">
              <div className="sw-alerts-column">
                {processedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    timezone={normalized.timezone}
                  />
                ))}
              </div>
              <div className="sw-map-column">
                <RadarZoneMap
                  location={normalized}
                  alerts={processedAlerts}
                  isCompact={false}
                />
              </div>
            </div>
          )}
        </>
      )}

      <SafetyDisclaimer />
    </div>
  );
}
