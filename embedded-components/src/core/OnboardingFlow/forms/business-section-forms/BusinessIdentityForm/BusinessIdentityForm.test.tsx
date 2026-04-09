import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: {
      id: 'client-1',
      parties: [
        {
          id: 'org-1',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
          organizationDetails: {
            organizationName: 'Test Corp',
          },
        },
      ],
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
  useGetValidationMessage: () => (key: string) => `${key} is invalid`,
  useGetFieldContentToken: () => (fieldName: string, tokenId: string) => `${fieldName}.${tokenId}`,
  convertPartyResponseToFormValues: () => ({}),
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

import { BusinessIdentityForm } from './BusinessIdentityForm';

describe('BusinessIdentityForm', () => {
  const renderForm = () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          organizationName: '',
          dbaName: '',
          yearOfFormation: '',
          organizationIds: [],
          websiteAvailable: true,
          website: '',
          countryOfFormation: 'US',
        },
      });
      return (
        <FormProvider {...methods}>
          <BusinessIdentityForm />
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
