import { describe, expect, it } from 'vitest';

import {
  _get,
  cn,
  compressImage,
  createRegExpAndMessage,
  isValueEmpty,
  sanitizeInput,
} from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('eb-foo', 'eb-bar')).toBe('eb-foo eb-bar');
  });

  it('handles conditional classes', () => {
    expect(cn('eb-base', false && 'eb-hidden', 'eb-visible')).toBe(
      'eb-base eb-visible'
    );
  });

  it('returns empty string when given no arguments', () => {
    expect(cn()).toBe('');
  });

  it('deduplicates conflicting tailwind classes', () => {
    // tailwind-merge should resolve conflicting classes
    const result = cn('eb-p-4', 'eb-p-2');
    expect(result).toBe('eb-p-2');
  });
});

describe('isValueEmpty', () => {
  it.each([
    [undefined, true],
    [null, true],
    ['', true],
    [[], true],
    [{}, true],
    ['hello', false],
    [0, false],
    [false, false],
    [[1], false],
    [{ a: 1 }, false],
  ])('isValueEmpty(%j) → %s', (value, expected) => {
    expect(isValueEmpty(value)).toBe(expected);
  });
});

describe('_get', () => {
  const obj = {
    user: {
      name: 'Alice',
      address: {
        city: 'Boston',
        zip: '02101',
      },
      tags: ['admin', 'user'],
    },
  };

  it('retrieves nested value by dot path', () => {
    expect(_get(obj, 'user.name')).toBe('Alice');
    expect(_get(obj, 'user.address.city')).toBe('Boston');
  });

  it('retrieves array element', () => {
    expect(_get(obj, 'user.tags.0')).toBe('admin');
  });

  it('returns defaultValue for missing paths', () => {
    expect(_get(obj, 'user.phone', 'N/A')).toBe('N/A');
    expect(_get(obj, 'user.address.country')).toBeUndefined();
  });

  it('returns defaultValue for null/undefined objects', () => {
    expect(_get(null, 'a.b', 'default')).toBe('default');
    expect(_get(undefined, 'a', 'default')).toBe('default');
  });

  it('supports array path format', () => {
    expect(_get(obj, ['user', 'name'])).toBe('Alice');
  });
});

describe('createRegExpAndMessage', () => {
  it('creates regex allowing alphanumeric and special chars', () => {
    const [regex, message] = createRegExpAndMessage('!@', 'Allowed: ');
    expect(regex.test('abc123')).toBe(true);
    expect(regex.test('hello!')).toBe(true);
    expect(regex.test('test@example')).toBe(true);
    expect(regex.test('no#hash')).toBe(false);
    expect(message).toBe('Allowed: ! @');
  });

  it('escapes special regex characters', () => {
    const [regex] = createRegExpAndMessage('^-]\\');
    expect(regex.test('test^')).toBe(true);
    expect(regex.test('test-')).toBe(true);
    expect(regex.test('test]')).toBe(true);
    expect(regex.test('test\\')).toBe(true);
  });

  it('handles undefined specialCharacters', () => {
    const [regex, message] = createRegExpAndMessage(undefined, 'Allowed: ');
    expect(regex.test('abc123')).toBe(true);
    expect(regex.test('abc!')).toBe(false);
    expect(message).toBe('Allowed: ');
  });

  it('handles empty specialCharacters', () => {
    const [regex] = createRegExpAndMessage('');
    expect(regex.test('abc 123')).toBe(true);
    expect(regex.test('!@#')).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('removes URLs', () => {
    expect(sanitizeInput('visit https://evil.com now')).toBe('visit now');
  });

  it('normalizes whitespace', () => {
    expect(sanitizeInput('hello   world')).toBe('hello world');
  });

  it('encodes < > characters as HTML entities', () => {
    expect(sanitizeInput('a < b > c')).toBe('a &lt; b &gt; c');
  });

  it('trims the result', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeInput('Hello World 123')).toBe('Hello World 123');
  });
});

describe('compressImage', () => {
  it('throws for non-File input', async () => {
    await expect(compressImage('not-a-file' as any)).rejects.toThrow(
      'Invalid file input'
    );
  });

  it('throws for non-image file', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    await expect(compressImage(file)).rejects.toThrow('File is not an image');
  });

  it('accepts options as a number for backwards compatibility', async () => {
    // The function should accept a number (maxWidthHeight) as the second arg
    // We can't fully test canvas in jsdom, but we can test the error paths
    const textFile = new File(['x'], 'test.txt', { type: 'text/plain' });
    await expect(compressImage(textFile, 500)).rejects.toThrow(
      'File is not an image'
    );
  });
});
