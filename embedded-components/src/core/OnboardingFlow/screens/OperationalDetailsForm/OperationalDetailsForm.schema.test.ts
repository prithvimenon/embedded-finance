import { describe, expect, it } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import { createDynamicZodSchema } from './OperationalDetailsForm.schema';

describe('createDynamicZodSchema', () => {
  it('creates schema with no questions', () => {
    const schema = createDynamicZodSchema([]);
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('creates schema for a string question', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30001',
        questionText: 'What is your business?',
        responseSchema: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    const result = schema.safeParse({ question_30001: ['My Business'] });
    expect(result.success).toBe(true);
  });

  it('rejects missing required string question', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30001',
        questionText: 'What is your business?',
        responseSchema: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    const result = schema.safeParse({ question_30001: [] });
    expect(result.success).toBe(false);
  });

  it('creates schema for a boolean question', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30002',
        questionText: 'Is this a new business?',
        responseSchema: {
          type: 'array',
          items: { type: 'boolean' },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    const result = schema.safeParse({ question_30002: ['true'] });
    expect(result.success).toBe(true);
  });

  it('creates schema for an enum question', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30003',
        questionText: 'Select category',
        responseSchema: {
          type: 'array',
          items: { type: 'string', enum: ['RETAIL', 'WHOLESALE', 'SERVICE'] },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    const result = schema.safeParse({ question_30003: ['RETAIL'] });
    expect(result.success).toBe(true);
  });

  it('creates schema for an integer question', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30004',
        questionText: 'Number of employees',
        responseSchema: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 1,
          maxItems: 1,
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    const result = schema.safeParse({ question_30004: ['42'] });
    expect(result.success).toBe(true);
  });
});
