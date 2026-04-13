import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@test-utils';

import type {
  ListAccountsResponse,
  MobileReviewConfig,
  Payee,
  PaymentMethod,
} from '../PaymentFlow.types';

import { ReviewPanelMobile } from './ReviewPanelMobile';
import { ReviewPlaceholder, ReviewSection } from './ReviewSection';
import { ReviewTotals } from './ReviewTotals';

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

// --- ReviewSection tests ---

describe('ReviewSection', () => {
  it('renders title and children content', () => {
    render(
      <ReviewSection title="Amount">
        <span>$250.00</span>
      </ReviewSection>
    );

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('renders with an icon', () => {
    render(
      <ReviewSection title="Method" icon={<svg data-testid="icon" />}>
        <span>ACH</span>
      </ReviewSection>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('ACH')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReviewSection title="Fee" className="eb-custom-class">
        <span>$2.50</span>
      </ReviewSection>
    );

    const section = container.querySelector('.eb-custom-class');
    expect(section).toBeInTheDocument();
  });
});

// --- ReviewPlaceholder tests ---

describe('ReviewPlaceholder', () => {
  it('renders default placeholder text', () => {
    render(<ReviewPlaceholder />);
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });

  it('renders custom placeholder text', () => {
    render(<ReviewPlaceholder text="Not selected" />);
    expect(screen.getByText('Not selected')).toBeInTheDocument();
  });
});

// --- ReviewTotals tests ---

describe('ReviewTotals', () => {
  it('renders fee items and total with currency formatting', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 250 },
          { label: 'Processing Fee', value: 2.5 },
        ]}
        total={252.5}
        currency="USD"
      />
    );

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
    expect(screen.getByText('Processing Fee')).toBeInTheDocument();
    expect(screen.getByText('$2.50')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$252.50')).toBeInTheDocument();
  });

  it('returns null when there are no fee items', () => {
    render(
      <ReviewTotals
        items={[{ label: 'Amount', value: 250 }]}
        total={250}
        currency="USD"
      />
    );

    // ReviewTotals filters for items with "fee" in the label; no fee = renders nothing
    // The wrapper provider may inject global styles, so check that no meaningful content is rendered
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.queryByText('Amount')).not.toBeInTheDocument();
  });

  it('renders with non-USD currency', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'Wire Fee', value: 25 },
        ]}
        total={125}
        currency="GBP"
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    // GBP formatted
    expect(screen.getByText('\u00A3125.00')).toBeInTheDocument();
  });

  it('applies custom className to the container', () => {
    const { container } = render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'Service Fee', value: 5 },
        ]}
        total={105}
        className="eb-mt-4"
      />
    );

    const wrapper = container.querySelector('.eb-mt-4');
    expect(wrapper).toBeInTheDocument();
  });
});

// --- ReviewPanelMobile tests ---

describe('ReviewPanelMobile', () => {
  const defaultConfig: MobileReviewConfig = {
    requireReviewBeforeSubmit: false,
    collapsedPreview: {
      title: 'Payment Summary',
      subtitle: 'Tap to review details',
      summary: 'ACH to Jane Smith',
    },
  };

  it('renders collapsed state with title, subtitle, and total', () => {
    render(
      <ReviewPanelMobile
        config={defaultConfig}
        total="$250.00"
        isComplete={false} // eslint-disable-line react/jsx-boolean-value
        footer={<button type="button">Submit</button>}
      >
        <div>Review content</div>
      </ReviewPanelMobile>
    );

    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('Tap to review details')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('shows review required indicator when requireReviewBeforeSubmit is true and complete', () => {
    const configRequired: MobileReviewConfig = {
      ...defaultConfig,
      requireReviewBeforeSubmit: true,
    };

    render(
      <ReviewPanelMobile
        config={configRequired}
        total="$250.00"
        isComplete
        footer={<button type="button">Submit</button>}
      >
        <div>Review content</div>
      </ReviewPanelMobile>
    );

    expect(
      screen.getByText('Please review before submitting')
    ).toBeInTheDocument();
  });

  it('expands to show children and footer when collapsed button is clicked', async () => {
    const { userEvent } = await import('@test-utils');
    const onReviewViewed = vi.fn();
    const configWithCallback: MobileReviewConfig = {
      ...defaultConfig,
      onReviewViewed,
    };

    render(
      <ReviewPanelMobile
        config={configWithCallback}
        total="$250.00"
        isComplete
        footer={<button type="button">Confirm payment</button>}
      >
        <div>Detailed review content</div>
      </ReviewPanelMobile>
    );

    // Click the collapsed button to expand
    const collapseButton = screen.getByText('Payment Summary');
    await userEvent.click(collapseButton);

    expect(onReviewViewed).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Review Details')).toBeInTheDocument();
    expect(screen.getByText('Detailed review content')).toBeInTheDocument();
  });

  it('renders legal disclosure when provided', async () => {
    const { userEvent } = await import('@test-utils');
    const configWithDisclosure: MobileReviewConfig = {
      ...defaultConfig,
      legalDisclosure: 'By submitting, you agree to the terms.',
    };

    render(
      <ReviewPanelMobile
        config={configWithDisclosure}
        total="$250.00"
        isComplete
        footer={<button type="button">Submit</button>}
      >
        <div>Content</div>
      </ReviewPanelMobile>
    );

    // Expand to see disclosure
    await userEvent.click(screen.getByText('Payment Summary'));

    expect(
      screen.getByText('By submitting, you agree to the terms.')
    ).toBeInTheDocument();
  });
});

// --- ReviewPanel tests ---

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
    // Account label shows
    expect(screen.getByText(/Checking Account/)).toBeInTheDocument();
    // Last four digits of account number
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

    // Balance should show "$5,000.00 available"
    expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/available/)).toBeInTheDocument();
  });
});
