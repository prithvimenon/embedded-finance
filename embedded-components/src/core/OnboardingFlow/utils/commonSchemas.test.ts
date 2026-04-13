import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AddressSchema,
  PhoneSchema,
  useAddressSchemas,
  usePhoneSchemas,
} from './commonSchemas';

// ---------------------------------------------------------------------------
// Mock context hooks used by usePhoneSchemas / useAddressSchemas
// ---------------------------------------------------------------------------
vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: undefined,
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    clientGetStatus: 'success' as const,
    setClientId: vi.fn(),
    organizationType: undefined,
  }),
  useFlowContext: () => ({
    currentScreenId: 'gateway',
    goTo: vi.fn(),
    goBack: vi.fn(),
    setFlowUnsavedChanges: vi.fn(),
  }),
}));

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();
  return {
    ...actual,
    useFormContext: () => ({
      getValues: () => undefined,
    }),
  };
});

// ---------------------------------------------------------------------------
// PhoneSchema (non-hook, backward-compat export)
// ---------------------------------------------------------------------------
describe('PhoneSchema', () => {
  it('accepts a valid phone object', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'BUSINESS_PHONE',
      phoneNumber: '+12025551234',
    });
    expect(result.success).toBe(true);
  });

  it('accepts MOBILE_PHONE type', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'MOBILE_PHONE',
      phoneNumber: '+14155551234',
    });
    expect(result.success).toBe(true);
  });

  it('accepts ALTERNATE_PHONE type', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'ALTERNATE_PHONE',
      phoneNumber: '+442071234567',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid phone type', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'HOME_PHONE',
      phoneNumber: '+12025551234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid phone number', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'BUSINESS_PHONE',
      phoneNumber: 'not-a-phone',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when phoneType is missing', () => {
    const result = PhoneSchema.safeParse({
      phoneNumber: '+12025551234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when phoneNumber is missing', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'BUSINESS_PHONE',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty object', () => {
    const result = PhoneSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddressSchema (non-hook, backward-compat export)
// ---------------------------------------------------------------------------
describe('AddressSchema', () => {
  const validAddress = {
    addressType: 'LEGAL_ADDRESS' as const,
    primaryAddressLine: '123 Main St',
    additionalAddressLines: [],
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  };

  it('accepts a valid address', () => {
    const result = AddressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it('accepts all valid address types', () => {
    const types = [
      'LEGAL_ADDRESS',
      'MAILING_ADDRESS',
      'BUSINESS_ADDRESS',
      'RESIDENTIAL_ADDRESS',
    ] as const;
    for (const addressType of types) {
      const result = AddressSchema.safeParse({ ...validAddress, addressType });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an invalid address type', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      addressType: 'INVALID_TYPE',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when primaryAddressLine is empty', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      primaryAddressLine: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects primaryAddressLine longer than 60 characters', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      primaryAddressLine: 'A'.repeat(61),
    });
    expect(result.success).toBe(false);
  });

  it('rejects when city is empty', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      city: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects city longer than 34 characters', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      city: 'A'.repeat(35),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid US state code', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      state: 'ZZ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid US postal code format', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      postalCode: 'ABCDE',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid US zip+4 postal code', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      postalCode: '10001-1234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects country code not exactly 2 characters', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      country: 'USA',
    });
    expect(result.success).toBe(false);
  });

  it('rejects postalCode longer than 10 characters', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      postalCode: '12345678901',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// usePhoneSchemas (hook-based)
// ---------------------------------------------------------------------------
describe('usePhoneSchemas', () => {
  it('returns PhoneTypeSchema, PhoneNumberSchema, and PhoneSchema', () => {
    const { result } = renderHook(() => usePhoneSchemas('controllerPhone'));
    expect(result.current.PhoneTypeSchema).toBeDefined();
    expect(result.current.PhoneNumberSchema).toBeDefined();
    expect(result.current.PhoneSchema).toBeDefined();
  });

  it('PhoneSchema accepts a valid phone object', () => {
    const { result } = renderHook(() => usePhoneSchemas('controllerPhone'));
    const parsed = result.current.PhoneSchema.safeParse({
      phoneType: 'BUSINESS_PHONE',
      phoneNumber: '+12025551234',
    });
    expect(parsed.success).toBe(true);
  });

  it('PhoneSchema rejects an invalid phone type', () => {
    const { result } = renderHook(() => usePhoneSchemas('organizationPhone'));
    const parsed = result.current.PhoneSchema.safeParse({
      phoneType: 'HOME_PHONE',
      phoneNumber: '+12025551234',
    });
    expect(parsed.success).toBe(false);
  });

  it('PhoneSchema rejects an invalid phone number', () => {
    const { result } = renderHook(() => usePhoneSchemas('controllerPhone'));
    const parsed = result.current.PhoneSchema.safeParse({
      phoneType: 'MOBILE_PHONE',
      phoneNumber: 'not-a-phone',
    });
    expect(parsed.success).toBe(false);
  });

  it('PhoneNumberSchema rejects an empty string', () => {
    const { result } = renderHook(() => usePhoneSchemas('controllerPhone'));
    const parsed = result.current.PhoneNumberSchema.safeParse('');
    expect(parsed.success).toBe(false);
  });

  it('PhoneTypeSchema accepts all valid phone types', () => {
    const { result } = renderHook(() => usePhoneSchemas('controllerPhone'));
    for (const phoneType of [
      'BUSINESS_PHONE',
      'MOBILE_PHONE',
      'ALTERNATE_PHONE',
    ]) {
      expect(result.current.PhoneTypeSchema.safeParse(phoneType).success).toBe(
        true
      );
    }
  });
});

// ---------------------------------------------------------------------------
// useAddressSchemas (hook-based)
// ---------------------------------------------------------------------------
describe('useAddressSchemas', () => {
  it('returns all expected sub-schemas and AddressSchema', () => {
    const { result } = renderHook(() => useAddressSchemas('individualAddress'));
    expect(result.current.PrimaryAddressLineSchema).toBeDefined();
    expect(result.current.SecondaryAddressLineSchema).toBeDefined();
    expect(result.current.TertiaryAddressLineSchema).toBeDefined();
    expect(result.current.AddressTypeSchema).toBeDefined();
    expect(result.current.CitySchema).toBeDefined();
    expect(result.current.StateSchema).toBeDefined();
    expect(result.current.PostalCodeSchema).toBeDefined();
    expect(result.current.CountrySchema).toBeDefined();
    expect(result.current.AddressSchema).toBeDefined();
  });

  it('AddressSchema accepts a valid US address', () => {
    const { result } = renderHook(() =>
      useAddressSchemas('organizationAddress')
    );
    const parsed = result.current.AddressSchema.safeParse({
      addressType: 'BUSINESS_ADDRESS',
      primaryAddressLine: '456 Oak Ave',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    });
    expect(parsed.success).toBe(true);
  });

  it('AddressSchema rejects when required city is missing', () => {
    const { result } = renderHook(() => useAddressSchemas('individualAddress'));
    const parsed = result.current.AddressSchema.safeParse({
      addressType: 'RESIDENTIAL_ADDRESS',
      primaryAddressLine: '789 Pine St',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: '',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    });
    expect(parsed.success).toBe(false);
  });

  it('AddressSchema rejects an invalid US postal code', () => {
    const { result } = renderHook(() =>
      useAddressSchemas('organizationAddress')
    );
    const parsed = result.current.AddressSchema.safeParse({
      addressType: 'LEGAL_ADDRESS',
      primaryAddressLine: '123 Main St',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'Boston',
      state: 'MA',
      postalCode: 'XXXXX',
      country: 'US',
    });
    expect(parsed.success).toBe(false);
  });

  it('AddressSchema validates country-specific postal code for CA', () => {
    const { result } = renderHook(() => useAddressSchemas('individualAddress'));
    const parsed = result.current.AddressSchema.safeParse({
      addressType: 'MAILING_ADDRESS',
      primaryAddressLine: '100 Queen St',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5H 2N2',
      country: 'CA',
    });
    expect(parsed.success).toBe(true);
  });

  it('PrimaryAddressLineSchema rejects strings over 60 chars', () => {
    const { result } = renderHook(() =>
      useAddressSchemas('organizationAddress')
    );
    const parsed = result.current.PrimaryAddressLineSchema.safeParse(
      'A'.repeat(61)
    );
    expect(parsed.success).toBe(false);
  });

  it('CountrySchema rejects a 3-letter code', () => {
    const { result } = renderHook(() => useAddressSchemas('individualAddress'));
    const parsed = result.current.CountrySchema.safeParse('USA');
    expect(parsed.success).toBe(false);
  });
});
