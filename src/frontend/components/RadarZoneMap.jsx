import React, { useState } from 'react';

/**
 * Projects latitude/longitude coordinates to SVG canvas space centered around the target location
 */
function projectPoint(lat, lon, centerLat, centerLon, width = 360, height = 270, zoom = 1.0) {
  const scale = 30 * zoom;
  const x = width / 2 + (lon - centerLon) * scale;
  const y = height / 2 - (lat - centerLat) * scale;
  return { x, y };
}

export default function RadarZoneMap({
  location,
  alerts = [],
  isCompact = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(isCompact);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const { placeName, latitude, longitude, stateAbb } = location;

  const centerLat = latitude != null ? Number(latitude) : 38.0;
  const centerLon = longitude != null ? Number(longitude) : -97.0;

  // Extract all polygon geometries from alerts
  const polygonPaths = [];

  alerts.forEach((alert, idx) => {
    if (alert.geometry && (alert.geometry.type === 'Polygon' || alert.geometry.type === 'MultiPolygon')) {
      const coordsGroup = alert.geometry.type === 'Polygon' ? [alert.geometry.coordinates] : alert.geometry.coordinates;

      coordsGroup.forEach((ringGroup) => {
        const outerRing = ringGroup[0];
        if (Array.isArray(outerRing) && outerRing.length > 2) {
          const points = outerRing.map(([lon, lat]) => {
            const pt = projectPoint(lat, lon, centerLat, centerLon, 360, 270, zoomLevel);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          }).join(' ');

          polygonPaths.push({
            id: `${alert.id}-${idx}`,
            points,
            severityRank: alert.severityRank || 1,
            event: alert.event
          });
        }
      });
    }
  });

  return (
    <div className="sw-radar-card" role="region" aria-label="Geographic Alert Map">
      <div className="sw-radar-header">
        <h3 className="sw-radar-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <line x1="12" y1="12" x2="19" y2="5" />
          </svg>
          <span>Tactical Geographic Scope</span>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="sw-theme-btn"
            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.3))}
            aria-label="Zoom in map"
          >
            +
          </button>
          <button
            type="button"
            className="sw-theme-btn"
            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.3))}
            aria-label="Zoom out map"
          >
            -
          </button>
          <button
            type="button"
            className="sw-theme-btn"
            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand radar map' : 'Collapse radar map'}
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="sw-map-canvas-wrap">
            <svg
              className="sw-map-svg"
              viewBox="0 0 360 270"
              xmlns="http://www.w3.org/2000/svg"
              aria-label={`Radar map centered at ${placeName}`}
            >
              <defs>
                <radialGradient id="sw-radar-sweep" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.08)" />
                  <stop offset="60%" stopColor="rgba(16, 185, 129, 0.03)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                </radialGradient>
              </defs>

              {/* Background grid */}
              <rect width="360" height="270" fill="#090d16" />

              {/* Range rings */}
              <circle cx="180" cy="135" r="40" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="180" cy="135" r="80" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="180" cy="135" r="120" fill="url(#sw-radar-sweep)" stroke="#334155" strokeWidth="1" />

              {/* Crosshair axis */}
              <line x1="180" y1="15" x2="180" y2="255" stroke="#1e293b" strokeWidth="1" />
              <line x1="20" y1="135" x2="340" y2="135" stroke="#1e293b" strokeWidth="1" />

              {/* Official Alert Polygons if present */}
              {polygonPaths.map((poly) => {
                const strokeColor = poly.severityRank >= 3 ? '#ef4444' : '#f59e0b';
                const fillColor = poly.severityRank >= 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)';
                return (
                  <polygon
                    key={poly.id}
                    points={poly.points}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  >
                    <title>{poly.event}</title>
                  </polygon>
                );
              })}

              {/* Location Center Crosshair */}
              <circle cx="180" cy="135" r="5" fill="#f59e0b" />
              <circle cx="180" cy="135" r="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" values="8;22" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2.5s" repeatCount="indefinite" />
              </circle>

              {/* Location Label */}
              <text x="180" y="162" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600" fontFamily="system-ui">
                {placeName} {stateAbb ? `(${stateAbb})` : ''}
              </text>
              <text x="180" y="176" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {latitude != null ? `${Number(latitude).toFixed(3)}°N, ${Number(longitude).toFixed(3)}°W` : 'US Region'}
              </text>
            </svg>
          </div>

          <div className="sw-map-meta">
            <span>
              {polygonPaths.length > 0
                ? `${polygonPaths.length} official warning polygon(s) projected`
                : 'Showing central telemetry point and radius boundary'}
            </span>
            <span style={{ fontFamily: 'var(--sw-font-mono)' }}>Zoom: {zoomLevel.toFixed(1)}x</span>
          </div>
        </>
      )}
    </div>
  );
}
