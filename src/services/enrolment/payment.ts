/**
 * Payment Service
 * API client for /test-takers/v1/me/enrolments/{enrolmentId}/payments endpoint
 *
 * Manages Stripe payment sessions for test taker enrolments.
 * All endpoints require Bearer token authentication.
 */

import { apiRequest } from '../apiClient';
import { PaymentSession, CreatePaymentResponse } from './types/payment.types';

/**
 * Start a Stripe payment session for an enrolment
 *
 * POST /test-takers/v1/me/enrolments/{enrolmentId}/payments
 *
 * Creates a Stripe embedded Checkout Session for the fee stored in the enrolment
 * snapshot and sets the payment to PENDING.
 * There is no request body. Every call starts a new checkout.
 * The enrolment stays IN_PROGRESS before and after the payment.
 *
 * @param enrolmentId - The UUID of the enrolment to pay for
 * @returns Payment session with clientSecret and publishableKey for Stripe.js
 * @throws ApiError if validation fails (400), not authenticated (401), enrolment not found (404), or already paid (409)
 */
export async function createPaymentSession(
  enrolmentId: string
): Promise<PaymentSession | null> {
  const response = await apiRequest<CreatePaymentResponse>(
    `/test-takers/v1/me/enrolments/${enrolmentId}/payments`,
    'POST',
    undefined // No request body required
  );

  return response.data || null;
}
