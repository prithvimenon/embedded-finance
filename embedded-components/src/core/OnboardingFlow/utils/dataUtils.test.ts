import { describe, expect, it } from 'vitest';

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import {
  formatQuestionResponse,
  getAllOwners,
  getActiveOwners,
  getClientContext,
  getControllerParty,
  getInactiveOwners,
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
  getPartyName,
  clientHasOutstandingDocRequests,
  convertClientToSoleProprietorship,
} from './dataUtils';

const mockClientData: ClientResponse = {
  id: 'client-1',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [
    {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Test Corp',
        jurisdiction: 'US',
        countryOfFormation: 'US',
      },
    },
    {
      id: 'ind-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
      },
    },
    {
      id: 'ind-2',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: false,
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    },
    {
      id: 'ind-3',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'Bob',
        lastName: 'Builder',
      },
    },
  ],
} as ClientResponse;

describe('getAllOwners', () => {
  it('returns INDIVIDUAL parties with BENEFICIAL_OWNER role', () => {
    const owners = getAllOwners(mockClientData);
    expect(owners).toHaveLength(2);
    expect(owners?.[0].id).toBe('ind-1');
    expect(owners?.[1].id).toBe('ind-2');
  });

  it('returns undefined for undefined clientData', () => {
    expect(getAllOwners(undefined)).toBeUndefined();
  });

  it('returns empty array when no owners exist', () => {
    const data = { ...mockClientData, parties: [mockClientData.parties![0]] };
    expect(getAllOwners(data)).toHaveLength(0);
  });
});

describe('getActiveOwners', () => {
  it('filters to active owners only', () => {
    const active = getActiveOwners(mockClientData);
    expect(active).toHaveLength(1);
    expect(active?.[0].id).toBe('ind-1');
  });

  it('returns undefined for undefined clientData', () => {
    expect(getActiveOwners(undefined)).toBeUndefined();
  });
});

describe('getInactiveOwners', () => {
  it('filters to inactive owners only', () => {
    const inactive = getInactiveOwners(mockClientData);
    expect(inactive).toHaveLength(1);
    expect(inactive?.[0].id).toBe('ind-2');
  });

  it('returns undefined for undefined clientData', () => {
    expect(getInactiveOwners(undefined)).toBeUndefined();
  });
});

describe('getClientContext', () => {
  it('extracts product, jurisdiction, entityType from org party', () => {
    const context = getClientContext(mockClientData);
    expect(context.product).toBe('EMBEDDED_PAYMENTS');
    expect(context.jurisdiction).toBe('US');
    expect(context.entityType).toBe('LIMITED_LIABILITY_COMPANY');
  });

  it('returns undefined values for undefined clientData', () => {
    const context = getClientContext(undefined);
    expect(context.product).toBeUndefined();
    expect(context.jurisdiction).toBeUndefined();
    expect(context.entityType).toBeUndefined();
  });

  it('returns undefined values when no org party exists', () => {
    const data = {
      ...mockClientData,
      parties: [mockClientData.parties![1]],
    };
    const context = getClientContext(data);
    expect(context.jurisdiction).toBeUndefined();
    expect(context.entityType).toBeUndefined();
  });
});

describe('getPartyByAssociatedPartyFilters', () => {
  it('finds party matching filters', () => {
    const party = getPartyByAssociatedPartyFilters(mockClientData, {
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
    });
    expect(party.id).toBe('ind-1');
  });

  it('returns empty object when no match found', () => {
    const party = getPartyByAssociatedPartyFilters(mockClientData, {
      partyType: 'INDIVIDUAL',
      roles: ['UNKNOWN_ROLE' as any],
    });
    expect(party).toEqual({});
  });

  it('returns empty object for undefined clientData', () => {
    const party = getPartyByAssociatedPartyFilters(undefined, {
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
    });
    expect(party).toEqual({});
  });
});

describe('getOrganizationParty', () => {
  it('returns the active organization party with CLIENT role', () => {
    const org = getOrganizationParty(mockClientData);
    expect(org?.id).toBe('org-1');
  });

  it('returns undefined for undefined clientData', () => {
    expect(getOrganizationParty(undefined)).toBeUndefined();
  });
});

describe('getControllerParty', () => {
  it('returns the active individual party with CONTROLLER role', () => {
    const controller = getControllerParty(mockClientData);
    expect(controller?.id).toBe('ind-3');
  });

  it('returns undefined for undefined clientData', () => {
    expect(getControllerParty(undefined)).toBeUndefined();
  });
});

describe('getPartyName', () => {
  it('returns individual name from parts', () => {
    const party: Partial<PartyResponse> = {
      individualDetails: {
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        nameSuffix: 'Jr',
      },
    };
    expect(getPartyName(party as PartyResponse)).toBe('John M Doe Jr');
  });

  it('returns organization name when available', () => {
    const party: Partial<PartyResponse> = {
      organizationDetails: {
        organizationName: 'Test Corp',
        countryOfFormation: 'US',
      },
    };
    expect(getPartyName(party as PartyResponse)).toBe('Test Corp');
  });

  it('returns empty string for undefined party', () => {
    expect(getPartyName(undefined)).toBe('');
  });
});

describe('formatQuestionResponse', () => {
  it('formats monetary question 30005 as currency', () => {
    const result = formatQuestionResponse({
      questionId: '30005',
      values: ['10000'],
    });
    expect(result).toBe('$10,000');
  });

  it('joins multiple values with comma', () => {
    const result = formatQuestionResponse({
      questionId: '30001',
      values: ['a', 'b', 'c'],
    });
    expect(result).toBe('a, b, c');
  });

  it('returns empty string for missing values', () => {
    const result = formatQuestionResponse({
      questionId: '30001',
      values: undefined,
    });
    expect(result).toBe('');
  });
});

describe('clientHasOutstandingDocRequests', () => {
  it('returns false for undefined clientData', () => {
    expect(clientHasOutstandingDocRequests(undefined)).toBe(false);
  });

  it('returns true when top-level doc requests exist', () => {
    const data = {
      ...mockClientData,
      outstanding: { documentRequestIds: ['doc-1'] },
    } as ClientResponse;
    expect(clientHasOutstandingDocRequests(data)).toBe(true);
  });

  it('returns false when no outstanding doc requests', () => {
    expect(clientHasOutstandingDocRequests(mockClientData)).toBe(false);
  });
});

describe('convertClientToSoleProprietorship', () => {
  it('returns undefined for undefined clientData', () => {
    expect(convertClientToSoleProprietorship(undefined)).toBeUndefined();
  });

  it('converts organization type to SOLE_PROPRIETORSHIP', () => {
    const result = convertClientToSoleProprietorship(mockClientData);
    const orgParty = result?.parties?.find(
      (p) => p.partyType === 'ORGANIZATION'
    );
    expect(orgParty?.organizationDetails?.organizationType).toBe(
      'SOLE_PROPRIETORSHIP'
    );
  });
});
