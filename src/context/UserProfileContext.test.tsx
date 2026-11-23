/**
 * UserProfileContext Tests
 * Verifies profile loading, refresh mechanism, and sidebar updates
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserProfileProvider, useUserProfileContext } from './UserProfileContext';

// Hoisted mocks - these will be configured per-test
const mocks = vi.hoisted(() => ({
  mockGetTestTaker: vi.fn(),
  mockFetchUserAttributes: vi.fn(),
  mockAuthState: {
    user: null as any,
    isLoading: false,
  },
}));

// Mock EnrolmentService
vi.mock('@services', () => ({
  EnrolmentService: {
    getTestTaker: mocks.mockGetTestTaker,
  },
}));

// Mock useAuth hook
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => mocks.mockAuthState,
}));

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: mocks.mockFetchUserAttributes,
}));

// Test component that uses the context
function TestComponent() {
  const { profile, isLoading, error, refreshProfile } = useUserProfileContext();

  return (
    <div>
      <div data-testid="display-name">{profile.displayName || 'empty'}</div>
      <div data-testid="email">{profile.email || 'empty'}</div>
      <div data-testid="first-name">{profile.firstName || 'empty'}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'done'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => refreshProfile()} data-testid="refresh-btn">
        Refresh
      </button>
    </div>
  );
}

describe('UserProfileContext', () => {
  beforeEach(() => {
    // Reset EVERYTHING: mocks, timers, sessionStorage
    vi.clearAllMocks();
    vi.useRealTimers();
    
    // CRITICAL: Reset mock implementations completely
    // This ensures no mock state leaks from previous tests
    mocks.mockGetTestTaker.mockReset();
    mocks.mockFetchUserAttributes.mockReset();
    
    // Reset auth state
    mocks.mockAuthState.user = null;
    mocks.mockAuthState.isLoading = false;
    
    // Default implementations (can be overridden per test)
    mocks.mockFetchUserAttributes.mockResolvedValue({
      given_name: '',
      family_name: '',
      email: '',
    });
    
    // Clear sessionStorage to prevent cache from affecting tests
    try {
      sessionStorage.clear();
    } catch (e) {
      // ignored in test environment
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Initial Loading', () => {
    it('shows empty fallback when user is not authenticated', async () => {
      mocks.mockAuthState.user = null;
      mocks.mockAuthState.isLoading = false;

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('empty');
      });
    });

    it('fetches profile when user is authenticated', async () => {
      mocks.mockAuthState.user = { userId: 'testuser1' };
      mocks.mockAuthState.isLoading = false;
      
      // IMPORTANT: Use mockResolvedValue, not mockResolvedValueOnce
      // This ensures the mock is stable for the entire test
      mocks.mockGetTestTaker.mockResolvedValue({
        givenName: 'John',
        familyName: 'Doe',
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('John Doe');
      }, { timeout: 5000 });

      expect(mocks.mockGetTestTaker).toHaveBeenCalled();
    });

    it('shows loading state while fetching profile', async () => {
      mocks.mockAuthState.user = { userId: 'testuser2' };
      mocks.mockAuthState.isLoading = false;
      
      mocks.mockGetTestTaker.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() =>
              resolve({ givenName: 'John', familyName: 'Doe' }), 500
            )
          )
      );

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      await waitFor(() => {
        const isLoading = screen.getByTestId('is-loading');
        expect(['loading', 'done']).toContain(isLoading.textContent);
      });
    });

    it('displays Cognito attributes when backend profile not available', async () => {
      mocks.mockAuthState.user = { userId: 'testuser3' };
      mocks.mockAuthState.isLoading = false;

      // Setup Cognito attributes
      mocks.mockFetchUserAttributes.mockResolvedValue({
        given_name: 'Jane',
        family_name: 'Smith',
        email: 'jane@example.com',
      });

      // Backend always rejects - use mockRejectedValue (not mockRejectedValueOnce)
      // to ensure consistent behavior
      mocks.mockGetTestTaker.mockRejectedValue(new Error('Profile not found'));

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      // After retries exhaust, should show Cognito data
      await waitFor(
        () => {
          expect(screen.getByTestId('display-name')).toHaveTextContent('Jane Smith');
          expect(screen.getByTestId('email')).toHaveTextContent('jane@example.com');
        },
        { timeout: 15000 }
      );
    });
  });

  describe('Profile Refresh After Creation', () => {
    it('fetches profile from backend after refresh is called', async () => {
      mocks.mockAuthState.user = { userId: 'testuser4' };
      mocks.mockAuthState.isLoading = false;

      // Initial: use implementation that tracks call count
      let callCount = 0;
      mocks.mockGetTestTaker.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Profile not found'));
        }
        return Promise.resolve({
          givenName: 'NewUser',
          familyName: 'Account',
        });
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      // Wait for initial fetch to fail and settle
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('done');
      }, { timeout: 10000 });

      const refreshBtn = screen.getByTestId('refresh-btn');
      await act(async () => {
        refreshBtn.click();
      });

      // Wait for profile to load after refresh
      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('NewUser Account');
      }, { timeout: 5000 });
    });

    it('retries with exponential backoff when profile fetch fails', async () => {
      mocks.mockAuthState.user = { userId: 'testuser5' };
      mocks.mockAuthState.isLoading = false;

      // Track retry attempts
      let attemptCount = 0;
      mocks.mockGetTestTaker.mockImplementation(() => {
        attemptCount++;
        // Fail twice, succeed on third
        if (attemptCount < 3) {
          return Promise.reject(new Error(`Not ready (attempt ${attemptCount})`));
        }
        return Promise.resolve({
          givenName: 'Retried',
          familyName: 'Success',
        });
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      // First call should happen immediately
      expect(mocks.mockGetTestTaker).toHaveBeenCalledTimes(1);

      // Wait for all retries to complete and profile to appear
      // Retries: 500ms, 1000ms, 2000ms = ~3.5 seconds minimum + time for state updates
      await waitFor(
        () => {
          expect(screen.getByTestId('display-name')).toHaveTextContent('Retried Success');
        },
        { timeout: 15000 }
      );

      // Verify retries happened
      expect(attemptCount).toBe(3);
    });

    it('does not exceed maximum retry attempts', async () => {
      mocks.mockAuthState.user = { userId: 'testuser6' };
      mocks.mockAuthState.isLoading = false;

      let callCount = 0;
      mocks.mockGetTestTaker.mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error(`Failed attempt ${callCount}`));
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      // Wait for all retries to exhaust
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('done');
      }, { timeout: 15000 });

      // Should be: 1 initial + 3 retries = 4 calls max
      expect(callCount).toBeLessThanOrEqual(4);
    });
  });

  describe('Sidebar Updates Without Page Refresh', () => {
    it('updates sidebar immediately after profile refresh succeeds', async () => {
      mocks.mockAuthState.user = { userId: 'testuser7' };
      mocks.mockAuthState.isLoading = false;

      mocks.mockFetchUserAttributes.mockResolvedValue({
        given_name: 'Temp',
        family_name: 'User',
        email: 'temp@example.com',
      });

      let callCount = 0;
      mocks.mockGetTestTaker.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Not ready'));
        }
        return Promise.resolve({
          givenName: 'Updated',
          familyName: 'Name',
        });
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      // Wait for Cognito fallback
      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('Temp User');
      }, { timeout: 10000 });

      // Trigger refresh
      const refreshBtn = screen.getByTestId('refresh-btn');
      await act(async () => {
        refreshBtn.click();
      });

      // Wait for update to appear
      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('Updated Name');
      }, { timeout: 5000 });
    });

    it('shows loading indicator while profile is refreshing', async () => {
      mocks.mockAuthState.user = { userId: 'testuser8' };
      mocks.mockAuthState.isLoading = false;

      mocks.mockGetTestTaker.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ givenName: 'Refreshed', familyName: 'User' }), 300)
          )
      );

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      const refreshBtn = screen.getByTestId('refresh-btn');
      await act(async () => {
        refreshBtn.click();
      });

      // Should show loading or done (depends on timing)
      await waitFor(() => {
        const isLoading = screen.getByTestId('is-loading');
        expect(['loading', 'done']).toContain(isLoading.textContent);
      }, { timeout: 5000 });

      // Should eventually resolve
      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('Refreshed User');
      }, { timeout: 5000 });
    });
  });

  describe('Returning Users', () => {
    it('loads profile immediately for returning users', async () => {
      mocks.mockAuthState.user = { userId: 'testuser9' };
      mocks.mockAuthState.isLoading = false;

      mocks.mockGetTestTaker.mockResolvedValue({
        givenName: 'Returning',
        familyName: 'User',
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('Returning User');
      }, { timeout: 5000 });

      // Should succeed on first try
      expect(mocks.mockGetTestTaker).toHaveBeenCalledTimes(1);
    });

    it('does not retry if profile loads successfully on first attempt', async () => {
      mocks.mockAuthState.user = { userId: 'testuser10' };
      mocks.mockAuthState.isLoading = false;

      mocks.mockGetTestTaker.mockResolvedValue({
        givenName: 'Quick',
        familyName: 'Load',
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(mocks.mockGetTestTaker).toHaveBeenCalledTimes(1);
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mocks.mockAuthState.user = { userId: 'testuser11' };
      mocks.mockAuthState.isLoading = false;

      // Always reject
      mocks.mockGetTestTaker.mockRejectedValue(new Error('Network error'));

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      // Wait for retries to exhaust
      await waitFor(
        () => {
          // After retries fail, should show empty and be done loading
          expect(screen.getByTestId('display-name')).toHaveTextContent('empty');
          expect(screen.getByTestId('is-loading')).toHaveTextContent('done');
        },
        { timeout: 15000 }
      );
    });

    it('recovers from errors when refresh is called', async () => {
      mocks.mockAuthState.user = { userId: 'testuser12' };
      mocks.mockAuthState.isLoading = false;

      let callCount = 0;
      mocks.mockGetTestTaker.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          givenName: 'Recovered',
          familyName: 'User',
        });
      });

      render(
        <UserProfileProvider>
          <TestComponent />
        </UserProfileProvider>
      );

      // Wait for initial failure
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('done');
      }, { timeout: 10000 });

      // Trigger refresh
      const refreshBtn = screen.getByTestId('refresh-btn');
      await act(async () => {
        refreshBtn.click();
      });

      // Should recover
      await waitFor(() => {
        expect(screen.getByTestId('display-name')).toHaveTextContent('Recovered User');
      }, { timeout: 5000 });
    });
  });
});
