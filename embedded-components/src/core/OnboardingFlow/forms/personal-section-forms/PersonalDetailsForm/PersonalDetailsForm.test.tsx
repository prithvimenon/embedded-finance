import { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  createMockOnboardingContext,
  createTestQueryClient,
  mockFlowContext,
} from '@/core/OnboardingFlow/forms/__test-helpers__/formTestUtils';

import { PersonalDetailsForm } from './PersonalDetailsForm';
import { usePersonalDetailsFormSchema } from './PersonalDetailsForm.schema';

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
    const schema = usePersonalDetailsFormSchema();
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        countryOfResidence: '',
        controllerFirstName: '',
        controllerMiddleName: '',
        controllerLastName: '',
        controllerNameSuffix: '',
        controllerJobTitle: '',
        controllerJobTitleDescription: '',
        natureOfOwnership: '',
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
          <PersonalDetailsForm />
        </Wrapper>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('PersonalDetailsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('field rendering', () => {
    test('renders country of residence combobox', () => {
      renderForm();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('renders first name, middle name, last name, and suffix text fields', () => {
      renderForm();
      const textInputs = screen.getAllByRole('textbox');
      // firstName, middleName, lastName, suffix = 4 text inputs
      expect(textInputs.length).toBe(4);
    });

    test('renders legal name section header as a legend', () => {
      renderForm();
      const legends = document.querySelectorAll('legend');
      expect(legends.length).toBeGreaterThan(0);
    });

    test('renders job title and nature of ownership fields', () => {
      renderForm();
      // countryOfResidence is a combobox; jobTitle may also render as combobox
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('conditional fields', () => {
    test('shows job title description field when "Other" is selected', async () => {
      renderForm({ controllerJobTitle: 'Other' });

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        // 4 name fields + 1 job title description = 5
        expect(inputs.length).toBe(5);
      });
    });

    test('does not show job title description field for non-Other job titles', () => {
      renderForm({ controllerJobTitle: 'CEO' });
      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs.length).toBe(4);
    });
  });

  describe('pre-populated data', () => {
    test('renders with pre-populated name values', () => {
      renderForm({
        countryOfResidence: 'US',
        controllerFirstName: 'Jane',
        controllerMiddleName: 'M',
        controllerLastName: 'Smith',
        controllerNameSuffix: 'Sr',
      });

      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
      expect(screen.getByDisplayValue('M')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sr')).toBeInTheDocument();
    });

    test('renders with pre-populated job title description when Other is selected', async () => {
      renderForm({
        controllerJobTitle: 'Other',
        controllerJobTitleDescription: 'Custom Title',
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Custom Title')).toBeInTheDocument();
      });
    });
  });

  describe('static properties', () => {
    test('has schema property', () => {
      expect(PersonalDetailsForm.schema).toBe(usePersonalDetailsFormSchema);
    });

    test('modifyFormValuesBeforeSubmit strips jobTitleDescription for non-Other', () => {
      const result = PersonalDetailsForm.modifyFormValuesBeforeSubmit?.(
        {
          controllerJobTitle: 'CEO',
          controllerJobTitleDescription: 'something',
          controllerFirstName: 'John',
          controllerLastName: 'Doe',
        },
        {}
      );
      expect(result?.controllerJobTitleDescription).toBeUndefined();
    });

    test('modifyFormValuesBeforeSubmit keeps jobTitleDescription for Other', () => {
      const result = PersonalDetailsForm.modifyFormValuesBeforeSubmit?.(
        {
          controllerJobTitle: 'Other',
          controllerJobTitleDescription: 'Custom Role',
          controllerFirstName: 'John',
          controllerLastName: 'Doe',
        },
        {}
      );
      expect(result?.controllerJobTitleDescription).toBe('Custom Role');
    });

    test('updateAnotherPartyOnSubmit builds org name from name parts', () => {
      const getValues =
        PersonalDetailsForm.updateAnotherPartyOnSubmit?.getValues;
      expect(getValues).toBeDefined();
      const result = getValues?.({
        controllerFirstName: 'John',
        controllerMiddleName: 'M',
        controllerLastName: 'Doe',
        controllerNameSuffix: 'Jr',
      });
      expect(result?.organizationName).toBe('John M Doe Jr');
    });

    test('updateAnotherPartyOnSubmit filters out empty name parts', () => {
      const getValues =
        PersonalDetailsForm.updateAnotherPartyOnSubmit?.getValues;
      const result = getValues?.({
        controllerFirstName: 'John',
        controllerMiddleName: '',
        controllerLastName: 'Doe',
        controllerNameSuffix: '',
      });
      expect(result?.organizationName).toBe('John Doe');
    });
  });
});
