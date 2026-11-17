/**
 * UserProfileContext - Global context for cached user profile data
 * Fetches user data once at app initialization and shares it across all pages
 * Prevents duplicate API calls when navigating between pages
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@hooks/useAuth';
import { EnrolmentService } from '@services';
import type { TestTakerResponse } from '@services/enrolment';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
}

interface UserProfileContextType {
  profile: UserProfile;
  isLoading: boolean;
  error: string | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [testTakerProfile, setTestTakerProfile] = useState<TestTakerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile once when auth is ready
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
        const profile = await EnrolmentService.getTestTaker();
        if (!cancelled) {
          setTestTakerProfile(profile);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('UserProfileContext: Failed to load test taker profile:', err);
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

  // Derive display values with proper fallback hierarchy
  const firstName =
    testTakerProfile?.givenName ||
    (user as any)?.attributes?.given_name ||
    (user as any)?.given_name ||
    '';

  const lastName =
    testTakerProfile?.familyName ||
    (user as any)?.attributes?.family_name ||
    (user as any)?.family_name ||
    '';

  const email =
    (user as any)?.attributes?.email ||
    (user as any)?.email ||
    (user as any)?.signInDetails?.loginId ||
    '';

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'User';

  const value: UserProfileContextType = {
    profile: {
      firstName,
      lastName,
      email,
      displayName,
    },
    isLoading: authLoading || isLoading,
    error,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfileContext must be used within UserProfileProvider');
  }
  return context;
}
