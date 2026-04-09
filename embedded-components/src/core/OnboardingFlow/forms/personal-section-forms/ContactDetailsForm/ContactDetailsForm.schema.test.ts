import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useContactDetailsFormSchema } from './ContactDetailsForm.schema';

vi.mock('@/core/OnboardingFlow/utils/formUtils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGetValidationMessage: () => (key: string) => `${key} is invalid`,
    useGetFieldContentToken: () => (fieldName: string, tokenId: string) =>
      `${fieldName}.${tokenId}`,
  };
});

describe('useContactDetailsFormSchema', () => {
  it('returns a valid schema', () => {
    const { result } = renderHook(() => useContactDetailsFormSchema());
    expect(result.current).toBeDefined();
  });

  it('validates valid contact details', () => {
    const { result } = renderHook(() => useContactDetailsFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      controllerEmail: 'john@example.com',
      controllerPhone: {
        phoneType: 'MOBILE_PHONE',
        phoneNumber: '+12025551234',
      },
      individualAddress: {
        addressType: 'RESIDENTIAL_ADDRESS',
        primaryAddressLine: '456 Oak Ave',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
      },
    });
    expect(parseResult.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const { result } = renderHook(() => useContactDetailsFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      controllerEmail: 'not-an-email',
      controllerPhone: {
        phoneType: 'MOBILE_PHONE',
        phoneNumber: '+12025551234',
      },
      individualAddress: {
        addressType: 'RESIDENTIAL_ADDRESS',
        primaryAddressLine: '456 Oak Ave',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
      },
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects empty email', () => {
    const { result } = renderHook(() => useContactDetailsFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      controllerEmail: '',
      controllerPhone: {
        phoneType: 'MOBILE_PHONE',
        phoneNumber: '+12025551234',
      },
      individualAddress: {
        addressType: 'RESIDENTIAL_ADDRESS',
        primaryAddressLine: '456 Oak Ave',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
      },
    });
    expect(parseResult.success).toBe(false);
  });
});
