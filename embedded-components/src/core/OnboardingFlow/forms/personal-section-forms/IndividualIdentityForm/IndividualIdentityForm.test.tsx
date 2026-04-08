import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import {
  refineIndividualIdentityFormSchema,
  useIndividualIdentityFormSchema,
} from './IndividualIdentityForm.schema';

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

describe('IndividualIdentityForm Schema', () => {
  let schema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => useIndividualIdentityFormSchema());
    schema = result.current;
  });

  const validSSNData = {
    birthDate: '1990-06-15',
    solePropSsn: '',
    controllerIds: [
      {
        idType: 'SSN',
        issuer: 'US',
        value: '123456788',
      },
    ],
  };

  const validPassportData = {
    birthDate: '1990-06-15',
    solePropSsn: '',
    controllerIds: [
      {
        idType: 'PASSPORT',
        issuer: 'GB',
        value: 'AB1234567',
        expiryDate: undefined,
      },
    ],
  };

  // Birth date validation
  test('accepts valid birth date', () => {
    const result = schema.safeParse(validSSNData);
    expect(result.success).toBe(true);
  });

  test('rejects empty birth date', () => {
    const result = schema.safeParse({
      ...validSSNData,
      birthDate: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid birth date format', () => {
    const result = schema.safeParse({
      ...validSSNData,
      birthDate: '06/15/1990',
    });
    expect(result.success).toBe(false);
  });

  test('rejects future birth date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    const result = schema.safeParse({
      ...validSSNData,
      birthDate: futureDateStr,
    });
    expect(result.success).toBe(false);
  });

  test('rejects birth date for person under 18', () => {
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 10);
    const recentDateStr = recentDate.toISOString().split('T')[0];
    const result = schema.safeParse({
      ...validSSNData,
      birthDate: recentDateStr,
    });
    expect(result.success).toBe(false);
  });

  test('rejects birth date for person over 120', () => {
    const result = schema.safeParse({
      ...validSSNData,
      birthDate: '1800-01-01',
    });
    expect(result.success).toBe(false);
  });

  // SSN validation
  test('accepts valid SSN (9 digits)', () => {
    const result = schema.safeParse(validSSNData);
    expect(result.success).toBe(true);
  });

  test('rejects SSN with wrong length', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '12345',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects SSN starting with 9', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '912345678',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects SSN starting with 666', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '666123456',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects known invalid SSN', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '078051120',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects SSN starting with 000', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '000123456',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  // ITIN validation
  test('accepts valid ITIN', () => {
    // ITIN starts with 9 and has valid middle digits (50-65, 70-88, 90-92, 94-99)
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'ITIN',
          issuer: 'US',
          value: '912501234',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('rejects ITIN not starting with 9', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'ITIN',
          issuer: 'US',
          value: '812501234',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects ITIN with invalid middle digits', () => {
    // Middle digits 10 is not in valid range (50-65, 70-88, 90-92, 94-99)
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'ITIN',
          issuer: 'US',
          value: '910101234',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  // Passport / non-US ID validation
  test('accepts valid passport data', () => {
    const result = schema.safeParse(validPassportData);
    expect(result.success).toBe(true);
  });

  test('rejects empty ID value', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty ID type', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: '',
          issuer: 'US',
          value: '123456788',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects ID value with spaces', () => {
    const result = schema.safeParse({
      ...validPassportData,
      controllerIds: [
        {
          idType: 'PASSPORT',
          issuer: 'GB',
          value: 'AB 1234567',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  // Duplicate ID types
  test('rejects duplicate ID types', () => {
    const result = schema.safeParse({
      ...validSSNData,
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456788',
        },
        {
          idType: 'SSN',
          issuer: 'US',
          value: '234567890',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('refineIndividualIdentityFormSchema', () => {
  let refinedSchema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => {
      const base = useIndividualIdentityFormSchema();
      return refineIndividualIdentityFormSchema(
        base as z.ZodObject<Record<string, z.ZodType>>
      );
    });
    refinedSchema = result.current;
  });

  test('requires solePropSsn when issuer is US', () => {
    const result = refinedSchema.safeParse({
      birthDate: '1990-06-15',
      solePropSsn: '',
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456788',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('validates solePropSsn format when issuer is US', () => {
    const result = refinedSchema.safeParse({
      birthDate: '1990-06-15',
      solePropSsn: '000123456',
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456788',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid solePropSsn when issuer is US', () => {
    const result = refinedSchema.safeParse({
      birthDate: '1990-06-15',
      solePropSsn: '123456788',
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456788',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('does not require solePropSsn when issuer is not US', () => {
    const result = refinedSchema.safeParse({
      birthDate: '1990-06-15',
      solePropSsn: '',
      controllerIds: [
        {
          idType: 'PASSPORT',
          issuer: 'GB',
          value: 'AB1234567',
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
