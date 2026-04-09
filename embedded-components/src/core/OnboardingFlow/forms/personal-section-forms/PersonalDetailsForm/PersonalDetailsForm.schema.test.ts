import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/OnboardingFlow/utils/formUtils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGetValidationMessage: () => (key: string) => `${key} is invalid`,
  };
});

import { usePersonalDetailsFormSchema } from './PersonalDetailsForm.schema';

describe('usePersonalDetailsFormSchema', () => {
  it('returns a valid schema', () => {
    const { result } = renderHook(() => usePersonalDetailsFormSchema());
    expect(result.current).toBeDefined();
  });

  it('validates valid personal details input', () => {
    const { result } = renderHook(() => usePersonalDetailsFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      countryOfResidence: 'US',
      controllerFirstName: 'John',
      controllerMiddleName: '',
      controllerLastName: 'Doe',
      controllerNameSuffix: 'Jr',
      controllerJobTitle: 'CEO',
      controllerJobTitleDescription: 'Chief Executive',
      natureOfOwnership: 'Direct',
    });
    expect(parseResult.success).toBe(true);
  });

  it('rejects empty country of residence', () => {
    const { result } = renderHook(() => usePersonalDetailsFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      countryOfResidence: '',
      controllerFirstName: 'John',
      controllerMiddleName: '',
      controllerLastName: 'Doe',
      controllerNameSuffix: 'Jr',
      controllerJobTitle: 'CEO',
      controllerJobTitleDescription: 'Manager',
      natureOfOwnership: 'Direct',
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects too-short first name', () => {
    const { result } = renderHook(() => usePersonalDetailsFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      countryOfResidence: 'US',
      controllerFirstName: 'J',
      controllerMiddleName: '',
      controllerLastName: 'Doe',
      controllerNameSuffix: '',
      controllerJobTitle: 'CEO',
      controllerJobTitleDescription: 'Manager',
      natureOfOwnership: 'Direct',
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects empty job title', () => {
    const { result } = renderHook(() => usePersonalDetailsFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      countryOfResidence: 'US',
      controllerFirstName: 'John',
      controllerMiddleName: '',
      controllerLastName: 'Doe',
      controllerNameSuffix: 'Jr',
      controllerJobTitle: '',
      controllerJobTitleDescription: 'Manager',
      natureOfOwnership: 'Direct',
    });
    expect(parseResult.success).toBe(false);
  });
});
