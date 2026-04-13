import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type {
  ApiErrorReasonV2,
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import {
  convertClientResponseToFormValues,
  convertPartyResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  getFieldRuleByClientContext,
  getValueByPath,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  modifySchemaByClientContext,
  sanitizeServerErrorMessage,
  setApiFormErrors,
  shapeFormValuesBySchema,
} from './formUtils';

// ---------------------------------------------------------------------------
// getValueByPath
// ---------------------------------------------------------------------------
describe('getValueByPath', () => {
  it('retrieves a top-level value', () => {
    expect(getValueByPath({ a: 1 }, 'a')).toBe(1);
  });

  it('retrieves a nested value using dot notation', () => {
    expect(getValueByPath({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
  });

  it('retrieves a value using bracket notation', () => {
    expect(getValueByPath({ items: ['x', 'y', 'z'] }, 'items[1]')).toBe('y');
  });

  it('returns undefined for a missing path', () => {
    expect(getValueByPath({ a: 1 }, 'b.c')).toBeUndefined();
  });

  it('returns undefined when intermediate is undefined', () => {
    expect(getValueByPath({}, 'a.b.c')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// sanitizeServerErrorMessage
// ---------------------------------------------------------------------------
describe('sanitizeServerErrorMessage', () => {
  it('strips "Field /.../ value must have the expected value." prefix', () => {
    const msg =
      'Field /individualDetails/addresses[0]/postalCode/ value must have the expected value. The postal code [00000] is invalid for the country [US].';
    const result = sanitizeServerErrorMessage(msg);
    expect(result).toBe('The postal code 00000 is invalid for the country US.');
  });

  it('removes bracket notation from values', () => {
    const msg = 'Error with [someValue] here.';
    expect(sanitizeServerErrorMessage(msg)).toBe('Error with someValue here.');
  });

  it('returns the original message when there is nothing to sanitize', () => {
    const msg = 'Simple error message';
    expect(sanitizeServerErrorMessage(msg)).toBe('Simple error message');
  });

  it('capitalizes the first letter after stripping a prefix', () => {
    const msg =
      'Field /foo/ value must have the expected value. the data is wrong.';
    expect(sanitizeServerErrorMessage(msg)).toBe('The data is wrong.');
  });

  it('returns original message if sanitized result would be empty', () => {
    // Only whitespace after prefix strip -> falls back to original
    const msg = 'Field /x/ value must have the expected value. ';
    const result = sanitizeServerErrorMessage(msg);
    expect(result).toBe(msg);
  });
});

// ---------------------------------------------------------------------------
// mapClientApiErrorsToFormErrors
// ---------------------------------------------------------------------------
describe('mapClientApiErrorsToFormErrors', () => {
  it('maps an error whose field matches a known partyFieldMap path', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        message: 'Name is required',
        field: '$.parties.0.organizationDetails.organizationName',
      },
    ];
    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result.length).toBe(1);
    expect(result[0].message).toBe('Name is required');
    // The field should be mapped to the fieldMap key
    expect(result[0].field).toBeDefined();
  });

  it('returns unmatched errors with field undefined', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        message: 'Unknown error',
        field: '$.parties.0.completely.unknown.path',
      },
    ];
    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result.length).toBe(1);
    expect(result[0].field).toBeUndefined();
    expect(result[0].message).toBe('Unknown error');
  });

  it('handles errors with no field property', () => {
    const errors: ApiErrorReasonV2[] = [{ message: 'General error' }];
    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result.length).toBe(1);
    expect(result[0].field).toBeUndefined();
  });

  it('supports addParties array name', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        message: 'Email invalid',
        field: '$.addParties.1.email',
      },
    ];
    const result = mapClientApiErrorsToFormErrors(errors, 1, 'addParties');
    expect(result.length).toBe(1);
    expect(result[0].message).toBe('Email invalid');
  });
});

// ---------------------------------------------------------------------------
// mapPartyApiErrorsToFormErrors
// ---------------------------------------------------------------------------
describe('mapPartyApiErrorsToFormErrors', () => {
  it('maps an error whose field matches a known partyFieldMap path', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        message: 'Email is required',
        field: '$.email',
      },
    ];
    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].message).toBe('Email is required');
  });

  it('maps an error with $.party. prefix', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        message: 'Name required',
        field: '$.party.organizationDetails.organizationName',
      },
    ];
    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].message).toBe('Name required');
  });

  it('returns unmatched errors with field undefined', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        message: 'Something unknown',
        field: '$.totally.unknown.path',
      },
    ];
    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result.length).toBe(1);
    expect(result[0].field).toBeUndefined();
  });

  it('handles errors with no field at all', () => {
    const errors: ApiErrorReasonV2[] = [{ message: 'Server error' }];
    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result.length).toBe(1);
    expect(result[0].field).toBeUndefined();
    expect(result[0].message).toBe('Server error');
  });
});

// ---------------------------------------------------------------------------
// setApiFormErrors
// ---------------------------------------------------------------------------
describe('setApiFormErrors', () => {
  it('calls form.setError for each error that has a field', () => {
    const setError = vi.fn();
    const setFocus = vi.fn();
    const mockForm = { setError, setFocus } as any;

    setApiFormErrors(mockForm, [
      { field: 'organizationName', message: 'required', path: '$.org' },
      {
        field: 'organizationEmail',
        message: 'invalid email',
        path: '$.email',
      },
    ]);

    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith('organizationName', {
      message: 'Server Error: required',
    });
    // setFocus should be called once for the first field
    expect(setFocus).toHaveBeenCalledTimes(1);
    expect(setFocus).toHaveBeenCalledWith('organizationName');
  });

  it('does not call setError for errors without a field', () => {
    const setError = vi.fn();
    const setFocus = vi.fn();
    const mockForm = { setError, setFocus } as any;

    setApiFormErrors(mockForm, [
      { field: undefined, message: 'unhandled', path: '$.x' },
    ]);

    expect(setError).not.toHaveBeenCalled();
    expect(setFocus).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// generateClientRequestBody
// ---------------------------------------------------------------------------
describe('generateClientRequestBody', () => {
  it('maps a known field to the correct nested API path', () => {
    const result = generateClientRequestBody(
      { organizationName: 'Acme Inc' } as any,
      0,
      'parties',
      {}
    );
    expect(result).toHaveProperty('parties');
    const { parties } = result as any;
    expect(parties[0].organizationDetails.organizationName).toBe('Acme Inc');
  });

  it('skips empty string values', () => {
    const result = generateClientRequestBody(
      { organizationName: '' } as any,
      0,
      'parties',
      {}
    );
    // Empty strings should be skipped
    expect((result as any).parties).toBeUndefined();
  });

  it('skips undefined values', () => {
    const result = generateClientRequestBody(
      { organizationName: undefined } as any,
      0,
      'parties',
      {}
    );
    expect((result as any).parties).toBeUndefined();
  });

  it('respects the partyIndex parameter', () => {
    const result = generateClientRequestBody(
      { organizationEmail: 'test@test.com' } as any,
      2,
      'parties',
      {}
    );
    const { parties } = result as any;
    expect(parties[2].email).toBe('test@test.com');
  });

  it('uses addParties array name', () => {
    const result = generateClientRequestBody(
      { organizationEmail: 'test@test.com' } as any,
      0,
      'addParties',
      {}
    );
    expect(result).toHaveProperty('addParties');
    expect((result as any).addParties[0].email).toBe('test@test.com');
  });
});

// ---------------------------------------------------------------------------
// generatePartyRequestBody
// ---------------------------------------------------------------------------
describe('generatePartyRequestBody', () => {
  it('maps a known field to its API path without array wrapping', () => {
    const result = generatePartyRequestBody(
      { organizationName: 'Acme Inc' } as any,
      {}
    );
    expect((result as any).organizationDetails.organizationName).toBe(
      'Acme Inc'
    );
  });

  it('skips empty and undefined values', () => {
    const result = generatePartyRequestBody(
      { organizationName: '', organizationEmail: undefined } as any,
      {}
    );
    expect((result as any).organizationDetails).toBeUndefined();
    expect((result as any).email).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// convertClientResponseToFormValues
// ---------------------------------------------------------------------------
describe('convertClientResponseToFormValues', () => {
  it('extracts form values from a client response for a given partyId', () => {
    const response: Partial<ClientResponse> = {
      parties: [
        {
          id: 'party-1',
          email: 'org@example.com',
          organizationDetails: {
            organizationName: 'Acme',
          },
        } as any,
      ],
    };

    const values = convertClientResponseToFormValues(
      response as ClientResponse,
      'party-1'
    );
    expect(values.organizationName).toBe('Acme');
    expect(values.organizationEmail).toBe('org@example.com');
  });

  it('returns empty object when partyId is not found', () => {
    const response: Partial<ClientResponse> = {
      parties: [
        {
          id: 'party-1',
          organizationDetails: { organizationName: 'Acme' },
        } as any,
      ],
    };
    const values = convertClientResponseToFormValues(
      response as ClientResponse,
      'non-existent'
    );
    // The party index will be -1, so paths like parties.-1.xxx won't resolve
    expect(Object.keys(values).length).toBe(0);
  });

  it('converts PLACEHOLDER_ORG_NAME to empty string via fromResponseFn', () => {
    const response: Partial<ClientResponse> = {
      parties: [
        {
          id: 'p1',
          organizationDetails: {
            organizationName: 'PLACEHOLDER_ORG_NAME',
          },
        } as any,
      ],
    };
    const values = convertClientResponseToFormValues(
      response as ClientResponse,
      'p1'
    );
    expect(values.organizationName).toBe('');
  });
});

// ---------------------------------------------------------------------------
// convertPartyResponseToFormValues
// ---------------------------------------------------------------------------
describe('convertPartyResponseToFormValues', () => {
  it('extracts form values from a party response', () => {
    const response: Partial<PartyResponse> = {
      email: 'party@example.com',
      organizationDetails: {
        organizationName: 'PartyOrg',
      },
    };
    const values = convertPartyResponseToFormValues(response as PartyResponse);
    expect(values.organizationEmail).toBe('party@example.com');
    expect(values.organizationName).toBe('PartyOrg');
  });

  it('sets controllerIds issuer to countryOfResidence for US', () => {
    const response: Partial<PartyResponse> = {
      individualDetails: {
        countryOfResidence: 'US',
      } as any,
    };
    const values = convertPartyResponseToFormValues(response as PartyResponse);
    expect(values.countryOfResidence).toBe('US');
    // When no ids exist, a default entry should be created
    expect(values.controllerIds).toEqual([
      { idType: 'SSN', issuer: 'US', value: '' },
    ]);
  });

  it('sets controllerIds with empty idType for non-US country', () => {
    const response: Partial<PartyResponse> = {
      individualDetails: {
        countryOfResidence: 'GB',
      } as any,
    };
    const values = convertPartyResponseToFormValues(response as PartyResponse);
    expect(values.controllerIds).toEqual([
      { idType: '', issuer: 'GB', value: '' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// shapeFormValuesBySchema
// ---------------------------------------------------------------------------
describe('shapeFormValuesBySchema', () => {
  it('returns only keys present in the schema shape', () => {
    const schema = z.object({
      organizationName: z.string(),
      organizationEmail: z.string(),
    });

    const result = shapeFormValuesBySchema(
      {
        organizationName: 'Acme',
        organizationEmail: 'a@b.com',
        controllerFirstName: 'John',
      } as any,
      schema
    );

    expect(result).toHaveProperty('organizationName', 'Acme');
    expect(result).toHaveProperty('organizationEmail', 'a@b.com');
    expect(result).not.toHaveProperty('controllerFirstName');
  });

  it('sets undefined for schema keys missing from form values', () => {
    const schema = z.object({
      organizationName: z.string(),
    });

    const result = shapeFormValuesBySchema({} as any, schema);
    expect(result).toHaveProperty('organizationName', undefined);
  });
});

// ---------------------------------------------------------------------------
// getFieldRuleByClientContext
// ---------------------------------------------------------------------------
describe('getFieldRuleByClientContext', () => {
  it('returns the base rule for a known field', () => {
    const { fieldRule, ruleType } = getFieldRuleByClientContext(
      'organizationName',
      {},
      'gateway'
    );
    expect(ruleType).toBe('single');
    expect(fieldRule.display).toBe('visible');
  });

  it('applies conditional rules based on entityType', () => {
    const { fieldRule, ruleType } = getFieldRuleByClientContext(
      'organizationName',
      { entityType: 'SOLE_PROPRIETORSHIP' },
      'gateway'
    );
    // SOLE_PROPRIETORSHIP makes organizationName readonly and not required
    expect(ruleType).toBe('single');
    expect(fieldRule.interaction).toBe('readonly');
    if (ruleType === 'single') {
      expect(fieldRule.required).toBe(false);
    }
  });

  it('returns array ruleType for array fields', () => {
    const { ruleType } = getFieldRuleByClientContext(
      'controllerIds',
      {},
      'gateway'
    );
    expect(ruleType).toBe('array');
  });

  it('throws for an unknown field name', () => {
    expect(() =>
      getFieldRuleByClientContext('nonExistentField' as any, {}, 'gateway')
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// modifySchemaByClientContext
// ---------------------------------------------------------------------------
describe('modifySchemaByClientContext', () => {
  it('removes hidden fields from the schema', () => {
    // natureOfOwnership is hidden by default (display: "hidden")
    const schema = z.object({
      organizationName: z.string(),
      natureOfOwnership: z.string(),
    });

    const modified = modifySchemaByClientContext(schema, {}, 'gateway');
    const { shape } = modified as z.ZodObject<any>;

    expect(shape).toHaveProperty('organizationName');
    expect(shape).not.toHaveProperty('natureOfOwnership');
  });

  it('makes non-required fields accept empty strings', () => {
    // dbaName is not required by default
    const schema = z.object({
      dbaName: z.string().min(1),
    });

    const modified = modifySchemaByClientContext(schema, {}, 'gateway');
    const result = (modified as z.ZodObject<any>).safeParse({ dbaName: '' });
    expect(result.success).toBe(true);
  });

  it('applies a refineFn when provided', () => {
    const schema = z.object({
      organizationName: z.string(),
    });

    const refineFn = (s: z.ZodObject<Record<string, z.ZodType<any>>>) =>
      s.refine((data) => data.organizationName !== 'BLOCKED', {
        message: 'Name is blocked',
      });

    const modified = modifySchemaByClientContext(
      schema,
      {},
      'gateway',
      refineFn
    );

    // Should be a ZodEffects (refined) schema
    expect(modified).toBeInstanceOf(z.ZodEffects);
    const badResult = modified.safeParse({ organizationName: 'BLOCKED' });
    expect(badResult.success).toBe(false);
  });
});
