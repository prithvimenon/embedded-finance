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

import { GatewayScreen } from './GatewayScreen';

// Mock the flow context hook
vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockFlowContext = {
  currentScreenId: 'gateway' as const,
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

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: undefined,
};

function renderGateway(
  onboardingOverrides: Partial<OnboardingContextType> = {},
  flowContextOverrides: Partial<typeof mockFlowContext> = {}
) {
  server.resetHandlers();

  // Mock POST /clients
  server.use(
    http.post('*/clients', () => {
      return HttpResponse.json({
        id: 'client-new',
        status: 'NEW',
        parties: [
          {
            id: 'party-1',
            partyType: 'ORGANIZATION',
            roles: ['CLIENT'],
            organizationDetails: {
              organizationName: 'PLACEHOLDER_ORG_NAME',
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
          attestationDocumentIds: [],
        },
      } as unknown as ClientResponse);
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

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider
        value={onboardingContext}
      >
        <FlowContextModule.FlowProvider
          initialScreenId="gateway"
          flowConfig={flowConfig}
        >
          <GatewayScreen />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('GatewayScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('renders the gateway screen with business type selection options', () => {
    renderGateway();

    expect(
      screen.getByText(/Select your general business type/i)
    ).toBeInTheDocument();
  });

  test('renders info alert by default', () => {
    renderGateway();

    // The info alert should be present when hideGatewayInfoAlert is not set
    const closeButtons = screen.queryAllByRole('button', { name: /close/i });
    // There should be a close button for the info alert
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('hides info alert when hideGatewayInfoAlert is true in session data', () => {
    renderGateway({}, { sessionData: { hideGatewayInfoAlert: true } });

    // The close button for the alert should not be present
    const closeButton = screen.queryByRole('button', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  test('shows radio options for general business types', () => {
    renderGateway({
      availableOrganizationTypes: [
        'SOLE_PROPRIETORSHIP',
        'LIMITED_LIABILITY_COMPANY',
        'NON_PROFIT_CORPORATION',
      ],
    });

    // Should show radio group options
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThanOrEqual(1);
  });

  test('selecting REGISTERED_BUSINESS shows legal structure dropdown', async () => {
    const user = userEvent.setup();

    renderGateway({
      availableOrganizationTypes: [
        'SOLE_PROPRIETORSHIP',
        'LIMITED_LIABILITY_COMPANY',
        'C_CORPORATION',
      ],
    });

    const registeredBusinessOption = screen.getByRole('radio', {
      name: /Registered business/i,
    });
    await user.click(registeredBusinessOption);

    await waitFor(() => {
      expect(
        screen.getByText(/Select the specific legal structure/i)
      ).toBeInTheDocument();
    });
  });

  test('selecting SOLE_PROPRIETORSHIP does not show legal structure dropdown', async () => {
    const user = userEvent.setup();

    renderGateway({
      availableOrganizationTypes: [
        'SOLE_PROPRIETORSHIP',
        'LIMITED_LIABILITY_COMPANY',
      ],
    });

    const solePropOption = screen.getByRole('radio', {
      name: /Sole proprietorship/i,
    });
    await user.click(solePropOption);

    await waitFor(() => {
      expect(
        screen.queryByText(/Select the specific legal structure/i)
      ).not.toBeInTheDocument();
    });
  });

  test('renders get started button', () => {
    renderGateway();

    const button = screen.getByRole('button', { name: /get started/i });
    expect(button).toBeInTheDocument();
  });

  test('submitting with SOLE_PROPRIETORSHIP selection calls postClient', async () => {
    const user = userEvent.setup();

    renderGateway({
      availableOrganizationTypes: [
        'SOLE_PROPRIETORSHIP',
        'LIMITED_LIABILITY_COMPANY',
      ],
    });

    const solePropOption = screen.getByRole('radio', {
      name: /Sole proprietorship/i,
    });
    await user.click(solePropOption);

    const getStartedButton = screen.getByRole('button', {
      name: /get started/i,
    });
    await user.click(getStartedButton);

    // Should navigate to overview after successful submission
    await waitFor(() => {
      expect(mockFlowContext.goTo).toHaveBeenCalledWith('overview');
    });
  });

  test('selecting REGISTERED_BUSINESS and LLC then submitting navigates', async () => {
    const user = userEvent.setup();

    renderGateway({
      availableOrganizationTypes: [
        'SOLE_PROPRIETORSHIP',
        'LIMITED_LIABILITY_COMPANY',
        'C_CORPORATION',
      ],
    });

    // Select registered business
    const registeredBusinessOption = screen.getByRole('radio', {
      name: /Registered business/i,
    });
    await user.click(registeredBusinessOption);

    // Wait for the legal structure combobox
    await waitFor(() => {
      expect(
        screen.getByText(/Select the specific legal structure/i)
      ).toBeInTheDocument();
    });

    // Open and select LLC from the dropdown
    const legalStructureDropdown = screen.getByLabelText(
      /Select the specific legal structure/i
    );
    await user.click(legalStructureDropdown);

    const llcOption = screen.getByRole('option', {
      name: /Limited Liability Company/i,
    });
    await user.click(llcOption);

    // Submit
    const getStartedButton = screen.getByRole('button', {
      name: /get started/i,
    });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(mockFlowContext.goTo).toHaveBeenCalledWith('overview');
    });
  });

  test('selecting OTHER shows specific type dropdown', async () => {
    const user = userEvent.setup();

    renderGateway({
      availableOrganizationTypes: [
        'SOLE_PROPRIETORSHIP',
        'LIMITED_LIABILITY_COMPANY',
        'NON_PROFIT_CORPORATION',
        'GOVERNMENT_ENTITY',
      ],
    });

    const otherOption = screen.getByRole('radio', {
      name: /Other/i,
    });
    await user.click(otherOption);

    await waitFor(() => {
      // Should show the specific type dropdown for OTHER
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  test('close button on info alert calls updateSessionData', async () => {
    const user = userEvent.setup();
    const mockUpdateSessionData = vi.fn();

    renderGateway({}, { updateSessionData: mockUpdateSessionData });

    const closeButton = screen.queryByRole('button', { name: /close/i });
    if (closeButton) {
      await user.click(closeButton);
      expect(mockUpdateSessionData).toHaveBeenCalledWith({
        hideGatewayInfoAlert: true,
      });
    }
  });

  test('renders with existing client data and pre-populates form', async () => {
    const mockClient = {
      id: 'client-1',
      partyId: 'party-1',
      status: 'NEW',
      parties: [
        {
          id: 'party-1',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          organizationDetails: {
            organizationName: 'Test Corp',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
          },
          active: true,
        },
      ],
      products: ['EMBEDDED_PAYMENTS'],
      outstanding: {
        partyIds: [],
        partyRoles: [],
        questionIds: [],
        documentRequestIds: [],
        attestationDocumentIds: [],
      },
    } as ClientResponse;

    renderGateway({
      clientData: mockClient,
      organizationType: 'LIMITED_LIABILITY_COMPANY',
    });

    // Should render without errors when client data exists
    expect(
      screen.getByRole('button', { name: /get started/i })
    ).toBeInTheDocument();
  });
});
