/**
 * Route Definitions
 */

import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from '@components/auth/SignIn';
import { SignUp } from '@components/auth/SignUp';
import { ConfirmSignUp } from '@components/auth/ConfirmSignUp';
import Dashboard from '../pages/Dashboard/Dashboard';
import Results from '../pages/Results/Results';
import PurchaseTest from '../pages/PurchaseTest/PurchaseTest';
import Checkout from '../pages/Checkout/Checkout';
import PurchaseReturn from '../pages/PurchaseReturn/PurchaseReturn';
import Settings from '../pages/Settings/Settings';
import Practice from '../pages/Practice/Practice';
import TestPrepare from '../pages/TestPrepare/TestPrepare';
import CheckInAbout from '../pages/CheckInAbout/CheckInAbout';
import CheckInIdentity from '../pages/CheckInIdentity/CheckInIdentity';
import ForgetPassword from '../pages/ForgetPassword/ForgetPassword';
import AppShell from '../layouts/AppShell';
import {
  signIn as authSignIn,
  getCurrentUser,
  signUp as authSignUp,
  confirmSignUp as authConfirmSignUp,
  getAuthSession,
} from '@services/auth';
import { useAuth } from '@hooks/useAuth';
import { useUserProfileContext } from '@context/UserProfileContext';
import { EnrolmentService } from '@services';
import { CreateTestTakerRequest, Gender } from '@services/enrolment';
import {
  setPendingProfile,
  getPendingProfile,
  clearPendingProfile,
} from '@utils/pendingProfileStorage';

/**
 * Component that handles sign-in and uses auth context
 * Must be inside Routes/AppRoutes so it has proper access to useAuth hook
 */
function SignInPage() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const { refreshProfile } = useUserProfileContext();

  /**
   * Create test taker profile if pending data exists
   * Only called after user is authenticated and has a valid session
   * Triggers profile refresh after successful creation so sidebar updates immediately
   */
  const createPendingProfile = async (): Promise<void> => {
    const pendingData = getPendingProfile();

    if (!pendingData) {
      return;
    }

    // Verify we have a valid access token before proceeding
    let hasValidToken = false;
    try {
      const session = await getAuthSession();
      hasValidToken = !!session?.tokens?.accessToken;
    } catch (tokenError) {
      console.error('[SignInPage] Failed to verify access token:', tokenError);
      return;
    }

    if (!hasValidToken) {
      return;
    }

    try {
      const testTakerData: CreateTestTakerRequest = {
        givenName: pendingData.firstName,
        familyName: pendingData.lastName,
        dateOfBirth: pendingData.dateOfBirth,
        gender: (pendingData.gender || 'PREFER_NOT_TO_SAY') as Gender,
        termsAccepted: pendingData.termsAccepted,
        termsVersion: pendingData.termsVersion,
        guardian: pendingData.guardian ? {
          name: `${pendingData.guardian.firstName} ${pendingData.guardian.lastName}`,
          dateOfBirth: pendingData.guardian.dateOfBirth,
          email: pendingData.guardian.email,
          relationship: pendingData.guardian.relationship,
          termsAccepted: pendingData.guardian.termsAccepted,
          termsVersion: pendingData.termsVersion,
        } : undefined,
      };

      await EnrolmentService.createTestTaker(testTakerData);
      
      // Clear pending data after successful creation
      clearPendingProfile();

      // ✅ NEW: Refresh profile in context so sidebar updates immediately
      // Without waiting for page navigation or refresh
      await refreshProfile();
      console.log('[SignInPage] Profile refreshed after creation - sidebar should update');
    } catch (profileError) {
      console.error('❌ [SignInPage] POST FAILED');
      console.error('[SignInPage] Error:', {
        message: (profileError as any)?.message,
        status: (profileError as any)?.status,
        statusText: (profileError as any)?.statusText,
      });
    }
  };

  const handleSignInSubmit = async (credentials: {
    email: string;
    password: string;
  }): Promise<void> => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SignInPage: handleSignInSubmit called`);

    try {
      await authSignIn(credentials);
      console.log(`[${timestamp}] SignInPage: authSignIn completed - user authenticated`);

      // Add small delay to ensure Cognito session is fully established
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get current user and verify user data is available
      const currentUser = await getCurrentUser();
      console.log(
        `[${timestamp}] SignInPage: getCurrentUser returned: ${currentUser?.username || 'null'}`
      );

      if (!currentUser) {
        throw new Error('User authenticated but user data is unavailable');
      }

      // Update AuthProvider state directly
      console.log(
        `[${timestamp}] SignInPage: Calling setAuthenticatedUser with user: ${currentUser.username}`
      );
      setAuthenticatedUser(currentUser);
      console.log(`[${timestamp}] SignInPage: AuthProvider state updated successfully`);

      // Now that user is authenticated with valid token, create profile if pending
      await createPendingProfile();

      // Small delay before navigation to ensure state update propagates
      await new Promise((resolve) => setTimeout(resolve, 50));

      console.log(`[${timestamp}] SignInPage: Navigating to /dashboard`);
      navigate('/dashboard', { replace: true });
      console.log(`[${timestamp}] SignInPage: Navigation triggered`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      console.error(`[${new Date().toISOString()}] SignInPage: handleSignInSubmit error:`, message);
      throw new Error(message);
    }
  };

  return <SignIn onSubmit={handleSignInSubmit} />;
}

export function AppRoutes(): React.JSX.Element {
  const navigate = useNavigate();

  /**
   * Handles Sign Up submission by creating a new account
   * Stores profile data for creation after confirmation and sign-in
   * NEVER stores password
   */
  const handleSignUpSubmit = async (credentials: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    termsAccepted: boolean;
    termsVersion: string;
    guardian?: any;
  }): Promise<void> => {
    try {
      // Store NON-SENSITIVE profile data (NOT password) for use after email confirmation and sign-in
      // Password is explicitly NOT stored - it's used only for Cognito sign-up
      // ✅ NOW INCLUDES: termsAccepted, termsVersion, guardian
      
      setPendingProfile({
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        dateOfBirth: credentials.dateOfBirth,
        gender: credentials.gender,
        termsAccepted: credentials.termsAccepted,
        termsVersion: credentials.termsVersion,
        guardian: credentials.guardian ? {
          firstName: credentials.guardian.firstName,
          lastName: credentials.guardian.lastName,
          dateOfBirth: credentials.guardian.dateOfBirth,  // ✅ Store guardian's DOB
          email: credentials.guardian.email,
          relationship: credentials.guardian.relationship,
          termsAccepted: credentials.guardian.consentGiven,
        } : undefined,
      });

      await authSignUp(credentials);

      // Navigate to confirmation page and pass email
      navigate('/confirm-signup', {
        replace: true,
        state: { email: credentials.email },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account creation failed';
      console.error('Sign up error:', message);
      throw new Error(message);
    }
  };

  /**
   * Handles email confirmation after sign up
   * Confirms the email but does NOT create the profile yet
   * Profile creation happens after sign-in when user has valid tokens
   */
  const handleConfirmSignUpSubmit = async (
    email: string,
    confirmationCode: string
  ): Promise<void> => {
    try {
      await authConfirmSignUp(email, confirmationCode);
      // User will be directed to sign in after success message in ConfirmSignUp component
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email confirmation failed';
      console.error('Email confirmation error:', message);
      throw new Error(message);
    }
  };

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUp onSubmit={handleSignUpSubmit} />} />
      <Route path="/confirm-signup" element={<ConfirmSignUp onSubmit={handleConfirmSignUpSubmit} />} />
      <Route path="/forget-password" element={<ForgetPassword />} />

      {/* Protected routes with AppShell layout */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/results" element={<Results />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/book" element={<PurchaseTest />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/purchase/return" element={<PurchaseReturn />} />
        <Route path="/test-prepare" element={<TestPrepare />} />
        <Route path="/check-in" element={<Navigate to="/check-in/about" replace />} />
        <Route path="/check-in/about" element={<CheckInAbout />} />
        <Route path="/check-in/identity" element={<CheckInIdentity />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
