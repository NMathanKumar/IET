/**
 * Payment error mapping and support guidance (MSP-2848, MSP-2849, MSP-2852).
 *
 * Maps API/Stripe failures to safe, user-friendly messages. Raw backend
 * messages, Stripe details and internal codes are never returned.
 */

export type PaymentErrorKind = 'already-paid' | 'auth' | 'not-found' | 'retryable' | 'generic';

export interface PaymentErrorInfo {
  kind: PaymentErrorKind;
  message: string;
}

/**
 * Support contact for payment and refund issues.
 * `null` until Product confirms the approved channel; the UI then shows
 * guidance text without any contact details. Do not invent a value here.
 */
export const PAYMENT_SUPPORT_CONTACT: string | null = null;

export const PAYMENT_GUIDANCE = {
  failed:
    'You can try the payment again. If the checkout form offers other payment methods, you can use one of those instead.',
  pending:
    'We are waiting for confirmation of your payment. Please do not pay again. This can take a few minutes.',
  expired:
    'Your payment session expired and you have not been charged for it. You can start the payment again.',
  refund:
    'Refunds and cancellations cannot be requested online. Refund requests are handled by the IDP Operations team.',
  reschedule:
    'Rescheduling is not available at the moment. You can take your test within 21 days of purchase.',
} as const;

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

/** True when the backend reports the enrolment is already paid (HTTP 409). */
export function isAlreadyPaidError(error: unknown): boolean {
  return getStatus(error) === 409;
}

/** Convert any thrown error into a safe message. Never includes error.message. */
export function getPaymentErrorInfo(error: unknown): PaymentErrorInfo {
  const status = getStatus(error);

  if (status === 409) {
    return {
      kind: 'already-paid',
      message: 'This test has already been paid for. You do not need to pay again.',
    };
  }
  if (status === 401 || status === 403) {
    return { kind: 'auth', message: 'Your session has ended. Please sign in again to continue.' };
  }
  if (status === 404) {
    return {
      kind: 'not-found',
      message: 'We could not find this purchase. Please go to your dashboard and check its status.',
    };
  }
  if (status === 429 || (status !== undefined && status >= 500)) {
    return {
      kind: 'retryable',
      message: 'We could not start your payment right now. Please try again in a moment.',
    };
  }
  if (status !== undefined && status >= 400) {
    return { kind: 'generic', message: 'We could not start your payment. Please try again.' };
  }
  return {
    kind: 'generic',
    message: 'Something went wrong while setting up your payment. Please try again.',
  };
}

/** Convenience wrapper returning only the safe message. */
export function getPaymentErrorMessage(error: unknown): string {
  return getPaymentErrorInfo(error).message;
}
