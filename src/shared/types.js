/**
 * SignalWatch Domain Constants and Status Codes
 */

export const ALERT_STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  ACTIVE_ALERTS: 'ACTIVE_ALERTS',
  NO_ALERTS: 'NO_ALERTS',
  UNSUPPORTED_COVERAGE: 'UNSUPPORTED_COVERAGE',
  INVALID_LOCATION: 'INVALID_LOCATION',
  API_ERROR: 'API_ERROR',
  MALFORMED_DATA: 'MALFORMED_DATA'
};

export const SEVERITY_LEVELS = {
  EXTREME: { label: 'Extreme', rank: 4, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  SEVERE: { label: 'Severe', rank: 3, color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  MODERATE: { label: 'Moderate', rank: 2, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  MINOR: { label: 'Minor', rank: 1, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  UNKNOWN: { label: 'Unknown', rank: 0, color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' }
};

export const HAZARD_CATEGORIES = {
  ALL: 'all',
  FLOOD: 'flood',
  TORNADO: 'tornado',
  HEAT: 'heat',
  WINTER: 'winter',
  WIND: 'wind',
  FIRE: 'fire',
  HURRICANE: 'hurricane',
  AIR_QUALITY: 'air_quality',
  SEVERE_WEATHER: 'severe_weather'
};

export const SUPPORTED_COUNTRY_CODES = ['US', 'PR', 'VI', 'GU', 'AS', 'MP'];
