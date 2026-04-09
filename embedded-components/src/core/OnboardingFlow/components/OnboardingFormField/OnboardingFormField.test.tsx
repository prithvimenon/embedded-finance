import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

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

import { OnboardingFormField } from './OnboardingFormField';

const Wrapper = ({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, any>;
}) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('OnboardingFormField', () => {
  it('renders a text field', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { testField: '' },
      });
      return (
        <FormProvider {...methods}>
          <OnboardingFormField
            control={methods.control}
            name="testField"
            type="text"
            label="Test Label"
            disableFieldRuleMapping
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders a select field with options', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { selectField: '' },
      });
      return (
        <FormProvider {...methods}>
          <OnboardingFormField
            control={methods.control}
            name="selectField"
            type="select"
            label="Select Label"
            options={[
              { value: 'opt1', label: 'Option 1' },
              { value: 'opt2', label: 'Option 2' },
            ]}
            disableFieldRuleMapping
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('Select Label')).toBeInTheDocument();
  });

  it('renders a checkbox field', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { checkField: false },
      });
      return (
        <FormProvider {...methods}>
          <OnboardingFormField
            control={methods.control}
            name="checkField"
            type="checkbox"
            label="Checkbox Label"
            disableFieldRuleMapping
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('Checkbox Label')).toBeInTheDocument();
  });

  it('renders with field rule mapping', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { controllerFirstName: '' },
      });
      return (
        <FormProvider {...methods}>
          <OnboardingFormField
            control={methods.control}
            name="controllerFirstName"
            type="text"
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    // Should render without crashing, using field rule mapping
    expect(document.querySelector('input')).toBeInTheDocument();
  });
});
