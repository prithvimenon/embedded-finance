import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReviewForm } from './ReviewForm';

vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: {
      id: 'client-1',
      parties: [
        {
          id: 'party-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            firstName: 'Jane',
            lastName: 'Smith',
            jobTitle: 'CEO',
          },
        },
      ],
      outstanding: { questionIds: [] },
      questionResponses: [],
    },
  }),
  useFlowContext: () => ({
    sections: [
      {
        id: 'personal-section',
        type: 'stepper',
        sectionConfig: { label: 'Personal Details' },
        stepperConfig: {
          steps: [],
          associatedPartyFilters: {
            partyType: 'INDIVIDUAL',
            roles: ['CONTROLLER'],
          },
        },
      },
    ],
    goTo: vi.fn(),
    sessionData: {},
    reviewScreenOpenedSectionId: undefined,
    currentScreenId: 'review-attest-section',
    savedFormValues: {},
  }),
}));

vi.mock('@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync', () => ({
  useFlowUnsavedChangesSync: vi.fn(),
}));

vi.mock('@/core/OnboardingFlow/utils/flowUtils', () => ({
  getFlowProgress: () => ({
    sectionStatuses: {
      'personal-section': 'completed',
      'business-section': 'completed',
      'owners-section': 'completed',
      'additional-questions-section': 'completed',
    },
  }),
  getStepperValidations: () => ({}),
}));

vi.mock('@/core/OnboardingFlow/utils/dataUtils', () => ({
  formatQuestionResponse: (response: any) => response?.values?.join(', '),
  getPartyName: (party: any) =>
    `${party.individualDetails?.firstName} ${party.individualDetails?.lastName}`,
}));

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoListQuestions: () => ({
    data: { questions: [] },
  }),
}));

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[], opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      const k = Array.isArray(key) ? key[0] : key;
      if (k.includes('reviewAndAttest.notSubmittedYet'))
        return 'Your application is not submitted yet.';
      if (k.includes('reviewAndAttest.dataAccuracyAttestation'))
        return 'Data accuracy attestation';
      if (k.includes('reviewAndAttest.dataAccuracyCheckbox'))
        return 'The data I am providing is true, accurate and complete.';
      return k;
    },
    tString: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
  }),
}));

describe('ReviewForm', () => {
  const defaultProps = {
    handlePrev: vi.fn(),
    handleNext: vi.fn(),
    getPrevButtonLabel: () => 'Previous',
    getNextButtonLabel: () => 'Submit',
  };

  it('renders without crashing', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it('renders the attestation info alert', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(
      screen.getByText(/Your application is not submitted yet/i)
    ).toBeInTheDocument();
  });

  it('renders the attestation checkbox', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getByText(/Data accuracy attestation/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /The data I am providing is true, accurate and complete/i
      )
    ).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /Previous/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
  });
});
