import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { useIndustryFormSchema } from './IndustryForm.schema';

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

describe('IndustryForm Schema', () => {
  let schema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => useIndustryFormSchema());
    schema = result.current;
  });

  const validData = {
    organizationDescription:
      'We provide software development services for financial institutions.',
    industry: '541511',
  };

  test('accepts valid industry data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('requires business description', () => {
    const result = schema.safeParse({
      ...validData,
      organizationDescription: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects description shorter than 10 characters', () => {
    const result = schema.safeParse({
      ...validData,
      organizationDescription: 'Short',
    });
    expect(result.success).toBe(false);
  });

  test('rejects description exceeding 1000 characters', () => {
    const result = schema.safeParse({
      ...validData,
      organizationDescription: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  test('rejects description containing HTML tags', () => {
    const result = schema.safeParse({
      ...validData,
      organizationDescription:
        'We provide <script>alert("xss")</script> services for businesses.',
    });
    expect(result.success).toBe(false);
  });

  test('rejects description containing URLs', () => {
    const result = schema.safeParse({
      ...validData,
      organizationDescription:
        'We provide services. Visit https://example.com for more info.',
    });
    expect(result.success).toBe(false);
  });

  test('requires industry classification', () => {
    const result = schema.safeParse({
      ...validData,
      industry: '',
    });
    expect(result.success).toBe(false);
  });

  test('accepts any non-empty industry code', () => {
    const result = schema.safeParse({
      ...validData,
      industry: '722511',
    });
    expect(result.success).toBe(true);
  });
});
