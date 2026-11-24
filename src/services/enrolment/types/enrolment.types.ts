/**
 * Enrolment Types
 * Generated from Enrolment Service OpenAPI specification
 *
 * Endpoints:
 * - POST /test-takers/v1/me/enrolments — Create enrolment
 * - GET /test-takers/v1/me/enrolments — List enrolments
 * 
 * Authentication: Bearer token (required)
 */

import type { Fee } from './testtaker.types';
import type { EnrolmentStatus, PaymentStatus, TestWindow } from './shared.types';

/**
 * Enrolment Request
 * POST /test-takers/v1/me/enrolments
 *
 * Creates an IN_PROGRESS enrolment with a snapshot of the profile and product.
 * The fee is always the fee for AUS for now. The client does not send a country.
 *
 * Request body:
 * {
 *   "productId": "string"  // Only productId required, no country
 * }
 */
export interface CreateEnrolmentRequest {
  /** ID from GET /public/v1/products (REQUIRED) */
  productId: string;
}

/**
 * Enrolment Response
 * POST /test-takers/v1/me/enrolments (200 OK)
 *
 * Creates an IN_PROGRESS enrolment with a snapshot of the profile and product.
 * The fee is always the fee for AUS for now. The client does not send a country.
 */
export interface CreateEnrolmentResponse {
  id: string; // uuid
  userProfileId: string; // uuid
  userProfile: UserProfileSnapshot;
  product: ProductSnapshot;
  status: EnrolmentStatus;
  enrolmentDateTime: string; // ISO 8601 date-time
  createdOn: string; // ISO 8601 date-time
  modifiedOn: string; // ISO 8601 date-time
  createdBy: string;
  modifiedBy: string;
  checkInDetails?: CheckInDetails;
  payment?: Payment;
  testWindow?: TestWindow;
}

/**
 * Enrolment
 * GET /test-takers/v1/me/enrolments
 *
 * Represents a test taker's purchase and participation in a test.
 * Newest first. An empty list when the user has no profile.
 */
export type Enrolment = CreateEnrolmentResponse;

/**
 * User Profile Snapshot
 * The profile as it was when the enrolment was made. Later profile changes do not touch it.
 */
export interface UserProfileSnapshot {
  id: string; // uuid
  sub: string; // Cognito sub (subject) of the test taker
  givenName: string; // The test taker's given (first) name at the time of enrolment
  familyName: string; // The test taker's family (last) name at the time of enrolment
  email: string; // The test taker's email address at the time of enrolment
  dateOfBirth: string; // YYYY-MM-DD format
  gender?: Gender;
  guardianDetails?: Guardian; // Present for test takers under 18
}

/**
 * Product Snapshot
 * The product and its price as they were when the enrolment was made.
 */
export interface ProductSnapshot {
  id: string; // Unique identifier of the product
  name: string; // Name of the product at the time of enrolment (HST, MST or LST)
  fee: Fee; // The price that applied at the time of enrolment
}

/**
 * Check-in Details
 * Check-in ("about you") answers of an enrolment.
 * Present after PATCH …/check-in-details.
 */
export interface CheckInDetails {
  countryOfResidence: string; // ISO 3166-1 alpha-3
  firstLanguage: string; // ISO 639 code (en, eng)
  yearsOfEnglishEducation: number; // Number of years the test taker was educated in English (0-100)
  resultCountry: string; // Country where the test taker plans to use the result
}

/**
 * Payment
 * The payment of an enrolment, a record of what the payment provider told the service.
 * Never card data. POST …/payments starts it as PENDING, the events of the provider change the status.
 */
export interface Payment {
  provider: 'STRIPE'; // The payment provider
  status: PaymentStatus; // PENDING (checkout started) → COMPLETED or EXPIRED
  amount: number; // The amount to pay, in the same units as the fee of the enrolment
  currency: string; // ISO 4217, e.g. AUD, USD, INR
  checkoutSessionId?: string; // Id of the checkout session at the provider
  paymentIntentId?: string; // Id of the payment intent at the provider
  createdOn?: string; // ISO 8601 date-time, when the checkout was started
  eventId?: string; // Id of the provider event that set the status
  eventType?: string; // Type of that event, e.g. checkout.session.completed
  receivedOn?: string; // ISO 8601 date-time, when that event was received
}

/**
 * Gender enumeration values
 * Must match OpenAPI contract exactly
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

/**
 * Guardian
 * Parent/guardian details as stored with the profile.
 */
export interface Guardian {
  name: string; // Full name of the parent or guardian
  dateOfBirth: string; // YYYY-MM-DD format, Date of birth of the guardian
  email: string; // Contact email address of the guardian
  relationship: string; // Relationship of the guardian to the test taker
  agreements: GuardianAgreement[]; // What the guardian accepted
}

/**
 * Guardian Agreement
 */
export interface GuardianAgreement {
  type: GuardianAgreementType;
  version: string; // Version of the document the client showed
  acceptedOn: string; // ISO 8601 date-time, When it was accepted
}

/**
 * Guardian Agreement Type
 */
export enum GuardianAgreementType {
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
}
