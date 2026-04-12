import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import type { StepperStepProps } from '@/core/OnboardingFlow/types/flow.types';

import { ReviewForm } from './ReviewForm';

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
    },
  ],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  questionResponses: [
    {
      questionId: '10001',
      values: ['$500,000'],
    },
  ],
  status: 'NEW',
};

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

const defaultStepperProps: StepperStepProps = {
  handleNext: vi.fn(),
  handlePrev: vi.fn(),
  getPrevButtonLabel: () => 'Back',
  getNextButtonLabel: () => 'Continue',
};

function renderReviewForm(
  contextOverrides: Partial<OnboardingContextType> = {},
  stepperPropsOverrides: Partial<StepperStepProps> = {}
) {
  server.use(
    http.get('*/questions*', () => {
      return HttpResponse.json({
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
        ],
      });
    })
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={{ ...baseOnboardingContext, ...contextOverrides }}
      >
        <FlowProvider
          initialScreenId="review-attest-section"
          flowConfig={flowConfig}
        >
          <ReviewForm {...defaultStepperProps} {...stepperPropsOverrides} />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('renders review section with informational alert', () => {
    renderReviewForm();

    expect(screen.getByText(/not submitted yet/i)).toBeInTheDocument();
  });

  test('renders section accordion items for review', () => {
    renderReviewForm();

    expect(screen.getByText(/Your personal details/i)).toBeInTheDocument();
    expect(screen.getByText(/Business details/i)).toBeInTheDocument();
    expect(screen.getByText(/Owners and key roles/i)).toBeInTheDocument();
    expect(screen.getByText(/Operational details/i)).toBeInTheDocument();
  });

  test('renders data accuracy attestation checkbox', () => {
    renderReviewForm();

    expect(screen.getByText(/Data accuracy attestation/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(
      screen.getByText(/true, accurate and complete/i)
    ).toBeInTheDocument();
  });

  test('renders navigation buttons', () => {
    renderReviewForm();

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue/i })
    ).toBeInTheDocument();
  });

  test('hides prev button when getPrevButtonLabel returns null', () => {
    renderReviewForm({}, { getPrevButtonLabel: () => null });

    // The button element is still in the DOM but hidden via CSS class
    const buttons = screen.getAllByRole('button');
    const hiddenButton = buttons.find((btn) =>
      btn.classList.contains('eb-hidden')
    );
    expect(hiddenButton).toBeDefined();
  });

  test('renders owners section within review', () => {
    renderReviewForm();

    // The owners section should be listed as a review section
    expect(screen.getByText(/Owners and key roles/i)).toBeInTheDocument();
  });

  test('shows section completion status indicators', () => {
    renderReviewForm();

    // Sections should show status (completed or missing details)
    const missingDetailsTexts = screen.getAllByText(/Missing details/i);
    expect(missingDetailsTexts.length).toBeGreaterThan(0);
  });
});
