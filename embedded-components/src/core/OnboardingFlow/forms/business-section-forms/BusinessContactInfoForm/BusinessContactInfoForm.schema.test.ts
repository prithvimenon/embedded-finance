import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

vi.mock('@/core/OnboardingFlow/utils/formUtils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGetValidationMessage: () => (key: string) => `${key} is invalid`,
  };
});

describe('useBusinessContactInfoFormSchema', () => {
  it('returns a valid schema', () => {
    const { result } = renderHook(() => useBusinessContactInfoFormSchema());
    expect(result.current).toBeDefined();
    expect(result.current.safeParse).toBeDefined();
  });

  it('validates valid input', () => {
    const { result } = renderHook(() => useBusinessContactInfoFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationEmail: 'test@example.com',
      organizationPhone: {
        phoneType: 'BUSINESS_PHONE',
        phoneNumber: '+12025551234',
      },
      organizationAddress: {
        addressType: 'BUSINESS_ADDRESS',
        primaryAddressLine: '123 Main St',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
    });
    expect(parseResult.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const { result } = renderHook(() => useBusinessContactInfoFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationEmail: 'not-an-email',
      organizationPhone: {
        phoneType: 'BUSINESS_PHONE',
        phoneNumber: '+12025551234',
      },
      organizationAddress: {
        addressType: 'BUSINESS_ADDRESS',
        primaryAddressLine: '123 Main St',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects empty email', () => {
    const { result } = renderHook(() => useBusinessContactInfoFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      organizationEmail: '',
      organizationPhone: {
        phoneType: 'BUSINESS_PHONE',
        phoneNumber: '+12025551234',
      },
      organizationAddress: {
        addressType: 'BUSINESS_ADDRESS',
        primaryAddressLine: '123 Main St',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
    });
    expect(parseResult.success).toBe(false);
  });
});
