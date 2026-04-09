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

import { ContactDetailsForm } from './ContactDetailsForm';
import { useContactDetailsFormSchema } from './ContactDetailsForm.schema';

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
  ).mockReturnValue({
    ...mockFlowContext,
    currentScreenId: 'personal-section',
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const schema = useContactDetailsFormSchema();
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        controllerEmail: '',
        controllerPhone: {
          phoneType: 'MOBILE_PHONE',
          phoneNumber: '',
        },
        individualAddress: {
          addressType: 'RESIDENTIAL_ADDRESS',
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
          <ContactDetailsForm />
        </Wrapper>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('ContactDetailsForm', () => {
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

    test('renders address text fields', () => {
      renderForm();
      const textInputs = screen.getAllByRole('textbox');
      // primaryAddressLine, secondaryAddressLine, tertiaryAddressLine, city, postalCode
      expect(textInputs.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('pre-populated data', () => {
    test('renders with pre-populated email', () => {
      renderForm({
        controllerEmail: 'john@example.com',
      });
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    test('renders with pre-populated address fields', () => {
      renderForm({
        individualAddress: {
          addressType: 'RESIDENTIAL_ADDRESS',
          country: 'US',
          primaryAddressLine: '456 Oak Ave',
          secondaryAddressLine: 'Apt 2B',
          tertiaryAddressLine: '',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
        },
      });
      expect(screen.getByDisplayValue('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Apt 2B')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Chicago')).toBeInTheDocument();
      expect(screen.getByDisplayValue('60601')).toBeInTheDocument();
    });
  });

  describe('static properties', () => {
    test('has schema property', () => {
      expect(ContactDetailsForm.schema).toBe(useContactDetailsFormSchema);
    });
  });
});
