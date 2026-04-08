import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { useContactDetailsFormSchema } from './ContactDetailsForm.schema';

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

describe('ContactDetailsForm Schema', () => {
  let schema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => useContactDetailsFormSchema());
    schema = result.current;
  });

  const validData = {
    controllerEmail: 'john.doe@example.com',
    controllerPhone: {
      phoneType: 'MOBILE_PHONE' as const,
      phoneNumber: '+12025551234',
    },
    individualAddress: {
      addressType: 'RESIDENTIAL_ADDRESS' as const,
      primaryAddressLine: '456 Oak Ave',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
    },
  };

  test('accepts valid contact details', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Email validation
  test('rejects empty email', () => {
    const result = schema.safeParse({
      ...validData,
      controllerEmail: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid email format', () => {
    const result = schema.safeParse({
      ...validData,
      controllerEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  test('rejects email exceeding max length', () => {
    const longEmail = `${'a'.repeat(95)}@b.com`;
    const result = schema.safeParse({
      ...validData,
      controllerEmail: longEmail,
    });
    expect(result.success).toBe(false);
  });

  // Phone validation
  test('rejects invalid phone number', () => {
    const result = schema.safeParse({
      ...validData,
      controllerPhone: {
        phoneType: 'MOBILE_PHONE',
        phoneNumber: '12345',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty phone number', () => {
    const result = schema.safeParse({
      ...validData,
      controllerPhone: {
        phoneType: 'MOBILE_PHONE',
        phoneNumber: '',
      },
    });
    expect(result.success).toBe(false);
  });

  // Address validation
  test('rejects missing address country', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        country: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing primary address line', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        primaryAddressLine: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing city', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        city: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing state', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        state: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing postalCode', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        postalCode: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid US postal code format', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        postalCode: 'ABCDE',
      },
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid US ZIP+4 postal code', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        postalCode: '90001-1234',
      },
    });
    expect(result.success).toBe(true);
  });

  test('rejects primary address line exceeding max length', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        primaryAddressLine: 'A'.repeat(61),
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects city exceeding max length', () => {
    const result = schema.safeParse({
      ...validData,
      individualAddress: {
        ...validData.individualAddress,
        city: 'A'.repeat(35),
      },
    });
    expect(result.success).toBe(false);
  });
});
