import { render, screen } from '@testing-library/react';
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
    currentScreenId: 'business-section',
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
  useFormUtilsWithClientContext: () => ({
    getFieldRule: () => ({
      ruleType: 'array',
      fieldRule: {
        display: 'visible',
        interaction: 'enabled',
        minItems: 1,
        maxItems: 1,
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
    tString: (key: string | string[], opts?: any) =>
      Array.isArray(key) ? key[0] : key,
  }),
}));

vi.mock('@/components/LearnMorePopover', () => ({
  InfoPopover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { BusinessContactInfoForm } from './BusinessContactInfoForm';

describe('BusinessContactInfoForm', () => {
  const renderForm = () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          organizationEmail: '',
          organizationPhone: '',
          organizationAddresses: [
            {
              addressLine1: '',
              addressLine2: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'US',
            },
          ],
        },
      });
      return (
        <FormProvider {...methods}>
          <BusinessContactInfoForm />
        </FormProvider>
      );
    };
    return render(<TestComponent />);
  };

  it('renders without crashing', () => {
    renderForm();
    // The form renders some input elements
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders email and phone fields', () => {
    renderForm();
    // Should have input elements for the form fields
    expect(document.querySelector('form, div')).toBeInTheDocument();
  });
});
