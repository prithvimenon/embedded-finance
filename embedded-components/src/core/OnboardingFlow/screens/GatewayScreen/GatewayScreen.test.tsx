import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GatewayScreen } from './GatewayScreen';

vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: undefined,
    setClientId: vi.fn(),
    onPostClientSettled: vi.fn(),
    onPostPartySettled: vi.fn(),
  }),
  useFlowContext: () => ({
    currentScreenId: 'gateway',
    goTo: vi.fn(),
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    availableOrganizationTypes: [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
      'C_CORPORATION',
    ],
    setOrganizationType: vi.fn(),
    sessionData: {},
    updateSessionData: vi.fn(),
    sections: [],
    savedFormValues: {},
    setCurrentStepperStepIdFallback: vi.fn(),
    setIsFormSubmitting: vi.fn(),
  }),
}));

vi.mock('@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync', () => ({
  useFlowUnsavedChangesSync: vi.fn(),
}));

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();
  return {
    ...actual,
    useFormState: () => ({ isDirty: false }),
    FormProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

vi.mock(
  '@/core/OnboardingFlow/components/OnboardingFormField/OnboardingFormField',
  () => ({
    OnboardingFormField: ({ name }: { name: string }) => (
      <div data-testid={`field-${name}`}>{name}</div>
    ),
  })
);

vi.mock('@/core/OnboardingFlow/utils/formUtils', () => ({
  useFormWithFilters: () => ({
    control: {},
    handleSubmit: vi.fn((fn) => (e: any) => {
      e?.preventDefault?.();
      return fn({});
    }),
    watch: vi.fn(() => ''),
    getValues: vi.fn(),
    setValue: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),
    reset: vi.fn(),
    formState: { errors: {}, isDirty: false },
  }),
  setApiFormErrors: vi.fn(),
  convertClientResponseToFormValues: vi.fn(() => ({})),
  shapeFormValuesBySchema: vi.fn((v: any) => v),
  useFormUtils: () => ({
    getFieldRule: () => ({
      ruleType: 'single',
      fieldRule: {
        display: 'visible',
        interaction: 'enabled',
        required: false,
        contentTokenOverrides: {},
        contentTokenOverrideKey: 'default',
      },
    }),
  }),
}));

vi.mock('@/core/OnboardingFlow/utils/dataUtils', () => ({
  getOrganizationParty: () => undefined,
}));

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoPostClient: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  useSmbdoPostClients: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  useSmbdoUpdateClientLegacy: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  useUpdatePartyLegacy: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  useSmbdoUpdateParty: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  getSmbdoGetClientQueryKey: () => ['client'],
}));

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[], opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      const k = Array.isArray(key) ? key[0] : key;
      // Return meaningful values for common keys
      if (k.includes('gateway.title')) return "Let's help you get started";
      if (k.includes('gateway.infoAlert.title'))
        return "Let's help you get started";
      return k;
    },
    tString: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock('@/components/LearnMorePopover', () => ({
  InfoPopover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/ServerErrorAlert', () => ({
  ServerErrorAlert: () => null,
}));

describe('GatewayScreen', () => {
  it('renders without crashing', () => {
    render(<GatewayScreen />);
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders the gateway form', () => {
    render(<GatewayScreen />);
    // The gateway screen should render a form
    expect(document.querySelector('form')).toBeInTheDocument();
  });
});
