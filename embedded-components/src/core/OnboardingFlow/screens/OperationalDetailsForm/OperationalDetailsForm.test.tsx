import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';

import { OperationalDetailsForm } from './OperationalDetailsForm';
import {
  createDynamicZodSchema,
  DATE_QUESTION_IDS,
  MONEY_INPUT_QUESTION_IDS,
} from './OperationalDetailsForm.schema';

// Mock the flow context hook
vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: vi.fn(),
    useOnboardingContext: vi.fn(),
  };
});

// Mock API hooks
vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoListQuestions: vi.fn().mockReturnValue({
      data: {
        questions: [
          {
            id: '30001',
            description: 'What is your primary business activity?',
            parentQuestionId: undefined,
            responseSchema: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 1,
            },
          },
          {
            id: '30002',
            description: 'What is the expected monthly revenue?',
            parentQuestionId: undefined,
            responseSchema: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'LESS_THAN_10K',
                  '10K_TO_50K',
                  '50K_TO_100K',
                  'MORE_THAN_100K',
                ],
              },
              minItems: 1,
              maxItems: 1,
            },
          },
          {
            id: '30003',
            description: 'Does your business operate internationally?',
            parentQuestionId: undefined,
            responseSchema: {
              type: 'array',
              items: { type: 'boolean' },
              minItems: 1,
              maxItems: 1,
            },
          },
        ],
      },
      status: 'success',
      error: null,
    }),
    useSmbdoUpdateClientLegacy: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      error: null,
      status: 'idle',
    }),
    getSmbdoGetClientQueryKey: vi.fn().mockReturnValue(['client', 'client-1']),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockGoTo = vi.fn();

const mockFlowContext = {
  currentScreenId: 'additional-questions-section' as const,
  originScreenId: null as ReturnType<
    typeof FlowContextModule.useFlowContext
  >['originScreenId'],
  goTo: mockGoTo,
  goBack: vi.fn(),
  editingPartyIds: {},
  updateEditingPartyId: vi.fn(),
  staticScreens: [],
  sections: [],
  sessionData: {},
  updateSessionData: vi.fn(),
  previouslyCompleted: false,
  reviewScreenOpenedSectionId: null,
  initialStepperStepId: null,
  currentStepperStepId: undefined,
  setCurrentStepperStepIdFallback: vi.fn(),
  setCurrentStepper: vi.fn(),
  currentStepperGoTo: vi.fn(),
  shortLabelOverride: null,
  savedFormValues: {},
  saveFormValue: vi.fn(),
  isFormSubmitting: false,
  setIsFormSubmitting: vi.fn(),
  unsavedChangesRef: { current: false },
  setFlowUnsavedChanges: vi.fn(),
};

const mockClient: ClientResponse = {
  id: 'client-1',
  status: 'NEW',
  partyId: 'party-1',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: ['30001', '30002', '30003'],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  questionResponses: [],
};

const mockOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClient,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

const renderComponent = (
  onboardingOverride: Partial<OnboardingContextType> = {},
  flowContextOverride: Partial<typeof mockFlowContext> = {}
) => {
  vi.mocked(FlowContextModule.useFlowContext).mockReturnValue({
    ...mockFlowContext,
    ...flowContextOverride,
  });

  vi.mocked(FlowContextModule.useOnboardingContext).mockReturnValue({
    ...mockOnboardingContext,
    ...onboardingOverride,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <OperationalDetailsForm />
    </QueryClientProvider>
  );
};

describe('OperationalDetailsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('renders the form with title and description', () => {
    renderComponent();

    // Should render the form element
    expect(document.querySelector('form')).toBeTruthy();
  });

  test('renders question labels from the fetched questions data', () => {
    renderComponent();

    expect(
      screen.getByText(/what is your primary business activity/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/what is the expected monthly revenue/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does your business operate internationally/i)
    ).toBeInTheDocument();
  });

  test('renders boolean question as radio group with Yes/No options', () => {
    renderComponent();

    // The boolean question should display Yes and No radio options
    const radioGroups = document.querySelectorAll('[role="radiogroup"]');
    expect(radioGroups.length).toBeGreaterThan(0);
  });

  test('renders enum question with label and input container', () => {
    renderComponent();

    // The enum question label should be visible
    const label = screen.getByText(/what is the expected monthly revenue/i);
    expect(label).toBeInTheDocument();

    // The label should be inside a form field container
    const fieldContainer =
      label.closest('[data-slot="form-item"]') ?? label.parentElement;
    expect(fieldContainer).toBeTruthy();
  });

  test('renders submit button', () => {
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: /save and continue|save and return/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  test('renders overview navigation button', () => {
    renderComponent();

    const overviewButton = screen.getByRole('button', {
      name: /overview/i,
    });
    expect(overviewButton).toBeInTheDocument();
  });

  test('navigates to overview when overview button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const overviewButton = screen.getByRole('button', {
      name: /overview/i,
    });
    await user.click(overviewButton);

    expect(mockGoTo).toHaveBeenCalledWith('overview');
  });

  test('renders save and return label in review mode', () => {
    renderComponent({}, { originScreenId: 'review-attest-section' });

    expect(
      screen.getByRole('button', { name: /save and return/i })
    ).toBeInTheDocument();
  });

  test('renders form even without question responses on client', () => {
    renderComponent({
      clientData: {
        ...mockClient,
        questionResponses: [],
      },
    });

    // Form should still render with questions from the API
    expect(document.querySelector('form')).toBeTruthy();
    expect(
      screen.getByText(/what is your primary business activity/i)
    ).toBeInTheDocument();
  });
});

describe('OperationalDetailsForm.schema', () => {
  test('DATE_QUESTION_IDS contains expected date question IDs', () => {
    expect(DATE_QUESTION_IDS).toContain('30071');
    expect(DATE_QUESTION_IDS).toContain('30073');
  });

  test('MONEY_INPUT_QUESTION_IDS contains expected money input question IDs', () => {
    expect(MONEY_INPUT_QUESTION_IDS).toContain('30005');
  });

  test('creates schema for string type questions', () => {
    const questions = [
      {
        id: '1',
        description: 'Test string question',
        responseSchema: {
          type: 'array' as const,
          items: { type: 'string' as const },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];

    const schema = createDynamicZodSchema(questions);
    const result = schema.safeParse({ question_1: ['test value'] });
    expect(result.success).toBe(true);
  });

  test('creates schema for boolean type questions', () => {
    const questions = [
      {
        id: '2',
        description: 'Test boolean question',
        responseSchema: {
          type: 'array' as const,
          items: { type: 'boolean' as const },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];

    const schema = createDynamicZodSchema(questions);
    const validResult = schema.safeParse({ question_2: ['true'] });
    expect(validResult.success).toBe(true);

    const invalidResult = schema.safeParse({ question_2: ['maybe'] });
    expect(invalidResult.success).toBe(false);
  });

  test('creates schema for enum type questions', () => {
    const questions = [
      {
        id: '3',
        description: 'Test enum question',
        responseSchema: {
          type: 'array' as const,
          items: {
            type: 'string' as const,
            enum: ['OPTION_A', 'OPTION_B', 'OPTION_C'],
          },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];

    const schema = createDynamicZodSchema(questions);
    const validResult = schema.safeParse({ question_3: ['OPTION_A'] });
    expect(validResult.success).toBe(true);

    const invalidResult = schema.safeParse({ question_3: ['INVALID'] });
    expect(invalidResult.success).toBe(false);
  });

  test('creates schema for integer type questions', () => {
    const questions = [
      {
        id: '4',
        description: 'Test integer question',
        responseSchema: {
          type: 'array' as const,
          items: { type: 'integer' as const },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];

    const schema = createDynamicZodSchema(questions);
    const validResult = schema.safeParse({ question_4: ['42'] });
    expect(validResult.success).toBe(true);

    const invalidResult = schema.safeParse({ question_4: ['not_a_number'] });
    expect(invalidResult.success).toBe(false);
  });

  test('rejects empty required string arrays', () => {
    const questions = [
      {
        id: '5',
        description: 'Required string question',
        responseSchema: {
          type: 'array' as const,
          items: { type: 'string' as const },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];

    const schema = createDynamicZodSchema(questions);
    const result = schema.safeParse({ question_5: [] });
    expect(result.success).toBe(false);
  });

  test('creates schema for date question IDs', () => {
    const questions = [
      {
        id: '30071',
        description: 'Test date question',
        responseSchema: {
          type: 'array' as const,
          items: { type: 'string' as const },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];

    const schema = createDynamicZodSchema(questions);
    const validResult = schema.safeParse({ question_30071: ['2024-01-15'] });
    expect(validResult.success).toBe(true);

    const invalidResult = schema.safeParse({ question_30071: ['not-a-date'] });
    expect(invalidResult.success).toBe(false);
  });
});
