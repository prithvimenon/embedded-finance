import { describe, expect, it } from 'vitest';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';

import {
  canMakePayment,
  canVerifyMicrodeposits,
  doesRecipientNeedAction,
  filterRecipientsByStatus,
  formatRecipientDate,
  getAccountCountsByStatus,
  getAccountHolderType,
  getMaskedAccountNumber,
  getMissingPaymentMethods,
  getRecipientDisplayName,
  getRecipientStatusMessageKey,
  getSupportedPaymentMethods,
  hasRequiredInfoForPaymentType,
  isRecipientInFinalState,
  needsAdditionalRouting,
  sortRecipientsByPriority,
} from './recipientHelpers';

const makeRecipient = (overrides: Partial<Recipient> = {}): Recipient =>
  ({
    id: 'r-1',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'John',
      lastName: 'Doe',
    },
    account: {
      number: '123456789',
      countryCode: 'US',
      routingInformation: [
        {
          transactionType: 'ACH',
          routingNumber: '021000021',
          routingCodeType: 'USABA',
        },
        {
          transactionType: 'WIRE',
          routingNumber: '021000021',
          routingCodeType: 'USABA',
        },
      ],
    },
    status: 'ACTIVE',
    ...overrides,
  }) as Recipient;

describe('getSupportedPaymentMethods', () => {
  it('returns payment methods from routing information', () => {
    const r = makeRecipient();
    expect(getSupportedPaymentMethods(r)).toEqual(['ACH', 'WIRE']);
  });

  it('returns empty array when no routing information', () => {
    const r = makeRecipient({ account: { number: '123', countryCode: 'US' } });
    expect(getSupportedPaymentMethods(r)).toEqual([]);
  });

  it('returns empty array when no account', () => {
    const r = makeRecipient({ account: undefined });
    expect(getSupportedPaymentMethods(r)).toEqual([]);
  });

  it('filters out falsy transaction types', () => {
    const r = makeRecipient({
      account: {
        number: '123',
        countryCode: 'US',
        routingInformation: [
          {
            transactionType: 'ACH',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
          { transactionType: undefined } as any,
        ],
      },
    });
    expect(getSupportedPaymentMethods(r)).toEqual(['ACH']);
  });
});

describe('getMaskedAccountNumber', () => {
  it('masks account number showing last 4 digits', () => {
    expect(getMaskedAccountNumber(makeRecipient())).toBe('****6789');
  });

  it('returns "N/A" when no account number', () => {
    expect(
      getMaskedAccountNumber(
        makeRecipient({
          account: { number: undefined, countryCode: 'US' } as any,
        })
      )
    ).toBe('N/A');
  });

  it('returns "N/A" when no account', () => {
    expect(getMaskedAccountNumber(makeRecipient({ account: undefined }))).toBe(
      'N/A'
    );
  });
});

describe('getRecipientDisplayName', () => {
  it('returns individual name with masked account number', () => {
    const name = getRecipientDisplayName(makeRecipient());
    expect(name).toBe('John Doe (...6789)');
  });

  it('returns business name with masked account number', () => {
    const r = makeRecipient({
      partyDetails: {
        type: 'BUSINESS' as any,
        businessName: 'Acme Corp',
      },
    });
    expect(getRecipientDisplayName(r)).toBe('Acme Corp (...6789)');
  });

  it('handles missing account', () => {
    const r = makeRecipient({ account: undefined });
    const name = getRecipientDisplayName(r);
    expect(name).toContain('John Doe');
    expect(name).toContain('(...)');
  });
});

describe('getAccountHolderType', () => {
  it('returns "Individual" for INDIVIDUAL type', () => {
    expect(getAccountHolderType(makeRecipient())).toBe('Individual');
  });

  it('returns "Business" for non-INDIVIDUAL type', () => {
    const r = makeRecipient({
      partyDetails: { type: 'BUSINESS' as any, businessName: 'X' },
    });
    expect(getAccountHolderType(r)).toBe('Business');
  });
});

describe('canVerifyMicrodeposits', () => {
  it('returns true when status is READY_FOR_VALIDATION', () => {
    expect(
      canVerifyMicrodeposits(makeRecipient({ status: 'READY_FOR_VALIDATION' }))
    ).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(canVerifyMicrodeposits(makeRecipient({ status: 'ACTIVE' }))).toBe(
      false
    );
    expect(canVerifyMicrodeposits(makeRecipient({ status: 'PENDING' }))).toBe(
      false
    );
  });
});

describe('canMakePayment', () => {
  it('returns true when status is ACTIVE', () => {
    expect(canMakePayment(makeRecipient({ status: 'ACTIVE' }))).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(canMakePayment(makeRecipient({ status: 'PENDING' }))).toBe(false);
    expect(canMakePayment(makeRecipient({ status: 'REJECTED' }))).toBe(false);
  });
});

describe('needsAdditionalRouting', () => {
  it('returns false when not ACTIVE', () => {
    expect(needsAdditionalRouting(makeRecipient({ status: 'PENDING' }))).toBe(
      false
    );
  });

  it('returns true when missing WIRE or RTP', () => {
    const r = makeRecipient({
      status: 'ACTIVE',
      account: {
        number: '123',
        countryCode: 'US',
        routingInformation: [
          {
            transactionType: 'ACH',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
        ],
      },
    });
    expect(needsAdditionalRouting(r)).toBe(true);
  });

  it('returns false when has both WIRE and RTP', () => {
    const r = makeRecipient({
      status: 'ACTIVE',
      account: {
        number: '123',
        countryCode: 'US',
        routingInformation: [
          {
            transactionType: 'WIRE',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
          {
            transactionType: 'RTP',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
        ],
      },
    });
    expect(needsAdditionalRouting(r)).toBe(false);
  });
});

describe('getMissingPaymentMethods', () => {
  it('returns both Wire and RTP when neither present', () => {
    const r = makeRecipient({
      account: {
        number: '123',
        countryCode: 'US',
        routingInformation: [
          {
            transactionType: 'ACH',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
        ],
      },
    });
    expect(getMissingPaymentMethods(r)).toEqual(['Wire', 'RTP']);
  });

  it('returns only RTP when WIRE is present', () => {
    const r = makeRecipient({
      account: {
        number: '123',
        countryCode: 'US',
        routingInformation: [
          {
            transactionType: 'WIRE',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
        ],
      },
    });
    expect(getMissingPaymentMethods(r)).toEqual(['RTP']);
  });

  it('returns empty when both present', () => {
    const r = makeRecipient({
      account: {
        number: '123',
        countryCode: 'US',
        routingInformation: [
          {
            transactionType: 'WIRE',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
          {
            transactionType: 'RTP',
            routingNumber: '021000021',
            routingCodeType: 'USABA',
          },
        ],
      },
    });
    expect(getMissingPaymentMethods(r)).toEqual([]);
  });
});

describe('formatRecipientDate', () => {
  it('returns "N/A" when no date string', () => {
    expect(formatRecipientDate()).toBe('N/A');
    expect(formatRecipientDate(undefined)).toBe('N/A');
  });

  it('formats a valid date string', () => {
    const result = formatRecipientDate('2024-01-15T10:00:00Z');
    // The exact format depends on locale, but should include year and month
    expect(result).toContain('2024');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});

describe('hasRequiredInfoForPaymentType', () => {
  it('returns true when payment type is supported', () => {
    expect(hasRequiredInfoForPaymentType(makeRecipient(), 'ACH')).toBe(true);
    expect(hasRequiredInfoForPaymentType(makeRecipient(), 'WIRE')).toBe(true);
  });

  it('returns false when payment type is not supported', () => {
    expect(hasRequiredInfoForPaymentType(makeRecipient(), 'RTP')).toBe(false);
  });
});

describe('isRecipientInFinalState', () => {
  it.each([
    ['ACTIVE', true],
    ['REJECTED', true],
    ['INACTIVE', true],
    ['PENDING', false],
    ['READY_FOR_VALIDATION', false],
    ['MICRODEPOSITS_INITIATED', false],
    [undefined, false],
  ] as const)('status=%s → %s', (status, expected) => {
    expect(
      isRecipientInFinalState(makeRecipient({ status: status as any }))
    ).toBe(expected);
  });
});

describe('doesRecipientNeedAction', () => {
  it('returns true for READY_FOR_VALIDATION', () => {
    expect(
      doesRecipientNeedAction(makeRecipient({ status: 'READY_FOR_VALIDATION' }))
    ).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(doesRecipientNeedAction(makeRecipient({ status: 'ACTIVE' }))).toBe(
      false
    );
  });
});

describe('getRecipientStatusMessageKey', () => {
  it('returns key based on status', () => {
    expect(
      getRecipientStatusMessageKey(makeRecipient({ status: 'ACTIVE' }))
    ).toBe('status.messages.ACTIVE');
  });

  it('returns key with undefined when no status', () => {
    expect(
      getRecipientStatusMessageKey(makeRecipient({ status: undefined }))
    ).toBe('status.messages.undefined');
  });
});

describe('sortRecipientsByPriority', () => {
  it('sorts recipients by priority order', () => {
    const recipients = [
      makeRecipient({ id: 'a', status: 'ACTIVE' }),
      makeRecipient({ id: 'b', status: 'READY_FOR_VALIDATION' }),
      makeRecipient({ id: 'c', status: 'PENDING' }),
      makeRecipient({ id: 'd', status: 'INACTIVE' }),
    ];

    const sorted = sortRecipientsByPriority(recipients);
    expect(sorted.map((r) => r.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('does not mutate the original array', () => {
    const original = [
      makeRecipient({ id: 'a', status: 'ACTIVE' }),
      makeRecipient({ id: 'b', status: 'PENDING' }),
    ];
    const copy = [...original];
    sortRecipientsByPriority(original);
    expect(original.map((r) => r.id)).toEqual(copy.map((r) => r.id));
  });

  it('handles unknown statuses (placed last)', () => {
    const recipients = [
      makeRecipient({ id: 'a', status: undefined }),
      makeRecipient({ id: 'b', status: 'ACTIVE' }),
    ];
    const sorted = sortRecipientsByPriority(recipients);
    expect(sorted.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('getAccountCountsByStatus', () => {
  it('returns counts grouped by status', () => {
    const recipients = [
      makeRecipient({ status: 'ACTIVE' }),
      makeRecipient({ status: 'ACTIVE' }),
      makeRecipient({ status: 'PENDING' }),
    ];
    expect(getAccountCountsByStatus(recipients)).toEqual({
      ACTIVE: 2,
      PENDING: 1,
    });
  });

  it('returns empty object for empty array', () => {
    expect(getAccountCountsByStatus([])).toEqual({});
  });

  it('uses "UNKNOWN" for recipients without status', () => {
    const recipients = [makeRecipient({ status: undefined })];
    expect(getAccountCountsByStatus(recipients)).toEqual({ UNKNOWN: 1 });
  });
});

describe('filterRecipientsByStatus', () => {
  it('filters recipients by given statuses', () => {
    const recipients = [
      makeRecipient({ id: 'a', status: 'ACTIVE' }),
      makeRecipient({ id: 'b', status: 'PENDING' }),
      makeRecipient({ id: 'c', status: 'REJECTED' }),
    ];
    const filtered = filterRecipientsByStatus(recipients, [
      'ACTIVE',
      'REJECTED',
    ]);
    expect(filtered.map((r) => r.id)).toEqual(['a', 'c']);
  });

  it('returns empty array when no match', () => {
    const recipients = [makeRecipient({ status: 'ACTIVE' })];
    expect(filterRecipientsByStatus(recipients, ['PENDING'])).toEqual([]);
  });

  it('excludes recipients with undefined status', () => {
    const recipients = [makeRecipient({ status: undefined })];
    expect(filterRecipientsByStatus(recipients, ['ACTIVE'])).toEqual([]);
  });
});
