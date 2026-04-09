import { describe, expect, it } from 'vitest';

import { NAME_PATTERN, SUFFIX_PATTERN } from './validationPatterns';

describe('NAME_PATTERN', () => {
  it('matches alphanumeric characters', () => {
    expect(NAME_PATTERN.test('JohnDoe123')).toBe(true);
  });

  it("matches special characters ()_/@&+%#;,.: '-", () => {
    expect(NAME_PATTERN.test("O'Brien")).toBe(true);
    expect(NAME_PATTERN.test('Smith & Co.')).toBe(true);
    expect(NAME_PATTERN.test('Dept. (Finance)')).toBe(true);
    expect(NAME_PATTERN.test('Name_Test')).toBe(true);
    expect(NAME_PATTERN.test('A/B Corp')).toBe(true);
    expect(NAME_PATTERN.test('Rate: 5%')).toBe(true);
    expect(NAME_PATTERN.test('#1 Company')).toBe(true);
    expect(NAME_PATTERN.test('Item; Note')).toBe(true);
    expect(NAME_PATTERN.test('A, B')).toBe(true);
    expect(NAME_PATTERN.test('First-Last')).toBe(true);
    expect(NAME_PATTERN.test('A+B')).toBe(true);
    expect(NAME_PATTERN.test('user@domain')).toBe(true);
  });

  it('matches empty string', () => {
    expect(NAME_PATTERN.test('')).toBe(true);
  });

  it('rejects invalid characters', () => {
    expect(NAME_PATTERN.test('Name!')).toBe(false);
    expect(NAME_PATTERN.test('Name$')).toBe(false);
    expect(NAME_PATTERN.test('Name*')).toBe(false);
    expect(NAME_PATTERN.test('Name^')).toBe(false);
    expect(NAME_PATTERN.test('Name~')).toBe(false);
    expect(NAME_PATTERN.test('Name`')).toBe(false);
    expect(NAME_PATTERN.test('Name{}')).toBe(false);
    expect(NAME_PATTERN.test('Name[]')).toBe(false);
    expect(NAME_PATTERN.test('Name|')).toBe(false);
    expect(NAME_PATTERN.test('Name\\')).toBe(false);
  });
});

describe('SUFFIX_PATTERN', () => {
  it('matches letters', () => {
    expect(SUFFIX_PATTERN.test('Jr')).toBe(true);
    expect(SUFFIX_PATTERN.test('Sr')).toBe(true);
    expect(SUFFIX_PATTERN.test('Esq')).toBe(true);
  });

  it('matches dots', () => {
    expect(SUFFIX_PATTERN.test('Jr.')).toBe(true);
    expect(SUFFIX_PATTERN.test('Sr.')).toBe(true);
  });

  it('matches Roman numerals I, V, X', () => {
    expect(SUFFIX_PATTERN.test('I')).toBe(true);
    expect(SUFFIX_PATTERN.test('II')).toBe(true);
    expect(SUFFIX_PATTERN.test('III')).toBe(true);
    expect(SUFFIX_PATTERN.test('IV')).toBe(true);
    expect(SUFFIX_PATTERN.test('V')).toBe(true);
    expect(SUFFIX_PATTERN.test('VI')).toBe(true);
    expect(SUFFIX_PATTERN.test('X')).toBe(true);
  });

  it('matches empty string', () => {
    expect(SUFFIX_PATTERN.test('')).toBe(true);
  });

  it('rejects invalid characters', () => {
    expect(SUFFIX_PATTERN.test('Jr!')).toBe(false);
    expect(SUFFIX_PATTERN.test('123')).toBe(false);
    expect(SUFFIX_PATTERN.test('Jr-')).toBe(false);
    expect(SUFFIX_PATTERN.test('Jr ')).toBe(false);
  });
});
