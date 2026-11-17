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
  try {
    const response = await apiRequest<TestTakerResponse>('/test-takers/v1/me', 'GET');
    return response.data || null;
  } catch (error) {
    console.error('getTestTaker: Failed to fetch test taker profile:', error);
    throw error;
  }
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
  try {
    console.log('📤 [createTestTaker] Starting POST request');
    console.log('[createTestTaker] URL: POST /test-takers/v1/me');
    console.log('[createTestTaker] Payload:', JSON.stringify(data, null, 2));

    const response = await apiRequest<TestTakerResponse>('/test-takers/v1/me', 'POST', data);

    console.log('✅ [createTestTaker] POST succeeded');
    console.log('[createTestTaker] Response status:', (response as any).status);
    console.log('[createTestTaker] Response body:', JSON.stringify(response.data, null, 2));
    
    return response.data || null;
  } catch (error) {
    console.error('❌ [createTestTaker] POST failed');
    console.error('[createTestTaker] Error status:', (error as any)?.status);
    console.error('[createTestTaker] Error message:', (error as any)?.message);
    console.error('[createTestTaker] Full error:', error);
    throw error;
  }
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
  try {
    console.log('updateTestTaker: Updating profile in Enrolment Service');

    const response = await apiRequest<TestTakerResponse>('/test-takers/v1/me', 'PUT', data);

    console.log('updateTestTaker: Profile updated successfully');
    return response.data || null;
  } catch (error) {
    console.error('updateTestTaker: Failed to update test taker profile:', error);
    throw error;
  }
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
  try {
    console.log('deleteTestTaker: Deleting profile from Enrolment Service');

    await apiRequest<void>('/test-takers/v1/me', 'DELETE');

    console.log('deleteTestTaker: Profile deleted successfully');
  } catch (error) {
    console.error('deleteTestTaker: Failed to delete test taker profile:', error);
    throw error;
  }
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
  try {
    console.log('getEnrolments: Fetching test taker enrolments');

    const response = await apiRequest<Enrolment[]>('/test-takers/v1/me/enrolments', 'GET');

    const enrolments = response.data || [];
    console.log(`getEnrolments: Retrieved ${enrolments.length} enrolment(s)`);

    return enrolments;
  } catch (error) {
    console.error('getEnrolments: Failed to fetch enrolments:', error);
    throw error;
  }
}
