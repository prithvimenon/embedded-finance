import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { PersonalDetailsForm } from './PersonalDetailsForm';
import {
  refinePersonalDetailsFormSchema,
  usePersonalDetailsFormSchema,
} from './PersonalDetailsForm.schema';

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

describe('PersonalDetailsForm Schema', () => {
  let schema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => usePersonalDetailsFormSchema());
    schema = result.current;
  });

  const validData = {
    countryOfResidence: 'US',
    controllerFirstName: 'John',
    controllerMiddleName: '',
    controllerLastName: 'Doe',
    controllerNameSuffix: 'Jr',
    controllerJobTitle: 'CEO' as const,
    controllerJobTitleDescription: 'Chief Executive',
    natureOfOwnership: 'Direct' as const,
  };

  test('accepts valid personal details data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // First name validation
  test('requires first name', () => {
    const result = schema.safeParse({
      ...validData,
      controllerFirstName: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects first name shorter than 2 characters', () => {
    const result = schema.safeParse({
      ...validData,
      controllerFirstName: 'J',
    });
    expect(result.success).toBe(false);
  });

  test('rejects first name exceeding 30 characters', () => {
    const result = schema.safeParse({
      ...validData,
      controllerFirstName: 'A'.repeat(31),
    });
    expect(result.success).toBe(false);
  });

  test('rejects first name with consecutive spaces', () => {
    const result = schema.safeParse({
      ...validData,
      controllerFirstName: 'Jo  hn',
    });
    expect(result.success).toBe(false);
  });

  test('rejects first name with consecutive hyphens', () => {
    const result = schema.safeParse({
      ...validData,
      controllerFirstName: 'Jo--hn',
    });
    expect(result.success).toBe(false);
  });

  // Last name validation
  test('rejects last name shorter than 2 characters', () => {
    const result = schema.safeParse({
      ...validData,
      controllerLastName: 'D',
    });
    expect(result.success).toBe(false);
  });

  test('rejects last name exceeding 30 characters', () => {
    const result = schema.safeParse({
      ...validData,
      controllerLastName: 'A'.repeat(31),
    });
    expect(result.success).toBe(false);
  });

  // Country of residence
  test('requires country of residence', () => {
    const result = schema.safeParse({
      ...validData,
      countryOfResidence: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects country code not exactly 2 characters', () => {
    const result = schema.safeParse({
      ...validData,
      countryOfResidence: 'USA',
    });
    expect(result.success).toBe(false);
  });

  // Job title validation
  test('validates job title is from allowed list', () => {
    for (const title of [
      'CEO',
      'CFO',
      'COO',
      'President',
      'Chairman',
      'Senior Branch Manager',
      'Other',
    ] as const) {
      const result = schema.safeParse({
        ...validData,
        controllerJobTitle: title,
      });
      expect(result.success).toBe(true);
    }
  });

  test('rejects empty job title', () => {
    const result = schema.safeParse({
      ...validData,
      controllerJobTitle: '',
    });
    expect(result.success).toBe(false);
  });

  // Nature of ownership
  test('validates nature of ownership Direct', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    expect(validData.natureOfOwnership).toBe('Direct');
  });

  test('validates nature of ownership Indirect', () => {
    const result = schema.safeParse({
      ...validData,
      natureOfOwnership: 'Indirect' as const,
    });
    expect(result.success).toBe(true);
  });

  test('rejects empty nature of ownership', () => {
    const result = schema.safeParse({
      ...validData,
      natureOfOwnership: '',
    });
    expect(result.success).toBe(false);
  });

  // Name suffix validation
  test('accepts valid name suffix', () => {
    // 'III' matches SUFFIX_PATTERN /^[A-Za-z.IVX]*$/
    const result = schema.safeParse({
      ...validData,
      controllerNameSuffix: 'III',
    });
    expect(result.success).toBe(true);
  });

  test('rejects name suffix exceeding 5 characters', () => {
    const result = schema.safeParse({
      ...validData,
      controllerNameSuffix: 'ABCDEF',
    });
    expect(result.success).toBe(false);
  });
});

describe('refinePersonalDetailsFormSchema', () => {
  let refinedSchema: z.ZodType;

  beforeEach(() => {
    const { result } = renderHook(() => {
      const base = usePersonalDetailsFormSchema();
      return refinePersonalDetailsFormSchema(
        base as z.ZodObject<Record<string, z.ZodType>>
      );
    });
    refinedSchema = result.current;
  });

  const validData = {
    countryOfResidence: 'US',
    controllerFirstName: 'John',
    controllerMiddleName: '',
    controllerLastName: 'Doe',
    controllerNameSuffix: 'Jr',
    controllerJobTitle: 'CEO' as const,
    controllerJobTitleDescription: 'Chief Executive',
    natureOfOwnership: 'Direct' as const,
  };

  test('requires jobTitleDescription when jobTitle is Other', () => {
    const result = refinedSchema.safeParse({
      ...validData,
      controllerJobTitle: 'Other',
      controllerJobTitleDescription: '',
    });
    expect(result.success).toBe(false);
  });

  test('does not require jobTitleDescription when jobTitle is not Other', () => {
    const result = refinedSchema.safeParse({
      ...validData,
      controllerJobTitle: 'CEO',
      controllerJobTitleDescription: 'Chief Executive',
    });
    expect(result.success).toBe(true);
  });

  test('accepts Other with valid description', () => {
    const result = refinedSchema.safeParse({
      ...validData,
      controllerJobTitle: 'Other',
      controllerJobTitleDescription: 'VP of Engineering',
    });
    expect(result.success).toBe(true);
  });
});

describe('PersonalDetailsForm.modifyFormValuesBeforeSubmit', () => {
  test('keeps jobTitleDescription when jobTitle is Other', () => {
    const values = {
      controllerJobTitle: 'Other' as const,
      controllerJobTitleDescription: 'VP of Engineering',
      controllerFirstName: 'John',
      controllerLastName: 'Doe',
    };
    const result = PersonalDetailsForm.modifyFormValuesBeforeSubmit!(
      values,
      undefined
    );
    expect(result.controllerJobTitleDescription).toBe('VP of Engineering');
  });

  test('removes jobTitleDescription when jobTitle is not Other', () => {
    const values = {
      controllerJobTitle: 'CEO' as const,
      controllerJobTitleDescription: 'Some description',
      controllerFirstName: 'John',
      controllerLastName: 'Doe',
    };
    const result = PersonalDetailsForm.modifyFormValuesBeforeSubmit!(
      values,
      undefined
    );
    expect(result.controllerJobTitleDescription).toBeUndefined();
  });
});

describe('PersonalDetailsForm.updateAnotherPartyOnSubmit.getValues', () => {
  test('concatenates name parts correctly', () => {
    const values = {
      controllerFirstName: 'John',
      controllerMiddleName: 'Michael',
      controllerLastName: 'Doe',
      controllerNameSuffix: 'Jr',
    };
    const result =
      PersonalDetailsForm.updateAnotherPartyOnSubmit!.getValues(values);
    expect(result).toEqual({
      organizationName: 'John Michael Doe Jr',
    });
  });

  test('omits empty middle name and suffix', () => {
    const values = {
      controllerFirstName: 'Jane',
      controllerMiddleName: '',
      controllerLastName: 'Smith',
      controllerNameSuffix: '',
    };
    const result =
      PersonalDetailsForm.updateAnotherPartyOnSubmit!.getValues(values);
    expect(result).toEqual({
      organizationName: 'Jane Smith',
    });
  });

  test('omits undefined name parts', () => {
    const values = {
      controllerFirstName: 'Alice',
      controllerLastName: 'Johnson',
    };
    const result =
      PersonalDetailsForm.updateAnotherPartyOnSubmit!.getValues(values);
    expect(result).toEqual({
      organizationName: 'Alice Johnson',
    });
  });
});
