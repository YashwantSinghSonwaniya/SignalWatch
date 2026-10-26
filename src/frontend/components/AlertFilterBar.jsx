import React from 'react';
import { HAZARD_CATEGORIES } from '../../shared/types.js';

export default function AlertFilterBar({
  selectedHazard,
  onSelectHazard,
  sortBy,
  onChangeSort,
  availableHazards = [],
  totalCount = 0
}) {
  const hazardTabs = [
    { id: HAZARD_CATEGORIES.ALL, label: 'All Hazards' },
    { id: HAZARD_CATEGORIES.FLOOD, label: 'Flooding' },
    { id: HAZARD_CATEGORIES.TORNADO, label: 'Tornado' },
    { id: HAZARD_CATEGORIES.HEAT, label: 'Heat' },
    { id: HAZARD_CATEGORIES.WINTER, label: 'Winter' },
    { id: HAZARD_CATEGORIES.WIND, label: 'Wind / Gale' },
    { id: HAZARD_CATEGORIES.SEVERE_WEATHER, label: 'Severe Weather' }
  ];

  return (
    <div className="sw-filter-bar" role="toolbar" aria-label="Alert Filters and Sorting">
      <div className="sw-filter-chips">
        {hazardTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sw-chip ${selectedHazard === tab.id ? 'active' : ''}`}
            onClick={() => onSelectHazard(tab.id)}
            aria-pressed={selectedHazard === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--sw-text-dim)', fontFamily: 'var(--sw-font-mono)' }}>
          {totalCount} {totalCount === 1 ? 'alert' : 'alerts'}
        </span>
        <select
          className="sw-sort-select"
          value={sortBy}
          onChange={(e) => onChangeSort(e.target.value)}
          aria-label="Sort alerts"
        >
          <option value="severity">Sort: Highest Threat</option>
          <option value="expiry">Sort: Expiring Soonest</option>
        </select>
      </div>
    </div>
  );
}
