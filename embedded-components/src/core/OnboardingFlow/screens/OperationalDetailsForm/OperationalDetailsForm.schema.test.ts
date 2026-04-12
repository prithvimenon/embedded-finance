import { describe, expect, test } from 'vitest';

import { QuestionResponse } from '@/api/generated/smbdo.schemas';

import {
  createDynamicZodSchema,
  DATE_QUESTION_IDS,
  MONEY_INPUT_QUESTION_IDS,
} from './OperationalDetailsForm.schema';

const makeQuestion = (
  overrides: Partial<QuestionResponse>
): QuestionResponse => ({
  id: '10001',
  description: 'Test question',
  ...overrides,
});

describe('OperationalDetailsForm.schema', () => {
  describe('DATE_QUESTION_IDS and MONEY_INPUT_QUESTION_IDS', () => {
    test('DATE_QUESTION_IDS contains expected IDs', () => {
      expect(DATE_QUESTION_IDS).toContain('30071');
      expect(DATE_QUESTION_IDS).toContain('30073');
    });

    test('MONEY_INPUT_QUESTION_IDS contains expected IDs', () => {
      expect(MONEY_INPUT_QUESTION_IDS).toContain('30005');
    });
  });

  describe('createDynamicZodSchema - string type', () => {
    test('validates required string field with min length', () => {
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: '10001',
          responseSchema: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 1,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      // Valid: non-empty string in array
      const validResult = schema.safeParse({ question_10001: ['hello'] });
      expect(validResult.success).toBe(true);

      // Invalid: empty array
      const emptyResult = schema.safeParse({ question_10001: [] });
      expect(emptyResult.success).toBe(false);

      // Invalid: empty string in array
      const emptyStringResult = schema.safeParse({ question_10001: [''] });
      expect(emptyStringResult.success).toBe(false);
    });

    test('validates string field with pattern', () => {
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: '10002',
          responseSchema: {
            type: 'array',
            items: { type: 'string', pattern: '^[A-Z]{2}$' },
            minItems: 1,
            maxItems: 1,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      const validResult = schema.safeParse({ question_10002: ['US'] });
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse({ question_10002: ['usa'] });
      expect(invalidResult.success).toBe(false);
    });

    test('validates string field with enum options', () => {
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: '10003',
          responseSchema: {
            type: 'array',
            items: { type: 'string', enum: ['option1', 'option2', 'option3'] },
            minItems: 1,
            maxItems: 1,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      const validResult = schema.safeParse({ question_10003: ['option1'] });
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse({
        question_10003: ['invalid_option'],
      });
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('createDynamicZodSchema - boolean type', () => {
    test('validates boolean field accepts true/false strings', () => {
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: '20001',
          responseSchema: {
            type: 'array',
            items: { type: 'boolean' },
            minItems: 1,
            maxItems: 1,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      const trueResult = schema.safeParse({ question_20001: ['true'] });
      expect(trueResult.success).toBe(true);

      const falseResult = schema.safeParse({ question_20001: ['false'] });
      expect(falseResult.success).toBe(true);

      const invalidResult = schema.safeParse({ question_20001: ['maybe'] });
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('createDynamicZodSchema - integer type', () => {
    test('validates integer field with number format', () => {
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: '20002',
          responseSchema: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 1,
            maxItems: 1,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      const validResult = schema.safeParse({ question_20002: ['42'] });
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse({ question_20002: ['abc'] });
      expect(invalidResult.success).toBe(false);

      const emptyResult = schema.safeParse({ question_20002: [''] });
      expect(emptyResult.success).toBe(false);
    });
  });

  describe('createDynamicZodSchema - date type', () => {
    test('validates date question with YYYY-MM-DD format', () => {
      const dateQuestionId = DATE_QUESTION_IDS[0];
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: dateQuestionId,
          responseSchema: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 1,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      const validResult = schema.safeParse({
        [`question_${dateQuestionId}`]: ['2024-01-15'],
      });
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse({
        [`question_${dateQuestionId}`]: ['01/15/2024'],
      });
      expect(invalidResult.success).toBe(false);

      const invalidResult2 = schema.safeParse({
        [`question_${dateQuestionId}`]: ['not-a-date'],
      });
      expect(invalidResult2.success).toBe(false);
    });
  });

  describe('createDynamicZodSchema - array type with minItems/maxItems', () => {
    test('validates array with minItems constraint', () => {
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: '30001',
          responseSchema: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['optA', 'optB', 'optC'],
            },
            minItems: 1,
            maxItems: 3,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      const validResult = schema.safeParse({ question_30001: ['optA'] });
      expect(validResult.success).toBe(true);

      const validMultiResult = schema.safeParse({
        question_30001: ['optA', 'optB'],
      });
      expect(validMultiResult.success).toBe(true);

      const emptyResult = schema.safeParse({ question_30001: [] });
      expect(emptyResult.success).toBe(false);
    });

    test('validates array with maxItems constraint', () => {
      const questions: QuestionResponse[] = [
        makeQuestion({
          id: '30002',
          responseSchema: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['optA', 'optB', 'optC'],
            },
            minItems: 1,
            maxItems: 2,
          },
        }),
      ];

      const schema = createDynamicZodSchema(questions);

      const tooManyResult = schema.safeParse({
        question_30002: ['optA', 'optB', 'optC'],
      });
      expect(tooManyResult.success).toBe(false);
    });
  });

  describe('createDynamicZodSchema - optional question (parentQuestionId)', () => {
    test('child question does not require value when parent condition not met', () => {
      const parentQuestion: QuestionResponse = makeQuestion({
        id: '40001',
        responseSchema: {
          type: 'array',
          items: { type: 'boolean' },
          minItems: 1,
          maxItems: 1,
        },
        subQuestions: [
          {
            anyValuesMatch: 'true',
            questionIds: ['40002'],
          },
        ],
      });

      const childQuestion: QuestionResponse = makeQuestion({
        id: '40002',
        parentQuestionId: '40001',
        responseSchema: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 1,
        },
      });

      const schema = createDynamicZodSchema([parentQuestion, childQuestion]);

      // Parent is 'false' — child should NOT be required
      const result = schema.safeParse({
        question_40001: ['false'],
        question_40002: [],
      });
      expect(result.success).toBe(true);
    });

    test('child question is required when parent condition is met', () => {
      const parentQuestion: QuestionResponse = makeQuestion({
        id: '40001',
        responseSchema: {
          type: 'array',
          items: { type: 'boolean' },
          minItems: 1,
          maxItems: 1,
        },
        subQuestions: [
          {
            anyValuesMatch: 'true',
            questionIds: ['40002'],
          },
        ],
      });

      const childQuestion: QuestionResponse = makeQuestion({
        id: '40002',
        parentQuestionId: '40001',
        responseSchema: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 1,
        },
      });

      const schema = createDynamicZodSchema([parentQuestion, childQuestion]);

      // Parent is 'true' — child is required
      const result = schema.safeParse({
        question_40001: ['true'],
        question_40002: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('question_40002');
      }
    });

    test('child question with array anyValuesMatch', () => {
      const parentQuestion: QuestionResponse = makeQuestion({
        id: '50001',
        responseSchema: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['optA', 'optB', 'optC'],
          },
          minItems: 1,
          maxItems: 3,
        },
        subQuestions: [
          {
            // The runtime code handles both string and string[] for anyValuesMatch,
            // but the generated type only declares string. Cast to satisfy TS.
            anyValuesMatch: ['optA', 'optB'] as unknown as string,
            questionIds: ['50002'],
          },
        ],
      });

      const childQuestion: QuestionResponse = makeQuestion({
        id: '50002',
        parentQuestionId: '50001',
        responseSchema: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 1,
        },
      });

      const schema = createDynamicZodSchema([parentQuestion, childQuestion]);

      // Parent includes matching value — child required
      const failResult = schema.safeParse({
        question_50001: ['optA'],
        question_50002: [],
      });
      expect(failResult.success).toBe(false);

      // Parent does not include matching value — child not required
      const passResult = schema.safeParse({
        question_50001: ['optC'],
        question_50002: [],
      });
      expect(passResult.success).toBe(true);
    });
  });

  describe('createDynamicZodSchema - empty questions', () => {
    test('returns valid schema with no questions', () => {
      const schema = createDynamicZodSchema([]);
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createDynamicZodSchema - child question maxItems via superRefine', () => {
    test('child question fails when parent condition met and maxItems exceeded', () => {
      const parentQuestion: QuestionResponse = makeQuestion({
        id: '60001',
        responseSchema: {
          type: 'array',
          items: { type: 'boolean' },
          minItems: 1,
          maxItems: 1,
        },
        subQuestions: [
          {
            anyValuesMatch: 'true',
            questionIds: ['60002'],
          },
        ],
      });

      const childQuestion: QuestionResponse = makeQuestion({
        id: '60002',
        parentQuestionId: '60001',
        responseSchema: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['a', 'b', 'c'],
          },
          minItems: 1,
          maxItems: 2,
        },
      });

      const schema = createDynamicZodSchema([parentQuestion, childQuestion]);

      const result = schema.safeParse({
        question_60001: ['true'],
        question_60002: ['a', 'b', 'c'],
      });
      expect(result.success).toBe(false);
    });
  });
});
