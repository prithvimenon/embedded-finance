import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { flowConfig } from '@/core/OnboardingFlow/config';
import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';

import { GatewayScreen } from './GatewayScreen';
import { GatewayScreenFormSchema } from './GatewayScreen.schema';

// Mock the flow context hook
vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: vi.fn(),
    useOnboardingContext: vi.fn(),
  };
});

// Mock API hooks used by GatewayScreen
vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoPostClients: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      error: null,
      status: 'idle',
    }),
    useSmbdoUpdateClientLegacy: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      error: null,
      status: 'idle',
    }),
    useUpdatePartyLegacy: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      error: null,
      status: 'idle',
    }),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockGoTo = vi.fn();
const mockUpdateSessionData = vi.fn();
const mockSetIsFormSubmitting = vi.fn();

const mockFlowContext = {
  currentScreenId: 'gateway' as const,
  originScreenId: null,
  goTo: mockGoTo,
  goBack: vi.fn(),
  editingPartyIds: {},
  updateEditingPartyId: vi.fn(),
  staticScreens: [],
  sections: [],
  sessionData: {},
  updateSessionData: mockUpdateSessionData,
  previouslyCompleted: false,
  reviewScreenOpenedSectionId: null,
  initialStepperStepId: null,
  currentStepperStepId: undefined,
  setCurrentStepperStepIdFallback: vi.fn(),
  setCurrentStepper: vi.fn(),
  currentStepperGoTo: vi.fn(),
  shortLabelOverride: null,
  savedFormValues: {},
  saveFormValue: vi.fn(),
  isFormSubmitting: false,
  setIsFormSubmitting: mockSetIsFormSubmitting,
  unsavedChangesRef: { current: false },
  setFlowUnsavedChanges: vi.fn(),
};

const mockOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: undefined,
};

const renderComponent = (
  onboardingOverride: Partial<OnboardingContextType> = {},
  flowContextOverride: Partial<typeof mockFlowContext> = {}
) => {
  vi.mocked(FlowContextModule.useFlowContext).mockReturnValue({
    ...mockFlowContext,
    ...flowContextOverride,
  });

  const onboardingContext: OnboardingContextType = {
    ...mockOnboardingContext,
    ...onboardingOverride,
  };

  vi.mocked(FlowContextModule.useOnboardingContext).mockReturnValue(
    onboardingContext
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider value={onboardingContext}>
        <FlowContextModule.FlowProvider
          initialScreenId="gateway"
          flowConfig={flowConfig}
        >
          <GatewayScreen />
        </FlowContextModule.FlowProvider>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('GatewayScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('renders the gateway screen with title and description', () => {
    renderComponent();

    // The screen should render with layout content
    expect(document.querySelector('form')).toBeTruthy();
    // The title text should be rendered
    expect(
      screen.getByText(/select your general business type/i)
    ).toBeInTheDocument();
  });

  test('renders the submit button', () => {
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: /submit|next|continue|get started/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  test('renders the informational alert when hideGatewayInfoAlert is false', () => {
    renderComponent({}, { sessionData: {} });

    // The close button for the info alert should be present
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  test('hides the informational alert when hideGatewayInfoAlert is true', () => {
    renderComponent({}, { sessionData: { hideGatewayInfoAlert: true } });

    // The close button for the info alert should not be present
    expect(
      screen.queryByRole('button', { name: /close/i })
    ).not.toBeInTheDocument();
  });

  test('dismisses the info alert when close button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({}, { sessionData: {} });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockUpdateSessionData).toHaveBeenCalledWith({
      hideGatewayInfoAlert: true,
    });
  });

  test('renders organization type radio options', () => {
    renderComponent();

    // Should show radio group options for organization types
    const radioGroup = document.querySelector('[role="radiogroup"]');
    expect(radioGroup).toBeTruthy();
  });

  test('renders with available organization types filter', () => {
    renderComponent({
      availableOrganizationTypes: [
        'LIMITED_LIABILITY_COMPANY',
        'C_CORPORATION',
      ],
    });

    // Component should render without crashing when availableOrganizationTypes is provided
    expect(document.querySelector('form')).toBeTruthy();
  });
});

describe('GatewayScreenFormSchema', () => {
  test('validates a valid SOLE_PROPRIETORSHIP selection', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'SOLE_PROPRIETORSHIP',
        specificOrganizationType: 'SOLE_PROPRIETORSHIP',
      },
    });
    expect(result.success).toBe(true);
  });

  test('validates a valid REGISTERED_BUSINESS with specific type', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(true);
  });

  test('validates a valid OTHER with specific type', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'OTHER',
        specificOrganizationType: 'NON_PROFIT_CORPORATION',
      },
    });
    expect(result.success).toBe(true);
  });

  test('rejects empty generalOrganizationType', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: '',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty specificOrganizationType', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid generalOrganizationType value', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'INVALID_TYPE',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing organizationTypeHierarchy', () => {
    const result = GatewayScreenFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
