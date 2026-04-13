import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { PaymentMethod } from '../PaymentFlow.types';

import { AddRecipientForm } from './AddRecipientForm';

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <EBComponentsProvider apiBaseUrl="" headers={{}}>
      {ui}
    </EBComponentsProvider>
  );
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: '1-3 business days',
    estimatedDelivery: '1-3 business days',
  },
  {
    id: 'RTP',
    name: 'Real-Time Payment',
    description: 'Instant',
    estimatedDelivery: 'Instant',
    fee: 1.5,
  },
  {
    id: 'WIRE',
    name: 'Wire Transfer',
    description: 'Same day',
    estimatedDelivery: 'Same day',
    fee: 25,
  },
];

describe('AddRecipientForm', () => {
  it('renders form with individual name fields by default', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    expect(screen.getByText('Recipient Type')).toBeInTheDocument();
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    // Individual fields visible by default
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    // Bank account fields
    expect(screen.getByLabelText(/Bank Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Routing Number/i)).toBeInTheDocument();
  });

  it('switches to business name field when Business is selected', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    await userEvent.click(screen.getByText('Business'));

    await waitFor(() => {
      expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    });
    // Individual fields should not be visible
    expect(screen.queryByLabelText(/First Name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Last Name/i)).not.toBeInTheDocument();
  });

  it('shows payment method selection when no preSelectedPaymentMethod', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    expect(
      screen.getByText('Enable Payment Methods')
    ).toBeInTheDocument();
    expect(screen.getByText('ACH Transfer')).toBeInTheDocument();
    expect(screen.getByText('(always included)')).toBeInTheDocument();
  });

  it('hides payment method selection when preSelectedPaymentMethod is set', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        preSelectedPaymentMethod="ACH"
        onSubmit={onSubmit}
        onCancel={onCancel}
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    expect(
      screen.queryByText('Enable Payment Methods')
    ).not.toBeInTheDocument();
    // Should show selected method badge instead
    expect(screen.getByText('Payment Method:')).toBeInTheDocument();
    expect(screen.getByText('ACH Transfer')).toBeInTheDocument();
  });

  it('shows wire transfer fields when WIRE is pre-selected', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        preSelectedPaymentMethod="WIRE"
        onSubmit={onSubmit}
        onCancel={onCancel}
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    expect(
      screen.getByText('Wire Transfer Details')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Beneficiary Address/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ZIP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bank Address/i)).toBeInTheDocument();
    // SWIFT/BIC field is only shown in the payment methods selection section (not in pre-selected wire section)
    expect(screen.getByText('Payment Method:')).toBeInTheDocument();
    expect(screen.getByText('Wire Transfer')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Save & Continue/i })
    );

    // The .refine() for name fires first, showing "Name is required"
    await waitFor(() => {
      expect(
        screen.getByText(/Name is required/)
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Cancel/i })
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <AddRecipientForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting
        availablePaymentMethods={mockPaymentMethods}
      />
    );

    expect(
      screen.getByRole('button', { name: /Saving.../i })
    ).toBeDisabled();
  });
});
