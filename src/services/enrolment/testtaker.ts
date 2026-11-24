/**
 * Test Taker Service
 * API client for /test-takers/v1/me endpoints
 *
 * Manages test taker profile information.
 * All endpoints require Bearer token authentication.
 */

import { apiRequest } from '../apiClient';
import { CreateTestTakerRequest, UpdateTestTakerRequest, TestTakerResponse, Enrolment } from './types';

/**
 * Get the current test taker's profile
 *
 * GET /test-takers/v1/me
 *
 * @returns Test taker profile information
 * @throws ApiError if not authenticated (401) or request fails
 */
export async function getTestTaker(): Promise<TestTakerResponse | null> {
  const response = await apiRequest<TestTakerResponse>('/test-takers/v1/me', 'GET');
  return response.data || null;
}

/**
 * Create a new test taker profile
 *
 * POST /test-takers/v1/me
 *
 * Called after sign-up completion and email verification.
 * Persists the test taker's profile information to the Enrolment Service.
 *
 * @param data - Test taker profile data (givenName, familyName, dateOfBirth, gender)
 * @returns Created test taker profile
 * @throws ApiError if validation fails (400), not authenticated (401), or request fails (422)
 */
export async function createTestTaker(
  data: CreateTestTakerRequest
): Promise<TestTakerResponse | null> {
  const response = await apiRequest<TestTakerResponse>('/test-takers/v1/me', 'POST', data);
  return response.data || null;
}

/**
 * Update the current test taker's profile
 *
 * PUT /test-takers/v1/me
 *
 * Updates an existing test taker profile.
 *
 * @param data - Updated test taker profile data
 * @returns Updated test taker profile
 * @throws ApiError if validation fails (400), not authenticated (401), or request fails (422)
 */
export async function updateTestTaker(
  data: UpdateTestTakerRequest
): Promise<TestTakerResponse | null> {
  const response = await apiRequest<TestTakerResponse>('/test-takers/v1/me', 'PUT', data);
  return response.data || null;
}

/**
 * Delete the current test taker's profile
 *
 * DELETE /test-takers/v1/me
 *
 * Removes the test taker's profile from the Enrolment Service.
 *
 * @throws ApiError if not authenticated (401) or request fails
 */
export async function deleteTestTaker(): Promise<void> {
  await apiRequest<void>('/test-takers/v1/me', 'DELETE');
}

/**
 * Get all enrolments for the current test taker
 *
 * GET /test-takers/v1/me/enrolments
 *
 * Retrieves all test purchases and enrolments for the authenticated user.
 *
 * @returns Array of enrolments, or empty array if none exist
 * @throws ApiError if not authenticated (401) or request fails
 */
export async function getEnrolments(): Promise<Enrolment[]> {
  const response = await apiRequest<Enrolment[]>('/test-takers/v1/me/enrolments', 'GET');
  return response.data || [];
}
