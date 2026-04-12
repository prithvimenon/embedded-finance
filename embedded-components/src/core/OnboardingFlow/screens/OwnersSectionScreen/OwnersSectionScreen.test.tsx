import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';

import { OwnersSectionScreen } from './OwnersSectionScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockClientWithOwners: ClientResponse = {
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
    {
      id: 'party-2',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Controller',
        jobTitle: 'CEO',
      },
      active: true,
    },
    {
      id: 'party-3',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'John',
        lastName: 'Owner',
        jobTitle: 'CFO',
      },
      active: true,
      status: 'ACTIVE',
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

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClientWithOwners,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

function renderOwnersSectionScreen(
  contextOverrides: Partial<OnboardingContextType> = {}
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={{ ...baseOnboardingContext, ...contextOverrides }}
      >
        <FlowProvider initialScreenId="owners-section" flowConfig={flowConfig}>
          <OwnersSectionScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('OwnersSectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('renders owners section title', () => {
    renderOwnersSectionScreen();

    expect(
      screen.getByText(/Provide information for owners and senior managers/i)
    ).toBeInTheDocument();
  });

  test('renders the controller is owner question', () => {
    renderOwnersSectionScreen();

    expect(screen.getByRole('radio', { name: /Yes/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /No/i })).toBeInTheDocument();
  });

  test('renders add owner button', () => {
    renderOwnersSectionScreen();

    expect(
      screen.getByRole('button', { name: /add.*owner/i })
    ).toBeInTheDocument();
  });

  test('renders list of active owners', () => {
    renderOwnersSectionScreen();

    expect(screen.getByText('John Owner')).toBeInTheDocument();
  });

  test('renders edit button for owners', () => {
    renderOwnersSectionScreen();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  test('renders remove button for non-controller owners', () => {
    renderOwnersSectionScreen();

    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  test('renders overview button', () => {
    renderOwnersSectionScreen();

    expect(
      screen.getByRole('button', { name: /overview/i })
    ).toBeInTheDocument();
  });

  test('renders continue/save button', () => {
    renderOwnersSectionScreen();

    expect(
      screen.getByRole('button', { name: /save|continue/i })
    ).toBeInTheDocument();
  });

  test('shows no stakeholders message when no owners', () => {
    const clientWithNoOwners: ClientResponse = {
      ...mockClientWithOwners,
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
        {
          id: 'party-2',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          individualDetails: {
            firstName: 'Jane',
            lastName: 'Controller',
            jobTitle: 'CEO',
          },
          active: true,
        },
      ],
    };

    renderOwnersSectionScreen({
      clientData: clientWithNoOwners,
    });

    expect(screen.getByText(/no stakeholders added/i)).toBeInTheDocument();
  });

  test('renders owner badge', () => {
    renderOwnersSectionScreen();

    // The badge is a div with specific styling classes
    const badges = screen.getAllByText('Owner');
    const badgeElement = badges.find((el) =>
      el.classList.contains('eb-rounded-full')
    );
    expect(badgeElement).toBeDefined();
  });
});
