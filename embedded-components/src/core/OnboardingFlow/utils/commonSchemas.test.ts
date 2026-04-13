import { describe, expect, it } from 'vitest';

import { AddressSchema, PhoneSchema } from './commonSchemas';

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
