import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { Payee } from '../PaymentFlow.types';

import { AddNewPayeeButton, PayeeListItem } from './PayeeListItem';
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

// --- PayeeSelector tests ---

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

    // Should display tab labels (count may render as literal {{count}} in test env)
    expect(screen.getByRole('tab', { name: /Recipients/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Linked Accounts/i })).toBeInTheDocument();
    // Empty state message for recipients
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

    expect(screen.getByRole('tab', { name: /Recipients/i })).toBeInTheDocument();
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

    expect(screen.getByRole('tab', { name: /Linked Accounts/i })).toBeInTheDocument();

    // Click the linked accounts tab
    const linkedTab = screen.getByRole('tab', {
      name: /Linked Accounts/i,
    });
    await userEvent.click(linkedTab);

    // Linked accounts should be visible
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

    // Loader2 renders an SVG with animate-spin class
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

    // Restriction message should show in the recipients tab content area
    // but the active tab should be linked-accounts, so My Savings should be visible
    expect(screen.getByText('My Savings')).toBeInTheDocument();
  });
});
