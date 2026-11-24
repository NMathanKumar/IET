/**
 * Payment Types
 * Generated from Enrolment Service OpenAPI specification
 *
 * Endpoints:
 * - POST /test-takers/v1/me/enrolments/{enrolmentId}/payments — Create payment session
 * 
 * Authentication: Bearer token (required)
 */

type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

/**
 * Payment Session Response
 * POST /test-takers/v1/me/enrolments/{enrolmentId}/payments (200 OK)
 *
 * A started payment of an enrolment. All the browser needs to show the Stripe embedded checkout.
 */
export interface PaymentSession {
  enrolmentId: string; // The enrolment the payment is for
  checkoutSessionId: string; // Id of the checkout session at Stripe
  clientSecret: string; // Client secret of the Stripe embedded Checkout Session, for Stripe.js
  publishableKey: string; // Stripe publishable key, for Stripe.js
  status: PaymentStatus; // Always PENDING after creation
}

/**
 * Create Payment Request
 * POST /test-takers/v1/me/enrolments/{enrolmentId}/payments
 *
 * No request body required. Every call starts a new checkout.
 */
export type CreatePaymentRequest = Record<string, never>;

/**
 * Create Payment Response
 * Same as PaymentSession for successful responses
 */
export type CreatePaymentResponse = PaymentSession;
