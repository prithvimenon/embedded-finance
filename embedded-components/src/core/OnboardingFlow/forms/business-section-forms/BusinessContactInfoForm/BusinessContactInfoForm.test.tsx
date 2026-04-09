import { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  createMockOnboardingContext,
  createTestQueryClient,
  mockFlowContext,
} from '@/core/OnboardingFlow/forms/__test-helpers__/formTestUtils';

import { BusinessContactInfoForm } from './BusinessContactInfoForm';
import { useBusinessContactInfoFormSchema } from './BusinessContactInfoForm.schema';

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
    const schema = useBusinessContactInfoFormSchema();
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        organizationEmail: '',
        organizationPhone: {
          phoneType: 'BUSINESS_PHONE',
          phoneNumber: '',
        },
        organizationAddress: {
          addressType: 'LEGAL_ADDRESS',
          country: 'US',
          primaryAddressLine: '',
          secondaryAddressLine: '',
          tertiaryAddressLine: '',
          city: '',
          state: '',
          postalCode: '',
        },
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
          <BusinessContactInfoForm />
        </Wrapper>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('BusinessContactInfoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('field rendering', () => {
    test('renders email input field', () => {
      renderForm();
      const emailInput = document.querySelector('input[type="email"]');
      expect(emailInput).toBeInTheDocument();
    });

    test('renders phone input field', () => {
      renderForm();
      const phoneInput = document.querySelector('input[type="tel"]');
      expect(phoneInput).toBeInTheDocument();
    });

    test('renders address section with legend', () => {
      renderForm();
      const legends = document.querySelectorAll('legend');
      expect(legends.length).toBeGreaterThan(0);
    });

    test('renders address country combobox', () => {
      renderForm();
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    test('renders address text fields (primary, secondary, tertiary address lines, city, postalCode)', () => {
      renderForm();
      const textInputs = screen.getAllByRole('textbox');
      // primaryAddressLine, secondaryAddressLine, tertiaryAddressLine, city, postalCode = at least 5
      expect(textInputs.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('pre-populated data', () => {
    test('renders with pre-populated email', () => {
      renderForm({
        organizationEmail: 'test@business.com',
      });
      expect(screen.getByDisplayValue('test@business.com')).toBeInTheDocument();
    });

    test('renders with pre-populated address fields', () => {
      renderForm({
        organizationAddress: {
          addressType: 'LEGAL_ADDRESS',
          country: 'US',
          primaryAddressLine: '123 Main St',
          secondaryAddressLine: 'Suite 100',
          tertiaryAddressLine: '',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
        },
      });
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Suite 100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10001')).toBeInTheDocument();
    });
  });

  describe('static properties', () => {
    test('has schema property', () => {
      expect(BusinessContactInfoForm.schema).toBe(
        useBusinessContactInfoFormSchema
      );
    });
  });
});
