import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { Payee } from '../PaymentFlow.types';

import { AddNewPayeeButton, PayeeListItem } from './PayeeListItem';

// --- Mock data ---

const mockIndividualPayee: Payee = {
  id: 'payee-1',
  type: 'RECIPIENT',
  name: 'John Doe',
  accountNumber: '1234567890',
  routingNumber: '021000021',
  recipientType: 'INDIVIDUAL',
  enabledPaymentMethods: ['ACH', 'RTP'],
};

const mockBusinessPayee: Payee = {
  id: 'payee-2',
  type: 'RECIPIENT',
  name: 'Acme Corp',
  accountNumber: '9876543210',
  routingNumber: '021000021',
  recipientType: 'BUSINESS',
  enabledPaymentMethods: ['ACH', 'WIRE'],
};

// --- PayeeListItem tests ---

describe('PayeeListItem', () => {
  it('renders individual payee with name and masked account number', () => {
    const onSelect = vi.fn();
    render(
      <PayeeListItem
        payee={mockIndividualPayee}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('(...7890)')).toBeInTheDocument();
  });

  it('renders business payee with Building2 icon aria-label', () => {
    const onSelect = vi.fn();
    render(
      <PayeeListItem
        payee={mockBusinessPayee}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('(...3210)')).toBeInTheDocument();
  });

  it('fires onSelect callback with payee when clicked', async () => {
    const onSelect = vi.fn();
    render(
      <PayeeListItem
        payee={mockIndividualPayee}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    const button = screen.getByRole('button', { name: /John Doe/i });
    await userEvent.click(button);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockIndividualPayee);
  });

  it('shows selected state via aria-pressed', () => {
    const onSelect = vi.fn();
    render(
      <PayeeListItem
        payee={mockIndividualPayee}
        isSelected
        onSelect={onSelect}
      />
    );

    const button = screen.getByRole('button', {
      name: /Selected: John Doe/i,
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders payee without account number gracefully', () => {
    const payeeNoAccount: Payee = {
      ...mockIndividualPayee,
      id: 'payee-no-acct',
      accountNumber: '',
    };
    const onSelect = vi.fn();
    render(
      <PayeeListItem
        payee={payeeNoAccount}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // No masked account number should be rendered
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });
});

// --- AddNewPayeeButton tests ---

describe('AddNewPayeeButton', () => {
  it('renders label and calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<AddNewPayeeButton label="Add New Recipient" onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Add New Recipient' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Add New Recipient')).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
