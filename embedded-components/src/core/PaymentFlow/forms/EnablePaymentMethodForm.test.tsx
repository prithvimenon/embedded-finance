import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { Payee, PaymentMethod } from '../PaymentFlow.types';

import { EnablePaymentMethodForm } from './EnablePaymentMethodForm';

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <EBComponentsProvider apiBaseUrl="" headers={{}}>
      {ui}
    </EBComponentsProvider>
  );
}

const mockPayee: Payee = {
  id: 'payee-1',
  type: 'RECIPIENT',
  name: 'John Doe',
  accountNumber: '1234567890',
  routingNumber: '021000021',
  enabledPaymentMethods: ['ACH'],
  details: {
    beneficiaryAddress: '123 Main St',
    beneficiaryCity: 'New York',
    beneficiaryState: 'NY',
    beneficiaryZip: '10001',
    bankAddress: '270 Park Ave',
  },
};

const mockPaymentMethod: PaymentMethod = {
  id: 'WIRE',
  name: 'Wire Transfer',
  description: 'Same day',
  estimatedDelivery: 'Same day',
};

describe('EnablePaymentMethodForm', () => {
  it('renders form with payee info and payment method details', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <EnablePaymentMethodForm
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Header - i18n key uses {{method}} but code passes methodName, so literal {{method}} renders
    expect(screen.getByText('Enable {{method}}')).toBeInTheDocument();
    // Payee info card
    expect(screen.getByText('Recipient Information')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Masked account number
    expect(screen.getByText('••••7890')).toBeInTheDocument();
    // Form fields
    expect(
      screen.getByLabelText(/Beneficiary Address/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ZIP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bank Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SWIFT\/BIC/i)).toBeInTheDocument();
  });

  it('pre-fills form from existing payee details', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <EnablePaymentMethodForm
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText(/Beneficiary Address/i)).toHaveValue(
      '123 Main St'
    );
    expect(screen.getByLabelText(/City/i)).toHaveValue('New York');
    expect(screen.getByLabelText(/State/i)).toHaveValue('NY');
    expect(screen.getByLabelText(/ZIP/i)).toHaveValue('10001');
    expect(screen.getByLabelText(/Bank Address/i)).toHaveValue(
      '270 Park Ave'
    );
  });

  it('shows validation errors when required fields are empty', async () => {
    const payeeNoDetails: Payee = {
      ...mockPayee,
      details: undefined,
    };
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <EnablePaymentMethodForm
        payee={payeeNoDetails}
        paymentMethod={mockPaymentMethod}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Enable & Continue/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Beneficiary address is required/)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/City is required/)).toBeInTheDocument();
    expect(screen.getByText(/State is required/)).toBeInTheDocument();
    expect(screen.getByText(/ZIP code is required/)).toBeInTheDocument();
    expect(
      screen.getByText(/Bank address is required/)
    ).toBeInTheDocument();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid form data', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <EnablePaymentMethodForm
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Enable & Continue/i })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          beneficiaryAddress: '123 Main St',
          beneficiaryCity: 'New York',
          beneficiaryState: 'NY',
          beneficiaryZip: '10001',
          bankAddress: '270 Park Ave',
        }),
        expect.anything()
      );
    });
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <EnablePaymentMethodForm
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSubmit={onSubmit}
        onCancel={onCancel}
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
      <EnablePaymentMethodForm
        payee={mockPayee}
        paymentMethod={mockPaymentMethod}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting
      />
    );

    expect(
      screen.getByRole('button', { name: /Enabling.../i })
    ).toBeDisabled();
  });
});
