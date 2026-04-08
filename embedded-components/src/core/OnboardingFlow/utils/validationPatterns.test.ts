import { describe, expect, it } from 'vitest';

import { NAME_PATTERN, SUFFIX_PATTERN } from './validationPatterns';

describe('NAME_PATTERN', () => {
  it.each([
    ['', true],
    ['John Doe', true],
    ["O'Brien", true],
    ['Company (LLC)', true],
    ['Test_Name', true],
    ['user@domain', true],
    ['A & B Corp', true],
    ['Rate: 5%', true],
    ['Item #1', true],
    ['Hello; World', true],
    ['Street, City', true],
    ['Name.Jr', true],
    ['abc123', true],
    ['a/b', true],
    ['a+b', true],
    ['a-b', true],
    // Invalid
    ['Name!', false],
    ['Hello$World', false],
    ['Test*Name', false],
    ['Bracket[1]', false],
    ['Curly{brace}', false],
    ['Back\\slash', false],
    ['Tilde~', false],
    ['\u00e9', false], // unicode accented char
    ['\u4e2d\u6587', false], // CJK characters
  ])('"%s" → %s', (input, expected) => {
    expect(NAME_PATTERN.test(input)).toBe(expected);
  });
});

describe('SUFFIX_PATTERN', () => {
  it.each([
    ['', true],
    ['Jr', true],
    ['Sr', true],
    ['III', true],
    ['IV', true],
    ['Jr.', true],
    ['X', true],
    // Invalid
    ['Jr!', false],
    ['123', false],
    ['Jr ', false],
    ['Jr-', false],
    ['Jr,', false],
    ['$', false],
    ['\u00e9', false], // unicode accented char
  ])('"%s" → %s', (input, expected) => {
    expect(SUFFIX_PATTERN.test(input)).toBe(expected);
  });
});
