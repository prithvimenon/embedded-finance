import { describe, expect, test } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import {
  createDynamicZodSchema,
  DATE_QUESTION_IDS,
  MONEY_INPUT_QUESTION_IDS,
} from './OperationalDetailsForm.schema';

describe('OperationalDetailsForm.schema', () => {
  describe('DATE_QUESTION_IDS', () => {
    test('contains expected date question IDs', () => {
      expect(DATE_QUESTION_IDS).toContain('30071');
      expect(DATE_QUESTION_IDS).toContain('30073');
    });
  });

  describe('MONEY_INPUT_QUESTION_IDS', () => {
    test('contains expected money input question IDs', () => {
      expect(MONEY_INPUT_QUESTION_IDS).toContain('30005');
    });
  });

  describe('createDynamicZodSchema', () => {
    test('creates schema for a required string question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10001',
          description: 'What is your business name?',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const validResult = schema.safeParse({
        question_10001: ['Test Business'],
      });
      expect(validResult.success).toBe(true);
    });

    test('fails for empty string array on required question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10001',
          description: 'What is your business name?',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const result = schema.safeParse({ question_10001: [] });
      expect(result.success).toBe(false);
    });

    test('creates schema for a boolean question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10002',
          description: 'Is your business publicly traded?',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'boolean' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const validResult = schema.safeParse({ question_10002: ['true'] });
      expect(validResult.success).toBe(true);

      const validFalse = schema.safeParse({ question_10002: ['false'] });
      expect(validFalse.success).toBe(true);
    });

    test('fails for invalid boolean value', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10002',
          description: 'Is your business publicly traded?',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'boolean' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const result = schema.safeParse({ question_10002: ['maybe'] });
      expect(result.success).toBe(false);
    });

    test('creates schema for an enum (string with items.enum) question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10003',
          description: 'Select your industry',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string', enum: ['RETAIL', 'FINANCE', 'TECH'] },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const validResult = schema.safeParse({ question_10003: ['RETAIL'] });
      expect(validResult.success).toBe(true);
    });

    test('fails for invalid enum value', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10003',
          description: 'Select your industry',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string', enum: ['RETAIL', 'FINANCE', 'TECH'] },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const result = schema.safeParse({ question_10003: ['INVALID'] });
      expect(result.success).toBe(false);
    });

    test('creates schema for an integer question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10004',
          description: 'Number of employees',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'integer' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const validResult = schema.safeParse({ question_10004: ['42'] });
      expect(validResult.success).toBe(true);
    });

    test('fails for non-integer value on integer question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10004',
          description: 'Number of employees',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'integer' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const result = schema.safeParse({ question_10004: ['abc'] });
      expect(result.success).toBe(false);
    });

    test('creates schema for a date question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '30071',
          description: 'Enter the date',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const validResult = schema.safeParse({ question_30071: ['2023-01-15'] });
      expect(validResult.success).toBe(true);
    });

    test('fails for invalid date format on date question', () => {
      const questions: QuestionResponse[] = [
        {
          id: '30071',
          description: 'Enter the date',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const result = schema.safeParse({ question_30071: ['01/15/2023'] });
      expect(result.success).toBe(false);
    });

    test('optional child questions do not fail when empty', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10001',
          description: 'Parent question',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'boolean' },
          },
          subQuestions: [
            {
              anyValuesMatch: 'true',
              questionIds: ['10002'],
            },
          ],
        },
        {
          id: '10002',
          parentQuestionId: '10001',
          description: 'Child question',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      // Child question with parent => isOptional true => no min/max validation on the array
      const result = schema.safeParse({
        question_10001: ['false'],
        question_10002: [],
      });
      expect(result.success).toBe(true);
    });

    test('child question required when parent condition matches', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10001',
          description: 'Parent question',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'boolean' },
          },
          subQuestions: [
            {
              anyValuesMatch: 'true',
              questionIds: ['10002'],
            },
          ],
        },
        {
          id: '10002',
          parentQuestionId: '10001',
          description: 'Child question',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: { type: 'string' },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      // Parent value is 'true' => child question is required by superRefine
      const result = schema.safeParse({
        question_10001: ['true'],
        question_10002: [],
      });
      expect(result.success).toBe(false);
    });

    test('creates schema for empty questions array', () => {
      const schema = createDynamicZodSchema([]);
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    test('handles multi-select checkbox question (maxItems > 1)', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10005',
          description: 'Select applicable options',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: {
              type: 'string',
              enum: ['OPTION_A', 'OPTION_B', 'OPTION_C'],
            },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const validResult = schema.safeParse({
        question_10005: ['OPTION_A', 'OPTION_B'],
      });
      expect(validResult.success).toBe(true);
    });

    test('fails when exceeding maxItems on multi-select', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10005',
          description: 'Select applicable options',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 2,
            items: {
              type: 'string',
              enum: ['OPTION_A', 'OPTION_B', 'OPTION_C'],
            },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const result = schema.safeParse({
        question_10005: ['OPTION_A', 'OPTION_B', 'OPTION_C'],
      });
      expect(result.success).toBe(false);
    });

    test('handles string question with pattern validation', () => {
      const questions: QuestionResponse[] = [
        {
          id: '10006',
          description: 'Enter a US ZIP code',
          responseSchema: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: {
              type: 'string',
              pattern: '^\\d{5}$',
            },
          },
        },
      ];

      const schema = createDynamicZodSchema(questions);
      const validResult = schema.safeParse({ question_10006: ['12345'] });
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse({ question_10006: ['abc'] });
      expect(invalidResult.success).toBe(false);
    });
  });
});
