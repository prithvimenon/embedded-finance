import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { useBusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

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

describe('BusinessContactInfoForm Schema', () => {
  let schema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => useBusinessContactInfoFormSchema());
    schema = result.current;
  });

  const validData = {
    organizationEmail: 'business@example.com',
    organizationPhone: {
      phoneType: 'BUSINESS_PHONE' as const,
      phoneNumber: '+12025551234',
    },
    organizationAddress: {
      addressType: 'BUSINESS_ADDRESS' as const,
      primaryAddressLine: '123 Main St',
      secondaryAddressLine: '',
      tertiaryAddressLine: '',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
  };

  test('accepts valid complete data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty organizationEmail', () => {
    const result = schema.safeParse({
      ...validData,
      organizationEmail: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid email format', () => {
    const result = schema.safeParse({
      ...validData,
      organizationEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  test('rejects email exceeding max length', () => {
    const longEmail = `${'a'.repeat(95)}@b.com`;
    const result = schema.safeParse({
      ...validData,
      organizationEmail: longEmail,
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid phone number', () => {
    const result = schema.safeParse({
      ...validData,
      organizationPhone: {
        phoneType: 'BUSINESS_PHONE',
        phoneNumber: '12345',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing address country', () => {
    const result = schema.safeParse({
      ...validData,
      organizationAddress: {
        ...validData.organizationAddress,
        country: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing primary address line', () => {
    const result = schema.safeParse({
      ...validData,
      organizationAddress: {
        ...validData.organizationAddress,
        primaryAddressLine: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing city', () => {
    const result = schema.safeParse({
      ...validData,
      organizationAddress: {
        ...validData.organizationAddress,
        city: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing state', () => {
    const result = schema.safeParse({
      ...validData,
      organizationAddress: {
        ...validData.organizationAddress,
        state: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing postalCode', () => {
    const result = schema.safeParse({
      ...validData,
      organizationAddress: {
        ...validData.organizationAddress,
        postalCode: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('validates US postal code format', () => {
    const result = schema.safeParse({
      ...validData,
      organizationAddress: {
        ...validData.organizationAddress,
        postalCode: 'ABCDE',
      },
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid US ZIP+4 postal code', () => {
    const result = schema.safeParse({
      ...validData,
      organizationAddress: {
        ...validData.organizationAddress,
        postalCode: '10001-1234',
      },
    });
    expect(result.success).toBe(true);
  });
});
