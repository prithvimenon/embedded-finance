import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import type { ScreenId } from '@/core/OnboardingFlow/types/flow.types';

import { OwnersSectionScreen } from './OwnersSectionScreen';

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
  currentScreenId: 'owners-section' as const,
  originScreenId: 'overview' as ScreenId | null,
  goTo: vi.fn(),
  goBack: vi.fn(),
  editingPartyIds: {},
  updateEditingPartyId: vi.fn(),
  staticScreens: [
    {
      id: 'owner-stepper',
      isSection: false,
      stepperConfig: {
        steps: [
          {
            id: 'owner-personal-details',
            label: 'Personal details',
            fields: [],
          },
          { id: 'owner-address', label: 'Address', fields: [] },
        ],
      },
    },
  ] as any,
  sections: flowConfig.screens.filter((s) => s.isSection) as any,
  sessionData: { isControllerOwnerQuestionAnswered: true },
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

const mockClientWithController = {
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
    attestationDocumentIds: [],
  },
} as unknown as ClientResponse;

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClientWithController,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

function renderOwners(
  onboardingOverrides: Partial<OnboardingContextType> = {},
  flowContextOverrides: Partial<typeof mockFlowContext> = {}
) {
  server.resetHandlers();

  server.use(
    http.patch('*/parties/*', () => {
      return HttpResponse.json({
        id: 'party-controller',
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
        active: true,
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

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider
        value={onboardingContext}
      >
        <FlowContextModule.FlowProvider
          initialScreenId="owners-section"
          flowConfig={flowConfig}
        >
          <OwnersSectionScreen />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('OwnersSectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('renders the owners section screen title', () => {
    renderOwners();

    expect(screen.getByText(/Owners and key roles/i)).toBeInTheDocument();
  });

  test('renders overview navigation button', () => {
    renderOwners();

    expect(
      screen.getByRole('button', { name: /overview/i })
    ).toBeInTheDocument();
  });

  test('overview button calls goTo overview', async () => {
    const user = userEvent.setup();
    const mockGoTo = vi.fn();

    renderOwners({}, { goTo: mockGoTo });

    await user.click(screen.getByRole('button', { name: /overview/i }));
    expect(mockGoTo).toHaveBeenCalledWith('overview');
  });

  test('renders add owner button', () => {
    renderOwners();

    expect(
      screen.getByRole('button', { name: /add owner/i })
    ).toBeInTheDocument();
  });

  test('renders empty state when no owners exist', () => {
    renderOwners();

    // No beneficial owners exist yet - controller only has CONTROLLER role
    expect(screen.getByText(/No stakeholders added/i)).toBeInTheDocument();
  });

  test('renders controller is owner question', () => {
    renderOwners();

    expect(
      screen.getByText(/controller/i, { selector: 'label,span,p,div' })
    ).toBeInTheDocument();
  });

  test('renders yes/no radio options for controller question', () => {
    renderOwners();

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(2);
  });

  test('renders owner cards when beneficial owners exist', () => {
    const clientWithOwners: ClientResponse = {
      ...mockClientWithController,
      parties: [
        ...mockClientWithController.parties!,
        {
          id: 'party-owner-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            firstName: 'Jane',
            lastName: 'Smith',
            jobTitle: 'CFO',
          },
        },
      ],
    };

    renderOwners({ clientData: clientWithOwners });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('renders edit button on owner cards', () => {
    const clientWithOwners: ClientResponse = {
      ...mockClientWithController,
      parties: [
        ...mockClientWithController.parties!,
        {
          id: 'party-owner-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            firstName: 'Jane',
            lastName: 'Smith',
            jobTitle: 'CFO',
          },
        },
      ],
    };

    renderOwners({ clientData: clientWithOwners });

    expect(
      screen.getByRole('button', { name: /edit/i })
    ).toBeInTheDocument();
  });

  test('renders remove button on non-controller owner cards', () => {
    const clientWithOwners: ClientResponse = {
      ...mockClientWithController,
      parties: [
        ...mockClientWithController.parties!,
        {
          id: 'party-owner-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            firstName: 'Jane',
            lastName: 'Smith',
            jobTitle: 'CFO',
          },
        },
      ],
    };

    renderOwners({ clientData: clientWithOwners });

    expect(
      screen.getByRole('button', { name: /remove/i })
    ).toBeInTheDocument();
  });

  test('does not render remove button on controller+owner cards', () => {
    const clientWithControllerOwner: ClientResponse = {
      ...mockClientWithController,
      parties: [
        {
          id: 'party-controller',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            firstName: 'John',
            lastName: 'Doe',
            jobTitle: 'CEO',
          },
        },
        mockClientWithController.parties![1],
      ],
    };

    renderOwners({ clientData: clientWithControllerOwner });

    // Controller who is also owner should not have remove button
    expect(
      screen.queryByRole('button', { name: /remove/i })
    ).not.toBeInTheDocument();
  });

  test('renders controller badge on controller+owner cards', () => {
    const clientWithControllerOwner: ClientResponse = {
      ...mockClientWithController,
      parties: [
        {
          id: 'party-controller',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            firstName: 'John',
            lastName: 'Doe',
            jobTitle: 'CEO',
          },
        },
        mockClientWithController.parties![1],
      ],
    };

    renderOwners({ clientData: clientWithControllerOwner });

    // Controller badge is rendered inside the owner card
    const badges = screen.getAllByText(/Controller/i);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  test('add owner button calls goTo owner-stepper', async () => {
    const user = userEvent.setup();
    const mockGoTo = vi.fn();

    renderOwners({}, { goTo: mockGoTo });

    await user.click(screen.getByRole('button', { name: /add owner/i }));
    expect(mockGoTo).toHaveBeenCalledWith('owner-stepper', {
      shortLabelOverride: 'Add owner',
    });
  });

  test('save and continue button navigates to additional questions', async () => {
    const user = userEvent.setup();
    const mockGoTo = vi.fn();
    const mockUpdateSessionData = vi.fn();

    renderOwners(
      {},
      { goTo: mockGoTo, updateSessionData: mockUpdateSessionData }
    );

    const saveButton = screen.getByRole('button', {
      name: /save and continue/i,
    });
    await user.click(saveButton);

    expect(mockGoTo).toHaveBeenCalledWith('additional-questions-section');
  });

  test('save and return to review button appears in review mode', () => {
    renderOwners(
      {},
      { originScreenId: 'review-attest-section' }
    );

    expect(
      screen.getByRole('button', { name: /save and return/i })
    ).toBeInTheDocument();
  });

  test('save and return navigates to review-attest-section in review mode', async () => {
    const user = userEvent.setup();
    const mockGoTo = vi.fn();

    renderOwners(
      {},
      {
        originScreenId: 'review-attest-section',
        goTo: mockGoTo,
      }
    );

    const saveButton = screen.getByRole('button', {
      name: /save and return/i,
    });
    await user.click(saveButton);

    expect(mockGoTo).toHaveBeenCalledWith('review-attest-section', {
      reviewScreenOpenedSectionId: 'owners-section',
    });
  });

  test('renders max owners warning when 4 owners exist', () => {
    const clientWith4Owners: ClientResponse = {
      ...mockClientWithController,
      parties: [
        ...mockClientWithController.parties!,
        ...[1, 2, 3, 4].map((i) => ({
          id: `party-owner-${i}`,
          partyType: 'INDIVIDUAL' as const,
          roles: ['BENEFICIAL_OWNER' as const],
          active: true,
          individualDetails: {
            firstName: `Owner${i}`,
            lastName: 'Test',
            jobTitle: 'Director',
          },
        })),
      ],
    };

    renderOwners({ clientData: clientWith4Owners });

    // Add owner button should be disabled when 4 owners exist
    const addButton = screen.getByRole('button', { name: /add owner/i });
    expect(addButton).toBeDisabled();
  });
});
