import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { LinkAccountForm } from './LinkAccountForm';

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <EBComponentsProvider apiBaseUrl="" headers={{}}>
      {ui}
    </EBComponentsProvider>
  );
}

describe('LinkAccountForm', () => {
  it('renders form fields and buttons', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <LinkAccountForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(screen.getByText('Link My Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Nickname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Routing Number/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Link Account/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cancel/i })
    ).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <LinkAccountForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows validation errors when submitting empty form', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <LinkAccountForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Link Account/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/Account nickname is required/)).toBeInTheDocument();
      expect(screen.getByText(/Account number is required/)).toBeInTheDocument();
      expect(screen.getByText(/Routing number must be 9 digits/)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid form data', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <LinkAccountForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    await userEvent.type(
      screen.getByLabelText(/Account Nickname/i),
      'My Chase Savings'
    );
    await userEvent.type(
      screen.getByLabelText(/Account Number/i),
      '123456789'
    );
    await userEvent.type(
      screen.getByLabelText(/Routing Number/i),
      '021000021'
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Link Account/i })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          nickname: 'My Chase Savings',
          accountNumber: '123456789',
          routingNumber: '021000021',
        },
        expect.anything()
      );
    });
  });

  it('shows Plaid connect option when onConnectWithPlaid is provided', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const onConnectWithPlaid = vi.fn();
    renderWithProvider(
      <LinkAccountForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        onConnectWithPlaid={onConnectWithPlaid}
      />
    );

    expect(screen.getByText('Connect with Plaid')).toBeInTheDocument();
    expect(
      screen.getByText('Or enter details manually')
    ).toBeInTheDocument();
  });

  it('calls onConnectWithPlaid when Plaid button is clicked', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const onConnectWithPlaid = vi.fn();
    renderWithProvider(
      <LinkAccountForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        onConnectWithPlaid={onConnectWithPlaid}
      />
    );

    await userEvent.click(screen.getByText('Connect with Plaid'));
    expect(onConnectWithPlaid).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProvider(
      <LinkAccountForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting
      />
    );

    expect(
      screen.getByRole('button', { name: /Linking.../i })
    ).toBeDisabled();
  });
});
