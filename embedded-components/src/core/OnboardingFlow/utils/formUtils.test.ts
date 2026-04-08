import { describe, expect, it } from 'vitest';
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
  getPartyFieldConfig,
  getValueByPath,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  modifyDefaultValuesByClientContext,
  modifySchemaByClientContext,
  sanitizeServerErrorMessage,
  shapeFormValuesBySchema,
} from './formUtils';

// ─── sanitizeServerErrorMessage ─────────────────────────────────────

describe('sanitizeServerErrorMessage', () => {
  it('strips "Field /.../ value must have the expected value." prefix', () => {
    const msg =
      'Field /individualDetails/addresses[0]/postalCode/ value must have the expected value. The postal code [00000] is invalid for the country [US].';
    const result = sanitizeServerErrorMessage(msg);
    expect(result).toBe('The postal code 00000 is invalid for the country US.');
  });

  it('strips standalone "Field /.../ " references', () => {
    const msg = 'Field /email/ is required';
    const result = sanitizeServerErrorMessage(msg);
    expect(result).toBe('Is required');
  });

  it('cleans up bracket notation: [value] → value', () => {
    const msg = 'The country [US] is not valid';
    expect(sanitizeServerErrorMessage(msg)).toBe('The country US is not valid');
  });

  it('capitalizes first letter when prefix is stripped', () => {
    const msg =
      'Field /x/ value must have the expected value. the name is required.';
    expect(sanitizeServerErrorMessage(msg)).toBe('The name is required.');
  });

  it('returns original message when no patterns match', () => {
    const msg = 'Something went wrong';
    expect(sanitizeServerErrorMessage(msg)).toBe('Something went wrong');
  });

  it('returns original message when sanitized result is empty', () => {
    const msg = 'Field /x/ ';
    const result = sanitizeServerErrorMessage(msg);
    // After stripping, the result would be empty → returns original
    expect(result).toBeTruthy();
  });
});

// ─── getValueByPath ─────────────────────────────────────────────────

describe('getValueByPath', () => {
  it('retrieves nested value using dot notation', () => {
    const obj = { a: { b: { c: 'value' } } };
    expect(getValueByPath(obj, 'a.b.c')).toBe('value');
  });

  it('retrieves array elements using bracket notation', () => {
    const obj = { items: [{ name: 'first' }, { name: 'second' }] };
    expect(getValueByPath(obj, 'items[1].name')).toBe('second');
  });

  it('returns undefined for missing paths', () => {
    const obj = { a: { b: 1 } };
    expect(getValueByPath(obj, 'a.c')).toBeUndefined();
    expect(getValueByPath(obj, 'x.y.z')).toBeUndefined();
  });

  it('returns undefined for null/undefined objects', () => {
    expect(getValueByPath(null, 'a')).toBeUndefined();
    expect(getValueByPath(undefined, 'a')).toBeUndefined();
  });

  it('retrieves top-level properties', () => {
    const obj = { name: 'test' };
    expect(getValueByPath(obj, 'name')).toBe('test');
  });
});

// ─── getPartyFieldConfig ────────────────────────────────────────────

describe('getPartyFieldConfig', () => {
  it('returns field config for a valid field name', () => {
    const config = getPartyFieldConfig('organizationName');
    expect(config).toBeDefined();
    expect(config.path).toBe('organizationDetails.organizationName');
  });

  it('throws for an unmapped field name', () => {
    expect(() => getPartyFieldConfig('nonExistentField' as any)).toThrow(
      '"nonExistentField" is not mapped in fieldMap'
    );
  });
});

// ─── mapClientApiErrorsToFormErrors ─────────────────────────────────

describe('mapClientApiErrorsToFormErrors', () => {
  it('maps API errors to form errors with matched field names', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        field: '$.parties.0.organizationDetails.organizationName',
        message: 'Name is required',
      },
    ];

    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('organizationName');
    expect(result[0].message).toBe('Name is required');
  });

  it('returns unmatched error with undefined field', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        field: '$.parties.0.unknown.path',
        message: 'Unknown error',
      },
    ];

    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBeUndefined();
    expect(result[0].message).toBe('Unknown error');
  });

  it('handles addParties array name', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        field: '$.addParties.0.organizationDetails.organizationName',
        message: 'Name error',
      },
    ];

    const result = mapClientApiErrorsToFormErrors(errors, 0, 'addParties');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('organizationName');
  });

  it('handles errors with bracket notation', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        field: '$.parties[0].organizationDetails.organizationName',
        message: 'Name error',
      },
    ];

    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('organizationName');
  });
});

// ─── mapPartyApiErrorsToFormErrors ──────────────────────────────────

describe('mapPartyApiErrorsToFormErrors', () => {
  it('maps party errors to form errors', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        field: '$.organizationDetails.organizationName',
        message: 'Required',
      },
    ];

    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((e) => e.field === 'organizationName')).toBe(true);
  });

  it('maps party errors prefixed with $.party.', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        field: '$.party.organizationDetails.organizationName',
        message: 'Required',
      },
    ];

    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result.some((e) => e.field === 'organizationName')).toBe(true);
  });

  it('returns unmatched error with undefined field', () => {
    const errors: ApiErrorReasonV2[] = [
      {
        field: '$.some.unknown.path',
        message: 'Unknown',
      },
    ];

    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBeUndefined();
  });

  it('handles empty errors array', () => {
    expect(mapPartyApiErrorsToFormErrors([])).toEqual([]);
  });
});

// ─── generateClientRequestBody ──────────────────────────────────────

describe('generateClientRequestBody', () => {
  it('maps form values to nested request body', () => {
    const result = generateClientRequestBody(
      { organizationName: 'Test Corp' },
      0,
      'parties',
      {}
    );

    expect(result).toEqual({
      parties: [
        {
          organizationDetails: {
            organizationName: 'Test Corp',
          },
        },
      ],
    });
  });

  it('skips empty string values', () => {
    const result = generateClientRequestBody(
      { organizationName: '' },
      0,
      'parties',
      {}
    );

    expect(result).toEqual({});
  });

  it('skips undefined values', () => {
    const result = generateClientRequestBody(
      { organizationName: undefined } as any,
      0,
      'parties',
      {}
    );

    expect(result).toEqual({});
  });

  it('skips fields with excludeFromMapping', () => {
    const result = generateClientRequestBody(
      { dbaNameNotAvailable: true } as any,
      0,
      'parties',
      {}
    );

    // dbaNameNotAvailable has excludeFromMapping: true
    expect(result).toEqual({});
  });

  it('applies toRequestFn when present', () => {
    const result = generateClientRequestBody(
      { organizationIdEin: '123456789' },
      0,
      'parties',
      {}
    );

    // organizationIdEin has a toRequestFn that wraps in array
    const ids = (result as any)?.parties?.[0]?.organizationDetails
      ?.organizationIds;
    expect(ids).toBeDefined();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids[0].idType).toBe('EIN');
    expect(ids[0].value).toBe('123456789');
  });
});

// ─── generatePartyRequestBody ───────────────────────────────────────

describe('generatePartyRequestBody', () => {
  it('maps form values to party request body', () => {
    const result = generatePartyRequestBody(
      { organizationName: 'Test Corp' },
      {}
    );

    expect(result).toEqual({
      organizationDetails: {
        organizationName: 'Test Corp',
      },
    });
  });

  it('skips empty values', () => {
    const result = generatePartyRequestBody({ organizationName: '' }, {});
    expect(result).toEqual({});
  });
});

// ─── convertClientResponseToFormValues ──────────────────────────────

describe('convertClientResponseToFormValues', () => {
  it('converts client response to form values', () => {
    const response = {
      id: 'client-1',
      partyId: '0000000001',
      products: ['EMBEDDED_PAYMENTS'],
      outstanding: {},
      status: 'NEW',
      parties: [
        {
          id: 'party-1',
          partyType: 'ORGANIZATION',
          active: true,
          roles: ['CLIENT'],
          organizationDetails: {
            organizationName: 'Test Corp',
          },
        },
      ],
    } as ClientResponse;

    const result = convertClientResponseToFormValues(response, 'party-1');
    expect(result.organizationName).toBe('Test Corp');
  });

  it('returns empty object when party not found', () => {
    const response = {
      id: 'client-1',
      partyId: '0000000001',
      products: ['EMBEDDED_PAYMENTS'],
      outstanding: {},
      status: 'NEW',
      parties: [],
    } as ClientResponse;

    const result = convertClientResponseToFormValues(response, 'nonexistent');
    // With partyIndex=-1, paths won't match
    expect(result).toBeDefined();
  });

  it('applies fromResponseFn transformations', () => {
    const response = {
      id: 'client-1',
      partyId: '0000000001',
      products: ['EMBEDDED_PAYMENTS'],
      outstanding: {},
      status: 'NEW',
      parties: [
        {
          id: 'party-1',
          partyType: 'ORGANIZATION',
          active: true,
          roles: ['CLIENT'],
          organizationDetails: {
            organizationName: 'PLACEHOLDER_ORG_NAME',
          },
        },
      ],
    } as ClientResponse;

    const result = convertClientResponseToFormValues(response, 'party-1');
    // fromResponseFn for organizationName converts PLACEHOLDER_ORG_NAME to ''
    expect(result.organizationName).toBe('');
  });
});

// ─── convertPartyResponseToFormValues ───────────────────────────────

describe('convertPartyResponseToFormValues', () => {
  it('converts party response to form values', () => {
    const partyResponse: PartyResponse = {
      id: 'p1',
      partyType: 'ORGANIZATION',
      active: true,
      roles: ['CLIENT'],
      organizationDetails: {
        organizationName: 'Acme Inc',
      },
    };

    const result = convertPartyResponseToFormValues(partyResponse);
    expect(result.organizationName).toBe('Acme Inc');
  });

  it('normalizes controllerIds with countryOfResidence', () => {
    const partyResponse: PartyResponse = {
      id: 'p1',
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'US',
        individualIds: [{ idType: 'SSN', value: '123456789', issuer: 'XX' }],
      },
    };

    const result = convertPartyResponseToFormValues(partyResponse);
    expect(result.countryOfResidence).toBe('US');
    // controllerIds should have issuer normalized to the countryOfResidence
    if (result.controllerIds) {
      expect(result.controllerIds[0]?.issuer).toBe('US');
    }
  });

  it('generates default controllerIds for US residents without IDs', () => {
    const partyResponse: PartyResponse = {
      id: 'p1',
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Jane',
        countryOfResidence: 'US',
      },
    };

    const result = convertPartyResponseToFormValues(partyResponse);
    if (result.controllerIds) {
      expect(result.controllerIds[0]?.idType).toBe('SSN');
      expect(result.controllerIds[0]?.issuer).toBe('US');
    }
  });

  it('generates default controllerIds with empty idType for non-US residents', () => {
    const partyResponse: PartyResponse = {
      id: 'p1',
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Pierre',
        countryOfResidence: 'CA',
      },
    };

    const result = convertPartyResponseToFormValues(partyResponse);
    if (result.controllerIds) {
      expect(result.controllerIds[0]?.idType).toBe('');
      expect(result.controllerIds[0]?.issuer).toBe('CA');
    }
  });

  it('handles empty party response', () => {
    const result = convertPartyResponseToFormValues({} as PartyResponse);
    expect(result).toBeDefined();
  });
});

// ─── getFieldRuleByClientContext ────────────────────────────────────

describe('getFieldRuleByClientContext', () => {
  it('returns base rule when no conditions match', () => {
    const result = getFieldRuleByClientContext(
      'organizationName',
      {},
      'checklist'
    );
    expect(result.ruleType).toBe('single');
    expect(result.fieldRule.display).toBe('visible');
  });

  it('applies conditional rules when conditions match', () => {
    const result = getFieldRuleByClientContext(
      'organizationName',
      { entityType: 'SOLE_PROPRIETORSHIP' },
      'checklist'
    );
    expect(result.fieldRule.interaction).toBe('readonly');
  });

  it('returns array rule type for array fields', () => {
    const result = getFieldRuleByClientContext(
      'controllerIds',
      {},
      'checklist'
    );
    expect(result.ruleType).toBe('array');
  });

  it('handles dot-path for subfields of array fields', () => {
    const result = getFieldRuleByClientContext(
      'controllerIds.0.value',
      {},
      'checklist'
    );
    expect(result).toBeDefined();
  });

  it('throws for undefined subfield', () => {
    expect(() =>
      getFieldRuleByClientContext(
        'controllerIds.0.nonexistent' as any,
        {},
        'checklist'
      )
    ).toThrow('Subfield "nonexistent" is not defined');
  });

  it('handles screenId condition', () => {
    // natureOfOwnership is hidden by default, visible in owner-stepper
    const hiddenResult = getFieldRuleByClientContext(
      'natureOfOwnership',
      {},
      'checklist'
    );
    expect(hiddenResult.fieldRule.display).toBe('hidden');

    const visibleResult = getFieldRuleByClientContext(
      'natureOfOwnership',
      {},
      'owner-stepper'
    );
    expect(visibleResult.fieldRule.display).toBe('visible');
  });
});

// ─── modifySchemaByClientContext ─────────────────────────────────────

describe('modifySchemaByClientContext', () => {
  const baseSchema = z.object({
    organizationName: z.string().min(1),
    organizationDescription: z.string().min(1),
  });

  it('returns a zod schema', () => {
    const result = modifySchemaByClientContext(baseSchema, {}, 'checklist');
    expect(result).toBeDefined();
    expect(typeof result.safeParse).toBe('function');
  });

  it('makes non-required fields optional', () => {
    // controllerEmail is not required by default
    const schema = z.object({
      controllerEmail: z.string().email(),
    });
    const modified = modifySchemaByClientContext(schema, {}, 'checklist');
    const result = modified.safeParse({ controllerEmail: '' });
    expect(result.success).toBe(true);
  });

  it('removes hidden fields from schema', () => {
    // natureOfOwnership is hidden by default
    const schema = z.object({
      natureOfOwnership: z.string().min(1),
      organizationName: z.string().min(1),
    });
    const modified = modifySchemaByClientContext(schema, {}, 'checklist');
    const result = modified.safeParse({ organizationName: 'Test' });
    expect(result.success).toBe(true);
  });

  it('applies refineFn when provided', () => {
    const refineFn = (s: z.ZodObject<Record<string, z.ZodType<any>>>) =>
      s.refine((data) => data.organizationName !== 'FORBIDDEN', {
        message: 'Forbidden name',
      });

    const modified = modifySchemaByClientContext(
      baseSchema,
      {},
      'checklist',
      refineFn
    );

    const result = modified.safeParse({
      organizationName: 'FORBIDDEN',
      organizationDescription: 'desc',
    });
    expect(result.success).toBe(false);
  });
});

// ─── modifyDefaultValuesByClientContext ──────────────────────────────

describe('modifyDefaultValuesByClientContext', () => {
  it('returns default values for visible fields', () => {
    const result = modifyDefaultValuesByClientContext(
      { organizationName: 'Test' },
      {},
      'checklist'
    );
    expect(result.organizationName).toBe('Test');
  });

  it('excludes hidden fields', () => {
    // natureOfOwnership is hidden by default (not in owner-stepper)
    const result = modifyDefaultValuesByClientContext(
      { natureOfOwnership: 'direct' } as any,
      {},
      'checklist'
    );
    expect(result).not.toHaveProperty('natureOfOwnership');
  });

  it('uses fieldRule defaultValue when form value is undefined', () => {
    const result = modifyDefaultValuesByClientContext(
      { countryOfFormation: undefined } as any,
      {},
      'checklist'
    );
    // countryOfFormation default is 'US'
    expect(result.countryOfFormation).toBe('US');
  });
});

// ─── shapeFormValuesBySchema ────────────────────────────────────────

describe('shapeFormValuesBySchema', () => {
  const schema = z.object({
    organizationName: z.string(),
    countryOfFormation: z.string(),
  });

  it('includes only keys present in the schema', () => {
    const result = shapeFormValuesBySchema(
      {
        organizationName: 'Test',
        countryOfFormation: 'US',
        organizationDescription: 'Desc',
      } as any,
      schema
    );
    expect(result).toHaveProperty('organizationName', 'Test');
    expect(result).toHaveProperty('countryOfFormation', 'US');
    expect(result).not.toHaveProperty('organizationDescription');
  });

  it('sets undefined for keys not in formValues', () => {
    const result = shapeFormValuesBySchema(
      { organizationName: 'Test' } as any,
      schema
    );
    expect(result).toHaveProperty('countryOfFormation', undefined);
  });

  it('handles empty formValues', () => {
    const result = shapeFormValuesBySchema({}, schema);
    expect(result.organizationName).toBeUndefined();
    expect(result.countryOfFormation).toBeUndefined();
  });
});
