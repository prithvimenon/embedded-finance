import { render, screen } from '@testing-library/react';
import { userEvent } from '@test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';

import { BankAccountFormWrapper } from './BankAccountFormWrapper';

vi.mock(
  '@/core/EBComponentsProvider/EBComponentsProvider',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/core/EBComponentsProvider/EBComponentsProvider')
      >();
    return {
      ...actual,
      useClientId: () => 'client-1',
      useInterceptorStatus: () => ({ interceptorReady: true }),
    };
  }
);

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoGetClient: vi.fn(),
}));

vi.mock('@/core/RecipientWidgets/hooks/useRecipientForm', () => ({
  useRecipientForm: vi.fn(),
}));

vi.mock('@/core/RecipientWidgets/components/BankAccountForm', () => ({
  BankAccountForm: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="bank-account-form">
      <span data-testid="config-submit-text">
        {(props.config as { content?: { submitButtonText?: string } })?.content
          ?.submitButtonText ?? ''}
      </span>
      <span data-testid="form-embedded">{String(props.embedded)}</span>
      <span data-testid="form-show-card">{String(props.showCard)}</span>
      <button
        type="button"
        data-testid="mock-submit"
        onClick={() =>
          (props.onSubmit as (data: Record<string, unknown>) => void)?.({
            accountType: 'INDIVIDUAL',
            firstName: 'Jane',
            lastName: 'Smith',
            accountNumber: '123456789',
            bankAccountType: 'CHECKING',
            routingNumbers: [
              { paymentType: 'ACH', routingNumber: '021000021' },
            ],
            paymentTypes: ['ACH'],
          })
        }
      >
        Submit
      </button>
      <button
        type="button"
        data-testid="mock-cancel"
        onClick={() => (props.onCancel as () => void)?.()}
      >
        Cancel
      </button>
    </div>
  )),
  useLinkedAccountConfig: vi.fn(() => ({
    paymentMethods: { available: ['ACH'], defaultSelected: ['ACH'] },
    content: { submitButtonText: 'Link Account', cancelButtonText: 'Cancel' },
  })),
  useRecipientConfig: vi.fn(() => ({
    paymentMethods: {
      available: ['ACH', 'WIRE', 'RTP'],
      defaultSelected: ['ACH'],
    },
    content: { submitButtonText: 'Add Recipient', cancelButtonText: 'Cancel' },
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockSubmit = vi.fn();
const mockReset = vi.fn();

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <EBComponentsProvider apiBaseUrl="" headers={{}}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </EBComponentsProvider>
  );
}

describe('BankAccountFormWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(useSmbdoGetClient).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useSmbdoGetClient>);

    vi.mocked(useRecipientForm).mockReturnValue({
      submit: mockSubmit,
      status: 'idle',
      error: null,
      reset: mockReset,
      isPending: false,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useRecipientForm>);
  });

  it('renders linked-account form with correct header', () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="linked-account"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Link My Account')).toBeInTheDocument();
    expect(screen.getByTestId('bank-account-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-embedded')).toHaveTextContent('true');
    expect(screen.getByTestId('form-show-card')).toHaveTextContent('false');
  });

  it('renders recipient form with correct header', () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="recipient"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Add New Recipient')).toBeInTheDocument();
  });

  it('renders edit header when isEditing is true', () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="recipient"
        onSuccess={onSuccess}
        onCancel={onCancel}
        isEditing
      />
    );

    expect(screen.getByText('Edit Recipient')).toBeInTheDocument();
  });

  it('calls onCancel and resets form when cancel is triggered', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="linked-account"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByTestId('mock-cancel'));
    expect(mockReset).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('submits via API for linked-account form type', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="linked-account"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByTestId('mock-submit'));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: 'INDIVIDUAL',
        firstName: 'Jane',
        lastName: 'Smith',
        accountNumber: '123456789',
      })
    );
  });

  it('shows confirmation step for recipient with onSubmitWithoutSave', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onSubmitWithoutSave = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="recipient"
        onSuccess={onSuccess}
        onCancel={onCancel}
        onSubmitWithoutSave={onSubmitWithoutSave}
      />
    );

    // Trigger form submit to go to confirmation
    await userEvent.click(screen.getByTestId('mock-submit'));

    // Should show confirmation step
    expect(screen.getByText('Save Recipient?')).toBeInTheDocument();
    expect(screen.getByText('Save & Continue')).toBeInTheDocument();
    expect(screen.getByText('Use Once')).toBeInTheDocument();
  });

  it('calls onSubmitWithoutSave when Use Once is clicked', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onSubmitWithoutSave = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="recipient"
        onSuccess={onSuccess}
        onCancel={onCancel}
        onSubmitWithoutSave={onSubmitWithoutSave}
      />
    );

    // Go to confirmation
    await userEvent.click(screen.getByTestId('mock-submit'));
    expect(screen.getByText('Save Recipient?')).toBeInTheDocument();

    // Click Use Once
    await userEvent.click(screen.getByText('Use Once'));
    expect(onSubmitWithoutSave).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Jane Smith',
        accountNumber: '123456789',
        routingNumber: '021000021',
        enabledPaymentMethods: ['ACH'],
      })
    );
  });

  it('shows switch-to-recipient link for linked-account type', () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onSwitchToRecipient = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="linked-account"
        onSuccess={onSuccess}
        onCancel={onCancel}
        onSwitchToRecipient={onSwitchToRecipient}
      />
    );

    expect(
      screen.getByText('Or add an external recipient instead')
    ).toBeInTheDocument();
  });

  it('shows switch-to-linked-account link for recipient type', () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onSwitchToLinkedAccount = vi.fn();
    renderWithProviders(
      <BankAccountFormWrapper
        formType="recipient"
        onSuccess={onSuccess}
        onCancel={onCancel}
        onSwitchToLinkedAccount={onSwitchToLinkedAccount}
      />
    );

    expect(
      screen.getByText('Or link my account instead')
    ).toBeInTheDocument();
  });
});
