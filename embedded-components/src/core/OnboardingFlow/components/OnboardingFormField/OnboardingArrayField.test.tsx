import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingArrayField } from './OnboardingArrayField';

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
  }),
}));

vi.mock('@/core/OnboardingFlow/utils/formUtils', () => ({
  useFormUtilsWithClientContext: () => ({
    getFieldRule: () => ({
      ruleType: 'array',
      fieldRule: {
        display: 'visible',
        interaction: 'enabled',
        minItems: 0,
        maxItems: 5,
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

describe('OnboardingArrayField', () => {
  it('renders items from the field array', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          items: [{ value: 'Item 1' }, { value: 'Item 2' }],
        },
      });
      return (
        <FormProvider {...methods}>
          <OnboardingArrayField
            control={methods.control}
            name="items"
            disableFieldRuleMapping
            renderItem={({ field, index }) => (
              <div key={field.id} data-testid={`item-${index}`}>
                Item {index}
              </div>
            )}
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
  });

  it('renders append button via footer', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          items: [{ value: 'Item 1' }],
        },
      });
      return (
        <FormProvider {...methods}>
          <OnboardingArrayField
            control={methods.control}
            name="items"
            disableFieldRuleMapping
            appendValue={{ value: '' }}
            renderItem={({ field, index }) => (
              <div key={field.id}>Item {index}</div>
            )}
            renderFooter={({ renderAppendButton }) => (
              <div>{renderAppendButton({ children: 'Add Item' })}</div>
            )}
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    expect(
      screen.getByRole('button', { name: /Add Item/i })
    ).toBeInTheDocument();
  });

  it('returns null when display is hidden via disableFieldRuleMapping with no items', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          items: [] as { value: string }[],
        },
      });
      return (
        <FormProvider {...methods}>
          <OnboardingArrayField
            control={methods.control}
            name="items"
            disableFieldRuleMapping
            renderItem={({ field, index }) => (
              <div key={field.id}>Item {index}</div>
            )}
            renderFooter={() => null}
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    // With no items and no footer, nothing should render
    expect(screen.queryByText(/Item/)).not.toBeInTheDocument();
  });
});
