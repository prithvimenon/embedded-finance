import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OnboardingContext, useOnboardingContext } from './OnboardingContext';

describe('OnboardingContext', () => {
  it('throws when useOnboardingContext is used outside provider', () => {
    expect(() => {
      renderHook(() => useOnboardingContext());
    }).toThrow('useOnboardingContext must be used within a OnboardingContext');
  });

  it('returns context value when used inside provider', () => {
    const mockContextValue = {
      alertOnExit: false,
      alertOnPreviousStep: false,
      clientData: undefined,
      clientGetStatus: 'pending' as const,
      setClientId: () => {},
      organizationType: undefined,
    };

    const { result } = renderHook(() => useOnboardingContext(), {
      wrapper: ({ children }) => (
        <OnboardingContext.Provider value={mockContextValue as any}>
          {children}
        </OnboardingContext.Provider>
      ),
    });

    expect(result.current.clientGetStatus).toBe('pending');
    expect(result.current.clientData).toBeUndefined();
  });
});
