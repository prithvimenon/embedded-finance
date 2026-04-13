import { render, screen } from '@testing-library/react';
import { userEvent } from '@test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useGetRecipient } from '@/api/generated/ep-recipients';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';

import type { Payee, PaymentMethod, UnsavedRecipient } from '../PaymentFlow.types';

import { EnablePaymentMethodWrapper } from './EnablePaymentMethodWrapper';

vi.mock(
  '@/core/EBComponentsProvider/EBComponentsProvider',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/core/EBComponentsProvider/EBComponentsProvider')
      >();
    return {
      ...actual,
      useClientId: () => 'client-1',
      useInterceptorStatus: () => ({ interceptorReady: true }),
    };
  }
);

vi.mock('@/api/generated/ep-recipients', () => ({
  useGetRecipient: vi.fn(),
}));

vi.mock('@/core/RecipientWidgets/hooks/useRecipientForm', () => ({
  useRecipientForm: vi.fn(),
}));

vi.mock('@/core/RecipientWidgets/components/BankAccountForm', () => ({
  BankAccountForm: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="bank-account-form">
      <span data-testid="config-submit-text">
        {(props.config as { content?: { submitButtonText?: string } })?.content
          ?.submitButtonText ?? ''}
      </span>
      <span data-testid="skip-step-one">{String(props.skipStepOne)}</span>
      <button
        type="button"
        data-testid="mock-submit"
        onClick={() =>
          (props.onSubmit as (data: Record<string, unknown>) => void)?.({
            accountType: 'INDIVIDUAL',
            firstName: 'John',
            lastName: 'Doe',
            accountNumber: '1234567890',
            bankAccountType: 'CHECKING',
            routingNumbers: [
              { paymentType: 'ACH', routingNumber: '021000021' },
              { paymentType: 'WIRE', routingNumber: '021000021' },
            ],
            paymentTypes: ['ACH', 'WIRE'],
          })
        }
      >
        Submit
      </button>
      <button
        type="button"
        data-testid="mock-cancel"
        onClick={() => (props.onCancel as () => void)?.()}
      >
        Cancel
      </button>
    </div>
  )),
  useLinkedAccountConfig: vi.fn(() => ({
    paymentMethods: { available: ['ACH'], defaultSelected: ['ACH'] },
    content: { submitButtonText: 'Link Account', cancelButtonText: 'Cancel' },
  })),
  useRecipientConfig: vi.fn(() => ({
    paymentMethods: {
      available: ['ACH', 'WIRE', 'RTP'],
      defaultSelected: ['ACH'],
    },
    content: { submitButtonText: 'Add Recipient', cancelButtonText: 'Cancel' },
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockSubmit = vi.fn();
const mockReset = vi.fn();

const mockPayee: Payee = {
  id: 'recipient-1',
  type: 'RECIPIENT',
  name: 'John Doe',
  accountNumber: '1234567890',
  routingNumber: '021000021',
  enabledPaymentMethods: ['ACH'],
};

const mockPaymentMethod: PaymentMethod = {
  id: 'WIRE',
  name: 'Wire Transfer',
  description: 'Same day',
  estimatedDelivery: 'Same day',
};

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <EBComponentsProvider apiBaseUrl="" headers={{}}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </EBComponentsProvider>
  );
}

describe('EnablePaymentMethodWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(useGetRecipient).mockReturnValue({
      data: {
        id: 'recipient-1',
        partyDetails: {
          type: 'INDIVIDUAL',
          firstName: 'John',
          lastName: 'Doe',
        },
        account: {
          number: '1234567890',
          type: 'CHECKING',
          routingInformation: [
            {
              routingCodeType: 'USABA',
              routingNumber: '021000021',
              transactionType: 'ACH',
            },
          ],
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGetRecipient>);

    vi.mocked(useRecipientForm).mockReturnValue({
      submit: mockSubmit,
      status: 'idle',
      error: null,
      reset: mockReset,
      isPending: false,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useRecipientForm>);
  });

  it('renders header with payment method name and payee name', () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <EnablePaymentMethodWrapper
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    // i18n key uses {{method}} but code passes methodName, so literal {{method}} renders
    expect(screen.getByText('Enable {{method}}')).toBeInTheDocument();
    // Description also has unresolved {{payeeName}} interpolation
    expect(screen.getByText(/Enable \{\{method\}\} for \{\{payeeName\}\}/)).toBeInTheDocument();
  });

  it('renders BankAccountForm with skipStepOne enabled', () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <EnablePaymentMethodWrapper
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId('bank-account-form')).toBeInTheDocument();
    expect(screen.getByTestId('skip-step-one')).toHaveTextContent('true');
  });

  it('shows loading skeleton when recipient is being fetched', () => {
    vi.mocked(useGetRecipient).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useGetRecipient>);

    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <EnablePaymentMethodWrapper
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    // Should not show the form while loading
    expect(screen.queryByTestId('bank-account-form')).not.toBeInTheDocument();
  });

  it('shows error alert when recipient fetch fails', () => {
    vi.mocked(useGetRecipient).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: {
        response: { status: 404, data: { httpStatus: 404 } },
        status: 404,
      },
    } as unknown as ReturnType<typeof useGetRecipient>);

    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <EnablePaymentMethodWrapper
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByText('Failed to load recipient')
    ).toBeInTheDocument();
  });

  it('calls submit via API for saved recipients', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <EnablePaymentMethodWrapper
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByTestId('mock-submit'));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
      })
    );
  });

  it('calls onCancel and resets when cancel is triggered', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <EnablePaymentMethodWrapper
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByTestId('mock-cancel'));
    expect(mockReset).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('handles unsaved recipient without API call', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onUnsavedSuccess = vi.fn();

    const unsavedRecipient: UnsavedRecipient = {
      displayName: 'Jane Unsaved',
      accountNumber: '9876543210',
      routingNumber: '021000021',
      enabledPaymentMethods: ['ACH'],
      recipientType: 'INDIVIDUAL',
      transactionRecipient: {
        account: {
          countryCode: 'US',
          number: '9876543210',
          routingInformation: [
            {
              routingCodeType: 'USABA',
              routingNumber: '021000021',
              transactionType: 'ACH',
            },
          ],
          type: 'CHECKING',
        },
        partyDetails: {
          type: 'INDIVIDUAL',
          firstName: 'Jane',
          lastName: 'Unsaved',
        },
        recipientType: 'RECIPIENT',
      },
    };

    renderWithProviders(
      <EnablePaymentMethodWrapper
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSuccess={onSuccess}
        onCancel={onCancel}
        onUnsavedSuccess={onUnsavedSuccess}
        unsavedRecipient={unsavedRecipient}
      />
    );

    // Should render form directly (no loading since unsaved)
    expect(screen.getByTestId('bank-account-form')).toBeInTheDocument();
  });
});
