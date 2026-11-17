import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useEffect, useState } from 'react';
import { isCheckInComplete } from '@utils/checkIn';
import { markGuideSeen, hasSeenGuide } from '@utils/onboarding';
import { EnrolmentService } from '@services';
import type { TestTakerResponse, Enrolment } from '@services/enrolment';
import AppIcon, { type AppIconName } from '@components/AppIcon';
import OnboardingModal from '../Onboarding/Onboarding';
import AppShell from '../../layouts/AppShell';

const NEXT_STEPS: { icon: AppIconName; label: string; sub: string; to: string }[] = [
  { icon: 'download', label: 'Download official certificate', sub: 'PDF · ready now', to: '/results' },
  { icon: 'edit', label: 'Request Score Review', sub: 'Submit a score review', to: '/results' },
  { icon: 'target', label: 'Practice to improve', sub: 'Free sessions available', to: '/practice' },
  { icon: 'institution', label: 'Search accepting institutions', sub: '2,000+ worldwide', to: '/book' },
];

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const completionState = (location.state as { checkInComplete?: boolean } | null)
    ?.checkInComplete;
  const [checkInComplete] = useState(() => Boolean(completionState) || isCheckInComplete());
  const [profile, setProfile] = useState<TestTakerResponse | null>(null);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [_profileLoading, _setProfileLoading] = useState(false);
  const [_profileError, _setProfileError] = useState<string | null>(null);
  const [_enrolmentsLoading, _setEnrolmentsLoading] = useState(false);
  const [_enrolmentsError, _setEnrolmentsError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || isLoading) {
        return;
      }

      _setProfileLoading(true);
      _setProfileError(null);

      try {
        const testTakerProfile = await EnrolmentService.getTestTaker();

        if (testTakerProfile) {
          setProfile(testTakerProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Dashboard: Failed to load test taker profile:', error);
        _setProfileError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        _setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user, isLoading]);

  // Load enrolments when user is authenticated
  useEffect(() => {
    const loadEnrolments = async () => {
      if (!user || isLoading) {
        return;
      }

      _setEnrolmentsLoading(true);
      _setEnrolmentsError(null);

      try {
        const data = await EnrolmentService.getEnrolments();
        setEnrolments(data || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load enrolments';
        console.error('Dashboard: Failed to load enrolments:', error);
        _setEnrolmentsError(errorMessage);
        setEnrolments([]);
      } finally {
        _setEnrolmentsLoading(false);
      }
    };

    loadEnrolments();
  }, [user, isLoading]);

  // Check if onboarding should be shown when profile is loaded
  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip if user not authenticated or auth is still loading
      if (!user || isLoading) {
        return;
      }

      try {
        const seen = await hasSeenGuide();
        setShowOnboarding(!seen);
      } catch (error) {
        console.error('Dashboard: Failed to check guide status:', error);
        setShowOnboarding(true);
      } finally {
        setOnboardingLoading(false);
      }
    };

    checkOnboarding();
    // Run when profile state changes (loaded, failed, or remains null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Don't render if no user (will redirect via effect)
  if (!user) {
    return null;
  }

  // Determine if user is new (no enrolments)
  const isNewUser = enrolments.length === 0;

  // Get first name for greeting (profile takes precedence)
  const firstName = 
    profile?.givenName || 
    (user as any)?.attributes?.given_name ||
    (user as any)?.given_name ||
    '';

  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding && !onboardingLoading}
        onClose={() => setShowOnboarding(false)}
        onExit={markGuideSeen}
      />
      <AppShell>
        {_enrolmentsError ? (
          // ERROR STATE
          <div className="max-w-[900px] mx-auto pb-12">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-[18px] font-black text-red-900 mb-2">
                    Unable to load your dashboard
                  </h2>
                  <p className="text-[14px] text-red-700 mb-4">
                    {_enrolmentsError}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-block px-6 py-2 rounded-lg bg-red-600 text-white text-[13px] font-black no-underline hover:bg-red-700 transition"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : isNewUser ? (
          // NEW USER DASHBOARD
          <div className="max-w-[900px] mx-auto pb-12">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <p className="text-[12px] font-bold uppercase text-[#EB7900] tracking-widest mb-2">
                Welcome, {firstName}
              </p>
              <h1 className="text-[32px] font-black text-[#232d3f] mb-2 leading-tight">
                What would you like to do first?
              </h1>
              <p className="text-[14px] text-[#55657b]">
                Choose an option to begin your English test journey.
              </p>
            </div>

            {/* Two-Column Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Purchase a test card */}
              <div className="border-2 border-[#FF6A0030] bg-[#FFF3EA] rounded-2xl p-6 md:p-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#FF6A00]">
                    <AppIcon name="purchase" size={24} />
                  </div>
                </div>
                <h2 className="text-[18px] font-black text-[#232d3f] mb-2 text-center">
                  Purchase a test
                </h2>
                <p className="text-[13px] text-[#55657b] mb-3 text-center">
                  Ready to prove your English? Purchase your test and complete it online.
                </p>
                <p className="text-[11px] font-semibold text-[#FF6A00] mb-4 text-center">
                  Four skills · Results within 48 hours
                </p>
                <Link
                  to="/book"
                  className="block w-full px-6 py-3 rounded-2xl bg-[#EB7900] text-white text-[13px] font-black text-center no-underline"
                >
                  Purchase a test →
                </Link>
              </div>

              {/* Practice for free card */}
              <div className="border-2 border-[#DDE2E7] bg-white rounded-2xl p-6 md:p-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-[#FF6A00]">
                    <AppIcon name="practice" size={24} />
                  </div>
                </div>
                <h2 className="text-[18px] font-black text-[#232d3f] mb-2 text-center">
                  Practice for free
                </h2>
                <p className="text-[13px] text-[#55657b] mb-3 text-center">
                  Build confidence with practice tasks for Listening, Reading, Speaking and Writing.
                </p>
                <p className="text-[11px] font-semibold text-[#55657b] mb-4 text-center">
                  Free practice · Work at your own pace
                </p>
                <Link
                  to="/practice"
                  className="block w-full px-6 py-3 rounded-2xl bg-white text-[#232d3f] text-[13px] font-black text-center no-underline border-2 border-[#DDE2E7] hover:border-[#FF6A00] transition"
                >
                  Start practising →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // EXISTING USER DASHBOARD
          <div className="max-w-[900px] mx-auto pb-12">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-[26px] font-black text-[#232d3f] mb-1 leading-tight">
                Welcome back, {firstName}
              </h1>
              <p className="text-[14px] text-[#55657b] m-0">
                Here&apos;s an overview of your IDP English Test journey.
              </p>
            </div>

            {/* Purchased Tests Section */}
            <div className="flex flex-col gap-3 mb-5">
              {/* State 1: Not taken, window open */}
              <div className="bg-white rounded-2xl border-2 border-[#FF6A0030] p-5 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start gap-4 flex-1 w-full">
                  <div className="w-11 h-11 rounded-xl bg-[#fff3ea] border border-[#FF6A0030] flex items-center justify-center flex-shrink-0 text-[#232d3f]">
                    <AppIcon name="ticket" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-0.5">
                      <span className="text-[15px] font-black text-[#232d3f]">IDP English Test</span>
                      <span className="text-[10px] font-bold px-2 rounded-full bg-[#fff8e1] text-[#f9a825] border border-[#ffd54f] w-fit">
                        TEST NOT TAKEN
                      </span>
                    </div>
                    <p className="text-[12px] text-[#55657b] mb-1.5">Purchased Sep 24, 2026 · ONE TIME TEST · UP TO 80 MINS</p>
                    <span className="inline-flex items-center gap-1.25 text-[11px] font-semibold text-[#e65100] bg-[#fff3ea] border border-[#FF6A0040] px-2.5 py-0.75 rounded-full">
                      <AppIcon name="award" size={14} /> Take within 21 days of enrolment · 17 days
                      left (by Oct 15, 2026)
                    </span>
                    <div className={`flex flex-col sm:flex-row sm:items-center gap-1.5 w-fit mt-2 px-2.25 py-1.5 rounded-lg border border-[#c9e2fa] text-[11px] font-bold ${
                      checkInComplete
                        ? 'bg-[#e8f5e9] text-[#2e7d32]'
                        : 'bg-[#eaf4ff] text-[#0b5ead]'
                    }`}>
                      <AppIcon name={checkInComplete ? 'identification' : 'user'} size={15} />
                      <span>
                        {checkInComplete
                          ? 'Check-in completed — you can now start your test.'
                          : 'Check-in is required before you can start this test.'}
                      </span>
                    </div>
                  </div>
                </div>
                {checkInComplete ? (
                  <Link
                    className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#eb7900] text-white text-[13px] font-black no-underline whitespace-nowrap flex-shrink-0 text-center"
                    to="/test-prepare"
                  >
                    Start test →
                  </Link>
                ) : (
                  <Link
                    className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#eb7900] text-white text-[13px] font-black no-underline whitespace-nowrap flex-shrink-0 text-center"
                    to="/check-in/about"
                  >
                    Check-in →
                  </Link>
                )}
              </div>

              {/* State 2: Not taken, window closed */}
              <div className="bg-white rounded-2xl border-2 border-[#e0e0e0] p-5 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start gap-4 flex-1 w-full">
                  <div className="w-11 h-11 rounded-xl bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center flex-shrink-0 text-[#232d3f]">
                    <AppIcon name="ticket" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-0.5">
                      <span className="text-[15px] font-black text-[#232d3f]">IDP English Test</span>
                      <span className="text-[10px] font-bold px-2 rounded-full bg-[#fff8e1] text-[#f9a825] border border-[#ffd54f] w-fit">
                        TEST NOT TAKEN
                      </span>
                    </div>
                    <p className="text-[12px] text-[#55657b] mb-1.5">Purchased 5 Aug 2026 · ONE TIME TEST · UP TO 80 MINS</p>
                    <span className="inline-flex flex-wrap items-center gap-1.25 text-[11px] font-semibold text-[#c62828] bg-[#fce4ec] border border-[#ef9a9a] px-2.5 py-0.75 rounded-full w-fit">
                      <AppIcon name="clock" size={14} /> Test window closed — was due by Aug 26, 2026
                    </span>
                  </div>
                </div>
                <button
                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#eb7900] text-white text-[13px] font-black no-underline whitespace-nowrap flex-shrink-0 text-center opacity-40 cursor-not-allowed disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled
                >
                  Start test →
                </button>
              </div>

              {/* State 3: Enrolment in progress */}
              <div className="bg-white rounded-2xl border-2 border-[#e0e0e0] p-5 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start gap-4 flex-1 w-full">
                  <div className="w-11 h-11 rounded-xl bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center flex-shrink-0 text-[#232d3f]">
                    <AppIcon name="ticket" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-0.5">
                      <span className="text-[15px] font-black text-[#232d3f]">IDP English Test</span>
                      <span className="text-[10px] font-bold px-2 rounded-full bg-[#e3f2fd] text-[#1565c0] border border-[#90caf9] w-fit">
                        ENROLMENT IN PROGRESS
                      </span>
                    </div>
                    <p className="text-[12px] text-[#55657b]">
                      Purchased 4 Aug 2026 · ONE TIME TEST · UP TO 80 MINS
                    </p>
                  </div>
                </div>
                <Link
                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#eb7900] text-white text-[13px] font-black no-underline whitespace-nowrap flex-shrink-0 text-center"
                  to="/book"
                >
                  Make payment →
                </Link>
              </div>
            </div>



            {/* What's Next Section */}
            <div className="bg-white rounded-2xl px-7 py-6 border border-[#dde2e7]">
              <h2 className="text-[16px] font-black text-[#232d3f] mb-4 leading-tight">
                What&apos;s next?
              </h2>
              <div className="flex flex-col gap-3">
                {NEXT_STEPS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#f5f5f5] no-underline border border-transparent transition-all duration-150 hover:border-[#FF6A0040] hover:bg-[#fff3ea]"
                  >
                    <span className="inline-flex items-center justify-center w-8.5 h-8.5 flex-shrink-0 rounded-lg bg-white text-[#ff6a00] shadow-[0_1px_4px_rgba(35,45,63,0.08)]">
                      <AppIcon name={item.icon} size={19} />
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-[#232d3f]">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#55657b]">{item.sub}</div>
                    </div>
                    <span className="text-[14px] text-[#55657b] flex-shrink-0">
                      ›
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </>
  );
}
