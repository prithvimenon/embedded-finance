import { describe, expect, test } from 'vitest';

import { GatewayScreenFormSchema } from './GatewayScreen.schema';

describe('GatewayScreenFormSchema', () => {
  test('parses valid SOLE_PROPRIETORSHIP input', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'SOLE_PROPRIETORSHIP',
        specificOrganizationType: 'SOLE_PROPRIETORSHIP',
      },
    });
    expect(result.success).toBe(true);
  });

  test('parses valid REGISTERED_BUSINESS with LLC', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(true);
  });

  test('parses valid OTHER with NON_PROFIT_CORPORATION', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'OTHER',
        specificOrganizationType: 'NON_PROFIT_CORPORATION',
      },
    });
    expect(result.success).toBe(true);
  });

  test('fails when generalOrganizationType is empty string', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: '',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(false);
  });

  test('fails when specificOrganizationType is empty string', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: '',
      },
    });
    expect(result.success).toBe(false);
  });

  test('fails when both fields are empty strings', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: '',
        specificOrganizationType: '',
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('fails when organizationTypeHierarchy is missing', () => {
    const result = GatewayScreenFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('fails with invalid generalOrganizationType value', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'INVALID_TYPE',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(false);
  });

  test('fails with invalid specificOrganizationType value', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: 'INVALID_SPECIFIC_TYPE',
      },
    });
    expect(result.success).toBe(false);
  });

  test('parses all valid specific organization types', () => {
    const validSpecificTypes = [
      'LIMITED_LIABILITY_COMPANY',
      'LIMITED_LIABILITY_PARTNERSHIP',
      'GENERAL_PARTNERSHIP',
      'LIMITED_PARTNERSHIP',
      'C_CORPORATION',
      'S_CORPORATION',
      'PARTNERSHIP',
      'NON_PROFIT_CORPORATION',
      'GOVERNMENT_ENTITY',
      'SOLE_PROPRIETORSHIP',
      'UNINCORPORATED_ASSOCIATION',
      'PUBLICLY_TRADED_COMPANY',
    ];

    for (const specificType of validSpecificTypes) {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'REGISTERED_BUSINESS',
          specificOrganizationType: specificType,
        },
      });
      expect(result.success).toBe(true);
    }
  });

  test('parses all valid general organization types', () => {
    const validGeneralTypes = [
      'SOLE_PROPRIETORSHIP',
      'REGISTERED_BUSINESS',
      'OTHER',
    ];

    for (const generalType of validGeneralTypes) {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: generalType,
          specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
        },
      });
      expect(result.success).toBe(true);
    }
  });
});
