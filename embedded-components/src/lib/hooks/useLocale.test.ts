import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLocale } from './useLocale';

describe('useLocale', () => {
  it('returns a locale string', () => {
    // The global i18n instance is initialized with 'enUS' in vitest.setup.mjs via config.ts
    const { result } = renderHook(() => useLocale());
    expect(result.current).toBe('en-US');
  });
});
