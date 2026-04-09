import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock all heavy dependencies
vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: {
      id: 'client-1',
      parties: [
        {
          id: 'party-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          active: true,
          individualDetails: { firstName: 'John', lastName: 'Doe' },
        },
      ],
      outstanding: { questionIds: [] },
      questionResponses: [],
    },
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    alertOnPreviousStep: false,
  }),
  useFlowContext: () => ({
    currentScreenId: 'personal-section',
    goTo: vi.fn(),
    goBack: vi.fn(),
    originScreenId: undefined,
    editingPartyIds: { 'personal-section': 'party-1' },
    updateEditingPartyId: vi.fn(),
    previouslyCompleted: false,
    updateSessionData: vi.fn(),
    initialStepperStepId: undefined,
    setCurrentStepper: vi.fn(),
    sections: [
      {
        id: 'personal-section',
        type: 'stepper',
        sectionConfig: { label: 'Personal Details', shortLabel: 'Personal' },
        stepperConfig: { steps: [] },
      },
    ],
    shortLabelOverride: undefined,
    savedFormValues: {},
    setCurrentStepperStepIdFallback: vi.fn(),
    setIsFormSubmitting: vi.fn(),
    unsavedChangesRef: { current: false },
    sessionData: {},
    reviewScreenOpenedSectionId: undefined,
  }),
}));

vi.mock('@stepperize/react', () => ({
  defineStepper: (...steps: any[]) => ({
    useStepper: () => ({
      current: steps[0],
      goTo: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
    }),
    utils: {
      getIndex: () => 0,
    },
  }),
}));

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();
  return {
    ...actual,
    useFormState: () => ({ isDirty: false, errors: {} }),
  };
});

vi.mock('@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync', () => ({
  useFlowUnsavedChangesSync: vi.fn(),
}));

vi.mock('@/core/OnboardingFlow/utils/flowUtils', () => ({
  getStepperValidation: () => ({
    stepValidationMap: {},
    allStepsValid: true,
  }),
  getStepperValidations: () => ({}),
  getFlowProgress: () => ({ sectionStatuses: {} }),
}));

vi.mock('@/core/OnboardingFlow/utils/formUtils', () => ({
  convertPartyResponseToFormValues: () => ({}),
  generateClientRequestBody: () => ({}),
  generatePartyRequestBody: () => ({}),
  mapClientApiErrorsToFormErrors: () => ({}),
  mapPartyApiErrorsToFormErrors: () => ({}),
  setApiFormErrors: vi.fn(),
  useFormWithFilters: () => {
    const control = {
      _subjects: {
        state: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
        values: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
        array: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
      },
      _subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      _getWatch: vi.fn(() => ({})),
      _formState: { isDirty: false, errors: {} },
      _state: { mount: true },
      _names: { mount: new Set(), array: new Set(), watch: new Set() },
      _options: { mode: 'onSubmit' },
      register: vi.fn(),
      unregister: vi.fn(),
      getFieldState: vi.fn(() => ({
        invalid: false,
        isDirty: false,
        isTouched: false,
        error: undefined,
      })),
    };
    return {
      control,
      handleSubmit: vi.fn((fn: any) => (e: any) => {
        e?.preventDefault?.();
        fn({});
      }),
      watch: vi.fn(() => ''),
      getValues: vi.fn(() => ({})),
      setValue: vi.fn(),
      setError: vi.fn(),
      clearErrors: vi.fn(),
      formState: { errors: {}, isDirty: false },
      reset: vi.fn(),
    };
  },
  useFormUtils: () => ({
    getFieldRule: () => ({
      ruleType: 'single',
      fieldRule: { display: 'visible', interaction: 'enabled' },
    }),
  }),
}));

vi.mock('@/core/OnboardingFlow/utils/dataUtils', () => ({
  getPartyByAssociatedPartyFilters: () => ({ id: 'party-1' }),
}));

vi.mock('@/core/OnboardingFlow/utils/flowLeaveWarnings', () => ({
  shouldSuppressOnboardingLeaveWarnings: () => false,
}));

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoUpdateClientLegacy: () => ({
    mutate: vi.fn(),
    error: null,
    status: 'idle',
  }),
  useUpdatePartyLegacy: () => ({
    mutate: vi.fn(),
    error: null,
    status: 'idle',
  }),
  getSmbdoGetClientQueryKey: () => ['client'],
}));

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
    tString: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

import { StepperRenderer } from './StepperRenderer';

describe('StepperRenderer', () => {
  const mockSteps = [
    {
      id: 'step-1',
      title: 'Step One Title',
      description: 'Step one description',
      stepType: 'form' as const,
      Component: Object.assign(() => <div>Form Content</div>, {
        schema: () => ({}),
      }),
    },
  ];

  it('renders without crashing', () => {
    render(<StepperRenderer steps={mockSteps} />);
    expect(screen.getByText('Step One Title')).toBeInTheDocument();
  });

  it('renders step description', () => {
    render(<StepperRenderer steps={mockSteps} />);
    expect(screen.getByText('Step one description')).toBeInTheDocument();
  });

  it('displays step counter information', () => {
    render(<StepperRenderer steps={mockSteps} />);
    // The component renders section label and step counter
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });
});
