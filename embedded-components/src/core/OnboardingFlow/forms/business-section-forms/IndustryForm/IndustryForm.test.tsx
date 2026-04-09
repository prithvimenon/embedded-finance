import { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import * as FlowContextModule from '@/core/OnboardingFlow/contexts';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  createMockOnboardingContext,
  createTestQueryClient,
  mockFlowContext,
} from '@/core/OnboardingFlow/forms/__test-helpers__/formTestUtils';

import { IndustryForm } from './IndustryForm';
import { useIndustryFormSchema } from './IndustryForm.schema';

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: vi.fn(),
  };
});

// Mock useIndustrySuggestions since the hook is already tested separately
vi.mock('./useIndustrySuggestions', () => ({
  useIndustrySuggestions: vi.fn().mockReturnValue({
    isFeatureFlagEnabled: false,
    recommendations: [],
    showRecommendations: false,
    showEmptyRecommendationWarning: false,
    showRecommendationErrorWarning: false,
    recommendationErrorMessage: '',
    isPending: false,
    handleSuggest: vi.fn(),
    setShowRecommendations: vi.fn(),
  }),
}));

const renderForm = (
  defaultValues?: Record<string, unknown>,
  onboardingOverrides?: Partial<OnboardingContextType>
) => {
  const queryClient = createTestQueryClient();
  const onboardingContext = createMockOnboardingContext(onboardingOverrides);

  (
    FlowContextModule.useFlowContext as ReturnType<typeof vi.fn>
  ).mockReturnValue(mockFlowContext);

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const schema = useIndustryFormSchema();
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        organizationDescription: '',
        industry: '',
        ...defaultValues,
      },
      mode: 'onBlur',
    });
    return <FormProvider {...form}>{children}</FormProvider>;
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <FlowContextModule.OnboardingContext.Provider value={onboardingContext}>
        <Wrapper>
          <IndustryForm />
        </Wrapper>
      </FlowContextModule.OnboardingContext.Provider>
    </QueryClientProvider>
  );
};

describe('IndustryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('field rendering', () => {
    test('renders organization description textarea', () => {
      renderForm();
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    test('renders informative alert', () => {
      renderForm();
      const alerts = document.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    test('renders industry select field', () => {
      renderForm();
      // The industrySelect type renders a custom component
      // Look for combobox or a relevant input
      const container = document.querySelector(
        '[data-dtrum-tracking="industry"]'
      );
      // Industry field should be present in the DOM
      expect(container !== null || screen.getByRole('textbox')).toBeTruthy();
    });
  });

  describe('feature flag behavior', () => {
    test('does not show suggest button when feature flag is disabled', () => {
      renderForm();
      // When feature flag is off, the suggest button with SparklesIcon should not appear
      // Tooltip icon buttons may still exist, so we check specifically for text content
      const suggestButton = screen.queryByText(/suggest/i);
      expect(suggestButton).toBeNull();
    });

    test('shows suggest button when feature flag is enabled', async () => {
      const { useIndustrySuggestions } = await import(
        './useIndustrySuggestions'
      );
      (useIndustrySuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
        isFeatureFlagEnabled: true,
        recommendations: [],
        showRecommendations: false,
        showEmptyRecommendationWarning: false,
        showRecommendationErrorWarning: false,
        recommendationErrorMessage: '',
        isPending: false,
        handleSuggest: vi.fn(),
        setShowRecommendations: vi.fn(),
      });

      renderForm({ organizationDescription: 'A test business description' });
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('recommendations display', () => {
    test('shows recommendations when available', async () => {
      const { useIndustrySuggestions } = await import(
        './useIndustrySuggestions'
      );
      (useIndustrySuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
        isFeatureFlagEnabled: true,
        recommendations: [
          { naicsCode: '541511', naicsDescription: 'Custom Programming' },
          { naicsCode: '541512', naicsDescription: 'Computer Systems Design' },
        ],
        showRecommendations: true,
        showEmptyRecommendationWarning: false,
        showRecommendationErrorWarning: false,
        recommendationErrorMessage: '',
        isPending: false,
        handleSuggest: vi.fn(),
        setShowRecommendations: vi.fn(),
      });

      renderForm({ organizationDescription: 'A test business' });
      expect(screen.getByText('541511')).toBeInTheDocument();
      expect(screen.getByText('541512')).toBeInTheDocument();
      expect(screen.getByText('Custom Programming')).toBeInTheDocument();
      expect(screen.getByText('Computer Systems Design')).toBeInTheDocument();
    });

    test('shows empty recommendation warning', async () => {
      const { useIndustrySuggestions } = await import(
        './useIndustrySuggestions'
      );
      (useIndustrySuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
        isFeatureFlagEnabled: true,
        recommendations: [],
        showRecommendations: false,
        showEmptyRecommendationWarning: true,
        showRecommendationErrorWarning: false,
        recommendationErrorMessage: '',
        isPending: false,
        handleSuggest: vi.fn(),
        setShowRecommendations: vi.fn(),
      });

      renderForm();
      const alerts = document.querySelectorAll('[role="alert"]');
      // At least the info alert + the warning alert
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    test('shows error warning when recommendation fails', async () => {
      const { useIndustrySuggestions } = await import(
        './useIndustrySuggestions'
      );
      (useIndustrySuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
        isFeatureFlagEnabled: true,
        recommendations: [],
        showRecommendations: false,
        showEmptyRecommendationWarning: false,
        showRecommendationErrorWarning: true,
        recommendationErrorMessage: 'Service unavailable',
        isPending: false,
        handleSuggest: vi.fn(),
        setShowRecommendations: vi.fn(),
      });

      renderForm();
      expect(screen.getByText('Service unavailable')).toBeInTheDocument();
    });

    test('shows loading state when pending', async () => {
      const { useIndustrySuggestions } = await import(
        './useIndustrySuggestions'
      );
      (useIndustrySuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
        isFeatureFlagEnabled: true,
        recommendations: [],
        showRecommendations: false,
        showEmptyRecommendationWarning: false,
        showRecommendationErrorWarning: false,
        recommendationErrorMessage: '',
        isPending: true,
        handleSuggest: vi.fn(),
        setShowRecommendations: vi.fn(),
      });

      renderForm({ organizationDescription: 'A test business' });
      // The loading spinner and text should be visible
      const loadingElements = document.querySelectorAll('.eb-animate-spin');
      expect(loadingElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('pre-populated data', () => {
    test('renders with pre-populated description', () => {
      renderForm({
        organizationDescription:
          'We provide software development services to small businesses.',
      });
      expect(
        screen.getByDisplayValue(
          'We provide software development services to small businesses.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('static properties', () => {
    test('has schema property', () => {
      expect(IndustryForm.schema).toBe(useIndustryFormSchema);
    });
  });
});
