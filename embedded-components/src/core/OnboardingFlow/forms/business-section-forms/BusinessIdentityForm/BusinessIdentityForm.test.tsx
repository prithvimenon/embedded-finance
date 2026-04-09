import { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  createLLCMockClient,
  createMockOnboardingContext,
  createTestQueryClient,
  mockFlowContext,
} from '@/core/OnboardingFlow/forms/__test-helpers__/formTestUtils';

import { BusinessIdentityForm } from './BusinessIdentityForm';
import { useBusinessIdentityFormSchema } from './BusinessIdentityForm.schema';

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: vi.fn(),
  };
});

const renderForm = (
  defaultValues?: Record<string, unknown>,
  onboardingOverrides?: Partial<OnboardingContextType>
) => {
  const queryClient = createTestQueryClient();
  const onboardingContext = createMockOnboardingContext(onboardingOverrides);

  (
    FlowContextModule.useFlowContext as ReturnType<typeof vi.fn>
  ).mockReturnValue(mockFlowContext);

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const schema = useBusinessIdentityFormSchema();
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        organizationName: '',
        dbaName: '',
        dbaNameNotAvailable: false,
        yearOfFormation: '',
        countryOfFormation: 'US',
        organizationIdEin: '',
        solePropHasEin: '',
        website: '',
        websiteNotAvailable: false,
        ...defaultValues,
      },
      mode: 'onBlur',
    });
    return <FormProvider {...form}>{children}</FormProvider>;
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider value={onboardingContext}>
        <Wrapper>
          <BusinessIdentityForm />
        </Wrapper>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('BusinessIdentityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('field rendering', () => {
    test('renders organization name text field', () => {
      renderForm();
      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs.length).toBeGreaterThanOrEqual(1);
    });

    test('renders DBA name field and checkbox', () => {
      renderForm();
      const checkboxes = screen.getAllByRole('checkbox');
      // dbaNameNotAvailable checkbox
      expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    });

    test('renders year of formation field', () => {
      renderForm();
      // yearOfFormation is a text input with maxLength 4
      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs.length).toBeGreaterThanOrEqual(2);
    });

    test('renders country of formation combobox', () => {
      renderForm();
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    test('renders EIN field when country is US', () => {
      renderForm({ countryOfFormation: 'US' });
      // solePropHasEin radio group should be rendered for US
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBeGreaterThanOrEqual(2);
    });

    test('does not render EIN-related fields when country is not US', () => {
      renderForm({ countryOfFormation: 'GB' });
      const radioButtons = screen.queryAllByRole('radio');
      expect(radioButtons.length).toBe(0);
    });
  });

  describe('conditional fields', () => {
    test('shows website field when country is US', () => {
      renderForm({ countryOfFormation: 'US' });
      // Website + websiteNotAvailable checkbox should be visible
      const checkboxes = screen.getAllByRole('checkbox');
      // dbaNameNotAvailable + websiteNotAvailable = 2
      expect(checkboxes.length).toBe(2);
    });

    test('shows informative alert about country restriction', () => {
      renderForm();
      // Alert should be visible
      const alertElements = document.querySelectorAll('[role="alert"]');
      expect(alertElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('pre-populated data', () => {
    test('renders with pre-populated organization name for non-sole-prop', () => {
      renderForm(
        { organizationName: 'Acme Corp' },
        {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          clientData: createLLCMockClient,
        }
      );
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    });

    test('renders with pre-populated year of formation', () => {
      renderForm({ yearOfFormation: '2020' });
      expect(screen.getByDisplayValue('2020')).toBeInTheDocument();
    });

    test('renders DBA name as organization name when dbaNameNotAvailable is true', async () => {
      renderForm({
        organizationName: 'Test Business',
        dbaNameNotAvailable: true,
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
      });
    });
  });

  describe('static properties', () => {
    test('has schema property', () => {
      expect(BusinessIdentityForm.schema).toBe(useBusinessIdentityFormSchema);
    });

    test('has refineSchemaFn property', () => {
      expect(BusinessIdentityForm.refineSchemaFn).toBeDefined();
    });

    test('modifyFormValuesBeforeSubmit removes EIN when solePropHasEin is no', () => {
      const result = BusinessIdentityForm.modifyFormValuesBeforeSubmit?.(
        {
          solePropHasEin: 'no',
          organizationIdEin: '123456789',
          organizationName: 'Test',
        },
        {}
      );
      expect(result?.organizationIdEin).toBeUndefined();
    });

    test('modifyFormValuesBeforeSubmit keeps EIN when solePropHasEin is yes', () => {
      const result = BusinessIdentityForm.modifyFormValuesBeforeSubmit?.(
        {
          solePropHasEin: 'yes',
          organizationIdEin: '123456789',
          organizationName: 'Test',
        },
        {}
      );
      expect(result?.organizationIdEin).toBe('123456789');
    });
  });
});
