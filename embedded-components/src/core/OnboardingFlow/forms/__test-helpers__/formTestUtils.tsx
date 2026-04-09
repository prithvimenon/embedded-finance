import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';

// ---- Query Client ----

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// ---- Mock Data ----

export const mockClient: ClientResponse = {
  id: 'client-1',
  status: 'NEW',
  parties: [
    {
      id: 'party-org',
      roles: ['CLIENT'],
      partyType: 'ORGANIZATION',
      active: true,
      organizationDetails: {
        organizationName: 'Test Business Inc.',
        organizationType: 'SOLE_PROPRIETORSHIP',
        countryOfFormation: 'US',
        yearOfFormation: '2020',
        jurisdiction: 'US',
      },
      status: 'ACTIVE',
      validationResponse: [],
    },
    {
      id: 'party-controller',
      roles: ['CONTROLLER'],
      partyType: 'INDIVIDUAL',
      active: true,
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'CEO',
        countryOfResidence: 'US',
      },
      status: 'ACTIVE',
      validationResponse: [],
    },
  ],
  partyId: 'party-org',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
};

// ---- Mock Flow Context ----

export const mockFlowContext = {
  currentScreenId: 'business-section' as const,
  originScreenId: 'overview' as const,
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
  setCurrentStepper: vi.fn(),
  currentStepperGoTo: vi.fn(),
  shortLabelOverride: null,
  savedFormValues: {},
  saveFormValue: vi.fn(),
  isFormSubmitting: false,
  setIsFormSubmitting: vi.fn(),
  unsavedChangesRef: { current: false },
  setFlowUnsavedChanges: vi.fn(),
};

// ---- Mock Onboarding Context ----

export const createMockOnboardingContext = (
  overrides: Partial<OnboardingContextType> = {}
): OnboardingContextType => ({
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'SOLE_PROPRIETORSHIP',
  availableJurisdictions: ['US'],
  availableProducts: ['EMBEDDED_PAYMENTS'],
  docUploadOnlyMode: false,
  ...overrides,
});

// ---- Client Factory ----

export const llcMockClient: ClientResponse = {
  ...mockClient,
  parties: mockClient.parties?.map((party) =>
    party?.partyType === 'ORGANIZATION'
      ? {
          ...party,
          organizationDetails: {
            ...party.organizationDetails,
            organizationType: 'LIMITED_LIABILITY_COMPANY' as const,
          },
        }
      : party
  ),
};

// ---- Provider Wrapper ----

/**
 * Sets up mocks and returns a wrapper with QueryClientProvider + OnboardingContext.
 * Each test file must call vi.mock for useFlowContext at the module level.
 */
export function setupFormTest(
  onboardingOverrides?: Partial<OnboardingContextType>,
  flowContextOverrides?: Partial<typeof mockFlowContext>
) {
  const queryClient = createTestQueryClient();
  const onboardingContext = createMockOnboardingContext(onboardingOverrides);

  (
    FlowContextModule.useFlowContext as ReturnType<typeof vi.fn>
  ).mockReturnValue({
    ...mockFlowContext,
    ...flowContextOverrides,
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <FlowContextModule.OnboardingContext.Provider value={onboardingContext}>
          {children}
        </FlowContextModule.OnboardingContext.Provider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient, onboardingContext };
}
