import { describe, it, expect } from 'vitest';
import {
  normalizeSearchData,
  extractHazardFromQuery,
  extractQuestionInfo
} from '../src/shared/normalizeSearchData.js';
import {
  searchDataHouston,
  searchDataColoradoFloods,
  searchDataDelhi,
  searchDataNearMe,
  searchDataPhoenixHeatQuestion,
  searchDataMissingLocation
} from './fixtures/alertsFixtures.js';
import { HAZARD_CATEGORIES } from '../src/shared/types.js';

describe('normalizeSearchData', () => {
  it('parses array-form searchData correctly (Houston)', () => {
    const result = normalizeSearchData(searchDataHouston);
    expect(result.placeName).toBe('Houston');
    expect(result.stateAbb).toBe('TX');
    expect(result.countryCode).toBe('US');
    expect(result.latitude).toBeCloseTo(29.76328);
    expect(result.longitude).toBeCloseTo(-95.36327);
    expect(result.timezone).toBe('America/Chicago');
    expect(result.isSupportedCoverage).toBe(true);
    expect(result.isValidLocation).toBe(true);
    expect(result.targetHazard).toBe(HAZARD_CATEGORIES.ALL);
  });

  it('parses single-object searchData correctly (Colorado Floods)', () => {
    const result = normalizeSearchData(searchDataColoradoFloods);
    expect(result.placeName).toBe('Colorado');
    expect(result.stateAbb).toBe('CO');
    expect(result.latitude).toBeCloseTo(39.5501);
    expect(result.targetHazard).toBe(HAZARD_CATEGORIES.FLOOD);
    expect(result.isSupportedCoverage).toBe(true);
    expect(result.isValidLocation).toBe(true);
  });

  it('accurately detects unsupported geographic coverage for international places (Delhi)', () => {
    const result = normalizeSearchData(searchDataDelhi);
    expect(result.placeName).toBe('Delhi');
    expect(result.countryCode).toBe('IN');
    expect(result.isSupportedCoverage).toBe(false);
    expect(result.unsupportedReason).toContain('outside the supported coverage area');
  });

  it('handles "near me" query using userLocation coordinates', () => {
    const result = normalizeSearchData(searchDataNearMe);
    expect(result.isNearMe).toBe(true);
    expect(result.latitude).toBeCloseTo(37.7749);
    expect(result.longitude).toBeCloseTo(-122.4194);
    expect(result.countryCode).toBe('US');
    expect(result.isSupportedCoverage).toBe(true);
  });

  it('detects question queries like "is there a heat advisory in Phoenix"', () => {
    const result = normalizeSearchData(searchDataPhoenixHeatQuestion);
    expect(result.placeName).toBe('Phoenix');
    expect(result.stateAbb).toBe('AZ');
    expect(result.targetHazard).toBe(HAZARD_CATEGORIES.HEAT);
    expect(result.questionInfo).toBeDefined();
    expect(result.questionInfo.isQuestion).toBe(true);
    expect(result.questionInfo.hazardPhrase).toContain('heat');
  });

  it('identifies invalid or missing locations gracefully', () => {
    const result = normalizeSearchData(searchDataMissingLocation);
    expect(result.isValidLocation).toBe(false);
    expect(result.countryCode).toBe('UNKNOWN');
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });

  it('rejects partial or out-of-range coordinates instead of treating them as a location', () => {
    const result = normalizeSearchData({
      query: 'weather alerts near me',
      entities: [],
      userLocation: {
        position: { coords: { latitude: 120 }, countryCode: 'US' }
      }
    });

    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.isValidLocation).toBe(false);
  });

  it('does not assume NWS coverage when coordinates have no country or state metadata', () => {
    const result = normalizeSearchData({
      query: 'weather alerts near me',
      entities: [],
      userLocation: {
        position: { coords: { latitude: 28.6139, longitude: 77.209 } }
      }
    });

    expect(result.countryCode).toBe('UNKNOWN');
    expect(result.isSupportedCoverage).toBe(true);
    expect(result.isValidLocation).toBe(false);
  });
});

describe('extractHazardFromQuery', () => {
  it('identifies flood hazards', () => {
    expect(extractHazardFromQuery('flood warning in Colorado')).toBe(HAZARD_CATEGORIES.FLOOD);
    expect(extractHazardFromQuery('flash flood watch')).toBe(HAZARD_CATEGORIES.FLOOD);
  });

  it('identifies tornado hazards', () => {
    expect(extractHazardFromQuery('is there a tornado warning near me')).toBe(HAZARD_CATEGORIES.TORNADO);
  });

  it('identifies heat hazards', () => {
    expect(extractHazardFromQuery('is there a heat advisory in Phoenix')).toBe(HAZARD_CATEGORIES.HEAT);
  });

  it('identifies winter hazards', () => {
    expect(extractHazardFromQuery('winter storm warning in Denver')).toBe(HAZARD_CATEGORIES.WINTER);
    expect(extractHazardFromQuery('blizzard watch')).toBe(HAZARD_CATEGORIES.WINTER);
  });

  it('defaults to all hazards for general queries', () => {
    expect(extractHazardFromQuery('weather alerts in Houston')).toBe(HAZARD_CATEGORIES.ALL);
    expect(extractHazardFromQuery('safety alerts')).toBe(HAZARD_CATEGORIES.ALL);
  });
});
