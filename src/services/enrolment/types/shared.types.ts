/**
 * Shared Types
 * Common types used across Enrolment Service endpoints
 *
 * Generated from Enrolment Service OpenAPI specification
 *
 * NOTE: Fee type is exported from testtaker.types.ts to avoid duplicate exports
 */

/**
 * Enrolment Status Enumeration
 * IN_PROGRESS → CONFIRMED (paid, verified and received by SpeakNow) → COMPLETED
 * A new enrolment is IN_PROGRESS, and a payment does not change that.
 */
export enum EnrolmentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
}

/**
 * Payment Status Enumeration
 * PENDING (checkout started) → COMPLETED or EXPIRED. FAILED is not used yet.
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Product Status Enumeration
 * Lifecycle state of a product.
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Test Window
 * The time in which the test taker can take the test. It starts when the enrolment is confirmed.
 */
export interface TestWindow {
  opensOn: string; // ISO 8601 date-time, When the enrolment was confirmed, the window opens
  closesOn: string; // ISO 8601 date-time, 21 days later, the last moment to take the test
}

