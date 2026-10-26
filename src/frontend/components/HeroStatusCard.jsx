import React from 'react';
import { ALERT_STATUS } from '../../shared/types.js';

export default function HeroStatusCard({
  normalizedLocation,
  status,
  alerts,
  lastUpdated,
  format,
  dataSourceLabel = 'NWS Live API'
}) {
  const { placeName, state, stateAbb, country, timezone, latitude, longitude, isNearMe } = normalizedLocation;

  const totalAlerts = alerts.length;
  const warningsCount = alerts.filter((a) => /warning/i.test(a.event)).length;
  const watchesCount = alerts.filter((a) => /watch/i.test(a.event)).length;
  const advisoriesCount = alerts.filter((a) => /advisory|statement/i.test(a.event)).length;

  const topAlert = alerts.length > 0 ? alerts[0] : null;

  let pillClass = 'info';
  let pillText = 'Status Not Verified';

  if (status === ALERT_STATUS.UNSUPPORTED_COVERAGE) {
    pillClass = 'unsupported';
    pillText = 'Outside NWS Coverage';
  } else if (status === ALERT_STATUS.API_ERROR) {
    pillClass = 'warning';
    pillText = 'Service Communication Alert';
  } else if (status === ALERT_STATUS.LOADING) {
    pillClass = 'info';
    pillText = 'Checking NWS Alerts';
  } else if (status === ALERT_STATUS.INVALID_LOCATION) {
    pillClass = 'warning';
    pillText = 'Location Unresolved';
  } else if (status === ALERT_STATUS.MALFORMED_DATA) {
    pillClass = 'warning';
    pillText = 'Alert Data Not Verified';
  } else if (status === ALERT_STATUS.NO_ALERTS) {
    pillClass = 'clear';
    pillText = 'No Active Disruption';
  } else if (totalAlerts > 0) {
    const highestRank = topAlert?.severityRank || 0;
    if (highestRank >= 4) {
      pillClass = 'danger';
      pillText = 'CRITICAL THREAT ACTIVE';
    } else if (highestRank === 3) {
      pillClass = 'danger';
      pillText = 'SEVERE WARNING ACTIVE';
    } else if (highestRank === 2) {
      pillClass = 'warning';
      pillText = 'ADVISORY IN EFFECT';
    } else {
      pillClass = 'info';
      pillText = 'WATCH / NOTICE ACTIVE';
    }
  } else if (status === ALERT_STATUS.ACTIVE_ALERTS) {
    pillClass = 'info';
    pillText = 'Active Alerts Available';
  }

  const countsVerified = [ALERT_STATUS.ACTIVE_ALERTS, ALERT_STATUS.NO_ALERTS].includes(status);

  // Format local clock if timezone is available
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    timeZone: timezone || 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <div className="sw-hero" role="region" aria-label="Current Threat Summary">
      <div className="sw-hero-top">
        <div className="sw-location-badge">
          <span className="sw-location-pin" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <div>
            <h2 className="sw-location-name">
              {placeName}
              {stateAbb ? `, ${stateAbb}` : state ? `, ${state}` : ''}
              {country && country !== 'United States' ? ` (${country})` : ''}
            </h2>
            <div className="sw-location-sub">
              {isNearMe ? '📍 Searcher Location • ' : ''}
              {timezone ? `Local Time: ${formattedTime}` : ''}
              {latitude != null && longitude != null ? ` • [${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°]` : ''}
            </div>
          </div>
        </div>

        <div className={`sw-status-pill ${pillClass}`} aria-live="polite">
          <span aria-hidden="true">●</span>
          <span>{pillText}</span>
        </div>
      </div>

      <div className="sw-hero-grid">
        <div className="sw-stat-box">
          <span className="sw-stat-label">Active Alerts</span>
          <span className={`sw-stat-val ${totalAlerts > 0 ? 'red' : 'green'}`}>
            {countsVerified ? totalAlerts : '—'}
          </span>
        </div>

        <div className="sw-stat-box">
          <span className="sw-stat-label">Warnings</span>
          <span className={`sw-stat-val ${warningsCount > 0 ? 'red' : ''}`}>
            {countsVerified ? warningsCount : '—'}
          </span>
        </div>

        <div className="sw-stat-box">
          <span className="sw-stat-label">Watches</span>
          <span className={`sw-stat-val ${watchesCount > 0 ? 'orange' : ''}`}>
            {countsVerified ? watchesCount : '—'}
          </span>
        </div>

        <div className="sw-stat-box">
          <span className="sw-stat-label">Advisories</span>
          <span className="sw-stat-val">
            {countsVerified ? advisoriesCount : '—'}
          </span>
        </div>

        <div className="sw-stat-box">
          <span className="sw-stat-label">Telemetry Feed</span>
          <span className="sw-stat-val" style={{ fontSize: '0.82rem', fontFamily: 'var(--sw-font-mono)', color: 'var(--sw-text-muted)' }}>
            {dataSourceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
