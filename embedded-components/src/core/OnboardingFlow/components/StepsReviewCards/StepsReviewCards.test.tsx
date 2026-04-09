import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: {
      id: 'client-1',
      parties: [],
      outstanding: { questionIds: [] },
      questionResponses: [],
    },
  }),
  useFlowContext: () => ({
    currentScreenId: 'personal-section',
    savedFormValues: {},
  }),
}));

vi.mock('@/core/OnboardingFlow/utils/flowUtils', () => ({
  getStepperValidation: () => ({
    stepValidationMap: {
      'step-1': { isValid: true, result: { success: true } },
      'step-2': { isValid: true, result: { success: true } },
    },
    allStepsValid: true,
  }),
}));

vi.mock('@/core/OnboardingFlow/utils/formUtils', () => ({
  convertPartyResponseToFormValues: () => ({}),
  useFormUtilsWithClientContext: () => ({
    modifySchema: (schema: any) => schema,
    getFieldRule: () => ({
      ruleType: 'single',
      fieldRule: { display: 'visible', interaction: 'enabled' },
    }),
  }),
}));

vi.mock('@/core/OnboardingFlow/config/fieldMap', () => ({
  partyFieldMap: {},
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

import { StepsReviewCards } from './StepsReviewCards';

describe('StepsReviewCards', () => {
  const mockOnEditClick = vi.fn();

  const mockSteps = [
    {
      id: 'step-1',
      title: 'Personal Details',
      stepType: 'form' as const,
      Component: Object.assign(() => <div>Form</div>, {
        schema: { shape: { controllerFirstName: {} } },
      }),
    },
  ];

  it('renders without crashing', () => {
    render(
      <StepsReviewCards
        steps={mockSteps}
        partyData={undefined}
        onEditClick={mockOnEditClick}
      />
    );
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
  });

  it('renders step title for each step', () => {
    const multipleSteps = [
      ...mockSteps,
      {
        id: 'step-2',
        title: 'Contact Info',
        stepType: 'form' as const,
        Component: Object.assign(() => <div>Form</div>, {
          schema: { shape: {} },
        }),
      },
    ];
    render(
      <StepsReviewCards
        steps={multipleSteps}
        partyData={undefined}
        onEditClick={mockOnEditClick}
      />
    );
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
  });

  it('filters out check-answers steps', () => {
    const stepsWithCheckAnswers = [
      ...mockSteps,
      {
        id: 'check-answers',
        title: 'Check Your Answers',
        stepType: 'check-answers' as const,
        Component: Object.assign(() => <div>Check</div>, {
          schema: { shape: {} },
        }),
      },
    ];
    render(
      <StepsReviewCards
        steps={stepsWithCheckAnswers}
        partyData={undefined}
        onEditClick={mockOnEditClick}
      />
    );
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.queryByText('Check Your Answers')).not.toBeInTheDocument();
  });

  it('renders edit buttons', () => {
    render(
      <StepsReviewCards
        steps={mockSteps}
        partyData={undefined}
        onEditClick={mockOnEditClick}
      />
    );
    // Valid steps show either "Change" or "Add" buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
