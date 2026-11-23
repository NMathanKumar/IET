/**
 * Onboarding utilities
 * Manages hasSeenGuide flag to track if user has completed the first-login guide
 */

import { EnrolmentService } from '@services';

/**
 * Mark guide as seen/completed
 * Updates the test taker profile with hasSeenGuide = true
 *
 * Per OpenAPI spec, PUT /test-takers/v1/me only accepts:
 * - gender (optional)
 * - hasSeenGuide (optional)
 *
 * @throws Error if update fails
 */
export async function markGuideSeen(): Promise<void> {
  try {
    console.log('markGuideSeen: Starting - Setting hasSeenGuide flag');
    
    // Get current profile to include gender if needed
    console.log('markGuideSeen: Fetching current profile...');
    let profile = null;
    
    try {
      profile = await EnrolmentService.getTestTaker();
      console.log('markGuideSeen: Profile fetched:', { 
        gender: profile?.gender,
        hasSeenGuide: profile?.hasSeenGuide,
      });
    } catch (getError) {
      console.warn('markGuideSeen: GET profile failed (profile may not exist yet):', (getError as any)?.message);
      console.log('markGuideSeen: Profile doesn\'t exist yet - will skip update');
      return;
    }
    
    if (!profile) {
      console.error('markGuideSeen: ❌ No profile found - cannot update');
      console.log('markGuideSeen: Profile doesn\'t exist - will skip update');
      return;
    }

    // Build update request with ONLY the fields PUT accepts per OpenAPI spec
    // PUT /test-takers/v1/me only accepts: gender, hasSeenGuide
    // Do NOT send: givenName, familyName, dateOfBirth (will cause 400 Bad Request)
    const updateData = {
      gender: profile.gender, // Include current gender (optional)
      hasSeenGuide: true,      // Set hasSeenGuide to true
    };
    
    console.log('markGuideSeen: Sending PUT request with data:', updateData);
    console.log('markGuideSeen: (Only gender and hasSeenGuide are allowed per OpenAPI spec)');

    // Update profile with hasSeenGuide flag
    const response = await EnrolmentService.updateTestTaker(updateData as any);
    
    console.log('markGuideSeen: ✅ PUT request succeeded');
    console.log('markGuideSeen: Response:', response);
    console.log('markGuideSeen: ✅ Flag set successfully - hasSeenGuide is now true');
  } catch (error) {
    console.error('markGuideSeen: ❌ FAILED to set flag');
    console.error('markGuideSeen: Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.status,
      statusText: (error as any)?.statusText,
      fullError: error,
    });
    // Don't throw - let modal close gracefully
    console.log('markGuideSeen: Continuing despite error - modal will close');
  }
}

/**
 * Check if user has seen the first-login guide
 * Returns true if hasSeenGuide flag is set, false otherwise
 *
 * For new users or when profile doesn't exist yet, returns false (show guide)
 *
 * @returns boolean indicating if guide has been seen
 */
export async function hasSeenGuide(): Promise<boolean> {
  try {
    const profile = await EnrolmentService.getTestTaker();
    
    // If profile doesn't exist (null response), treat as new user
    if (!profile) {
      console.log('hasSeenGuide: No profile found - treating as new user');
      return false; // Show onboarding for new users
    }
    
    console.log('hasSeenGuide: Profile fetched:', { hasSeenGuide: profile?.hasSeenGuide, keys: Object.keys(profile || {}) });
    const result = profile?.hasSeenGuide === true;
    console.log('hasSeenGuide: Result =', result);
    return result;
  } catch (error) {
    console.error('hasSeenGuide: Failed to check flag (profile doesn\'t exist or API error):', error);
    // If profile doesn't exist (404) or API error, treat as new user and show guide
    console.log('hasSeenGuide: Defaulting to false - showing guide for new/missing profile');
    return false;
  }
}

/**
 * @deprecated Use markGuideSeen instead
 */
export async function markOnboardingSeen(): Promise<void> {
  return markGuideSeen();
}

/**
 * @deprecated Use hasSeenGuide instead
 */
export async function hasSeenOnboarding(): Promise<boolean> {
  return hasSeenGuide();
}
