/**
 * UserProfileContext - shared user profile (name/email) for the authenticated user.
 * Backend profile is the source of truth; Cognito attributes are a display fallback.
 * Only given/family name are cached (sessionStorage) to avoid storing extra PII.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useAuth } from '@hooks/useAuth';
import { EnrolmentService } from '@services';

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
  refreshProfile: () => Promise<void>;
}

interface Names {
  givenName: string;
  familyName: string;
}

interface CognitoProfile extends Names {
  email: string;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const RETRY_CONFIG = { maxRetries: 3, initialDelayMs: 500, maxDelayMs: 5000 };
const CACHE_PREFIX = 'iet:profile:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readCache(userId: string): Names | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Names> & { timestamp?: number };
    if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return { givenName: parsed.givenName ?? '', familyName: parsed.familyName ?? '' };
  } catch {
    return null;
  }
}

function writeCache(userId: string, names: Names): void {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + userId,
      JSON.stringify({ ...names, timestamp: Date.now() })
    );
  } catch {
    // storage unavailable - ignore
  }
}

function clearCache(userId?: string): void {
  try {
    if (userId) {
      sessionStorage.removeItem(CACHE_PREFIX + userId);
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function UserProfileProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.userId ?? null;

  const [backendNames, setBackendNames] = useState<Names | null>(null);
  const [cognitoProfile, setCognitoProfile] = useState<CognitoProfile | null>(null);
  const [settledFor, setSettledFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId; // latest id for callbacks captured before re-render

  /** Fetch backend profile with backoff. Only the newest request may update state. */
  const load = useCallback(async (id: string): Promise<void> => {
    const requestId = ++requestIdRef.current;
    const isStale = (): boolean => requestIdRef.current !== requestId;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const profile = await EnrolmentService.getTestTaker();
        if (isStale()) return;
        if (profile) {
          const names: Names = {
            givenName: profile.givenName ?? '',
            familyName: profile.familyName ?? '',
          };
          writeCache(id, names); // only real backend data is cached
          setBackendNames(names);
          setError(null);
          setSettledFor(id);
          return;
        }
        // empty response: profile not created yet - retry
      } catch (err) {
        if (isStale()) return;
        console.warn(`UserProfileContext: profile fetch failed (attempt ${attempt + 1})`, err);
      }

      if (attempt < RETRY_CONFIG.maxRetries) {
        await sleep(
          Math.min(RETRY_CONFIG.initialDelayMs * 2 ** attempt, RETRY_CONFIG.maxDelayMs)
        );
        if (isStale()) return;
      }
    }

    setError('Failed to load profile.');
    setSettledFor(id); // stop the loading state; nothing is cached
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      requestIdRef.current++; // cancel anything in flight
      clearCache();
      setBackendNames(null);
      setCognitoProfile(null);
      setSettledFor(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setBackendNames(readCache(userId)); // instant name on refresh
    setSettledFor(null);

    fetchUserAttributes()
      .then((attrs) => {
        if (cancelled) return;
        setCognitoProfile({
          givenName: attrs.given_name ?? '',
          familyName: attrs.family_name ?? '',
          email: attrs.email ?? '',
        });
      })
      .catch(() => undefined);

    void load(userId); // revalidate in background

    return () => {
      cancelled = true;
      requestIdRef.current++;
    };
  }, [userId, authLoading, load]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    const id = userIdRef.current;
    if (!id) return;
    clearCache(id);
    setSettledFor(null);
    setError(null);
    await load(id);
  }, [load]);

  const firstName = backendNames?.givenName || cognitoProfile?.givenName || '';
  const lastName = backendNames?.familyName || cognitoProfile?.familyName || '';
  const email = cognitoProfile?.email || user?.signInDetails?.loginId || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  // Loading until a name is available or the fetch has settled for this user.
  const isLoading =
    authLoading || (userId !== null && displayName === '' && settledFor !== userId);

  const value = useMemo<UserProfileContextType>(
    () => ({
      profile: { firstName, lastName, email, displayName },
      isLoading,
      error,
      refreshProfile,
    }),
    [firstName, lastName, email, displayName, isLoading, error, refreshProfile]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfileContext(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfileContext must be used within UserProfileProvider');
  }
  return context;
}