import { render } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: {
      id: 'client-1',
      parties: [],
      outstanding: { questionIds: [] },
    },
  }),
  useFlowContext: () => ({
    currentScreenId: 'personal-section',
    savedFormValues: {},
  }),
}));

vi.mock('@/core/OnboardingFlow/utils/formUtils', () => ({
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
  useGetValidationMessage: () => (key: string) => `${key} is invalid`,
  useGetFieldContentToken: () => (fieldName: string, tokenId: string) => `${fieldName}.${tokenId}`,
}));

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[], opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      return Array.isArray(key) ? key[0] : key;
    },
    tString: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
  }),
}));

vi.mock('@/components/LearnMorePopover', () => ({
  InfoPopover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { PersonalDetailsForm } from './PersonalDetailsForm';

describe('PersonalDetailsForm', () => {
  const renderForm = () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          countryOfResidence: 'US',
          controllerFirstName: '',
          controllerMiddleName: '',
          controllerLastName: '',
          controllerNameSuffix: '',
          controllerJobTitle: '',
          controllerJobTitleDescription: '',
          natureOfOwnership: '',
        },
      });
      return (
        <FormProvider {...methods}>
          <PersonalDetailsForm />
        </FormProvider>
      );
    };
    return render(<TestComponent />);
  };

  it('renders without crashing', () => {
    renderForm();
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders form input elements for personal details', () => {
    renderForm();
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('has static modifyFormValuesBeforeSubmit', () => {
    expect(PersonalDetailsForm.modifyFormValuesBeforeSubmit).toBeDefined();
  });

  it('modifyFormValuesBeforeSubmit removes jobTitleDescription when not Other', () => {
    const result = PersonalDetailsForm.modifyFormValuesBeforeSubmit!(
      {
        controllerJobTitle: 'CEO',
        controllerJobTitleDescription: 'Some description',
        controllerFirstName: 'John',
      },
      undefined
    );
    expect(result.controllerJobTitleDescription).toBeUndefined();
  });

  it('modifyFormValuesBeforeSubmit keeps jobTitleDescription when Other', () => {
    const result = PersonalDetailsForm.modifyFormValuesBeforeSubmit!(
      {
        controllerJobTitle: 'Other',
        controllerJobTitleDescription: 'Custom title',
        controllerFirstName: 'John',
      },
      undefined
    );
    expect(result.controllerJobTitleDescription).toBe('Custom title');
  });
});
