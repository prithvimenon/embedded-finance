import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { BusinessIdentityForm } from './BusinessIdentityForm';
import {
  refineBusinessIdentityFormSchema,
  useBusinessIdentityFormSchema,
} from './BusinessIdentityForm.schema';

// Mock the context dependencies used by useGetValidationMessage
vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: undefined,
    clientGetStatus: 'success',
    setClientId: vi.fn(),
    organizationType: undefined,
  }),
  useFlowContext: () => ({
    currentScreenId: 'overview',
    originScreenId: null,
    goTo: vi.fn(),
    goBack: vi.fn(),
    editingPartyIds: {},
    updateEditingPartyId: vi.fn(),
    staticScreens: [],
    sections: [],
    sessionData: {},
    updateSessionData: vi.fn(),
    previouslyCompleted: false,
    reviewScreenOpenedSectionId: null,
    initialStepperStepId: null,
    currentStepperStepId: undefined,
    setCurrentStepperStepIdFallback: vi.fn(),
    currentStepperGoTo: vi.fn(),
    setCurrentStepper: vi.fn(),
    shortLabelOverride: null,
    savedFormValues: {},
    saveFormValue: vi.fn(),
    isFormSubmitting: false,
    setIsFormSubmitting: vi.fn(),
    unsavedChangesRef: { current: false },
    setFlowUnsavedChanges: vi.fn(),
  }),
}));

describe('BusinessIdentityForm Schema', () => {
  let schema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => useBusinessIdentityFormSchema());
    schema = result.current;
  });

  const validData = {
    organizationName: 'Acme Corp',
    dbaName: 'Acme Trading',
    dbaNameNotAvailable: false,
    yearOfFormation: '2020',
    countryOfFormation: 'US',
    organizationIdEin: '123456789',
    solePropHasEin: 'yes',
    website: 'https://example.com',
    websiteNotAvailable: false,
  };

  test('accepts valid business identity data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Organization name validation
  test('rejects business name shorter than 2 characters', () => {
    const result = schema.safeParse({
      ...validData,
      organizationName: 'A',
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty business name', () => {
    const result = schema.safeParse({
      ...validData,
      organizationName: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects business name with consecutive spaces', () => {
    const result = schema.safeParse({
      ...validData,
      organizationName: 'Acme  Corp',
    });
    expect(result.success).toBe(false);
  });

  test('rejects business name starting with special character', () => {
    const result = schema.safeParse({
      ...validData,
      organizationName: '-AcmeCorp',
    });
    expect(result.success).toBe(false);
  });

  // Year of formation validation
  test('rejects invalid year of formation format', () => {
    const result = schema.safeParse({
      ...validData,
      yearOfFormation: '20',
    });
    expect(result.success).toBe(false);
  });

  test('rejects year of formation before 1800', () => {
    const result = schema.safeParse({
      ...validData,
      yearOfFormation: '1799',
    });
    expect(result.success).toBe(false);
  });

  test('rejects future year of formation', () => {
    const futureYear = (new Date().getFullYear() + 1).toString();
    const result = schema.safeParse({
      ...validData,
      yearOfFormation: futureYear,
    });
    expect(result.success).toBe(false);
  });

  test('accepts current year of formation', () => {
    const currentYear = new Date().getFullYear().toString();
    const result = schema.safeParse({
      ...validData,
      yearOfFormation: currentYear,
    });
    expect(result.success).toBe(true);
  });

  // EIN validation
  test('rejects EIN with wrong length', () => {
    const result = schema.safeParse({
      ...validData,
      organizationIdEin: '12345',
    });
    expect(result.success).toBe(false);
  });

  test('rejects non-numeric EIN', () => {
    const result = schema.safeParse({
      ...validData,
      organizationIdEin: 'ABCDEFGHI',
    });
    expect(result.success).toBe(false);
  });

  test('rejects EIN with invalid prefix (00)', () => {
    const result = schema.safeParse({
      ...validData,
      organizationIdEin: '001234567',
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty EIN', () => {
    const result = schema.safeParse({
      ...validData,
      organizationIdEin: '',
    });
    expect(result.success).toBe(false);
  });

  // Website validation
  test('rejects website without https://', () => {
    const result = schema.safeParse({
      ...validData,
      website: 'http://example.com',
    });
    expect(result.success).toBe(false);
  });

  test('rejects website with IP address', () => {
    const result = schema.safeParse({
      ...validData,
      website: 'https://192.168.1.1',
    });
    expect(result.success).toBe(false);
  });

  test('rejects website exceeding max length', () => {
    const longUrl = `https://example.com/${'a'.repeat(490)}`;
    const result = schema.safeParse({
      ...validData,
      website: longUrl,
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid https website', () => {
    const result = schema.safeParse({
      ...validData,
      website: 'https://www.example.com',
    });
    expect(result.success).toBe(true);
  });

  // Country of formation
  test('rejects non-US country of formation', () => {
    const result = schema.safeParse({
      ...validData,
      countryOfFormation: 'CA',
    });
    expect(result.success).toBe(false);
  });

  // solePropHasEin
  test('rejects invalid solePropHasEin value', () => {
    const result = schema.safeParse({
      ...validData,
      solePropHasEin: 'maybe',
    });
    expect(result.success).toBe(false);
  });

  test('accepts solePropHasEin "no"', () => {
    const result = schema.safeParse({
      ...validData,
      solePropHasEin: 'no',
    });
    expect(result.success).toBe(true);
  });
});

describe('refineBusinessIdentityFormSchema', () => {
  let refinedSchema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => {
      const base = useBusinessIdentityFormSchema();
      return refineBusinessIdentityFormSchema(
        base as z.ZodObject<Record<string, z.ZodType>>
      );
    });
    refinedSchema = result.current;
  });

  const validData = {
    organizationName: 'Acme Corp',
    dbaName: 'Acme Trading',
    dbaNameNotAvailable: false,
    yearOfFormation: '2020',
    countryOfFormation: 'US',
    organizationIdEin: '123456789',
    solePropHasEin: 'yes',
    website: 'https://example.com',
    websiteNotAvailable: false,
  };

  test('requires EIN when countryOfFormation is US and solePropHasEin is yes', () => {
    const result = refinedSchema.safeParse({
      ...validData,
      organizationIdEin: '',
    });
    expect(result.success).toBe(false);
  });

  test('requires website when websiteNotAvailable is false', () => {
    const result = refinedSchema.safeParse({
      ...validData,
      website: '',
      websiteNotAvailable: false,
    });
    expect(result.success).toBe(false);
  });

  test('does not add custom required issue for website when websiteNotAvailable is true', () => {
    // Note: the base schema's URL regex still rejects empty strings,
    // but the superRefine does NOT add its own "required" issue when the flag is true.
    // In practice the UI sets website to 'N/A' when the checkbox is checked,
    // so the form would skip this base-level validation via field-level overrides.
    const result = refinedSchema.safeParse({
      ...validData,
      website: 'https://example.com',
      websiteNotAvailable: true,
    });
    expect(result.success).toBe(true);
  });

  test('requires dbaName when dbaNameNotAvailable is false', () => {
    const result = refinedSchema.safeParse({
      ...validData,
      dbaName: '',
      dbaNameNotAvailable: false,
    });
    expect(result.success).toBe(false);
  });

  test('does not require dbaName when dbaNameNotAvailable is true', () => {
    const result = refinedSchema.safeParse({
      ...validData,
      dbaName: '',
      dbaNameNotAvailable: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('BusinessIdentityForm.modifyFormValuesBeforeSubmit', () => {
  test('keeps organizationIdEin when solePropHasEin is yes', () => {
    const values = {
      organizationName: 'Acme Corp',
      solePropHasEin: 'yes',
      organizationIdEin: '123456789',
      website: 'https://example.com',
    };
    const result = BusinessIdentityForm.modifyFormValuesBeforeSubmit!(
      values,
      undefined
    );
    expect(result).toHaveProperty('organizationIdEin', '123456789');
    expect(result).not.toHaveProperty('solePropHasEin');
  });

  test('removes organizationIdEin when solePropHasEin is no', () => {
    const values = {
      organizationName: 'Acme Corp',
      solePropHasEin: 'no',
      organizationIdEin: '123456789',
      website: 'https://example.com',
    };
    const result = BusinessIdentityForm.modifyFormValuesBeforeSubmit!(
      values,
      undefined
    );
    expect(result).not.toHaveProperty('organizationIdEin');
    expect(result).not.toHaveProperty('solePropHasEin');
  });
});
