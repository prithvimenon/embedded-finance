import { describe, expect, it } from 'vitest';

import { GatewayScreenFormSchema } from './GatewayScreen.schema';

describe('GatewayScreenFormSchema', () => {
  it('validates valid input with both organization types', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty generalOrganizationType', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: '',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty specificOrganizationType', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: '',
      },
    });
    expect(result.success).toBe(false);
  });

  it('validates SOLE_PROPRIETORSHIP as general type', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'SOLE_PROPRIETORSHIP',
        specificOrganizationType: 'SOLE_PROPRIETORSHIP',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid general organization type', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'INVALID',
        specificOrganizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid specific organization type', () => {
    const result = GatewayScreenFormSchema.safeParse({
      organizationTypeHierarchy: {
        generalOrganizationType: 'REGISTERED_BUSINESS',
        specificOrganizationType: 'INVALID_TYPE',
      },
    });
    expect(result.success).toBe(false);
  });
});
