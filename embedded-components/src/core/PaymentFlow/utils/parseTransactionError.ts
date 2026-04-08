import type { ErrorType } from '@/api/axios-instance';
import type { ApiErrorV2 } from '@/api/generated/ep-transactions.schemas';

/**
 * Error context item from API response
 */
export interface ErrorContextItem {
  code?: string;
  location?: string;
  field?: string;
  message?: string;
}

/**
 * Maps API error context codes to user-friendly messages
 */
export function getErrorMessageFromContext(
  context: ErrorContextItem[]
): { title: string; message: string } | null {
  if (!context || context.length === 0) return null;

  // Look for specific error codes and provide user-friendly messages
  for (const item of context) {
    const { code, field: rawField, message: errorMessage } = item;
    const field = rawField?.toLowerCase();

    // 10104 on recipientId with routing number message → Payment method not enabled for recipient
    if (
      code === '10104' &&
      field === 'recipientid' &&
      errorMessage?.toLowerCase().includes('routing number')
    ) {
      return {
        title: 'Payment Method Not Enabled',
        message:
          errorMessage ||
          'The selected payment method is not configured for this recipient. Please enable the payment method for this recipient or choose a different payment method.',
      };
    }

    // Currency/payment method not supported (code 10104 from API)
    if (
      code === '10104' ||
      field === 'targetcurrency' ||
      field === 'currency'
    ) {
      return {
        title: 'Payment Method Not Supported',
        message:
          errorMessage ||
          'The selected payment method is not available for this account. Please select a different payment method or use a different account.',
      };
    }

    // Recipient validation issues
    if (field === 'recipientid' || field === 'recipient') {
      return {
        title: 'Recipient Error',
        message:
          errorMessage ||
          'There was a problem with the selected recipient. Please verify the recipient details or select a different recipient.',
      };
    }
  }

  // If we have context but no specific mapping, show the first message
  const firstMessage = context.find((c) => c.message)?.message;
  if (firstMessage) {
    return {
      title: 'Payment Error',
      message: firstMessage,
    };
  }

  return null;
}

/**
 * Parse a transaction error into a user-friendly title and message
 */
export function parseTransactionError(
  error: ErrorType<ApiErrorV2> | null | undefined
): { title: string; message: string } | null {
  if (!error) return null;

  const errorData = error.response?.data;
  const httpStatus = errorData?.httpStatus ?? error.status ?? 500;

  // Try to get a specific error message from context
  const contextError = getErrorMessageFromContext(
    (errorData as { context?: ErrorContextItem[] })?.context ?? []
  );

  if (contextError) return contextError;

  // Default messages by HTTP status
  switch (httpStatus) {
    case 400:
      return {
        title: 'Invalid Request',
        message: 'Please check the payment details and try again.',
      };
    case 401:
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in and try again.',
      };
    case 403:
      return {
        title: 'Permission Denied',
        message: 'You do not have permission to make this payment.',
      };
    case 404:
      return {
        title: 'Not Found',
        message: 'The account or recipient was not found.',
      };
    case 422:
      return {
        title: 'Validation Error',
        message:
          'The payment details are invalid. Please check and try again.',
      };
    case 503:
      return {
        title: 'Service Unavailable',
        message:
          'The service is currently unavailable. Please try again later.',
      };
    default:
      return {
        title: 'Payment Failed',
        message: 'An unexpected error occurred. Please try again later.',
      };
  }
}
