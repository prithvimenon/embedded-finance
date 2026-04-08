import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type {
  Payee,
  PaymentMethod,
  PaymentMethodType,
} from '../PaymentFlow.types';

import { PaymentMethodSelector } from './PaymentMethodSelector';

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: 'Standard bank transfer',
    estimatedDelivery: '1-2 business days',
    fee: 2.5,
  },
  {
    id: 'RTP',
    name: 'Real-Time Payment',
    description: 'Instant payment',
    estimatedDelivery: 'Instant',
  },
  {
    id: 'WIRE',
    name: 'Wire Transfer',
    description: 'Wire transfer',
    estimatedDelivery: 'Same day',
    fee: 25,
  },
];

const mockPayee: Payee = {
  id: 'payee-1',
  type: 'RECIPIENT',
  name: 'John Doe',
  accountNumber: '****7890',
  routingNumber: '123456789',
  enabledPaymentMethods: ['ACH', 'RTP'],
};

const mockLinkedAccountPayee: Payee = {
  id: 'linked-1',
  type: 'LINKED_ACCOUNT',
  name: 'My Other Bank',
  accountNumber: '****4567',
  routingNumber: '987654321',
  enabledPaymentMethods: ['ACH'],
};

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
    >
      {ui}
    </EBComponentsProvider>
  );
}

describe('PaymentMethodSelector', () => {
  it('renders all available payment methods', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
      />
    );

    expect(screen.getByText('ACH Transfer')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Payment')).toBeInTheDocument();
    expect(screen.getByText('Wire Transfer')).toBeInTheDocument();
  });

  it('shows enabled state for methods the payee supports', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
      />
    );

    // ACH and RTP should be enabled (clickable buttons)
    // We look for the method names; enabled methods render as <button> elements
    const achButton = screen.getByText('ACH Transfer').closest('button');
    expect(achButton).toBeInTheDocument();

    const rtpButton = screen.getByText('Real-Time Payment').closest('button');
    expect(rtpButton).toBeInTheDocument();
  });

  it('shows disabled/locked state for methods the payee does not support', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
      />
    );

    // WIRE is not in payee's enabledPaymentMethods
    // The locked state renders as a <div> not a <button>
    const wireText = screen.getByText('Wire Transfer');
    const wireParent = wireText.closest('div.eb-flex.eb-items-center');
    expect(wireParent).toBeInTheDocument();

    // Should show "Not enabled for this recipient" text
    expect(
      screen.getByText('Not enabled for this recipient')
    ).toBeInTheDocument();
  });

  it('shows "Not enabled for this linked account" for linked account payee', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockLinkedAccountPayee}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
      />
    );

    // RTP and WIRE are not enabled for this linked account
    const notEnabledTexts = screen.getAllByText(
      'Not enabled for this linked account'
    );
    expect(notEnabledTexts.length).toBe(2);
  });

  it('calls onSelect when an enabled method is clicked', async () => {
    const onSelect = vi.fn();
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        availableMethods={mockPaymentMethods}
        onSelect={onSelect}
        onEnableMethod={vi.fn()}
      />
    );

    const achButton = screen.getByText('ACH Transfer').closest('button');
    await userEvent.click(achButton!);

    expect(onSelect).toHaveBeenCalledWith('ACH');
  });

  it('calls onEnableMethod when Enable button is clicked for a disabled method', async () => {
    const onEnableMethod = vi.fn();
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={onEnableMethod}
      />
    );

    // WIRE is disabled, click the "Enable" button
    const enableButtons = screen.getAllByText('Enable');
    await userEvent.click(enableButtons[0]);

    expect(onEnableMethod).toHaveBeenCalledWith('WIRE');
  });

  it('shows selected state for the currently selected method', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        selectedMethod={'ACH' as PaymentMethodType}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
      />
    );

    // The selected ACH button container should have primary styling
    const achButton = screen.getByText('ACH Transfer').closest('button');
    expect(achButton).toHaveClass('eb-bg-primary/5');
  });

  it('shows fee for methods with fee > 0', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        selectedMethod={undefined}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
      />
    );

    // ACH has fee of 2.5
    expect(screen.getByText('$2.50')).toBeInTheDocument();
  });

  it('renders disabled state when disabled prop is true', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={mockPayee}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
        disabled
      />
    );

    // Should show "Select a payee first" message
    expect(screen.getByText('Select a payee first')).toBeInTheDocument();
    // Should not render payment methods
    expect(screen.queryByText('ACH Transfer')).not.toBeInTheDocument();
  });

  it('renders disabled state when no payee is provided', () => {
    renderWithProvider(
      <PaymentMethodSelector
        payee={undefined}
        availableMethods={mockPaymentMethods}
        onSelect={vi.fn()}
        onEnableMethod={vi.fn()}
      />
    );

    expect(screen.getByText('Select a payee first')).toBeInTheDocument();
  });
});
