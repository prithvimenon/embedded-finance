import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@test-utils';

import type {
  ListAccountsResponse,
  Payee,
  PaymentMethod,
} from '../PaymentFlow.types';

// --- Mock FlowContext for ReviewPanel ---
const mockFormData = {
  amount: '250.00',
  currency: 'USD',
  payeeId: 'payee-1',
  fromAccountId: 'account-1',
  paymentMethod: 'ACH' as const,
};

const mockSetValidationErrors = vi.fn();

vi.mock('../FlowContainer/FlowContext', () => ({
  useFlowContext: () => ({
    formData: mockFormData,
    isComplete: true,
    currentView: 'main',
    setValidationErrors: mockSetValidationErrors,
  }),
}));

// Lazy import after mock is registered
const { ReviewPanel } = await import('./ReviewPanel');

// --- Mock data ---

const mockAccounts: ListAccountsResponse = {
  items: [
    {
      id: 'account-1',
      label: 'Checking Account',
      category: 'LIMITED_DDA_PAYMENTS',
      createdAt: '2024-01-01T00:00:00Z',
      state: 'OPEN',
      clientId: 'client-1',
      paymentRoutingInformation: {
        accountNumber: '1234567890',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '021000021' }],
      },
      balance: {
        available: 5000,
        currency: 'USD',
      },
    },
  ],
  metadata: {
    page: 0,
    limit: 25,
    total_items: 1,
  },
};

const mockPayees: Payee[] = [
  {
    id: 'payee-1',
    type: 'RECIPIENT',
    name: 'Jane Smith',
    accountNumber: '9876543210',
    routingNumber: '021000021',
    recipientType: 'INDIVIDUAL',
    enabledPaymentMethods: ['ACH', 'RTP'],
  },
  {
    id: 'payee-2',
    type: 'LINKED_ACCOUNT',
    name: 'Business Partner LLC',
    accountNumber: '5551234567',
    routingNumber: '021000021',
    recipientType: 'BUSINESS',
    enabledPaymentMethods: ['ACH', 'WIRE'],
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: 'Standard bank transfer',
    fee: 2.5,
    estimatedDelivery: '1-3 business days',
  },
  {
    id: 'RTP',
    name: 'Real-Time Payment',
    description: 'Instant transfer',
    fee: 1.0,
    estimatedDelivery: 'Instant',
  },
  {
    id: 'WIRE',
    name: 'Wire Transfer',
    description: 'Same-day wire',
    fee: 25.0,
    estimatedDelivery: 'Same day',
  },
];

describe('ReviewPanel', () => {
  it('renders payment summary header', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
  });

  it('renders "From" section with selected account info', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText(/Checking Account/)).toBeInTheDocument();
    expect(screen.getByText(/7890/)).toBeInTheDocument();
  });

  it('renders "To" section with selected payee name', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders selected payment method name', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('ACH Transfer')).toBeInTheDocument();
  });

  it('renders confirm payment button', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
      />
    );

    const button = screen.getByRole('button', { name: /Confirm payment/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('disables submit button when isSubmitting is true', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
        isSubmitting
      />
    );

    const button = screen.getByRole('button', { name: /Processing/i });
    expect(button).toBeDisabled();
  });

  it('renders transaction error when provided', () => {
    const onSubmit = vi.fn();
    const onDismissError = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
        transactionError={{
          title: 'Payment Failed',
          message: 'Insufficient funds in the account.',
        }}
        onDismissError={onDismissError}
      />
    );

    expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    expect(
      screen.getByText('Insufficient funds in the account.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Dismiss error/i })
    ).toBeInTheDocument();
  });

  it('shows balance info when account has balance data', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewPanel
        accounts={mockAccounts}
        payees={mockPayees}
        paymentMethods={mockPaymentMethods}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/available/)).toBeInTheDocument();
  });
});
