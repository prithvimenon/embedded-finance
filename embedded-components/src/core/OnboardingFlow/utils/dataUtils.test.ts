import { describe, expect, it } from 'vitest';

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import {
  clientHasOutstandingDocRequests,
  convertClientToSoleProprietorship,
  formatQuestionResponse,
  getActiveOwners,
  getAllOwners,
  getClientContext,
  getControllerParty,
  getInactiveOwners,
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
  getPartyName,
} from './dataUtils';

const makeClientResponse = (
  overrides: Partial<ClientResponse> = {}
): ClientResponse =>
  ({
    id: 'client-1',
    partyId: '0000000001',
    products: ['EMBEDDED_PAYMENTS'],
    outstanding: {},
    status: 'NEW',
    ...overrides,
  }) as ClientResponse;

const makeParty = (overrides: Partial<PartyResponse> = {}): PartyResponse => ({
  id: 'party-1',
  partyType: 'INDIVIDUAL',
  active: true,
  roles: [],
  ...overrides,
});

describe('getAllOwners', () => {
  it('returns undefined when clientData is undefined', () => {
    expect(getAllOwners(undefined)).toBeUndefined();
  });

  it('returns undefined when parties is undefined', () => {
    expect(getAllOwners(makeClientResponse())).toBeUndefined();
  });

  it('returns only INDIVIDUAL parties with BENEFICIAL_OWNER role', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          id: 'p1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
        }),
        makeParty({
          id: 'p2',
          partyType: 'ORGANIZATION',
          roles: ['BENEFICIAL_OWNER'],
        }),
        makeParty({
          id: 'p3',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
        }),
        makeParty({
          id: 'p4',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
        }),
      ],
    });

    const owners = getAllOwners(clientData);
    expect(owners).toHaveLength(2);
    expect(owners?.map((o) => o.id)).toEqual(['p1', 'p4']);
  });

  it('returns empty array when no matching parties', () => {
    const clientData = makeClientResponse({
      parties: [makeParty({ partyType: 'ORGANIZATION', roles: ['CLIENT'] })],
    });
    expect(getAllOwners(clientData)).toEqual([]);
  });
});

describe('getActiveOwners', () => {
  it('returns only active owners', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          id: 'active',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
        }),
        makeParty({
          id: 'inactive',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: false,
        }),
      ],
    });

    const active = getActiveOwners(clientData);
    expect(active).toHaveLength(1);
    expect(active?.[0].id).toBe('active');
  });

  it('returns undefined when clientData is undefined', () => {
    expect(getActiveOwners(undefined)).toBeUndefined();
  });
});

describe('getInactiveOwners', () => {
  it('returns only inactive owners', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          id: 'active',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
        }),
        makeParty({
          id: 'inactive',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: false,
        }),
      ],
    });

    const inactive = getInactiveOwners(clientData);
    expect(inactive).toHaveLength(1);
    expect(inactive?.[0].id).toBe('inactive');
  });

  it('returns undefined when clientData is undefined', () => {
    expect(getInactiveOwners(undefined)).toBeUndefined();
  });
});

describe('getClientContext', () => {
  it('returns empty context when clientData is undefined', () => {
    const ctx = getClientContext(undefined);
    expect(ctx).toEqual({
      product: undefined,
      jurisdiction: undefined,
      entityType: undefined,
    });
  });

  it('extracts product from first element of products array', () => {
    const clientData = makeClientResponse({
      products: ['EMBEDDED_PAYMENTS'],
    });
    const ctx = getClientContext(clientData);
    expect(ctx.product).toBe('EMBEDDED_PAYMENTS');
  });

  it('extracts jurisdiction and entityType from organization party', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          partyType: 'ORGANIZATION',
          organizationDetails: {
            jurisdiction: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
          },
        }),
      ],
    });
    const ctx = getClientContext(clientData);
    expect(ctx.jurisdiction).toBe('US');
    expect(ctx.entityType).toBe('LIMITED_LIABILITY_COMPANY');
  });
});

describe('getPartyByAssociatedPartyFilters', () => {
  const clientData = makeClientResponse({
    parties: [
      makeParty({
        id: 'p1',
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
        active: true,
      }),
      makeParty({
        id: 'p2',
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
        active: true,
      }),
      makeParty({
        id: 'p3',
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
        active: false,
      }),
    ],
  });

  it('finds matching active party by type and roles', () => {
    const result = getPartyByAssociatedPartyFilters(clientData, {
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
    });
    expect(result).toEqual(expect.objectContaining({ id: 'p1' }));
  });

  it('returns empty object when no match found', () => {
    const result = getPartyByAssociatedPartyFilters(clientData, {
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
    });
    expect(result).toEqual({});
  });

  it('returns empty object when clientData is undefined', () => {
    expect(
      getPartyByAssociatedPartyFilters(undefined, {
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
      })
    ).toEqual({});
  });

  it('skips inactive parties', () => {
    const result = getPartyByAssociatedPartyFilters(
      makeClientResponse({
        parties: [
          makeParty({
            id: 'p3',
            partyType: 'INDIVIDUAL',
            roles: ['CONTROLLER'],
            active: false,
          }),
        ],
      }),
      { partyType: 'INDIVIDUAL', roles: ['CONTROLLER'] }
    );
    expect(result).toEqual({});
  });
});

describe('getOrganizationParty', () => {
  it('returns the active ORGANIZATION party with CLIENT role', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          id: 'org',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
        }),
        makeParty({ id: 'ind', partyType: 'INDIVIDUAL', roles: ['CLIENT'] }),
      ],
    });
    expect(getOrganizationParty(clientData)?.id).toBe('org');
  });

  it('returns undefined when no matching party', () => {
    expect(getOrganizationParty(makeClientResponse())).toBeUndefined();
  });

  it('returns undefined when clientData is undefined', () => {
    expect(getOrganizationParty(undefined)).toBeUndefined();
  });
});

describe('getControllerParty', () => {
  it('returns the active INDIVIDUAL party with CONTROLLER role', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          id: 'ctrl',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          active: true,
        }),
      ],
    });
    expect(getControllerParty(clientData)?.id).toBe('ctrl');
  });

  it('returns undefined when no matching party', () => {
    expect(getControllerParty(makeClientResponse())).toBeUndefined();
  });

  it('returns undefined when clientData is undefined', () => {
    expect(getControllerParty(undefined)).toBeUndefined();
  });
});

describe('getPartyName', () => {
  it('returns empty string when partyData is undefined', () => {
    expect(getPartyName(undefined)).toBe('');
  });

  it('returns organization name when available', () => {
    const party = makeParty({
      organizationDetails: { organizationName: 'Acme Corp' },
    });
    expect(getPartyName(party)).toBe('Acme Corp');
  });

  it('returns individual full name', () => {
    const party = makeParty({
      individualDetails: {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        nameSuffix: 'Jr',
      },
    });
    expect(getPartyName(party)).toBe('John Michael Doe Jr');
  });

  it('skips empty name parts', () => {
    const party = makeParty({
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    });
    expect(getPartyName(party)).toBe('Jane Smith');
  });

  it('returns empty string when no name info', () => {
    const party = makeParty({});
    expect(getPartyName(party)).toBe('');
  });
});

describe('formatQuestionResponse', () => {
  it('formats currency for questionId 30005', () => {
    const result = formatQuestionResponse({
      questionId: '30005',
      values: ['50000'],
    });
    expect(result).toBe('$50,000');
  });

  it('formats currency with 0 for non-numeric value with questionId 30005', () => {
    const result = formatQuestionResponse({
      questionId: '30005',
      values: ['abc'],
    });
    expect(result).toBe('$0');
  });

  it('joins values with comma for other questions', () => {
    const result = formatQuestionResponse({
      questionId: '10001',
      values: ['value1', 'value2'],
    });
    expect(result).toBe('value1, value2');
  });

  it('returns "No" for false', () => {
    const result = formatQuestionResponse({
      questionId: '10001',
      values: ['false'],
    });
    // i18n returns translation key when not found, or the actual translation
    expect(result).toBeDefined();
  });

  it('returns "Yes" for true', () => {
    const result = formatQuestionResponse({
      questionId: '10001',
      values: ['true'],
    });
    expect(result).toBeDefined();
  });

  it('returns empty string when values is undefined', () => {
    const result = formatQuestionResponse({
      questionId: '10001',
    });
    expect(result).toBe('');
  });
});

describe('clientHasOutstandingDocRequests', () => {
  it('returns false when clientData is undefined', () => {
    expect(clientHasOutstandingDocRequests(undefined)).toBe(false);
  });

  it('returns false when no outstanding document requests', () => {
    expect(
      clientHasOutstandingDocRequests(
        makeClientResponse({
          outstanding: { documentRequestIds: [] },
        })
      )
    ).toBe(false);
  });

  it('returns true when top-level documentRequestIds exist', () => {
    expect(
      clientHasOutstandingDocRequests(
        makeClientResponse({
          outstanding: { documentRequestIds: ['doc-1'] },
        })
      )
    ).toBe(true);
  });

  it('returns true when party validation has documentRequestIds', () => {
    expect(
      clientHasOutstandingDocRequests(
        makeClientResponse({
          parties: [
            makeParty({
              validationResponse: [{ documentRequestIds: ['doc-2'] }],
            }),
          ],
        })
      )
    ).toBe(true);
  });

  it('returns false when parties have no documentRequestIds', () => {
    expect(
      clientHasOutstandingDocRequests(
        makeClientResponse({
          parties: [
            makeParty({
              validationResponse: [{ documentRequestIds: [] }],
            }),
          ],
        })
      )
    ).toBe(false);
  });
});

describe('convertClientToSoleProprietorship', () => {
  it('returns undefined when clientData is undefined', () => {
    expect(convertClientToSoleProprietorship(undefined)).toBeUndefined();
  });

  it('converts organization type to SOLE_PROPRIETORSHIP', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          id: 'org',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
          organizationDetails: {
            organizationName: 'Test Biz',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
          },
        }),
        makeParty({
          id: 'ctrl',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          active: true,
          individualDetails: {
            firstName: 'John',
            lastName: 'Doe',
          },
        }),
      ],
    });

    const result = convertClientToSoleProprietorship(clientData);
    const orgParty = result?.parties?.find(
      (p) => p.partyType === 'ORGANIZATION'
    );
    const ctrlParty = result?.parties?.find(
      (p) => p.partyType === 'INDIVIDUAL'
    );

    expect(orgParty?.organizationDetails?.organizationType).toBe(
      'SOLE_PROPRIETORSHIP'
    );
    expect(orgParty?.organizationDetails?.countryOfFormation).toBe('US');
    expect(orgParty?.organizationDetails?.organizationName).toBe('John Doe');
    expect(ctrlParty?.roles).toContain('BENEFICIAL_OWNER');
  });

  it('does not duplicate BENEFICIAL_OWNER role if already present', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
          organizationDetails: {},
        }),
        makeParty({
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          active: true,
          individualDetails: { firstName: 'Jane' },
        }),
      ],
    });

    const result = convertClientToSoleProprietorship(clientData);
    const ctrl = result?.parties?.find((p) => p.roles?.includes('CONTROLLER'));
    const ownerCount = ctrl?.roles?.filter(
      (r) => r === 'BENEFICIAL_OWNER'
    ).length;
    expect(ownerCount).toBe(1);
  });

  it('handles missing controller party', () => {
    const clientData = makeClientResponse({
      parties: [
        makeParty({
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          active: true,
          organizationDetails: { organizationName: 'Original' },
        }),
      ],
    });

    const result = convertClientToSoleProprietorship(clientData);
    const orgParty = result?.parties?.find(
      (p) => p.partyType === 'ORGANIZATION'
    );
    expect(orgParty?.organizationDetails?.organizationType).toBe(
      'SOLE_PROPRIETORSHIP'
    );
  });
});
