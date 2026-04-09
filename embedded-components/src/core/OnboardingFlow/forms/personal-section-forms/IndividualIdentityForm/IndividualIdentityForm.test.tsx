import { render } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { IndividualIdentityForm } from './IndividualIdentityForm';

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
  useGetFieldContentToken: () => (fieldName: string, tokenId: string) =>
    `${fieldName}.${tokenId}`,
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

describe('IndividualIdentityForm', () => {
  const renderForm = () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          birthDate: '',
          controllerIds: [
            {
              idType: 'SSN',
              value: '',
              issuer: 'US',
            },
          ],
          solePropSsn: '',
        },
      });
      return (
        <FormProvider {...methods}>
          <IndividualIdentityForm />
        </FormProvider>
      );
    };
    return render(<TestComponent />);
  };

  it('renders without crashing', () => {
    renderForm();
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders form elements for identity fields', () => {
    renderForm();
    // Should have some input or form elements
    const formElements = document.querySelectorAll('input, button, select');
    expect(formElements.length).toBeGreaterThan(0);
  });
});
