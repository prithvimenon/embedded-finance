import { describe, expect, test } from 'vitest';

import { GatewayScreenFormSchema } from './GatewayScreen.schema';

describe('GatewayScreenFormSchema', () => {
  describe('valid inputs', () => {
    test('passes with SOLE_PROPRIETORSHIP for both general and specific', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'SOLE_PROPRIETORSHIP',
          specificOrganizationType: 'SOLE_PROPRIETORSHIP',
        },
      });
      expect(result.success).toBe(true);
    });

    test('passes with REGISTERED_BUSINESS and LIMITED_LIABILITY_COMPANY', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'REGISTERED_BUSINESS',
          specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
        },
      });
      expect(result.success).toBe(true);
    });

    test('passes with OTHER and NON_PROFIT_CORPORATION', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'OTHER',
          specificOrganizationType: 'NON_PROFIT_CORPORATION',
        },
      });
      expect(result.success).toBe(true);
    });

    test('passes with REGISTERED_BUSINESS and C_CORPORATION', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'REGISTERED_BUSINESS',
          specificOrganizationType: 'C_CORPORATION',
        },
      });
      expect(result.success).toBe(true);
    });

    test('passes with all specific organization types', () => {
      const specificTypes = [
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

      specificTypes.forEach((specificType) => {
        const result = GatewayScreenFormSchema.safeParse({
          organizationTypeHierarchy: {
            generalOrganizationType: 'REGISTERED_BUSINESS',
            specificOrganizationType: specificType,
          },
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('invalid inputs', () => {
    test('fails when both fields are empty strings', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: '',
          specificOrganizationType: '',
        },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain(
          'organizationTypeHierarchy.generalOrganizationType'
        );
        expect(paths).toContain(
          'organizationTypeHierarchy.specificOrganizationType'
        );
      }
    });

    test('fails when general is valid but specific is empty', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'REGISTERED_BUSINESS',
          specificOrganizationType: '',
        },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain(
          'organizationTypeHierarchy.specificOrganizationType'
        );
        expect(paths).not.toContain(
          'organizationTypeHierarchy.generalOrganizationType'
        );
      }
    });

    test('fails when fields are completely missing', () => {
      const result = GatewayScreenFormSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    test('fails when organizationTypeHierarchy is missing', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {},
      });
      expect(result.success).toBe(false);
    });

    test('fails when general type is invalid enum value', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'INVALID_TYPE',
          specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
        },
      });
      expect(result.success).toBe(false);
    });

    test('fails when specific type is invalid enum value', () => {
      const result = GatewayScreenFormSchema.safeParse({
        organizationTypeHierarchy: {
          generalOrganizationType: 'REGISTERED_BUSINESS',
          specificOrganizationType: 'INVALID_TYPE',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
