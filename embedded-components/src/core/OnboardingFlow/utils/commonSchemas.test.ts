import { describe, expect, it } from 'vitest';

import { AddressSchema, PhoneSchema } from './commonSchemas';

describe('PhoneSchema', () => {
  it('accepts valid phone data', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'BUSINESS_PHONE',
      phoneNumber: '+12125551234',
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
      phoneNumber: '+14155551234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone type', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'INVALID_TYPE',
      phoneNumber: '+12125551234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone number', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'BUSINESS_PHONE',
      phoneNumber: 'not-a-number',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const phoneError = result.error.issues.find((i) =>
        i.path.includes('phoneNumber')
      );
      expect(phoneError?.message).toBe('Invalid phone number');
    }
  });

  it('rejects empty phone number', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'BUSINESS_PHONE',
      phoneNumber: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('AddressSchema (non-hook)', () => {
  const validAddress = {
    addressType: 'LEGAL_ADDRESS' as const,
    primaryAddressLine: '123 Main Street',
    additionalAddressLines: [],
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  };

  it('accepts a valid US address', () => {
    const result = AddressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it('accepts all address types', () => {
    for (const type of [
      'LEGAL_ADDRESS',
      'MAILING_ADDRESS',
      'BUSINESS_ADDRESS',
      'RESIDENTIAL_ADDRESS',
    ] as const) {
      const result = AddressSchema.safeParse({
        ...validAddress,
        addressType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty primaryAddressLine', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      primaryAddressLine: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects primaryAddressLine longer than 60 chars', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      primaryAddressLine: 'a'.repeat(61),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty city', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      city: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects city longer than 34 chars', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      city: 'a'.repeat(35),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid US state code', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      state: 'XX',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid US postal code format', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      postalCode: 'ABCDE',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid ZIP+4 format', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      postalCode: '10001-1234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects country code that is not exactly 2 characters', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      country: 'USA',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty country code', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      country: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid addressType', () => {
    const result = AddressSchema.safeParse({
      ...validAddress,
      addressType: 'INVALID',
    });
    expect(result.success).toBe(false);
  });
});
