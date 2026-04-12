import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
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
import type { StepperStepProps } from '@/core/OnboardingFlow/types/flow.types';

import { TermsAndConditionsForm } from './TermsAndConditionsForm';

vi.mock('@/lib/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/hooks')>();
  return {
    ...actual,
    useIPAddress: () => ({ data: '127.0.0.1' }),
  };
});

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
  ],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: ['doc-1'],
  },
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
  getNextButtonLabel: () => 'Submit',
};

function renderTermsAndConditionsForm(
  contextOverrides: Partial<OnboardingContextType> = {},
  stepperPropsOverrides: Partial<StepperStepProps> = {}
) {
  server.use(
    http.get('*/documents/doc-1', () => {
      return HttpResponse.json({
        id: 'doc-1',
        documentType: 'Terms and Conditions',
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
          <TermsAndConditionsForm
            {...defaultStepperProps}
            {...stepperPropsOverrides}
          />
        </FlowProvider>
      </OnboardingContext.Provider>
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
    renderTermsAndConditionsForm();

    expect(screen.getByText(/Document attestation/i)).toBeInTheDocument();
  });

  test('renders attestation checkbox', () => {
    renderTermsAndConditionsForm();

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(
      screen.getByText(/I have read and agree to all of the documents/i)
    ).toBeInTheDocument();
  });

  test('renders document review notice when documents not opened', () => {
    renderTermsAndConditionsForm();

    expect(
      screen.getByText(/must open and review all documents/i)
    ).toBeInTheDocument();
  });

  test('renders submit button from stepper props', () => {
    renderTermsAndConditionsForm();

    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  test('renders back button from stepper props', () => {
    renderTermsAndConditionsForm();

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  test('checkbox is disabled when documents are not opened', () => {
    renderTermsAndConditionsForm();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  test('renders with no attestation documents', () => {
    const clientWithNoDocs: ClientResponse = {
      ...mockClient,
      outstanding: {
        ...mockClient.outstanding,
        attestationDocumentIds: [],
      },
    };

    renderTermsAndConditionsForm({
      clientData: clientWithNoDocs,
    });

    // Should still render the form
    expect(screen.getByText(/Document attestation/i)).toBeInTheDocument();
  });

  test('document button loads and shows document type', async () => {
    renderTermsAndConditionsForm();

    // Initially shows loading, then document type
    await waitFor(() => {
      expect(screen.getByText(/Terms and Conditions/i)).toBeInTheDocument();
    });
  });

  test('calls handlePrev when back button clicked', async () => {
    const handlePrev = vi.fn();
    const user = userEvent.setup();

    renderTermsAndConditionsForm({}, { handlePrev });

    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);

    expect(handlePrev).toHaveBeenCalledTimes(1);
  });
});
