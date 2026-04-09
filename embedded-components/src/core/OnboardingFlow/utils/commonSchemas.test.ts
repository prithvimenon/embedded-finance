import { describe, expect, it } from 'vitest';

import { AddressSchema, PhoneSchema } from './commonSchemas';

describe('PhoneSchema (non-hook)', () => {
  it('validates a valid phone object', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'MOBILE_PHONE',
      phoneNumber: '+12025551234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone type', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'INVALID_TYPE',
      phoneNumber: '+12025551234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone number', () => {
    const result = PhoneSchema.safeParse({
      phoneType: 'MOBILE_PHONE',
      phoneNumber: 'not-a-phone',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid phone types', () => {
    for (const phoneType of [
      'BUSINESS_PHONE',
      'MOBILE_PHONE',
      'ALTERNATE_PHONE',
    ]) {
      const result = PhoneSchema.safeParse({
        phoneType,
        phoneNumber: '+12025551234',
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('AddressSchema (non-hook)', () => {
  const validUSAddress = {
    addressType: 'LEGAL_ADDRESS',
    primaryAddressLine: '123 Main St',
    additionalAddressLines: [],
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  };

  it('validates a valid US address', () => {
    const result = AddressSchema.safeParse(validUSAddress);
    expect(result.success).toBe(true);
  });

  it('rejects missing required primaryAddressLine', () => {
    const result = AddressSchema.safeParse({
      ...validUSAddress,
      primaryAddressLine: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing city', () => {
    const result = AddressSchema.safeParse({
      ...validUSAddress,
      city: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid US postal code format', () => {
    const result = AddressSchema.safeParse({
      ...validUSAddress,
      postalCode: 'ABCDE',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid US postal code with extension', () => {
    const result = AddressSchema.safeParse({
      ...validUSAddress,
      postalCode: '10001-1234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid state code', () => {
    const result = AddressSchema.safeParse({
      ...validUSAddress,
      state: 'XX',
    });
    expect(result.success).toBe(false);
  });

  it('rejects country code that is not exactly 2 characters', () => {
    const result = AddressSchema.safeParse({
      ...validUSAddress,
      country: 'USA',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid address types', () => {
    for (const addressType of [
      'LEGAL_ADDRESS',
      'MAILING_ADDRESS',
      'BUSINESS_ADDRESS',
      'RESIDENTIAL_ADDRESS',
    ]) {
      const result = AddressSchema.safeParse({
        ...validUSAddress,
        addressType,
      });
      expect(result.success).toBe(true);
    }
  });
});
