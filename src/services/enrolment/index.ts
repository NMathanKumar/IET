/**
 * Enrolment Service
 * API client for the IDP Enrolment Service (test-taker focused)
 *
 * Base URL: https://api-enrolment.dev-iet.idp.com (dev), etc.
 * Authentication: Bearer token (Cognito access token) for protected endpoints
 *
 * Endpoints:
 * - GET/POST/PUT/DELETE /test-takers/v1/me — Test taker profile management
 * - GET /public/v1/products — Product listing (public)
 * - POST /test-takers/v1/me/enrolments — Create enrolment
 * - GET /test-takers/v1/me/enrolments — List enrolments (used for payment verification)
 * - POST /test-takers/v1/me/enrolments/{enrolmentId}/payments — Create payment session
 * - POST /webhooks/v1/stripe — Stripe webhook (payment status updates)
 * - GET /public/v1/health — Service health check (public)
 */

// Re-export functions from enrolment service
export { createEnrolment, getEnrolments } from './enrolment';
export { createPaymentSession } from './payment';

// Re-export test taker profile functions
export { 
  createTestTaker,
  deleteTestTaker,
  getTestTaker,
  updateTestTaker,
  getEnrolments as getTestTakerEnrolments 
} from './testtaker';

// Re-export types
export * from './types';
