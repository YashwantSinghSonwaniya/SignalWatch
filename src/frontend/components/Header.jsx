import React from 'react';

export default function Header({ themeMode, onToggleTheme, format }) {
  return (
    <header className="sw-header" role="banner">
      <div className="sw-brand">
        <div className="sw-brand-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="3" />
            <path d="M12 8v-1" />
            <path d="M12 15v-1" />
          </svg>
        </div>
        <div className="sw-title-group">
          <div className="sw-title-row">
            <h1 className="sw-title">SignalWatch</h1>
          </div>
          <p className="sw-tagline">Know what's happening. Know what to do.</p>
        </div>
      </div>

      <div className="sw-header-actions">
        <div className="sw-live-pulse" title="Connected to National Weather Service telemetry feed">
          <span className="sw-pulse-dot" aria-hidden="true"></span>
          <span>NWS Active</span>
        </div>

        <button
          type="button"
          className="sw-theme-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
        >
          {themeMode === 'dark' ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span>Light</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
