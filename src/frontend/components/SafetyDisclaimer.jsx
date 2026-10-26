import React from 'react';

export default function SafetyDisclaimer({ dataSourceLabel = 'NWS Live API' }) {
  const isSimulation = /simulated/i.test(dataSourceLabel);
  return (
    <footer className="sw-disclaimer" role="contentinfo">
      <div className="sw-disclaimer-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div>
        <strong>Public Safety & Accuracy Notice: </strong>
        {isSimulation
          ? 'This local view uses synthetic test fixtures and does not report current conditions or official alerts. Do not use simulated data for safety decisions.'
          : 'SignalWatch ingests unadulterated meteorological warning feeds directly from the United States National Weather Service (NOAA). This interface is for informational awareness. In an active life-threatening crisis, civil defense orders, evacuation mandates, and 911 emergency broadcasts supersede digital aggregators.'}
      </div>
    </footer>
  );
}
