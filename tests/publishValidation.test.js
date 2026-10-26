import { describe, it, expect } from 'vitest';
import config from '../hyperdart.config.js';
import fs from 'fs';
import path from 'path';

describe('HyperDart Configuration & Publication Rules', () => {
  it('has non-empty keywords array containing required problem statement triggers', () => {
    expect(Array.isArray(config.triggers?.keywords)).toBe(true);
    expect(config.triggers.keywords.length).toBeGreaterThan(0);

    const required = [
      'weather alerts',
      'weather warnings',
      'flood warning',
      'tornado warning',
      'heat advisory',
      'winter storm warning'
    ];
    for (const req of required) {
      expect(config.triggers.keywords).toContain(req);
    }
  });

  it('has valid non-empty regex patterns covering location and near-me queries', () => {
    expect(Array.isArray(config.query_format?.regex)).toBe(true);
    expect(config.query_format.regex.length).toBeGreaterThan(0);

    const regexStrings = config.query_format.regex;
    expect(regexStrings.some((r) => r.includes('HD_LOCATION'))).toBe(true);
    expect(regexStrings.some((r) => r.includes('near|around'))).toBe(true);

    // Verify all regexes compile without syntax errors
    for (const r of regexStrings) {
      expect(() => new RegExp(r)).not.toThrow();
    }
  });

  it('has valid GitHub URL', () => {
    expect(config.github).toBeDefined();
    expect(config.github).toMatch(/^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/);
  });

  it('has valid YouTube demo video URL', () => {
    expect(config.demovideo).toBeDefined();
    const isValid =
      /^https:\/\/(www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(config.demovideo) ||
      /^https:\/\/youtu\.be\/[A-Za-z0-9_-]{11}$/.test(config.demovideo);
    expect(isValid).toBe(true);
  });

  it('references client and server files that exist on disk', () => {
    expect(fs.existsSync(path.resolve(config.client.location))).toBe(true);
    expect(fs.existsSync(path.resolve(config.server.location))).toBe(true);
    expect(fs.existsSync(path.resolve(config.server.configPath))).toBe(true);
  });
});
