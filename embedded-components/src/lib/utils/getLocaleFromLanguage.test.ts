import { describe, expect, it } from 'vitest';

import { getLocaleFromLanguage } from './getLocaleFromLanguage';

describe('getLocaleFromLanguage', () => {
  it('returns "en-US" when no language code is provided', () => {
    expect(getLocaleFromLanguage()).toBe('en-US');
    expect(getLocaleFromLanguage(undefined)).toBe('en-US');
  });

  it('returns "en-US" for empty string', () => {
    expect(getLocaleFromLanguage('')).toBe('en-US');
  });

  it('returns "en-US" for "enUS"', () => {
    expect(getLocaleFromLanguage('enUS')).toBe('en-US');
  });

  it('returns "fr-CA" for "frCA"', () => {
    expect(getLocaleFromLanguage('frCA')).toBe('fr-CA');
  });

  it('returns "es-US" for "esUS"', () => {
    expect(getLocaleFromLanguage('esUS')).toBe('es-US');
  });

  it('returns "en-US" for unknown language code', () => {
    expect(getLocaleFromLanguage('unknownCode')).toBe('en-US');
    expect(getLocaleFromLanguage('deDE')).toBe('en-US');
    expect(getLocaleFromLanguage('zhCN')).toBe('en-US');
  });
});
