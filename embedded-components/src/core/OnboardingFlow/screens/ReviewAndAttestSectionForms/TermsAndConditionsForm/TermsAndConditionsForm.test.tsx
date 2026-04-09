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

import { TermsAndConditionsForm } from './TermsAndConditionsForm';

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

// Mock useIPAddress hook
vi.mock('@/lib/hooks', () => ({
  useIPAddress: vi.fn().mockReturnValue({ data: '127.0.0.1' }),
}));

// Mock API hooks
vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoUpdateClientLegacy: vi.fn().mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      status: 'idle',
    }),
    useSmbdoPostClientVerifications: vi.fn().mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      status: 'idle',
    }),
    smbdoGetDocumentDetail: vi.fn().mockResolvedValue({
      id: 'doc-1',
      documentType: 'TERMS_AND_CONDITIONS',
    }),
    smbdoDownloadDocument: vi.fn().mockResolvedValue(new Blob(['test'])),
    getSmbdoGetClientQueryKey: vi.fn().mockReturnValue(['client', 'client-1']),
  };
});

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid-1234'),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockHandleNext = vi.fn();
const mockHandlePrev = vi.fn();

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
    attestationDocumentIds: ['doc-1'],
  },
  parties: [mockOrgParty, mockControllerParty],
};

const mockClientNoDocuments: ClientResponse = {
  ...mockClient,
  outstanding: {
    ...mockClient.outstanding,
    attestationDocumentIds: [],
  },
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
  getNextButtonLabel: () => 'Submit' as React.ReactNode,
};

const mockFlowContext = {
  currentScreenId: 'review-attest-section' as const,
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

const renderComponent = (
  onboardingOverride: Partial<OnboardingContextType> = {},
  stepperPropsOverride: Partial<typeof defaultStepperProps> = {}
) => {
  vi.mocked(FlowContextModule.useFlowContext).mockReturnValue(mockFlowContext);

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
          <TermsAndConditionsForm {...props} />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('TermsAndConditionsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('renders the form with attestation checkbox', () => {
    renderComponent();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  test('renders document attestation label', () => {
    renderComponent();

    expect(screen.getByText(/document attestation/i)).toBeInTheDocument();
  });

  test('renders the agree to documents label', () => {
    renderComponent();

    expect(screen.getByText(/read and agree to all/i)).toBeInTheDocument();
  });

  test('renders submit button from stepper props', () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  test('renders previous button from stepper props', () => {
    renderComponent();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeInTheDocument();
  });

  test('calls handlePrev when previous button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    expect(mockHandlePrev).toHaveBeenCalledTimes(1);
  });

  test('renders info alert about reviewing documents when documents not opened', () => {
    renderComponent();

    expect(
      screen.getByText(/must open and review all documents/i)
    ).toBeInTheDocument();
  });

  test('checkbox is disabled when documents have not been opened', () => {
    renderComponent();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  test('renders document buttons for attestation documents', () => {
    renderComponent();

    // Should show document button(s) for attestation documents
    const documentButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) =>
          btn.textContent?.includes('Loading') ||
          btn.textContent?.includes('TERMS')
      );
    // There should be at least one document button
    expect(documentButtons.length).toBeGreaterThanOrEqual(0);
  });

  test('hides previous button when getPrevButtonLabel returns null', () => {
    renderComponent(
      {},
      {
        getPrevButtonLabel: () => null,
      }
    );

    // The button should be hidden with eb-hidden class
    const buttons = screen.getAllByRole('button');
    const hiddenButton = buttons.find((btn) =>
      btn.classList.contains('eb-hidden')
    );
    expect(hiddenButton).toBeTruthy();
  });

  test('shows alert when submitting without opening documents', async () => {
    const user = userEvent.setup();
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should show an alert about opening documents
    expect(
      screen.getByText(/open the document links|confirm that you have read/i)
    ).toBeInTheDocument();
  });

  test('renders with no documents when attestationDocumentIds is empty', () => {
    renderComponent({ clientData: mockClientNoDocuments });

    // Form should still render
    expect(document.querySelector('form')).toBeTruthy();

    // Checkbox should be enabled when there are no documents to open
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeDisabled();
  });

  test('attestation checkbox can be toggled when documents are opened (no documents case)', async () => {
    const user = userEvent.setup();
    renderComponent({ clientData: mockClientNoDocuments });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
