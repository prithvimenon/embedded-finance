import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/OnboardingFlow/utils/formUtils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGetValidationMessage: () => (key: string) => `${key} is invalid`,
  };
});

import { useBusinessIdentityFormSchema } from './BusinessIdentityForm.schema';

describe('useBusinessIdentityFormSchema', () => {
  it('returns a valid schema', () => {
    const { result } = renderHook(() => useBusinessIdentityFormSchema());
    expect(result.current).toBeDefined();
  });

  it('validates valid business identity input', () => {
    const { result } = renderHook(() => useBusinessIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationName: 'Test Corp LLC',
      dbaName: 'TestCo',
      dbaNameNotAvailable: false,
      yearOfFormation: '2020',
      countryOfFormation: 'US',
      organizationIdEin: '123456789',
      solePropHasEin: 'yes',
      website: 'https://example.com',
      websiteNotAvailable: false,
    });
    expect(parseResult.success).toBe(true);
  });

  it('rejects empty organization name', () => {
    const { result } = renderHook(() => useBusinessIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationName: '',
      dbaName: '',
      dbaNameNotAvailable: true,
      yearOfFormation: '2020',
      countryOfFormation: 'US',
      organizationIdEin: '123456789',
      solePropHasEin: 'yes',
      website: 'https://example.com',
      websiteNotAvailable: false,
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects invalid year of formation', () => {
    const { result } = renderHook(() => useBusinessIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationName: 'Test Corp',
      dbaName: '',
      dbaNameNotAvailable: true,
      yearOfFormation: '3000',
      countryOfFormation: 'US',
      organizationIdEin: '123456789',
      solePropHasEin: 'yes',
      website: 'https://example.com',
      websiteNotAvailable: false,
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects non-US country of formation', () => {
    const { result } = renderHook(() => useBusinessIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationName: 'Test Corp',
      dbaName: '',
      dbaNameNotAvailable: true,
      yearOfFormation: '2020',
      countryOfFormation: 'CA',
      organizationIdEin: '123456789',
      solePropHasEin: 'yes',
      website: 'https://example.com',
      websiteNotAvailable: false,
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects invalid EIN format', () => {
    const { result } = renderHook(() => useBusinessIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationName: 'Test Corp',
      dbaName: '',
      dbaNameNotAvailable: true,
      yearOfFormation: '2020',
      countryOfFormation: 'US',
      organizationIdEin: '12345',
      solePropHasEin: 'yes',
      website: 'https://example.com',
      websiteNotAvailable: false,
    });
    expect(parseResult.success).toBe(false);
  });
});
