import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import type {
  FormStep,
  FormStepComponent,
  SectionScreenConfig,
  StepConfig,
} from '@/core/OnboardingFlow/types/flow.types';

import {
  getFlowProgress,
  getStepperValidation,
  getStepperValidations,
} from './flowUtils';

// Helper to create a minimal FormStepComponent for testing
const makeFormStepComponent = (
  schema: z.ZodObject<Record<string, z.ZodType<any>>>
): FormStepComponent => {
  const Component = (() => null) as unknown as FormStepComponent;
  Component.schema = schema;
  return Component;
};

const simpleSchema = z.object({
  organizationName: z.string().min(1),
});

const makeFormStep = (
  id: string,
  schema: z.ZodObject<Record<string, z.ZodType<any>>> = simpleSchema
): FormStep => ({
  id,
  title: `Step ${id}`,
  stepType: 'form',
  Component: makeFormStepComponent(schema),
});

describe('getStepperValidation', () => {
  it('validates form steps against party data', () => {
    const steps: StepConfig[] = [makeFormStep('step-1')];

    const partyData: Partial<PartyResponse> = {
      organizationDetails: { organizationName: 'Test Corp' },
    };

    const result = getStepperValidation(
      steps,
      partyData,
      undefined,
      undefined,
      'checklist'
    );

    expect(result.stepValidationMap['step-1']).toBeDefined();
    expect(result.stepValidationMap['step-1'].isValid).toBe(true);
    expect(result.allStepsValid).toBe(true);
  });

  it('marks step as invalid when validation fails', () => {
    const steps: StepConfig[] = [makeFormStep('step-1')];

    // Empty party data - organizationName will be empty/missing
    const result = getStepperValidation(
      steps,
      {},
      undefined,
      undefined,
      'checklist'
    );

    expect(result.stepValidationMap['step-1'].isValid).toBe(false);
    expect(result.allStepsValid).toBe(false);
  });

  it('handles check-answers step type', () => {
    const steps: StepConfig[] = [
      makeFormStep('step-1'),
      {
        id: 'check-answers',
        title: 'Review',
        stepType: 'check-answers',
      },
    ];

    const partyData: Partial<PartyResponse> = {
      organizationDetails: { organizationName: 'Valid Corp' },
    };

    const result = getStepperValidation(
      steps,
      partyData,
      undefined,
      undefined,
      'checklist'
    );

    // check-answers isValid reflects allStepsValid at that point
    expect(result.stepValidationMap['check-answers'].isValid).toBe(true);
  });

  it('handles static step type', () => {
    const steps: StepConfig[] = [
      {
        id: 'static-step',
        title: 'Info',
        stepType: 'static',
      },
    ];

    const result = getStepperValidation(
      steps,
      {},
      undefined,
      undefined,
      'checklist'
    );

    expect(result.stepValidationMap['static-step'].isValid).toBe(false);
    expect(result.stepValidationMap['static-step'].result).toBeUndefined();
  });

  it('merges savedFormValues with partyData', () => {
    const steps: StepConfig[] = [makeFormStep('step-1')];

    // Party has no org name, but savedFormValues provides it
    const result = getStepperValidation(
      steps,
      {},
      undefined,
      { organizationName: 'Saved Corp' },
      'checklist'
    );

    expect(result.stepValidationMap['step-1'].isValid).toBe(true);
  });
});

describe('getStepperValidations', () => {
  it('returns validations for multiple parties', () => {
    const steps: StepConfig[] = [makeFormStep('step-1')];

    const parties: PartyResponse[] = [
      {
        id: 'party-a',
        partyType: 'INDIVIDUAL',
        active: true,
        roles: ['CONTROLLER'],
      },
      {
        id: 'party-b',
        partyType: 'INDIVIDUAL',
        active: true,
        roles: ['BENEFICIAL_OWNER'],
      },
    ];

    const result = getStepperValidations(
      steps,
      parties,
      undefined,
      undefined,
      'checklist'
    );

    expect(result['party-a']).toBeDefined();
    expect(result['party-b']).toBeDefined();
  });

  it('skips parties without id', () => {
    const steps: StepConfig[] = [makeFormStep('step-1')];
    const parties: PartyResponse[] = [
      {
        partyType: 'INDIVIDUAL',
        active: true,
        roles: [],
      } as any,
    ];

    const result = getStepperValidations(
      steps,
      parties,
      undefined,
      undefined,
      'checklist'
    );

    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('getFlowProgress', () => {
  it('returns section statuses and step validations', () => {
    const sections: SectionScreenConfig[] = [
      {
        id: 'business-section',
        isSection: true,
        type: 'stepper',
        stepperConfig: {
          steps: [makeFormStep('step-1')],
          associatedPartyFilters: {
            partyType: 'ORGANIZATION',
            roles: ['CLIENT'],
          },
        },
        sectionConfig: {
          icon: {} as any,
          label: 'Business',
        },
      },
    ];

    const clientData = {
      id: 'client-1',
      partyId: '0000000001',
      products: ['EMBEDDED_PAYMENTS'],
      outstanding: {},
      status: 'NEW',
      parties: [
        {
          id: 'org-1',
          partyType: 'ORGANIZATION',
          active: true,
          roles: ['CLIENT'],
          organizationDetails: { organizationName: 'Valid Corp' },
        },
      ],
    } as ClientResponse;

    const result = getFlowProgress(
      sections,
      {},
      clientData,
      undefined,
      'checklist'
    );

    expect(result.sectionStatuses).toBeDefined();
    expect(result.stepValidations).toBeDefined();
    expect(result.sectionStatuses['business-section']).toBeDefined();
  });

  it('uses statusResolver when provided', () => {
    const sections: SectionScreenConfig[] = [
      {
        id: 'personal-section',
        isSection: true,
        type: 'stepper',
        stepperConfig: {
          steps: [makeFormStep('step-1')],
        },
        sectionConfig: {
          icon: {} as any,
          label: 'Personal',
          statusResolver: () => 'verifying',
        },
      },
    ];

    const result = getFlowProgress(
      sections,
      {},
      undefined,
      undefined,
      'checklist'
    );
    expect(result.sectionStatuses['personal-section']).toBe('verifying');
  });

  it('defaults to completed when allStepsValid and no statusResolver', () => {
    const alwaysPassSchema = z.object({});

    const sections: SectionScreenConfig[] = [
      {
        id: 'review-attest-section',
        isSection: true,
        type: 'stepper',
        stepperConfig: {
          steps: [makeFormStep('step-empty', alwaysPassSchema)],
        },
        sectionConfig: {
          icon: {} as any,
          label: 'Review',
        },
      },
    ];

    const result = getFlowProgress(
      sections,
      {},
      undefined,
      undefined,
      'checklist'
    );
    expect(result.sectionStatuses['review-attest-section']).toBe('completed');
  });
});
