import { describe, expect, it } from 'vitest';

import type {
  SectionScreenConfig,
  StepConfig,
} from '@/core/OnboardingFlow/types/flow.types';

import { getFlowProgress, getStepperValidation } from './flowUtils';

describe('getStepperValidation', () => {
  it('returns allStepsValid=true when there are no steps', () => {
    const result = getStepperValidation(
      [],
      {},
      undefined,
      undefined,
      'gateway'
    );
    expect(result.allStepsValid).toBe(true);
    expect(result.stepValidationMap).toEqual({});
  });

  it('marks check-answers step valid when all prior steps valid', () => {
    const steps: StepConfig[] = [
      {
        id: 'check-answers',
        stepType: 'check-answers',
        title: 'Check Answers',
      } as StepConfig,
    ];
    const result = getStepperValidation(
      steps,
      {},
      undefined,
      undefined,
      'gateway'
    );
    expect(result.stepValidationMap['check-answers'].isValid).toBe(true);
  });

  it('handles steps with unknown stepType', () => {
    const steps: StepConfig[] = [
      {
        id: 'custom-step',
        stepType: 'custom' as any,
        title: 'Custom',
      } as StepConfig,
    ];
    const result = getStepperValidation(
      steps,
      {},
      undefined,
      undefined,
      'gateway'
    );
    // Unknown step types default to valid (no validation logic applies)
    expect(result.stepValidationMap['custom-step']).toBeDefined();
  });
});

describe('getFlowProgress', () => {
  it('returns empty statuses when no sections are provided', () => {
    const result = getFlowProgress([], {}, undefined, undefined, 'gateway');
    expect(result.sectionStatuses).toEqual({});
    expect(result.stepValidations).toEqual({});
  });

  it('marks a section as completed when all steps are valid and no statusResolver', () => {
    const mockSection = {
      id: 'personal-section',
      type: 'component',
      isSection: true,
      sectionConfig: {},
    } as unknown as SectionScreenConfig;

    const result = getFlowProgress(
      [mockSection],
      {},
      undefined,
      undefined,
      'gateway'
    );
    expect(result.sectionStatuses['personal-section']).toBe('completed');
  });

  it('uses statusResolver when provided', () => {
    const mockSection = {
      id: 'business-section',
      type: 'component',
      isSection: true,
      sectionConfig: {
        statusResolver: () => 'in_progress' as const,
      },
    } as unknown as SectionScreenConfig;

    const result = getFlowProgress(
      [mockSection],
      {},
      undefined,
      undefined,
      'gateway'
    );
    expect(result.sectionStatuses['business-section']).toBe('in_progress');
  });
});
