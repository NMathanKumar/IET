/**
 * Enrolment Service
 * API client for /test-takers/v1/me/enrolments endpoint
 *
 * Manages test taker enrolments for test purchases.
 * All endpoints require Bearer token authentication.
 */

import { apiRequest } from '../apiClient';
import { Enrolment, CreateEnrolmentRequest, CreateEnrolmentResponse } from './types/enrolment.types';

/**
 * Create a new enrolment for the current test taker
 *
 * POST /test-takers/v1/me/enrolments
 *
 * Creates an IN_PROGRESS enrolment with a snapshot of the profile and product.
 * The fee is always the fee for AUS for now. The client does not send a country.
 *
 * @param data - Enrolment request containing productId
 * @returns Created enrolment with IN_PROGRESS status
 * @throws ApiError if validation fails (400), not authenticated (401), or request fails (422)
 */
export async function createEnrolment(
  data: CreateEnrolmentRequest
): Promise<Enrolment | null> {
  const response = await apiRequest<CreateEnrolmentResponse>(
    '/test-takers/v1/me/enrolments',
    'POST',
    data
  );

  return response.data || null;
}

/**
 * Get all enrolments for the current test taker
 *
 * GET /test-takers/v1/me/enrolments
 *
 * Retrieves all test purchases and enrolments for the authenticated user.
 * Newest first. An empty list when the user has no profile.
 *
 * @returns Array of enrolments, or empty array if none exist
 * @throws ApiError if not authenticated (401) or request fails
 */
export async function getEnrolments(): Promise<Enrolment[]> {
  const response = await apiRequest<Enrolment[]>('/test-takers/v1/me/enrolments', 'GET');

  const enrolments = response.data || [];

  return enrolments;
}
