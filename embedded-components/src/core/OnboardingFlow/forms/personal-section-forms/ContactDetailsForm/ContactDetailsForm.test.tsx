import { render } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { ContactDetailsForm } from './ContactDetailsForm';

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
  useGetFieldContentToken: () => (fieldName: string, tokenId: string) =>
    `${fieldName}.${tokenId}`,
}));

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[], opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      return Array.isArray(key) ? key[0] : key;
    },
    tString: (key: string | string[], _opts?: any) =>
      Array.isArray(key) ? key[0] : key,
  }),
}));

vi.mock('@/components/LearnMorePopover', () => ({
  InfoPopover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('ContactDetailsForm', () => {
  const renderForm = () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          controllerEmail: '',
          controllerPhone: '',
          controllerAddresses: [
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
          <ContactDetailsForm />
        </FormProvider>
      );
    };
    return render(<TestComponent />);
  };

  it('renders without crashing', () => {
    renderForm();
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders form input elements', () => {
    renderForm();
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
