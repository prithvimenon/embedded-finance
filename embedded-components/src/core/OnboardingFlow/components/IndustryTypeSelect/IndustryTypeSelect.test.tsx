import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
    tString: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

// Mock react-window to render items normally
vi.mock('react-window', () => ({
  VariableSizeList: ({
    children: Row,
    itemCount,
  }: {
    children: any;
    itemCount: number;
  }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: Math.min(itemCount, 5) }, (_, i) => (
        <Row key={i} index={i} style={{}} />
      ))}
    </div>
  ),
}));

import { IndustryTypeSelect } from './IndustryTypeSelect';

describe('IndustryTypeSelect', () => {
  it('renders the combobox trigger button', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { industryType: '' },
      });
      const field = {
        value: '',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name: 'industryType',
        ref: vi.fn(),
      };
      return (
        <FormProvider {...methods}>
          <IndustryTypeSelect
            field={field as any}
            onChange={vi.fn()}
            placeholder="Select industry type"
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays selected value when field has a value', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { industryType: '111110' },
      });
      const field = {
        value: '111110',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name: 'industryType',
        ref: vi.fn(),
      };
      return (
        <FormProvider {...methods}>
          <IndustryTypeSelect field={field as any} onChange={vi.fn()} />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    // Should display the code in brackets
    expect(screen.getByText(/\[111110\]/)).toBeInTheDocument();
  });

  it('shows placeholder when no value selected', () => {
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { industryType: '' },
      });
      const field = {
        value: '',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name: 'industryType',
        ref: vi.fn(),
      };
      return (
        <FormProvider {...methods}>
          <IndustryTypeSelect
            field={field as any}
            onChange={vi.fn()}
            placeholder="Choose an industry"
          />
        </FormProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('Choose an industry')).toBeInTheDocument();
  });
});
