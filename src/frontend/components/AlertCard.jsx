import React, { useState, useEffect } from 'react';

function formatCountdown(targetTime) {
  if (!targetTime) return null;
  const diff = new Date(targetTime).getTime() - Date.now();
  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

export default function AlertCard({ alert, timezone }) {
  const [showFullInstructions, setShowFullInstructions] = useState(false);
  const [showMeteorologicalDesc, setShowMeteorologicalDesc] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(alert.expires));

  useEffect(() => {
    if (!alert.expires) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(alert.expires));
    }, 15000);
    return () => clearInterval(interval);
  }, [alert.expires]);

  const severityClass = (alert.severity || 'unknown').toLowerCase();

  const formatDate = (isoString) => {
    if (!isoString) return 'Not specified';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        timeZone: timezone || 'America/New_York',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <article className={`sw-alert-card ${severityClass}`} aria-labelledby={`alert-heading-${alert.id}`}>
      <div className="sw-card-header">
        <div className="sw-card-title-group">
          <div className="sw-badges-row">
            <span className={`sw-badge ${severityClass}`} aria-label={`Severity: ${alert.severity}`}>
              {alert.severity} Severity
            </span>
            {alert.urgency && alert.urgency !== 'Unknown' && (
              <span className="sw-badge subtle" aria-label={`Urgency: ${alert.urgency}`}>
                {alert.urgency}
              </span>
            )}
            {alert.certainty && alert.certainty !== 'Unknown' && (
              <span className="sw-badge subtle" aria-label={`Certainty: ${alert.certainty}`}>
                {alert.certainty}
              </span>
            )}
          </div>
          <h3 id={`alert-heading-${alert.id}`} className="sw-event-title">
            {alert.event}
          </h3>
        </div>

        {alert.expires && countdown && countdown !== 'Expired' && (
          <div className="sw-countdown-badge" title={`Alert expires at ${formatDate(alert.expires)}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{countdown}</span>
          </div>
        )}
      </div>

      <p className="sw-card-headline">{alert.headline}</p>

      {/* Start and Expiry Timestamps */}
      <div className="sw-timing-box">
        <div className="sw-time-item">
          <span className="sw-time-label">Active From:</span>
          <span>{formatDate(alert.onset || alert.effective)}</span>
        </div>
        <div className="sw-time-item">
          <span className="sw-time-label">Expires:</span>
          <span>{formatDate(alert.expires)}</span>
        </div>
      </div>

      {/* Affected Area */}
      <div className="sw-area-box">
        <span className="sw-area-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </span>
        <div>
          <strong style={{ color: 'var(--sw-text-main)' }}>Affected Area: </strong>
          <span>{alert.areaDesc}</span>
        </div>
      </div>

      {/* Plain Language Action Guidance */}
      <div className="sw-action-box">
        <div className="sw-action-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Recommended Official Actions</span>
        </div>
        <p className="sw-action-content">
          {alert.plainInstruction}
        </p>
      </div>

      {/* Expandable Full Official Instructions if available */}
      {alert.instruction && (
        <div style={{ marginTop: '6px' }}>
          <button
            type="button"
            className="sw-expand-btn"
            onClick={() => setShowFullInstructions(!showFullInstructions)}
            aria-expanded={showFullInstructions}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: showFullInstructions ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>{showFullInstructions ? 'Hide Full Official Instructions' : 'View Full Official Instructions'}</span>
          </button>
          {showFullInstructions && (
            <div className="sw-expanded-body" tabIndex="0" role="region" aria-label="Official Instructions">
              {alert.instruction}
            </div>
          )}
        </div>
      )}

      {/* Expandable Meteorological Bulletin Description */}
      {alert.description && (
        <div style={{ marginTop: '6px' }}>
          <button
            type="button"
            className="sw-expand-btn"
            onClick={() => setShowMeteorologicalDesc(!showMeteorologicalDesc)}
            aria-expanded={showMeteorologicalDesc}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: showMeteorologicalDesc ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>{showMeteorologicalDesc ? 'Hide Meteorological Synopsis' : 'View Meteorological Synopsis'}</span>
          </button>
          {showMeteorologicalDesc && (
            <div className="sw-expanded-body" tabIndex="0" role="region" aria-label="Meteorological Description">
              {alert.description}
            </div>
          )}
        </div>
      )}

      {/* Card Footer */}
      <div className="sw-card-footer">
        <span className="sw-sender-text">Source: {alert.senderName}</span>
        <a
          href={alert.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sw-official-link"
          title="Verify directly on National Weather Service bulletin"
        >
          <span>Verify Official NWS Bulletin</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </article>
  );
}
