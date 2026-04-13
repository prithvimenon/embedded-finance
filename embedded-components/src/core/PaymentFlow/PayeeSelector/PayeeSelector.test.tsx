import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { Payee } from '../PaymentFlow.types';

import { PayeeSelector } from './PayeeSelector';

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

const mockLinkedAccount: Payee = {
  id: 'linked-1',
  type: 'LINKED_ACCOUNT',
  name: 'My Savings',
  accountNumber: '5555666677',
  routingNumber: '021000021',
  recipientType: 'INDIVIDUAL',
  enabledPaymentMethods: ['ACH'],
};

const mockLinkedAccountBusiness: Payee = {
  id: 'linked-2',
  type: 'LINKED_ACCOUNT',
  name: 'Business Checking',
  accountNumber: '1112223344',
  routingNumber: '021000021',
  recipientType: 'BUSINESS',
  enabledPaymentMethods: ['ACH', 'RTP'],
};

describe('PayeeSelector', () => {
  it('renders with empty payee lists and shows empty state', () => {
    const onSelect = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[]}
        linkedAccounts={[]}
      />
    );

    expect(
      screen.getByRole('tab', { name: /Recipients/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Linked Accounts/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/No recipients yet/)).toBeInTheDocument();
  });

  it('renders recipients list with individual and business payees', () => {
    const onSelect = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[mockIndividualPayee, mockBusinessPayee]}
        linkedAccounts={[]}
      />
    );

    expect(
      screen.getByRole('tab', { name: /Recipients/i })
    ).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('calls onSelect when a payee is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[mockIndividualPayee, mockBusinessPayee]}
        linkedAccounts={[]}
      />
    );

    const payeeButton = screen.getByRole('button', { name: /John Doe/i });
    await userEvent.click(payeeButton);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockIndividualPayee);
  });

  it('switches to linked accounts tab and displays linked accounts', async () => {
    const onSelect = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[mockIndividualPayee]}
        linkedAccounts={[mockLinkedAccount, mockLinkedAccountBusiness]}
      />
    );

    expect(
      screen.getByRole('tab', { name: /Linked Accounts/i })
    ).toBeInTheDocument();

    const linkedTab = screen.getByRole('tab', {
      name: /Linked Accounts/i,
    });
    await userEvent.click(linkedTab);

    expect(screen.getByText('My Savings')).toBeInTheDocument();
    expect(screen.getByText('Business Checking')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[]}
        linkedAccounts={[]}
        isLoading
      />
    );

    const spinner = container.querySelector('.eb-animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows restriction warning banner when showRestrictionWarning is true', () => {
    const onSelect = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[]}
        linkedAccounts={[mockLinkedAccount]}
        showRestrictionWarning
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Recipient cleared/)).toBeInTheDocument();
  });

  it('shows error state for recipients with retry button', async () => {
    const onSelect = vi.fn();
    const onRetry = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[]}
        linkedAccounts={[]}
        recipientsError
        onRetryRecipients={onRetry}
      />
    );

    expect(
      screen.getByText(/Unable to load recipients/)
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    await userEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onAddRecipient when add new recipient button is clicked', async () => {
    const onSelect = vi.fn();
    const onAddRecipient = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        onAddRecipient={onAddRecipient}
        recipients={[]}
        linkedAccounts={[]}
      />
    );

    const addButton = screen.getByRole('button', {
      name: /Add New Recipient/i,
    });
    await userEvent.click(addButton);
    expect(onAddRecipient).toHaveBeenCalledTimes(1);
  });

  it('defaults to linked-accounts tab when recipientsRestricted is true', () => {
    const onSelect = vi.fn();
    render(
      <PayeeSelector
        selectedPayeeId={undefined}
        onSelect={onSelect}
        recipients={[mockIndividualPayee]}
        linkedAccounts={[mockLinkedAccount]}
        recipientsRestricted
      />
    );

    expect(screen.getByText('My Savings')).toBeInTheDocument();
  });
});
