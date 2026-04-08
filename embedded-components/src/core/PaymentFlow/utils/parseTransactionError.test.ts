import type { ErrorType } from '@/api/axios-instance';
import type { ApiErrorV2 } from '@/api/generated/ep-transactions.schemas';

import {
  getErrorMessageFromContext,
  parseTransactionError,
} from './parseTransactionError';

describe('getErrorMessageFromContext', () => {
  it('returns null for empty context', () => {
    expect(getErrorMessageFromContext([])).toBeNull();
  });

  it('returns null for null/undefined context', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getErrorMessageFromContext(null as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getErrorMessageFromContext(undefined as any)).toBeNull();
  });

  it('returns "Payment Method Not Enabled" for code 10104 + recipientId + routing number message', () => {
    const result = getErrorMessageFromContext([
      {
        code: '10104',
        field: 'recipientId',
        message: 'Invalid routing number for this payment method',
      },
    ]);
    expect(result).toEqual({
      title: 'Payment Method Not Enabled',
      message: 'Invalid routing number for this payment method',
    });
  });

  it('uses fallback message when code 10104 + recipientId + routing number but message is empty', () => {
    const result = getErrorMessageFromContext([
      {
        code: '10104',
        field: 'recipientId',
        message: '',
      },
    ]);
    // Empty message won't match the routing number check, falls through to
    // the next 10104 check which matches code === '10104'
    expect(result).toEqual({
      title: 'Payment Method Not Supported',
      message:
        'The selected payment method is not available for this account. Please select a different payment method or use a different account.',
    });
  });

  it('returns "Payment Method Not Supported" for code 10104 without routing number message', () => {
    const result = getErrorMessageFromContext([
      {
        code: '10104',
        field: 'someOtherField',
        message: 'Some specific error message',
      },
    ]);
    expect(result).toEqual({
      title: 'Payment Method Not Supported',
      message: 'Some specific error message',
    });
  });

  it('returns "Payment Method Not Supported" for code 10104 with no message (uses fallback)', () => {
    const result = getErrorMessageFromContext([
      {
        code: '10104',
        field: 'someOtherField',
      },
    ]);
    expect(result).toEqual({
      title: 'Payment Method Not Supported',
      message:
        'The selected payment method is not available for this account. Please select a different payment method or use a different account.',
    });
  });

  it('returns "Payment Method Not Supported" for targetcurrency field', () => {
    const result = getErrorMessageFromContext([
      {
        field: 'targetCurrency',
        message: 'Currency not supported',
      },
    ]);
    expect(result).toEqual({
      title: 'Payment Method Not Supported',
      message: 'Currency not supported',
    });
  });

  it('returns "Payment Method Not Supported" for currency field', () => {
    const result = getErrorMessageFromContext([
      {
        field: 'currency',
        message: 'Invalid currency',
      },
    ]);
    expect(result).toEqual({
      title: 'Payment Method Not Supported',
      message: 'Invalid currency',
    });
  });

  it('returns "Recipient Error" for recipientId field (without code 10104)', () => {
    const result = getErrorMessageFromContext([
      {
        field: 'recipientId',
        message: 'Recipient not found',
      },
    ]);
    expect(result).toEqual({
      title: 'Recipient Error',
      message: 'Recipient not found',
    });
  });

  it('returns "Recipient Error" for recipient field', () => {
    const result = getErrorMessageFromContext([
      {
        field: 'recipient',
        message: 'Invalid recipient',
      },
    ]);
    expect(result).toEqual({
      title: 'Recipient Error',
      message: 'Invalid recipient',
    });
  });

  it('returns "Recipient Error" with fallback message when no message is provided', () => {
    const result = getErrorMessageFromContext([
      {
        field: 'recipientId',
      },
    ]);
    expect(result).toEqual({
      title: 'Recipient Error',
      message:
        'There was a problem with the selected recipient. Please verify the recipient details or select a different recipient.',
    });
  });

  it('returns "Payment Error" with first message for unknown context', () => {
    const result = getErrorMessageFromContext([
      {
        code: '99999',
        field: 'unknownField',
        message: 'Something went wrong',
      },
    ]);
    expect(result).toEqual({
      title: 'Payment Error',
      message: 'Something went wrong',
    });
  });

  it('returns null for unknown context without message', () => {
    const result = getErrorMessageFromContext([
      {
        code: '99999',
        field: 'unknownField',
      },
    ]);
    expect(result).toBeNull();
  });

  it('returns the first matching message when multiple context items are present', () => {
    const result = getErrorMessageFromContext([
      {
        code: '99999',
        field: 'unknownField',
      },
      {
        field: 'recipientId',
        message: 'Recipient problem',
      },
    ]);
    expect(result).toEqual({
      title: 'Recipient Error',
      message: 'Recipient problem',
    });
  });
});

describe('parseTransactionError', () => {
  it('returns null for null error', () => {
    expect(parseTransactionError(null)).toBeNull();
  });

  it('returns null for undefined error', () => {
    expect(parseTransactionError(undefined)).toBeNull();
  });

  it('returns "Invalid Request" for 400 status', () => {
    const error = {
      response: { data: { httpStatus: 400 } },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Invalid Request',
      message: 'Please check the payment details and try again.',
    });
  });

  it('returns "Session Expired" for 401 status', () => {
    const error = {
      response: { data: { httpStatus: 401 } },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Session Expired',
      message: 'Your session has expired. Please log in and try again.',
    });
  });

  it('returns "Permission Denied" for 403 status', () => {
    const error = {
      response: { data: { httpStatus: 403 } },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Permission Denied',
      message: 'You do not have permission to make this payment.',
    });
  });

  it('returns "Not Found" for 404 status', () => {
    const error = {
      response: { data: { httpStatus: 404 } },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Not Found',
      message: 'The account or recipient was not found.',
    });
  });

  it('returns "Validation Error" for 422 status', () => {
    const error = {
      response: { data: { httpStatus: 422 } },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Validation Error',
      message:
        'The payment details are invalid. Please check and try again.',
    });
  });

  it('returns "Service Unavailable" for 503 status', () => {
    const error = {
      response: { data: { httpStatus: 503 } },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Service Unavailable',
      message:
        'The service is currently unavailable. Please try again later.',
    });
  });

  it('returns "Payment Failed" for unknown status code', () => {
    const error = {
      response: { data: { httpStatus: 418 } },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Payment Failed',
      message: 'An unexpected error occurred. Please try again later.',
    });
  });

  it('falls back to error.status when response.data.httpStatus is missing', () => {
    const error = {
      status: 403,
      response: { data: {} },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Permission Denied',
      message: 'You do not have permission to make this payment.',
    });
  });

  it('defaults to 500 when both httpStatus and error.status are missing', () => {
    const error = {
      response: { data: {} },
    } as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Payment Failed',
      message: 'An unexpected error occurred. Please try again later.',
    });
  });

  it('returns context-based error when context is present', () => {
    const error = {
      response: {
        data: {
          httpStatus: 400,
          context: [
            {
              code: '10104',
              field: 'recipientId',
              message: 'Routing number is invalid for this method',
            },
          ],
        },
      },
    } as unknown as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Payment Method Not Enabled',
      message: 'Routing number is invalid for this method',
    });
  });

  it('falls back to HTTP status error when context is empty', () => {
    const error = {
      response: {
        data: {
          httpStatus: 400,
          context: [],
        },
      },
    } as unknown as ErrorType<ApiErrorV2>;
    expect(parseTransactionError(error)).toEqual({
      title: 'Invalid Request',
      message: 'Please check the payment details and try again.',
    });
  });
});
