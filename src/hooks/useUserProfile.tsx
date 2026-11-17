/**
 * useUserProfile Hook
 * Centralized hook for fetching and caching authenticated user profile data
 * Prevents duplicate API calls across pages and ensures consistent user data display
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { EnrolmentService } from '@services';
import type { TestTakerResponse } from '@services/enrolment';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
}

/**
 * Fetches user profile from authenticated user state
 * Falls back to auth user attributes if profile endpoint unavailable
 */
export function useUserProfile(): UserProfile & { isLoading: boolean; error: string | null } {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<TestTakerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile from API
  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const testTakerProfile = await EnrolmentService.getTestTaker();
        if (!cancelled) {
          setProfile(testTakerProfile);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('useUserProfile: Failed to load test taker profile:', err);
          // Don't set error state - we'll use fallback values instead
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Determine display values with proper fallback hierarchy
  const firstName =
    profile?.givenName ||
    (user as any)?.attributes?.given_name ||
    (user as any)?.given_name ||
    '';

  const lastName =
    profile?.familyName ||
    (user as any)?.attributes?.family_name ||
    (user as any)?.family_name ||
    '';

  const email =
    (user as any)?.attributes?.email ||
    (user as any)?.email ||
    (user as any)?.signInDetails?.loginId ||
    '';

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'User';

  return {
    firstName,
    lastName,
    email,
    displayName,
    isLoading: authLoading || isLoading,
    error,
  };
}
