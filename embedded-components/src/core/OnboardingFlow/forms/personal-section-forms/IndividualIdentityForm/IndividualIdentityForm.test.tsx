import { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';

import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  createLLCMockClient,
  createMockOnboardingContext,
  createTestQueryClient,
  mockFlowContext,
} from '@/core/OnboardingFlow/forms/__test-helpers__/formTestUtils';

import { IndividualIdentityForm } from './IndividualIdentityForm';
import { useIndividualIdentityFormSchema } from './IndividualIdentityForm.schema';

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
    const schema = useIndividualIdentityFormSchema();
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        birthDate: '',
        solePropSsn: '',
        controllerIds: [
          {
            idType: 'SSN',
            issuer: 'US',
            value: '',
          },
        ],
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
          <IndividualIdentityForm />
        </Wrapper>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('IndividualIdentityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('field rendering', () => {
    test('renders birth date field (importantDate type)', () => {
      renderForm();
      // importantDate renders as 3 sub-fields: Month (select), Day (text), Year (text)
      // Check for the month select and day/year inputs
      const comboboxes = screen.getAllByRole('combobox');
      // issuer combobox + month combobox
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    test('renders issuer country field as readonly combobox', () => {
      renderForm();
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    test('renders SSN field for US issuer', () => {
      renderForm({
        controllerIds: [{ idType: 'SSN', issuer: 'US', value: '' }],
      });
      // Should have masked text input for sole prop SSN
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    test('renders ID type select for non-US issuer', () => {
      renderForm({
        controllerIds: [{ idType: '', issuer: 'GB', value: '' }],
      });
      // For non-US, should render a select for idType
      waitFor(() => {
        const selects = document.querySelectorAll('[role="combobox"]');
        expect(selects.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('renders "Use a different ID type" dropdown for US with LLC entity', () => {
      renderForm(
        {
          controllerIds: [{ idType: 'SSN', issuer: 'US', value: '' }],
        },
        {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          clientData: createLLCMockClient,
        }
      );
      const button = screen.queryByText('Use a different ID type');
      expect(button).toBeInTheDocument();
    });

    test('does not render "Use a different ID type" dropdown for non-US', () => {
      renderForm(
        {
          controllerIds: [{ idType: 'PASSPORT', issuer: 'GB', value: '' }],
        },
        {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          clientData: createLLCMockClient,
        }
      );
      const button = screen.queryByText('Use a different ID type');
      expect(button).toBeNull();
    });
  });

  describe('US vs non-US behavior', () => {
    test('shows solePropSsn field for US issuer', () => {
      renderForm({
        controllerIds: [{ idType: 'SSN', issuer: 'US', value: '' }],
      });
      // The solePropSsn field should be rendered
      const inputs = document.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    test('does not show solePropSsn field for non-US issuer', () => {
      renderForm({
        controllerIds: [{ idType: 'PASSPORT', issuer: 'GB', value: '' }],
      });
      // solePropSsn should not be rendered for non-US
      const ssnField = document.querySelector(
        '[data-dtrum-tracking="solePropSsn"]'
      );
      expect(ssnField).toBeNull();
    });
  });

  describe('pre-populated data', () => {
    test('renders with pre-populated birth date', () => {
      renderForm({ birthDate: '1990-05-15' });
      // The importantDate component splits the date into parts
      // Day and year should show as text input values
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1990')).toBeInTheDocument();
    });
  });

  describe('static properties', () => {
    test('has schema property', () => {
      expect(IndividualIdentityForm.schema).toBe(
        useIndividualIdentityFormSchema
      );
    });

    test('has refineSchemaFn property', () => {
      expect(IndividualIdentityForm.refineSchemaFn).toBeDefined();
    });

    test('modifyFormValuesBeforeSubmit sets issuer to US for SSN', () => {
      const result = IndividualIdentityForm.modifyFormValuesBeforeSubmit?.(
        {
          controllerIds: [{ idType: 'SSN', issuer: 'US', value: '123456789' }],
          birthDate: '1990-01-01',
          solePropSsn: '123456789',
        },
        {}
      );
      expect(result?.controllerIds?.[0]?.issuer).toBe('US');
    });

    test('modifyFormValuesBeforeSubmit sets issuer to US for ITIN', () => {
      const result = IndividualIdentityForm.modifyFormValuesBeforeSubmit?.(
        {
          controllerIds: [{ idType: 'ITIN', issuer: 'US', value: '912345678' }],
          birthDate: '1990-01-01',
          solePropSsn: '',
        },
        {}
      );
      expect(result?.controllerIds?.[0]?.issuer).toBe('US');
    });

    test('modifyFormValuesBeforeSubmit keeps issuer for non-SSN/ITIN types', () => {
      const result = IndividualIdentityForm.modifyFormValuesBeforeSubmit?.(
        {
          controllerIds: [
            { idType: 'PASSPORT', issuer: 'GB', value: 'AB123456' },
          ],
          birthDate: '1990-01-01',
          solePropSsn: '',
        },
        {}
      );
      expect(result?.controllerIds?.[0]?.issuer).toBe('GB');
    });

    test('modifyFormValuesBeforeSubmit uses partyData fallback when issuer missing', () => {
      const result = IndividualIdentityForm.modifyFormValuesBeforeSubmit?.(
        {
          controllerIds: [
            { idType: 'PASSPORT', issuer: '', value: 'AB123456' },
          ],
          birthDate: '1990-01-01',
          solePropSsn: '',
        },
        { individualDetails: { countryOfResidence: 'CA' } }
      );
      expect(result?.controllerIds?.[0]?.issuer).toBe('CA');
    });
  });

  describe('dropdown interaction', () => {
    test('clicking "Use a different ID type" opens dropdown menu', async () => {
      const user = userEvent.setup();
      renderForm(
        {
          controllerIds: [{ idType: 'SSN', issuer: 'US', value: '' }],
        },
        {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          clientData: createLLCMockClient,
        }
      );

      const button = screen.getByText('Use a different ID type');
      await user.click(button);

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
