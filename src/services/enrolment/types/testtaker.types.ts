/**
 * Test Taker Types
 * Generated from Enrolment Service OpenAPI specification
 *
 * Endpoints:
 * - GET /test-takers/v1/me — Test taker profile
 * - GET /test-takers/v1/me/enrolments — Test taker enrolments
 * 
 * Authentication: Bearer token (required)
 */

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
 * Create Test Taker Request
 * POST /test-takers/v1/me
 *
 * Persists test taker profile information after sign-up completion.
 * Called after email verification in the confirm-signup flow.
 * 
 * REQUIRED FIELDS (from OpenAPI):
 * - givenName, familyName, dateOfBirth
 * - termsAccepted (must be true), termsVersion
 * - guardian (if user is under 18, with required subfields)
 */
export interface GuardianRequest {
  /** Full name of parent/guardian: 1-256 characters */
  name: string;

  /** Date of birth in YYYY-MM-DD format */
  dateOfBirth: string;

  /** Email address: max 256 characters, must be valid email */
  email: string;

  /** Relationship to test taker: 1-64 characters */
  relationship: string;

  /** Must be true (terms acceptance is mandatory) */
  termsAccepted: boolean;

  /** Version of terms accepted: 1-64 characters */
  termsVersion: string;
}

export interface CreateTestTakerRequest {
  /** Given (first) name: 1-256 characters (REQUIRED) */
  givenName: string;

  /** Family (last) name: 1-256 characters (REQUIRED) */
  familyName: string;

  /** Date of birth in YYYY-MM-DD format (REQUIRED) */
  dateOfBirth: string;

  /** Must be true — user must accept terms to create profile (REQUIRED) */
  termsAccepted: boolean;

  /** Version of terms accepted: 1-64 characters (REQUIRED) */
  termsVersion: string;

  /** Gender preference (OPTIONAL) */
  gender?: Gender;

  /** Whether user has seen the first-login guide (OPTIONAL) */
  hasSeenGuide?: boolean;

  /** Parent/guardian information — REQUIRED if user is under 18 (CONDITIONAL) */
  guardian?: GuardianRequest;
}

/**
 * Update Test Taker Request
 * PUT /test-takers/v1/me
 *
 * Updates existing test taker profile information.
 * Same schema as create request.
 */
export type UpdateTestTakerRequest = CreateTestTakerRequest;

/**
 * Test Taker Response
 * GET /test-takers/v1/me
 *
 * Retrieves the current test taker's profile information.
 *
 * NOTE: OpenAPI spec does not define response schema for 200 responses.
 * Based on endpoint design patterns, response likely includes the same fields
 * submitted in POST/PUT requests. Additional fields may be returned by backend.
 *
 * Minimum guaranteed fields from POST/PUT request:
 * - givenName (1-256 chars)
 * - familyName (1-256 chars)
 * - dateOfBirth (YYYY-MM-DD)
 * - gender (enum)
 * - hasSeenGuide (boolean, optional)
 */
export interface TestTakerResponse {
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  /** Whether user has seen the first-login guide */
  hasSeenGuide?: boolean;
  // Additional fields may be present in response — backend to confirm
  [key: string]: unknown;
}

/**
 * Error Response
 * Common error response for all endpoints
 */
export interface ErrorResponse {
  message: string;
}

/**
 * API Health Check Response
 * GET /public/v1/health
 *
 * Public endpoint (no authentication required)
 */
export interface HealthCheckResponse {
  // Schema not specified in OpenAPI
  // Expected to be a simple OK response with standard health check fields
  status?: string;
  timestamp?: string;
}

/**
 * Enrolment Status Enumeration
 * Represents the lifecycle of an enrolment
 */
export enum EnrolmentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
}

/**
 * Payment Status Enumeration
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Test Window
 * Defines when a test taker can take the test after purchase
 */
export interface TestWindow {
  /** When the test window opens (purchase date) */
  opensOn: string; // ISO 8601 date-time
  /** When the test window closes (purchase date + 21 days) */
  closesOn: string; // ISO 8601 date-time
}

/**
 * Payment Information
 */
export interface Payment {
  provider: 'STRIPE';
  status: PaymentStatus;
  amount: number;
  currency: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
}

/**
 * Check-in Details
 * Information provided by test taker during check-in
 */
export interface CheckInDetails {
  countryOfResidence: string; // ISO 3166-1 alpha-3
  firstLanguage: string; // ISO 639 code
  yearsOfEnglishEducation: number;
  resultCountry: string;
}

/**
 * Product Snapshot
 * Product information as it was when enrolment was made
 */
export interface ProductSnapshot {
  id: string;
  name: string; // HST, MST, or LST
  fee: Fee;
}

/**
 * Fee Information
 */
export interface Fee {
  country: string; // ISO 3166-1 alpha-3
  currency: string; // ISO 4217
  basePrice: number;
}

/**
 * User Profile Snapshot
 * User information as it was when enrolment was made
 */
export interface UserProfileSnapshot {
  id: string; // uuid
  sub: string; // Cognito subject
  givenName: string;
  familyName: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender?: Gender;
  guardianDetails?: Guardian;
}

/**
 * Guardian Information
 */
export interface Guardian {
  name: string;
  dateOfBirth: string;
  email: string;
  relationship: string;
  consentedOn: string;
  termsVersion: string;
}

/**
 * Enrolment
 * Represents a test taker's purchase and participation in a test
 *
 * GET /test-takers/v1/me/enrolments
 */
export interface Enrolment {
  id: string; // uuid
  userProfileId: string; // uuid
  userProfile: UserProfileSnapshot;
  product: ProductSnapshot;
  status: EnrolmentStatus;
  enrolmentDateTime: string; // ISO 8601 date-time
  checkInDetails?: CheckInDetails;
  payment: Payment;
  testWindow: TestWindow;
  createdOn: string; // ISO 8601 date-time
  modifiedOn: string; // ISO 8601 date-time
  createdBy: string;
  modifiedBy: string;
}
