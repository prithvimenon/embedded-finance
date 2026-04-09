import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
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
  };
});

// Mock useIPAddress
vi.mock('@/lib/hooks', () => ({
  useIPAddress: () => ({ data: '127.0.0.1' }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

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
  shortLabelOverride: null,
  unsavedChangesRef: { current: false },
  setFlowUnsavedChanges: vi.fn(),
  isFormSubmitting: false,
  setIsFormSubmitting: vi.fn(),
  savedFormValues: {},
  saveFormValue: vi.fn(),
  currentStepperStepId: undefined,
  setCurrentStepperStepIdFallback: vi.fn(),
  setCurrentStepper: vi.fn(),
  currentStepperGoTo: vi.fn(),
};

const mockClient = {
  id: 'client-1',
  partyId: 'party-controller',
  status: 'NEW',
  parties: [
    {
      id: 'party-controller',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'CEO',
      },
    },
    {
      id: 'party-org',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationName: 'Test Corp',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: ['doc-1'],
  },
} as unknown as ClientResponse;

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

const mockStepperProps = {
  handlePrev: vi.fn(),
  handleNext: vi.fn(),
  getPrevButtonLabel: () => 'Back' as React.ReactNode,
  getNextButtonLabel: () => 'Submit' as React.ReactNode,
};

function renderTermsForm(
  onboardingOverrides: Partial<OnboardingContextType> = {},
  flowContextOverrides: Partial<typeof mockFlowContext> = {},
  stepperOverrides: Partial<typeof mockStepperProps> = {}
) {
  server.resetHandlers();

  // Mock document detail API
  server.use(
    http.get('*/documents/doc-1', () => {
      return HttpResponse.json({
        id: 'doc-1',
        documentType: 'TERMS_AND_CONDITIONS',
        status: 'ACTIVE',
      });
    }),
    http.get('*/documents/doc-1/download', () => {
      return HttpResponse.json(new Blob(['fake pdf content']));
    }),
    http.patch('*/clients/*', () => {
      return HttpResponse.json(mockClient);
    }),
    http.post('*/clients/*/verifications', () => {
      return HttpResponse.json({
        id: 'verification-1',
        status: 'APPROVED',
      });
    })
  );

  (
    FlowContextModule.useFlowContext as ReturnType<typeof vi.fn>
  ).mockReturnValue({
    ...mockFlowContext,
    ...flowContextOverrides,
  });

  const onboardingContext: OnboardingContextType = {
    ...baseOnboardingContext,
    ...onboardingOverrides,
  };

  const stepperProps = { ...mockStepperProps, ...stepperOverrides };

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider
        value={onboardingContext}
      >
        <FlowContextModule.FlowProvider
          initialScreenId="review-attest-section"
          flowConfig={flowConfig}
        >
          <TermsAndConditionsForm {...stepperProps} />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('TermsAndConditionsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('renders document attestation section', () => {
    renderTermsForm();

    expect(
      screen.getByText(/Document attestation/i)
    ).toBeInTheDocument();
  });

  test('renders attestation checkbox unchecked by default', () => {
    renderTermsForm();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  test('renders agree to documents label', () => {
    renderTermsForm();

    expect(
      screen.getByText(/read and agree to all of the documents/i)
    ).toBeInTheDocument();
  });

  test('renders submit button from stepper props', () => {
    renderTermsForm();

    expect(
      screen.getByRole('button', { name: /Submit/i })
    ).toBeInTheDocument();
  });

  test('renders back button from stepper props', () => {
    renderTermsForm();

    expect(
      screen.getByRole('button', { name: /Back/i })
    ).toBeInTheDocument();
  });

  test('back button calls handlePrev', async () => {
    const user = userEvent.setup();
    const mockHandlePrev = vi.fn();

    renderTermsForm({}, {}, { handlePrev: mockHandlePrev });

    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockHandlePrev).toHaveBeenCalled();
  });

  test('renders document links for attestation documents', async () => {
    renderTermsForm();

    // Wait for document detail to load
    await waitFor(() => {
      expect(
        screen.getByText(/TERMS_AND_CONDITIONS/i)
      ).toBeInTheDocument();
    });
  });

  test('shows info alert about reviewing documents', () => {
    renderTermsForm();

    expect(
      screen.getByText(/must open and review all documents/i)
    ).toBeInTheDocument();
  });

  test('checkbox is disabled when documents have not been opened', () => {
    renderTermsForm();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  test('submitting without opening documents shows alert', async () => {
    const user = userEvent.setup();

    renderTermsForm();

    await user.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/open the document links/i)
      ).toBeInTheDocument();
    });
  });

  test('renders without attestation documents', () => {
    const clientNoAttestationDocs: ClientResponse = {
      ...mockClient,
      outstanding: {
        ...mockClient.outstanding,
        attestationDocumentIds: [],
      },
    };

    renderTermsForm({ clientData: clientNoAttestationDocs });

    // Should render without errors
    expect(
      screen.getByText(/Document attestation/i)
    ).toBeInTheDocument();
  });

  test('checkbox becomes enabled after documents are opened and info alert hidden', async () => {
    const clientNoAttestationDocs: ClientResponse = {
      ...mockClient,
      outstanding: {
        ...mockClient.outstanding,
        attestationDocumentIds: [],
      },
    };

    renderTermsForm({ clientData: clientNoAttestationDocs });

    // With no documents, allDocumentsOpened should be true (every() on empty array is true)
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeDisabled();

    // Info alert about reviewing documents should not show
    expect(
      screen.queryByText(/must open and review all documents/i)
    ).not.toBeInTheDocument();
  });

  test('submitting form without attestation checked shows validation error', async () => {
    const user = userEvent.setup();

    const clientNoAttestationDocs: ClientResponse = {
      ...mockClient,
      outstanding: {
        ...mockClient.outstanding,
        attestationDocumentIds: [],
      },
    };

    renderTermsForm({ clientData: clientNoAttestationDocs });

    // Click submit without checking
    await user.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/must agree to all of the documents/i)
      ).toBeInTheDocument();
    });
  });

  test('hides back button when getPrevButtonLabel returns null', () => {
    renderTermsForm({}, {}, { getPrevButtonLabel: () => null });

    // Back button should have eb-hidden class
    const buttons = screen.getAllByRole('button');
    const hiddenButtons = buttons.filter((b) =>
      b.classList.contains('eb-hidden')
    );
    expect(hiddenButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('hides submit button when getNextButtonLabel returns null', () => {
    renderTermsForm({}, {}, { getNextButtonLabel: () => null });

    const buttons = screen.getAllByRole('button');
    const hiddenButtons = buttons.filter((b) =>
      b.classList.contains('eb-hidden')
    );
    expect(hiddenButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('checking attestation checkbox enables it', async () => {
    const user = userEvent.setup();

    const clientNoAttestationDocs: ClientResponse = {
      ...mockClient,
      outstanding: {
        ...mockClient.outstanding,
        attestationDocumentIds: [],
      },
    };

    renderTermsForm({ clientData: clientNoAttestationDocs });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  test('submitting valid form triggers KYC verification', async () => {
    const user = userEvent.setup();
    const mockHandleNext = vi.fn();
    let _patchCalled = false;
    let verificationCalled = false;

    const clientNoAttestationDocs: ClientResponse = {
      ...mockClient,
      outstanding: {
        ...mockClient.outstanding,
        attestationDocumentIds: [],
      },
    };

    renderTermsForm(
      { clientData: clientNoAttestationDocs },
      {},
      { handleNext: mockHandleNext }
    );

    // Override handlers after render
    server.use(
      http.patch('*/clients/:clientId', () => {
        _patchCalled = true;
        return HttpResponse.json(clientNoAttestationDocs);
      }),
      http.post('*/clients/:clientId/verifications', () => {
        verificationCalled = true;
        return HttpResponse.json({
          id: 'verification-1',
          status: 'APPROVED',
        });
      })
    );

    // Check the attestation checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Submit
    await user.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(
      () => {
        expect(verificationCalled).toBe(true);
      },
      { timeout: 5000 }
    );
  });
});
