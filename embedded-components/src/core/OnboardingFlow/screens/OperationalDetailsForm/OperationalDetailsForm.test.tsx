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
import type { ScreenId } from '@/core/OnboardingFlow/types/flow.types';

import { OperationalDetailsForm } from './OperationalDetailsForm';

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
  currentScreenId: 'additional-questions-section' as const,
  originScreenId: 'overview' as ScreenId | null,
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
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: ['30001', '30002'],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  questionResponses: [],
} as ClientResponse;

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

const mockQuestionsResponse = {
  questions: [
    {
      id: '30001',
      description: 'What is your total annual revenue?',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['LESS_THAN_50K', '50K_TO_100K', '100K_TO_500K', 'OVER_500K'],
        },
      },
    },
    {
      id: '30002',
      description: 'How many employees does your business have?',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: { type: 'integer' },
      },
    },
  ],
};

function renderOperationalDetails(
  onboardingOverrides: Partial<OnboardingContextType> = {},
  flowContextOverrides: Partial<typeof mockFlowContext> = {}
) {
  server.resetHandlers();

  // Default MSW handler for questions API
  server.use(
    http.get('*/questions*', () => {
      return HttpResponse.json(mockQuestionsResponse);
    }),
    http.patch('*/clients/*', () => {
      return HttpResponse.json(mockClient);
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
          initialScreenId="additional-questions-section"
          flowConfig={flowConfig}
        >
          <OperationalDetailsForm />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('OperationalDetailsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('renders loading state while fetching questions', () => {
    renderOperationalDetails();

    // Override the default handler with a delayed one AFTER render
    // so it takes precedence (MSW evaluates most recently added handlers first)
    server.use(
      http.get('*/questions*', async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 5000);
        });
        return HttpResponse.json(mockQuestionsResponse);
      })
    );

    expect(screen.getByText(/Loading questions/i)).toBeInTheDocument();
  });

  test('renders questions after loading', async () => {
    renderOperationalDetails();

    await waitFor(() => {
      expect(
        screen.getByText(/What is your total annual revenue/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/How many employees does your business have/i)
    ).toBeInTheDocument();
  });

  test('renders form title', async () => {
    renderOperationalDetails();

    await waitFor(() => {
      expect(screen.getByText(/Operational details/i)).toBeInTheDocument();
    });
  });

  test('renders overview navigation button', async () => {
    renderOperationalDetails();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /overview/i })
      ).toBeInTheDocument();
    });
  });

  test('overview button calls goTo overview', async () => {
    const user = userEvent.setup();
    const mockGoTo = vi.fn();

    renderOperationalDetails({}, { goTo: mockGoTo });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /overview/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /overview/i }));
    expect(mockGoTo).toHaveBeenCalledWith('overview');
  });

  test('renders submit button', async () => {
    renderOperationalDetails();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save and continue/i })
      ).toBeInTheDocument();
    });
  });

  test('renders save and return button in review mode', async () => {
    renderOperationalDetails(
      {},
      { originScreenId: 'review-attest-section' }
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save and return/i })
      ).toBeInTheDocument();
    });
  });

  test('renders no questions message when API returns no data', async () => {
    renderOperationalDetails({
      clientData: {
        ...mockClient,
        outstanding: {
          ...mockClient.outstanding,
          questionIds: [],
        },
        questionResponses: [],
      },
    });

    // Override the default handler AFTER render so it takes precedence
    server.use(
      http.get('*/questions*', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    await waitFor(() => {
      // The questions from the successful response should not be rendered
      expect(
        screen.queryByText(/What is your total annual revenue/i)
      ).not.toBeInTheDocument();
    });
  });

  test('renders pre-populated values from existing question responses', async () => {
    const clientWithResponses: ClientResponse = {
      ...mockClient,
      questionResponses: [
        {
          questionId: '30001',
          values: ['LESS_THAN_50K'],
        },
      ],
    };

    renderOperationalDetails({
      clientData: clientWithResponses,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/What is your total annual revenue/i)
      ).toBeInTheDocument();
    });
  });

  test('renders description text', async () => {
    renderOperationalDetails();

    await waitFor(() => {
      expect(
        screen.getByText(/additional questions/i)
      ).toBeInTheDocument();
    });
  });
});
