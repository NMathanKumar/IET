/**
 * Pending Profile Storage
 *
 * Safely stores profile information between confirmation and sign-in.
 * IMPORTANT: Never stores or persists the password.
 * Uses session storage which is cleared on browser close.
 * 
 * Stores all data needed for POST /test-takers/v1/me including required fields
 * for API contract: termsAccepted and termsVersion
 */

export interface PendingProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  /** Terms acceptance — required for API contract (REQUIRED) */
  termsAccepted: boolean;
  /** Terms version — required for API contract (REQUIRED) */
  termsVersion: string;
  /** Guardian data if user under 18 (CONDITIONAL) */
  guardian?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;  // ✅ Guardian's own DOB
    email: string;
    relationship: string;
    termsAccepted: boolean;
  };
}

const STORAGE_KEY = '__IDP_PENDING_PROFILE_DATA__';

/**
 * Store pending profile data for creation after sign-in
 * NEVER stores password - only stores the profile fields
 */
export function setPendingProfile(data: PendingProfileData): void {
  try {
    console.log('📥 [pendingProfileStorage] setPendingProfile() called with data:', data);
    
    const sanitized = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      termsAccepted: data.termsAccepted,
      termsVersion: data.termsVersion,
      guardian: data.guardian,
      // Explicitly exclude password if accidentally passed
    };
    
    console.log('📝 [pendingProfileStorage] Sanitized data:', sanitized);
    const jsonString = JSON.stringify(sanitized);
    console.log('🔤 [pendingProfileStorage] JSON string:', jsonString);
    
    sessionStorage.setItem(STORAGE_KEY, jsonString);
    
    const stored = sessionStorage.getItem(STORAGE_KEY);
    console.log('✅ [pendingProfileStorage] Data written to sessionStorage');
    console.log('[pendingProfileStorage] Verification - retrieved from storage:', stored);
    console.log('[pendingProfileStorage] sessionStorage keys:', Object.keys(sessionStorage));
    console.log('[pendingProfileStorage] sessionStorage size:', Object.keys(sessionStorage).length, 'items');
  } catch (error) {
    console.error('❌ pendingProfileStorage: Failed to store profile:', error);
  }
}

/**
 * Retrieve pending profile data (used after sign-in)
 * Returns null if no data is stored
 */
export function getPendingProfile(): PendingProfileData | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    console.log('[pendingProfileStorage] getPendingProfile() called');
    console.log('[pendingProfileStorage] sessionStorage keys:', Object.keys(sessionStorage));
    console.log('[pendingProfileStorage] STORAGE_KEY value:', STORAGE_KEY);
    console.log('[pendingProfileStorage] Retrieved value:', stored ? '✅ DATA EXISTS' : '❌ NO DATA');
    if (!stored) {
      console.warn('❌ [pendingProfileStorage] No pending profile found in sessionStorage');
      return null;
    }
    const parsed = JSON.parse(stored);
    console.log('✅ [pendingProfileStorage] getPendingProfile() - Data retrieved:', parsed);
    return parsed as PendingProfileData;
  } catch (error) {
    console.error('pendingProfileStorage: Failed to retrieve profile:', error);
    return null;
  }
}

/**
 * Clear pending profile data
 * Called after profile creation succeeds or fails
 */
export function clearPendingProfile(): void {
  try {
    console.log('🗑️ [pendingProfileStorage] clearPendingProfile() called');
    console.log('[pendingProfileStorage] Before clear - sessionStorage keys:', Object.keys(sessionStorage));
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('[pendingProfileStorage] After clear - sessionStorage keys:', Object.keys(sessionStorage));
  } catch (error) {
    console.error('pendingProfileStorage: Failed to clear profile:', error);
  }
}

/**
 * Check if pending profile data exists
 */
export function hasPendingProfile(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored !== null;
  } catch (error) {
    return false;
  }
}
