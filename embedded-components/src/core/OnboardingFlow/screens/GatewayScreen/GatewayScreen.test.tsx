import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';

import { GatewayScreen } from './GatewayScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  availableOrganizationTypes: [
    'SOLE_PROPRIETORSHIP',
    'LIMITED_LIABILITY_COMPANY',
    'C_CORPORATION',
  ],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: undefined,
};

function renderGatewayScreen(
  contextOverrides: Partial<OnboardingContextType> = {}
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={{ ...baseOnboardingContext, ...contextOverrides }}
      >
        <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
          <GatewayScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('GatewayScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('renders organization type selection UI', () => {
    renderGatewayScreen();

    expect(
      screen.getByText(/Select your general business type/i)
    ).toBeInTheDocument();
  });

  test('renders general business type radio options', () => {
    renderGatewayScreen();

    expect(
      screen.getByRole('radio', { name: /Sole proprietorship/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /Registered business/i })
    ).toBeInTheDocument();
  });

  test('selecting Sole proprietorship does not show specific type dropdown', async () => {
    const user = userEvent.setup();
    renderGatewayScreen();

    const solePropOption = screen.getByRole('radio', {
      name: /Sole proprietorship/i,
    });
    await user.click(solePropOption);

    // Sole proprietorship auto-sets specific type, no dropdown shown
    expect(
      screen.queryByText(/Select the specific legal structure/i)
    ).not.toBeInTheDocument();
  });

  test('selecting Registered business shows specific type dropdown', async () => {
    const user = userEvent.setup();
    renderGatewayScreen();

    const registeredOption = screen.getByRole('radio', {
      name: /Registered business/i,
    });
    await user.click(registeredOption);

    await waitFor(() => {
      expect(
        screen.getByText(/Select the specific legal structure/i)
      ).toBeInTheDocument();
    });
  });

  test('renders the submit button', () => {
    renderGatewayScreen();

    const submitButton = screen.getByRole('button', {
      name: /get started/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  test('renders info alert by default', () => {
    renderGatewayScreen();

    // The info alert should be visible when hideGatewayInfoAlert is not set
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  test('renders with existing client data and organization party', () => {
    const mockClient: ClientResponse = {
      id: 'client-1',
      partyId: 'party-1',
      products: ['EMBEDDED_PAYMENTS'],
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
      outstanding: {
        partyIds: [],
        partyRoles: [],
        questionIds: [],
        documentRequestIds: [],
        attestationDocumentIds: [],
      },
      status: 'NEW',
    };

    renderGatewayScreen({
      clientData: mockClient,
      organizationType: 'LIMITED_LIABILITY_COMPANY',
    });

    // Should still render the gateway screen form
    expect(
      screen.getByText(/Select your general business type/i)
    ).toBeInTheDocument();
  });
});
