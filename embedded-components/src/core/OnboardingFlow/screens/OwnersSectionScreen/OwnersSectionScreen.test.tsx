import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config';
import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';

import { OwnersSectionScreen } from './OwnersSectionScreen';

// Mock the flow context hook
vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: vi.fn(),
    useOnboardingContext: vi.fn(),
  };
});

// Mock API hooks
vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useUpdatePartyLegacy: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      error: null,
      status: 'idle',
    }),
    getSmbdoGetClientQueryKey: vi.fn().mockReturnValue(['client', 'client-1']),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockGoTo = vi.fn();
const mockUpdateSessionData = vi.fn();

const mockControllerParty: PartyResponse = {
  id: 'party-controller',
  roles: ['CONTROLLER'],
  partyType: 'INDIVIDUAL',
  active: true,
  individualDetails: {
    firstName: 'Jane',
    lastName: 'Controller',
    jobTitle: 'CEO',
  },
  status: 'ACTIVE',
  validationResponse: [],
};

const mockOwner1: PartyResponse = {
  id: 'party-owner-1',
  roles: ['BENEFICIAL_OWNER'],
  partyType: 'INDIVIDUAL',
  active: true,
  individualDetails: {
    firstName: 'John',
    lastName: 'Owner',
    jobTitle: 'Director',
  },
  status: 'ACTIVE',
  validationResponse: [],
};

const mockOwner2: PartyResponse = {
  id: 'party-owner-2',
  roles: ['BENEFICIAL_OWNER'],
  partyType: 'INDIVIDUAL',
  active: true,
  individualDetails: {
    firstName: 'Alice',
    lastName: 'Smith',
    jobTitle: 'CFO',
  },
  status: 'ACTIVE',
  validationResponse: [],
};

const mockOrgParty: PartyResponse = {
  id: 'party-org',
  roles: ['CLIENT'],
  partyType: 'ORGANIZATION',
  active: true,
  organizationDetails: {
    organizationName: 'Test Corp',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
  },
  status: 'ACTIVE',
  validationResponse: [],
};

const mockClient: ClientResponse = {
  id: 'client-1',
  status: 'NEW',
  partyId: 'party-org',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  parties: [mockOrgParty, mockControllerParty],
};

const sectionScreens = flowConfig.screens.filter((s) => s.isSection) as Array<
  Extract<(typeof flowConfig.screens)[number], { isSection: true }>
>;

const staticScreens = flowConfig.screens.filter((s) => !s.isSection) as Array<
  Extract<(typeof flowConfig.screens)[number], { isSection: false }>
>;

const mockFlowContext = {
  currentScreenId: 'owners-section' as const,
  originScreenId: null as ReturnType<
    typeof FlowContextModule.useFlowContext
  >['originScreenId'],
  goTo: mockGoTo,
  goBack: vi.fn(),
  editingPartyIds: {},
  updateEditingPartyId: vi.fn(),
  staticScreens,
  sections: sectionScreens,
  sessionData: { isControllerOwnerQuestionAnswered: false },
  updateSessionData: mockUpdateSessionData,
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

const mockOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

const renderComponent = (
  onboardingOverride: Partial<OnboardingContextType> = {},
  flowContextOverride: Partial<typeof mockFlowContext> = {}
) => {
  vi.mocked(FlowContextModule.useFlowContext).mockReturnValue({
    ...mockFlowContext,
    ...flowContextOverride,
  });

  const onboardingContext: OnboardingContextType = {
    ...mockOnboardingContext,
    ...onboardingOverride,
  };

  vi.mocked(FlowContextModule.useOnboardingContext).mockReturnValue(
    onboardingContext
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider value={onboardingContext}>
        <FlowContextModule.FlowProvider
          initialScreenId="owners-section"
          flowConfig={flowConfig}
        >
          <OwnersSectionScreen />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('OwnersSectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('renders the owners section screen with add owner button', () => {
    renderComponent();

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();
  });

  test('renders controller-is-owner question as radio group', () => {
    renderComponent();

    // Should have a radio group for the controller question
    const radioGroup = document.querySelector('[role="radiogroup"]');
    expect(radioGroup).toBeTruthy();
  });

  test('renders empty state when no owners exist', () => {
    renderComponent();

    // With no beneficial owners, we should see the empty state card
    expect(screen.getByText(/no stakeholders/i)).toBeInTheDocument();
  });

  test('renders owner cards when owners exist', () => {
    const clientWithOwners: ClientResponse = {
      ...mockClient,
      parties: [mockOrgParty, mockControllerParty, mockOwner1, mockOwner2],
    };

    renderComponent({ clientData: clientWithOwners });

    expect(screen.getByText('John Owner')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  test('renders edit button for each owner', () => {
    const clientWithOwners: ClientResponse = {
      ...mockClient,
      parties: [mockOrgParty, mockControllerParty, mockOwner1],
    };

    renderComponent({ clientData: clientWithOwners });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
  });

  test('renders remove button for non-controller owners', () => {
    const clientWithOwners: ClientResponse = {
      ...mockClient,
      parties: [mockOrgParty, mockControllerParty, mockOwner1],
    };

    renderComponent({ clientData: clientWithOwners });

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  test('does not render remove button for controller who is also owner', () => {
    const controllerOwner: PartyResponse = {
      ...mockControllerParty,
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
    };

    const clientWithControllerOwner: ClientResponse = {
      ...mockClient,
      parties: [mockOrgParty, controllerOwner],
    };

    renderComponent({ clientData: clientWithControllerOwner });

    // Controller+owner should not have a remove button
    const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(0);
  });

  test('renders overview navigation button', () => {
    renderComponent();

    const overviewButton = screen.getByRole('button', { name: /overview/i });
    expect(overviewButton).toBeInTheDocument();
  });

  test('navigates to overview when overview button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const overviewButton = screen.getByRole('button', { name: /overview/i });
    await user.click(overviewButton);

    expect(mockGoTo).toHaveBeenCalledWith('overview');
  });

  test('renders save and continue button in normal mode', () => {
    renderComponent();

    const saveButton = screen.getByRole('button', {
      name: /save and continue/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  test('renders save and return button in review mode', () => {
    renderComponent({}, { originScreenId: 'review-attest-section' });

    const saveButton = screen.getByRole('button', {
      name: /save and return/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  test('renders owner badge for beneficial owners', () => {
    const clientWithOwners: ClientResponse = {
      ...mockClient,
      parties: [mockOrgParty, mockControllerParty, mockOwner1],
    };

    renderComponent({ clientData: clientWithOwners });

    // Should display an "Owner" badge
    const ownerBadges = screen.getAllByText(/owner/i);
    expect(ownerBadges.length).toBeGreaterThan(0);
  });

  test('renders controller badge for parties with CONTROLLER role', () => {
    const controllerOwner: PartyResponse = {
      ...mockControllerParty,
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
    };

    const clientWithControllerOwner: ClientResponse = {
      ...mockClient,
      parties: [mockOrgParty, controllerOwner],
    };

    renderComponent({ clientData: clientWithControllerOwner });

    // Should display a "Controller" badge
    const controllerBadges = screen.getAllByText(/controller/i);
    expect(controllerBadges.length).toBeGreaterThan(0);
  });
});
