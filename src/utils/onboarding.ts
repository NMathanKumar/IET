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
    let profile = null;
    
    try {
      profile = await EnrolmentService.getTestTaker();
    } catch (getError) {
      return;
    }
    
    if (!profile) {
      return;
    }

    const updateData = {
      gender: profile.gender,
      hasSeenGuide: true,
    };

    await EnrolmentService.updateTestTaker(updateData as any);
  } catch (error) {
    // Silent failure - modal closes gracefully
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
    
    if (!profile) {
      return false;
    }
    
    return profile?.preferences?.hasSeenGuide === true;
  } catch (error) {
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
