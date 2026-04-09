import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: {
      id: 'client-1',
      parties: [
        {
          id: 'org-1',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
        },
      ],
      outstanding: { questionIds: ['q1'] },
      questionResponses: [],
    },
    onPostClientSettled: vi.fn(),
  }),
  useFlowContext: () => ({
    currentScreenId: 'additional-questions-section',
    goTo: vi.fn(),
    goBack: vi.fn(),
    sessionData: {},
    updateSessionData: vi.fn(),
    sections: [],
    savedFormValues: {},
    setCurrentStepperStepIdFallback: vi.fn(),
    setIsFormSubmitting: vi.fn(),
    unsavedChangesRef: { current: false },
  }),
}));

vi.mock('@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync', () => ({
  useFlowUnsavedChangesSync: vi.fn(),
}));

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoListQuestions: () => ({
    data: {
      questions: [
        {
          id: 'q1',
          description: 'What is your annual revenue?',
          questionType: 'FREEFORM',
          responseSchema: { inputType: 'STRING' },
        },
      ],
    },
    isLoading: false,
  }),
  useSmbdoUpdateClientLegacy: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  getSmbdoGetClientQueryKey: () => ['client'],
}));

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[], opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      const k = Array.isArray(key) ? key[0] : key;
      if (k.includes('operationalDetails.title')) return 'Operational details';
      return k;
    },
    tString: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock('@/components/ServerErrorAlert', () => ({
  ServerErrorAlert: () => null,
}));

import { OperationalDetailsForm } from './OperationalDetailsForm';

describe('OperationalDetailsForm', () => {
  const defaultProps = {
    handlePrev: vi.fn(),
    handleNext: vi.fn(),
    getPrevButtonLabel: () => 'Previous',
    getNextButtonLabel: () => 'Continue',
  };

  it('renders without crashing', () => {
    render(<OperationalDetailsForm {...defaultProps} />);
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders the form element', () => {
    render(<OperationalDetailsForm {...defaultProps} />);
    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<OperationalDetailsForm {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
