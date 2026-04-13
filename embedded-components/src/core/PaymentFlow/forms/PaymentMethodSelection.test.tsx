import { render, screen } from '@testing-library/react';
import { userEvent } from '@test-utils';

import type { PaymentMethod } from '../PaymentFlow.types';

import { PaymentMethodSelection } from './PaymentMethodSelection';

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

describe('PaymentMethodSelection', () => {
  it('renders all available payment methods', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(
      <PaymentMethodSelection
        availablePaymentMethods={mockPaymentMethods}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('ACH Transfer')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Payment')).toBeInTheDocument();
    expect(screen.getByText('Wire Transfer')).toBeInTheDocument();
    expect(
      screen.getByText('How do you want to pay this recipient?')
    ).toBeInTheDocument();
  });

  it('calls onSelect with the correct method type when clicked', async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(
      <PaymentMethodSelection
        availablePaymentMethods={mockPaymentMethods}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByText('ACH Transfer'));
    expect(onSelect).toHaveBeenCalledWith('ACH');

    await userEvent.click(screen.getByText('Real-Time Payment'));
    expect(onSelect).toHaveBeenCalledWith('RTP');

    await userEvent.click(screen.getByText('Wire Transfer'));
    expect(onSelect).toHaveBeenCalledWith('WIRE');
  });

  it('displays fees when provided', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(
      <PaymentMethodSelection
        availablePaymentMethods={mockPaymentMethods}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );

    // RTP has fee $1.5, WIRE has fee $25
    expect(screen.getByText('$1.5 fee')).toBeInTheDocument();
    expect(screen.getByText('$25 fee')).toBeInTheDocument();
  });

  it('shows additional info note for WIRE', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(
      <PaymentMethodSelection
        availablePaymentMethods={mockPaymentMethods}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByText('Additional address info required')
    ).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(
      <PaymentMethodSelection
        availablePaymentMethods={mockPaymentMethods}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders default payment methods when none provided', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(
      <PaymentMethodSelection onSelect={onSelect} onCancel={onCancel} />
    );

    // DEFAULT_PAYMENT_METHODS uses 'ACH Transfer', 'Real-Time Payment', 'Wire Transfer'
    expect(screen.getByText('ACH Transfer')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Payment')).toBeInTheDocument();
    expect(screen.getByText('Wire Transfer')).toBeInTheDocument();
  });
});
