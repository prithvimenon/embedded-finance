import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
        {
          id: 'party-controller',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          active: true,
          individualDetails: {
            firstName: 'John',
            lastName: 'Doe',
            jobTitle: 'CFO',
          },
        },
      ],
      outstanding: { questionIds: [] },
      questionResponses: [],
    },
    onPostPartySettled: vi.fn(),
    organizationType: 'LIMITED_LIABILITY_COMPANY',
  }),
  useFlowContext: () => ({
    currentScreenId: 'owners-section',
    goTo: vi.fn(),
    goBack: vi.fn(),
    sessionData: {},
    updateSessionData: vi.fn(),
    sections: [
      {
        id: 'owners-section',
        type: 'component',
        sectionConfig: { label: 'Owners' },
      },
    ],
    staticScreens: [
      {
        id: 'owner-stepper',
        stepperConfig: {
          steps: [
            { id: 'personal-details', label: 'Personal Details' },
            { id: 'identity', label: 'Identity' },
          ],
        },
      },
    ],
    savedFormValues: {},
    setCurrentStepperStepIdFallback: vi.fn(),
    editingPartyIds: {},
    updateEditingPartyId: vi.fn(),
    originScreenId: undefined,
    previouslyCompleted: false,
    setIsFormSubmitting: vi.fn(),
    unsavedChangesRef: { current: false },
  }),
}));

vi.mock('@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync', () => ({
  useFlowUnsavedChangesSync: vi.fn(),
}));

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();
  return {
    ...actual,
    useFormState: () => ({ isDirty: false }),
  };
});

vi.mock('@/core/OnboardingFlow/utils/flowUtils', () => ({
  getStepperValidation: () => ({
    stepValidationMap: {},
    allStepsValid: true,
  }),
  getStepperValidations: () => ({}),
  getFlowProgress: () => ({
    sectionStatuses: {
      'owners-section': { status: 'complete' },
    },
  }),
}));

vi.mock('@/core/OnboardingFlow/utils/dataUtils', () => ({
  getAllOwners: () => [
    {
      id: 'party-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      individualDetails: { firstName: 'Jane', lastName: 'Smith' },
    },
  ],
  getActiveOwners: () => [
    {
      id: 'party-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      individualDetails: { firstName: 'Jane', lastName: 'Smith' },
    },
  ],
  getInactiveOwners: () => [],
  getPartyName: (party: any) =>
    `${party.individualDetails?.firstName} ${party.individualDetails?.lastName}`,
  getPartyByAssociatedPartyFilters: () => ({ id: 'party-1' }),
}));

vi.mock('@/api/generated/smbdo', () => ({
  useUpdatePartyLegacy: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
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
      if (k.includes('owners.title')) return 'Owners and key roles';
      if (k.includes('owners.addOwner')) return 'Add another owner';
      return k;
    },
    tString: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
  }),
  TransWithTokens: ({ children }: { children?: React.ReactNode }) => children ?? null,
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

import { OwnersSectionScreen } from './OwnersSectionScreen';

describe('OwnersSectionScreen', () => {
  const defaultProps = {
    handlePrev: vi.fn(),
    handleNext: vi.fn(),
    getPrevButtonLabel: () => 'Previous',
    getNextButtonLabel: () => 'Continue',
  };

  it('renders without crashing', () => {
    render(<OwnersSectionScreen {...defaultProps} />);
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<OwnersSectionScreen {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
