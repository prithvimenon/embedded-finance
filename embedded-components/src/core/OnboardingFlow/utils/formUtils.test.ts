import { describe, expect, it } from 'vitest';

import type { PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  convertPartyResponseToFormValues,
  getPartyFieldConfig,
  getValueByPath,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  modifySchemaByClientContext,
  sanitizeServerErrorMessage,
  shapeFormValuesBySchema,
} from './formUtils';

describe('getValueByPath', () => {
  it('retrieves nested values using dot notation', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getValueByPath(obj, 'a.b.c')).toBe(42);
  });

  it('returns undefined for missing paths', () => {
    const obj = { a: { b: 1 } };
    expect(getValueByPath(obj, 'a.c.d')).toBeUndefined();
  });

  it('handles array index notation', () => {
    const obj = { items: [{ name: 'first' }, { name: 'second' }] };
    expect(getValueByPath(obj, 'items[1].name')).toBe('second');
  });

  it('returns undefined for null/undefined input', () => {
    expect(getValueByPath(undefined, 'a.b')).toBeUndefined();
    expect(getValueByPath(null, 'a.b')).toBeUndefined();
  });
});

describe('getPartyFieldConfig', () => {
  it('returns config for a valid field name', () => {
    const config = getPartyFieldConfig('organizationName');
    expect(config).toBeDefined();
    expect(config.path).toBeDefined();
  });

  it('throws for an unmapped field name', () => {
    expect(() =>
      getPartyFieldConfig('nonExistentField' as any)
    ).toThrow();
  });
});

describe('convertPartyResponseToFormValues', () => {
  it('converts a party response with individual details', () => {
    const response: PartyResponse = {
      id: 'party-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'US',
        individualIds: [{ idType: 'SSN', issuer: 'US', value: '123456789' }],
      },
    } as PartyResponse;

    const formValues = convertPartyResponseToFormValues(response);
    // Field map uses controllerFirstName -> individualDetails.firstName
    expect(formValues.controllerFirstName).toBe('John');
    expect(formValues.controllerLastName).toBe('Doe');
    expect(formValues.countryOfResidence).toBe('US');
  });

  it('normalises controllerIds issuer to countryOfResidence', () => {
    const response: PartyResponse = {
      id: 'party-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Smith',
        countryOfResidence: 'CA',
        individualIds: [
          { idType: 'PASSPORT', issuer: 'US', value: 'P12345' },
        ],
      },
    } as PartyResponse;

    const formValues = convertPartyResponseToFormValues(response);
    if (formValues.controllerIds?.length) {
      expect(formValues.controllerIds[0].issuer).toBe('CA');
    }
  });

  it('generates default controllerIds when none exist for US country', () => {
    const response: PartyResponse = {
      id: 'party-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'Bob',
        lastName: 'Builder',
        countryOfResidence: 'US',
      },
    } as PartyResponse;

    const formValues = convertPartyResponseToFormValues(response);
    expect(formValues.controllerIds).toEqual([
      { idType: 'SSN', issuer: 'US', value: '' },
    ]);
  });

  it('generates default controllerIds with empty idType for non-US country', () => {
    const response: PartyResponse = {
      id: 'party-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'Hans',
        lastName: 'Mueller',
        countryOfResidence: 'DE',
      },
    } as PartyResponse;

    const formValues = convertPartyResponseToFormValues(response);
    expect(formValues.controllerIds).toEqual([
      { idType: '', issuer: 'DE', value: '' },
    ]);
  });

  it('converts organization party response', () => {
    const response: PartyResponse = {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationName: 'Test Corp',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
        jurisdiction: 'US',
      },
    } as PartyResponse;

    const formValues = convertPartyResponseToFormValues(response);
    expect(formValues.organizationName).toBe('Test Corp');
  });
});

describe('sanitizeServerErrorMessage', () => {
  it('strips Field path prefix', () => {
    const msg =
      'Field /individualDetails/addresses[0]/postalCode/ value must have the expected value. The postal code [00000] is invalid for the country [US].';
    const result = sanitizeServerErrorMessage(msg);
    expect(result).toBe(
      'The postal code 00000 is invalid for the country US.'
    );
  });

  it('returns original message when no prefix found', () => {
    const msg = 'Some generic error';
    expect(sanitizeServerErrorMessage(msg)).toBe('Some generic error');
  });

  it('handles empty message', () => {
    expect(sanitizeServerErrorMessage('')).toBe('');
  });
});

describe('mapClientApiErrorsToFormErrors', () => {
  it('maps API errors to form errors', () => {
    const errors = [
      { field: '$.parties.0.individualDetails.firstName', message: 'Required' },
    ];
    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles unmatched errors gracefully', () => {
    const errors = [
      { field: '$.unknown.path', message: 'Unknown error' },
    ];
    const result = mapClientApiErrorsToFormErrors(errors, 0, 'parties');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBeUndefined();
  });
});

describe('mapPartyApiErrorsToFormErrors', () => {
  it('maps party-level API errors', () => {
    const errors = [
      { field: '$.individualDetails.firstName', message: 'Required' },
    ];
    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles unmatched errors gracefully', () => {
    const errors = [{ field: '$.totally.unknown', message: 'Error' }];
    const result = mapPartyApiErrorsToFormErrors(errors);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBeUndefined();
  });
});

describe('shapeFormValuesBySchema', () => {
  it('returns only keys present in the schema', () => {
    const { z } = require('zod');
    const schema = z.object({
      firstName: z.string(),
      lastName: z.string(),
    });
    const values = {
      firstName: 'John',
      lastName: 'Doe',
      extraField: 'should be removed',
    };
    const result = shapeFormValuesBySchema(values as any, schema);
    expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    expect((result as any).extraField).toBeUndefined();
  });
});
