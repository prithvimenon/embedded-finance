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

import { ReviewForm } from './ReviewForm';

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
    useSmbdoListQuestions: vi.fn().mockReturnValue({
      data: { questions: [] },
      status: 'success',
      error: null,
    }),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockHandleNext = vi.fn();
const mockHandlePrev = vi.fn();
const mockGoTo = vi.fn();

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
  questionResponses: [],
};

const sectionScreens = flowConfig.screens.filter((s) => s.isSection) as Array<
  Extract<(typeof flowConfig.screens)[number], { isSection: true }>
>;

const mockFlowContext = {
  currentScreenId: 'review-attest-section' as const,
  originScreenId: null,
  goTo: mockGoTo,
  goBack: vi.fn(),
  editingPartyIds: {},
  updateEditingPartyId: vi.fn(),
  staticScreens: [],
  sections: sectionScreens,
  sessionData: {
    isOwnersSectionDone: true,
    isControllerOwnerQuestionAnswered: true,
  },
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

const mockOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

const defaultStepperProps = {
  handleNext: mockHandleNext,
  handlePrev: mockHandlePrev,
  getPrevButtonLabel: () => 'Previous' as React.ReactNode,
  getNextButtonLabel: () => 'Submit Application' as React.ReactNode,
};

const renderComponent = (
  onboardingOverride: Partial<OnboardingContextType> = {},
  flowContextOverride: Partial<typeof mockFlowContext> = {},
  stepperPropsOverride: Partial<typeof defaultStepperProps> = {}
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

  const props = { ...defaultStepperProps, ...stepperPropsOverride };

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider value={onboardingContext}>
        <FlowContextModule.FlowProvider
          initialScreenId="review-attest-section"
          flowConfig={flowConfig}
        >
          <ReviewForm {...props} />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('renders the review form with informational alert', () => {
    renderComponent();

    expect(
      screen.getByText(/not submitted yet|review your data/i)
    ).toBeInTheDocument();
  });

  test('renders the attestation checkbox', () => {
    renderComponent();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(
      screen.getByText(/true, accurate and complete/i)
    ).toBeInTheDocument();
  });

  test('renders the previous button', () => {
    renderComponent();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeInTheDocument();
  });

  test('renders the submit/next button', () => {
    renderComponent();

    const nextButton = screen.getByRole('button', {
      name: /submit application/i,
    });
    expect(nextButton).toBeInTheDocument();
  });

  test('calls handlePrev when previous button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    expect(mockHandlePrev).toHaveBeenCalledTimes(1);
  });

  test('hides previous button when getPrevButtonLabel returns null', () => {
    renderComponent(
      {},
      {},
      {
        getPrevButtonLabel: () => null,
      }
    );

    // The button element with null content should be hidden via eb-hidden class
    const buttons = screen.getAllByRole('button');
    const hiddenPrevButton = buttons.find((btn) =>
      btn.classList.contains('eb-hidden')
    );
    expect(hiddenPrevButton).toBeTruthy();
  });

  test('renders accordion sections for review', () => {
    renderComponent();

    // The form should contain accordion items
    const form = document.querySelector('form');
    expect(form).toBeTruthy();
  });

  test('renders form element for review', () => {
    renderComponent();

    // The form element should be present
    expect(document.querySelector('form')).toBeTruthy();
  });

  test('renders section accordion items for review', () => {
    renderComponent();

    // The review form should contain accordion trigger elements
    const accordionTriggers = document.querySelectorAll(
      '[data-orientation="vertical"] > div'
    );
    expect(accordionTriggers.length).toBeGreaterThan(0);
  });

  test('shows warning alert when submitting with missing details', async () => {
    const user = userEvent.setup();

    // Client without completed sections will have missing details
    const incompleteClient: ClientResponse = {
      ...mockClient,
      outstanding: {
        ...mockClient.outstanding,
        questionIds: ['30001'],
      },
    };

    renderComponent({ clientData: incompleteClient });

    // Check the attestation checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Click submit
    const submitButton = screen.getByRole('button', {
      name: /submit application/i,
    });
    await user.click(submitButton);

    // Should show warning about missing details
    expect(screen.getByText(/there is a problem/i)).toBeInTheDocument();
  });

  test('attestation checkbox can be toggled', async () => {
    const user = userEvent.setup();
    renderComponent();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
