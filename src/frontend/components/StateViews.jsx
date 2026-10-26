import React from 'react';

/**
 * Unsupported Coverage View (e.g. Delhi, London, international locations)
 */
export function UnsupportedCoverageView({ location, query }) {
  const place = location.placeName || location.country || 'the requested location';

  return (
    <div className="sw-state-card" role="alert" aria-label="Geographic Coverage Notice">
      <div className="sw-state-icon-wrap slate" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>

      <h3 className="sw-state-title">Coverage Notice: Location Outside NWS Area</h3>

      <p className="sw-state-desc">
        SignalWatch is currently integrated with the <strong>United States National Weather Service (NWS)</strong>.
        Official active safety alerts, flood warnings, and disruption bulletins are strictly available for the
        <strong> United States and its territories</strong> (PR, VI, GU, AS, MP).
      </p>

      <div style={{
        background: 'var(--sw-bg-subtle)',
        padding: '12px 16px',
        borderRadius: 'var(--sw-radius-md)',
        border: '1px solid var(--sw-border-subtle)',
        maxWidth: '520px',
        width: '100%',
        textAlign: 'left',
        fontSize: '0.82rem',
        color: 'var(--sw-text-muted)'
      }}>
        <div><strong>Requested Place: </strong> {place}</div>
        {location.countryCode && <div><strong>Country Code: </strong> {location.countryCode}</div>}
        <div style={{ marginTop: '6px', color: 'var(--sw-amber)' }}>
          ⚠ <em>Do not interpret this message as an "All Clear". For safety guidance in {place}, consult your local national meteorological and civil defense authority.</em>
        </div>
      </div>
    </div>
  );
}

/**
 * Supported Location with No Active Alerts
 */
export function NoActiveAlertsView({ location, targetHazard }) {
  const place = location.placeName || (location.stateAbb ? location.stateAbb : 'this location');
  const hazardName = targetHazard && targetHazard !== 'all' ? `${targetHazard} ` : '';

  return (
    <div className="sw-state-card" role="region" aria-label="No Active Alerts Found">
      <div className="sw-state-icon-wrap green" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h3 className="sw-state-title">
        No Matching Active {hazardName.toUpperCase()}Alerts
      </h3>

      <p className="sw-state-desc">
        No active {hazardName}warnings, watches, or advisories were returned for <strong>{place}</strong> by the National Weather Service at this time.
      </p>

      <div style={{
        background: 'var(--sw-bg-subtle)',
        padding: '10px 14px',
        borderRadius: 'var(--sw-radius-sm)',
        fontSize: '0.78rem',
        color: 'var(--sw-text-dim)',
        maxWidth: '460px',
        lineHeight: 1.4
      }}>
        SignalWatch continuously polls official emergency bulletins. Rapidly evolving weather events can trigger warnings with minimal advance notice. Stay alert to changing local conditions.
      </div>
    </div>
  );
}

/**
 * Invalid or Unresolved Location View
 */
export function InvalidLocationView({ query }) {
  return (
    <div className="sw-state-card" role="alert" aria-label="Unresolved Location">
      <div className="sw-state-icon-wrap amber" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="sw-state-title">Location Could Not Be Resolved</h3>

      <p className="sw-state-desc">
        We could not determine a specific geographic target from your search: <em>"{query}"</em>.
      </p>

      <div style={{
        background: 'var(--sw-bg-subtle)',
        padding: '12px 16px',
        borderRadius: 'var(--sw-radius-md)',
        textAlign: 'left',
        fontSize: '0.8rem',
        maxWidth: '440px'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--sw-text-main)' }}>Try searching for:</div>
        <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--sw-text-muted)' }}>
          <li>A US city: <em>"weather alerts in Houston"</em></li>
          <li>A US state: <em>"flood warnings in Colorado"</em></li>
          <li>A specific hazard: <em>"is there a heat advisory in Phoenix"</em></li>
          <li>Your position: <em>"weather alerts near me"</em></li>
        </ul>
      </div>
    </div>
  );
}

/**
 * API or Network Communication Failure View
 */
export function ApiErrorView({ error, onRetry }) {
  return (
    <div className="sw-state-card" role="alert" aria-label="Upstream Service Communication Alert">
      <div className="sw-state-icon-wrap red" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="sw-state-title">Telemetry Service Unavailable</h3>

      <p className="sw-state-desc">
        An error occurred while communicating with the official National Weather Service API:
      </p>

      <div style={{
        background: 'var(--sw-bg-subtle)',
        padding: '8px 12px',
        borderRadius: 'var(--sw-radius-sm)',
        fontFamily: 'var(--sw-font-mono)',
        fontSize: '0.78rem',
        color: 'var(--sw-red)',
        maxWidth: '480px',
        wordBreak: 'break-word'
      }}>
        {error || 'Upstream National Weather Service API request failed or timed out.'}
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--sw-text-dim)', margin: 0, maxWidth: '440px' }}>
        Never assume an area is safe due to a network or upstream API interruption. Please check back shortly.
      </p>

      {onRetry && (
        <button type="button" className="sw-state-action-btn" onClick={onRetry}>
          Retry Connection
        </button>
      )}
    </div>
  );
}

/**
 * Skeleton Loading View
 */
export function LoadingSkeletonView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-busy="true" aria-label="Loading active safety alerts">
      <div className="sw-skeleton" style={{ height: '140px', width: '100%', borderRadius: 'var(--sw-radius-lg)' }}></div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="sw-skeleton" style={{ height: '36px', width: '90px', borderRadius: '9999px' }}></div>
        <div className="sw-skeleton" style={{ height: '36px', width: '90px', borderRadius: '9999px' }}></div>
        <div className="sw-skeleton" style={{ height: '36px', width: '90px', borderRadius: '9999px' }}></div>
      </div>
      <div className="sw-skeleton" style={{ height: '200px', width: '100%', borderRadius: 'var(--sw-radius-lg)' }}></div>
    </div>
  );
}
