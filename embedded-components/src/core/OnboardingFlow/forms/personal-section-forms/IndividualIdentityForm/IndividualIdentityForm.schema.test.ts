import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/OnboardingFlow/utils/formUtils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGetValidationMessage: () => (key: string) => `${key} is invalid`,
  };
});

import { useIndividualIdentityFormSchema } from './IndividualIdentityForm.schema';

describe('useIndividualIdentityFormSchema', () => {
  it('returns a valid schema', () => {
    const { result } = renderHook(() => useIndividualIdentityFormSchema());
    expect(result.current).toBeDefined();
  });

  it('validates valid individual identity input', () => {
    const { result } = renderHook(() => useIndividualIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      birthDate: '1990-01-15',
      solePropSsn: '',
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456780',
        },
      ],
    });
    expect(parseResult.success).toBe(true);
  });

  it('rejects empty birth date', () => {
    const { result } = renderHook(() => useIndividualIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      birthDate: '',
      solePropSsn: '',
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456780',
        },
      ],
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects future birth date', () => {
    const { result } = renderHook(() => useIndividualIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      birthDate: '2090-01-15',
      solePropSsn: '',
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456780',
        },
      ],
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects invalid birth date format', () => {
    const { result } = renderHook(() => useIndividualIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      birthDate: '01/15/1990',
      solePropSsn: '',
      controllerIds: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '123456780',
        },
      ],
    });
    expect(parseResult.success).toBe(false);
  });

  it('rejects empty controllerIds idType', () => {
    const { result } = renderHook(() => useIndividualIdentityFormSchema());
    const schema = result.current;
    const parseResult = schema.safeParse({
      birthDate: '1990-01-15',
      solePropSsn: '',
      controllerIds: [
        {
          idType: '',
          issuer: 'US',
          value: '123456780',
        },
      ],
    });
    expect(parseResult.success).toBe(false);
  });
});
