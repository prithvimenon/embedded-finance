import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';

import { OperationalDetailsForm } from './OperationalDetailsForm';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

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
    questionIds: ['10001', '10002'],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  questionResponses: [],
  status: 'NEW',
};

const mockQuestions = {
  questions: [
    {
      id: '10001',
      description: 'What is your total annual revenue?',
      responseSchema: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 1,
      },
    },
    {
      id: '10002',
      description: 'Do you operate internationally?',
      responseSchema: {
        type: 'array',
        items: { type: 'boolean' },
        minItems: 1,
        maxItems: 1,
      },
    },
  ],
};

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

function renderOperationalDetailsForm(
  contextOverrides: Partial<OnboardingContextType> = {}
) {
  server.use(
    http.get('*/questions*', () => {
      return HttpResponse.json(mockQuestions);
    })
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={{ ...baseOnboardingContext, ...contextOverrides }}
      >
        <FlowProvider
          initialScreenId="additional-questions-section"
          flowConfig={flowConfig}
        >
          <OperationalDetailsForm />
        </FlowProvider>
      </OnboardingContext.Provider>
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
    renderOperationalDetailsForm();

    expect(screen.getByText(/loading questions/i)).toBeInTheDocument();
  });

  test('renders dynamic questions based on mock question data', async () => {
    renderOperationalDetailsForm();

    await waitFor(() => {
      expect(
        screen.getByText(/What is your total annual revenue/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Do you operate internationally/i)
      ).toBeInTheDocument();
    });
  });

  test('renders boolean question as radio buttons with Yes/No', async () => {
    renderOperationalDetailsForm();

    await waitFor(() => {
      expect(
        screen.getByText(/Do you operate internationally/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('radio', { name: /Yes/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /No/i })).toBeInTheDocument();
  });

  test('renders form header when questions are loaded', async () => {
    renderOperationalDetailsForm();

    await waitFor(() => {
      expect(screen.getByText(/Operational details/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Please answer these additional questions/i)
    ).toBeInTheDocument();
  });

  test('renders overview button', async () => {
    renderOperationalDetailsForm();

    await waitFor(() => {
      expect(
        screen.getByText(/What is your total annual revenue/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /overview/i })
    ).toBeInTheDocument();
  });

  test('renders continue button', async () => {
    renderOperationalDetailsForm();

    await waitFor(() => {
      expect(
        screen.getByText(/What is your total annual revenue/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /continue|save/i })
    ).toBeInTheDocument();
  });
});
