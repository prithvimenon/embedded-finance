import { render, screen } from '@testing-library/react';
import { userEvent } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { PayeeTypeSelector } from './PayeeTypeSelector';

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <EBComponentsProvider apiBaseUrl="" headers={{}}>
      {ui}
    </EBComponentsProvider>
  );
}

describe('PayeeTypeSelector', () => {
  it('renders both payee type options', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <PayeeTypeSelector onSelect={onSelect} onCancel={onCancel} />
    );

    expect(screen.getByText('Link My Account')).toBeInTheDocument();
    expect(screen.getByText('Add New Recipient')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onSelect with "link-account" when Link My Account is clicked', async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <PayeeTypeSelector onSelect={onSelect} onCancel={onCancel} />
    );

    await userEvent.click(screen.getByText('Link My Account'));
    expect(onSelect).toHaveBeenCalledWith('link-account');
  });

  it('calls onSelect with "add-recipient" when Add a Recipient is clicked', async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <PayeeTypeSelector onSelect={onSelect} onCancel={onCancel} />
    );

    await userEvent.click(screen.getByText('Add New Recipient'));
    expect(onSelect).toHaveBeenCalledWith('add-recipient');
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <PayeeTypeSelector onSelect={onSelect} onCancel={onCancel} />
    );

    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
