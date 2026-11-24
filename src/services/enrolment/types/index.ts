/**
 * Enrolment Service Types
 * Exports all type definitions for Enrolment Service endpoints
 * 
 * Single source of truth for shared types to avoid conflicts:
 * - Enrolment, Guardian, Payment, ProductSnapshot, UserProfileSnapshot
 * - EnrolmentStatus, PaymentStatus, TestWindow
 * 
 * These are centralized in shared.types.ts and re-exported here.
 */

// Core types from shared (single source of truth)
export type { EnrolmentStatus, PaymentStatus, ProductStatus, TestWindow } from './shared.types';

// Test taker types (non-shared)
export type { TestTakerResponse, GuardianRequest } from './testtaker.types';
export type { CreateTestTakerRequest, UpdateTestTakerRequest } from './testtaker.types';
export type { Preferences, ErrorResponse, HealthCheckResponse } from './testtaker.types';
export type { Gender } from './testtaker.types';

// Enrolment types (non-shared)
export type {
  CreateEnrolmentRequest,
  CreateEnrolmentResponse,
  Enrolment,
  CheckInDetails,
} from './enrolment.types';
export type { GuardianAgreement } from './enrolment.types';
export type { GuardianAgreementType } from './enrolment.types';

// Payment types
export type { PaymentSession, CreatePaymentRequest, CreatePaymentResponse } from './payment.types';
