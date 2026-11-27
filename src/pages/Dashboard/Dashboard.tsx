import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useEffect, useState } from 'react';
import { hasSeenGuide, markGuideSeen } from '@utils/onboarding';
import { EnrolmentService } from '@services';
import type { TestTakerResponse, Enrolment } from '@services/enrolment';
import AppIcon, { type AppIconName } from '@components/AppIcon';
import { Button } from '@components/common/Button';
import PaymentSupportNotice from '@components/PaymentSupportNotice';
import OnboardingModal from '../Onboarding/Onboarding';

const NEXT_STEPS: { icon: AppIconName; label: string; sub: string; to: string }[] = [
  { icon: 'download', label: 'Download official certificate', sub: 'PDF · ready now', to: '/results' },
  { icon: 'edit', label: 'Request Score Review', sub: 'Submit a score review', to: '/results' },
  { icon: 'target', label: 'Practice to improve', sub: 'Free sessions available', to: '/practice' },
  { icon: 'institution', label: 'Search accepting institutions', sub: '2,000+ worldwide', to: '/book' },
];

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TestTakerResponse | null>(null);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [_profileLoading, _setProfileLoading] = useState(false);
  const [_profileError, _setProfileError] = useState<string | null>(null);
  const [enrolmentsLoading, setEnrolmentsLoading] = useState(true);
  const [_enrolmentsError, _setEnrolmentsError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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
        setProfile(testTakerProfile || null);
      } catch (error) {
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

      setEnrolmentsLoading(true);
      _setEnrolmentsError(null);

      try {
        const data = await EnrolmentService.getEnrolments();
        setEnrolments(data || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load enrolments';
        _setEnrolmentsError(errorMessage);
        setEnrolments([]);
      } finally {
        setEnrolmentsLoading(false);
      }
    };

    loadEnrolments();
  }, [user, isLoading, refreshKey]);

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

  // Show loading skeleton while enrolments are being fetched
  if (enrolmentsLoading) {
    return (
      <div className="max-w-[900px] mx-auto pb-12">
        {/* Welcome Section Skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-surface-light rounded-lg mb-2 w-48"></div>
          <div className="h-4 bg-surface-light rounded-lg w-96"></div>
        </div>

        {/* Enrolments Skeleton */}
        <div className="flex flex-col gap-3 mb-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border-2 border-border-alt p-5 md:p-7 flex items-start md:items-center gap-4 md:gap-6"
            >
              <div className="w-11 h-11 rounded-xl bg-surface-light flex-shrink-0"></div>
              <div className="flex-1 w-full">
                <div className="h-5 bg-surface-light rounded-lg mb-2 w-40"></div>
                <div className="h-4 bg-surface-light rounded-lg mb-2 w-32"></div>
                <div className="h-3 bg-surface-light rounded-lg w-56"></div>
              </div>
              <div className="h-10 bg-surface-light rounded-2xl w-24 flex-shrink-0"></div>
            </div>
          ))}
        </div>

        {/* What's Next Skeleton */}
        <div className="bg-white rounded-2xl px-7 py-6 border border-border-default">
          <div className="h-5 bg-surface-light rounded-lg mb-4 w-32"></div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3.5">
                <div className="w-8.5 h-8.5 rounded-lg bg-surface-light flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-light rounded-lg mb-1 w-40"></div>
                  <div className="h-3 bg-surface-light rounded-lg w-56"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
      {_enrolmentsError ? (
          // ERROR STATE
          <div className="max-w-[900px] mx-auto pb-12">
            <div className="bg-surface-error-light border-2 border-surface-error-light rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-error-light flex items-center justify-center flex-shrink-0 text-brand-red">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-[18px] font-black text-brand-red mb-2">
                    Unable to load your dashboard
                  </h2>
                  <p className="text-[14px] text-brand-red mb-4">
                    {_enrolmentsError}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-block px-6 py-2 rounded-lg bg-brand-red text-white text-[13px] font-black no-underline hover:bg-brand-red-hover transition"
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
              <p className="text-[12px] font-bold uppercase text-brand-primary tracking-widest mb-2">
                Welcome, {firstName}
              </p>
              <h1 className="text-[32px] font-black text-ink mb-2 leading-tight">
                What would you like to do first?
              </h1>
              <p className="text-[14px] text-slate">
                Choose an option to begin your English test journey.
              </p>
            </div>

            {/* Two-Column Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Purchase a test card */}
              <div className="border-2 border-brand-primary/19 bg-surface-brand rounded-2xl p-6 md:p-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand-primary">
                    <AppIcon name="purchase" size={24} />
                  </div>
                </div>
                <h2 className="text-[18px] font-black text-ink mb-2 text-center">
                  Purchase a test
                </h2>
                <p className="text-[13px] text-slate mb-3 text-center">
                  Ready to prove your English? Purchase your test and complete it online.
                </p>
                <p className="text-[11px] font-semibold text-brand-primary mb-4 text-center">
                  Four skills · Results within 48 hours
                </p>
                <Link
                  to="/book"
                  className="block w-full px-6 py-3 rounded-2xl bg-brand-primary text-white text-[13px] font-black text-center no-underline"
                >
                  Purchase a test →
                </Link>
              </div>

              {/* Practice for free card */}
              <div className="border-2 border-border-default bg-white rounded-2xl p-6 md:p-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center text-brand-primary">
                    <AppIcon name="practice" size={24} />
                  </div>
                </div>
                <h2 className="text-[18px] font-black text-ink mb-2 text-center">
                  Practice for free
                </h2>
                <p className="text-[13px] text-slate mb-3 text-center">
                  Build confidence with practice tasks for Listening, Reading, Speaking and Writing.
                </p>
                <p className="text-[11px] font-semibold text-slate mb-4 text-center">
                  Free practice · Work at your own pace
                </p>
                <Link
                  to="/practice"
                  className="block w-full px-6 py-3 rounded-2xl bg-white text-ink text-[13px] font-black text-center no-underline border-2 border-border-default hover:border-brand-primary transition"
                >
                  Start practising →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // EXISTING USER DASHBOARD - Map real enrolments
          <div className="max-w-[900px] mx-auto pb-12">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-[26px] font-black text-ink mb-1 leading-tight">
                Welcome back, {firstName}
              </h1>
              <p className="text-[14px] text-slate m-0">
                Here&apos;s an overview of your IDP English Test journey.
              </p>
            </div>

            {/* Purchased Tests Section - Render real enrolments */}
            <div className="flex flex-col gap-3 mb-5">
              {enrolments.map((enrolment) => {
                // Calculate window status based on enrolment date
                const enrolmentDate = new Date(enrolment.enrolmentDateTime);
                const windowOpenDate = new Date(enrolmentDate);
                windowOpenDate.setDate(enrolmentDate.getDate() + 1); // Window opens day after purchase
                const windowCloseDate = new Date(enrolmentDate);
                windowCloseDate.setDate(enrolmentDate.getDate() + 21); // Window closes 21 days after purchase
                const today = new Date();
                const daysLeft = Math.ceil((windowCloseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isWindowOpen = today >= windowOpenDate && today <= windowCloseDate;
                // "by" date: the backend test window when present, otherwise the same
                // purchase + 21 days date the countdown above uses (never "Invalid Date")
                const backendCloseDate = enrolment.testWindow?.closesOn
                  ? new Date(enrolment.testWindow.closesOn)
                  : null;
                const displayCloseDate =
                  backendCloseDate && !Number.isNaN(backendCloseDate.getTime())
                    ? backendCloseDate
                    : windowCloseDate;
                const paymentStatus: string | undefined = enrolment.payment?.status;
                const enrolmentStatus: string = enrolment.status;
                // Paid only when positively known: a missing or unrecognised payment is never paid.
                // CONFIRMED / COMPLETED enrolments are paid (see EnrolmentStatus).
                const isPaid =
                  paymentStatus === 'COMPLETED' ||
                  enrolmentStatus === 'CONFIRMED' ||
                  enrolmentStatus === 'COMPLETED';
                const isPaymentUnpaid = !isPaid;
                // No checkout was ever started (e.g. payment session creation failed)
                const isPaymentMissing = isPaymentUnpaid && !enrolment.payment;
                const isPaymentFailed =
                  isPaymentUnpaid && (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED');
                // Missing, FAILED or EXPIRED: pay again for the same enrolment
                const isPaymentRetryable = isPaymentMissing || isPaymentFailed;
                // PENDING or an unrecognised status: only re-check, never start another payment
                const isPaymentPending = isPaymentUnpaid && !isPaymentRetryable;
                const paymentBadge = isPaymentMissing
                  ? 'PAYMENT NOT COMPLETED'
                  : paymentStatus === 'FAILED'
                    ? 'PAYMENT FAILED'
                    : paymentStatus === 'EXPIRED'
                      ? 'PAYMENT EXPIRED'
                      : 'PAYMENT PENDING';
                const isCheckInComplete = enrolment.status === 'CONFIRMED';
                const testStarted = enrolment.status === 'COMPLETED';
                const hasResult = (enrolment as any).result;

                return (
                  <div
                    key={enrolment.id}
                    className={`bg-white rounded-2xl border-2 p-5 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 ${
                      isPaymentUnpaid
                        ? 'border-border-alt opacity-75'
                        : isWindowOpen
                          ? 'border-brand-primary/19'
                          : 'border-border-alt opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 w-full">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 text-ink ${
                        isPaymentUnpaid || !isWindowOpen
                          ? 'bg-surface-light border-border-alt'
                          : 'bg-surface-brand border-brand-primary/19'
                      }`}>
                        <AppIcon name="ticket" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-0.5">
                          <span className="text-[15px] font-black text-ink">
                            {enrolment.product?.name || 'IDP English Test'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 rounded-full w-fit border ${
                            isPaymentUnpaid
                              ? 'bg-surface-warning-light text-warning border-accent-yellow'
                              : hasResult
                                ? 'bg-surface-success-light text-success border-success'
                                : testStarted
                                  ? 'bg-surface-info-light text-info-dark border-info-medium'
                                  : 'bg-surface-warning-light text-warning border-accent-yellow'
                          }`}>
                            {isPaymentUnpaid
                              ? paymentBadge
                              : hasResult
                                ? 'RESULTS READY'
                                : testStarted
                                  ? 'TEST COMPLETED'
                                  : 'TEST NOT STARTED'}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate mb-1.5">
                          Purchased {new Date(enrolment.enrolmentDateTime).toLocaleDateString()} · ONE TIME TEST · UP TO 80 MINS
                        </p>
                        
                        {isPaymentUnpaid && (
                          <>
                            <span className="inline-flex items-center gap-1.25 text-[11px] font-semibold text-warning bg-surface-warning-light border border-accent-yellow px-2.5 py-0.75 rounded-full">
                              <AppIcon name="clock" size={14} />{' '}
                              {isPaymentMissing
                                ? 'Payment not completed. Complete payment to activate your test.'
                                : paymentStatus === 'FAILED'
                                  ? 'Your payment did not go through. Retry to activate your test.'
                                  : paymentStatus === 'EXPIRED'
                                    ? 'Your payment session expired. Retry to activate your test.'
                                    : 'Payment confirmation in progress. Please do not pay again.'}
                            </span>
                            <PaymentSupportNotice
                              className="mt-3"
                              variant={
                                isPaymentMissing || paymentStatus === 'FAILED'
                                  ? 'failed'
                                  : paymentStatus === 'EXPIRED'
                                    ? 'expired'
                                    : 'pending'
                              }
                            />
                          </>
                        )}
                        
                        {!isPaymentUnpaid && isWindowOpen && (
                          <>
                            <span className="inline-flex items-center gap-1.25 text-[11px] font-semibold text-brand-primary bg-surface-brand border border-brand-primary/25 px-2.5 py-0.75 rounded-full mb-2">
                              <AppIcon name="award" size={14} /> {daysLeft} days left (by {displayCloseDate.toLocaleDateString()})
                            </span>
                            <div className={`flex flex-col sm:flex-row sm:items-center gap-1.5 w-fit mt-2 px-2.25 py-1.5 rounded-lg border ${
                              isCheckInComplete
                                ? 'bg-surface-success-light text-success border-success'
                                : 'bg-surface-info-very-light text-info-accent border-info-medium'
                            }`}>
                              <AppIcon name={isCheckInComplete ? 'identification' : 'user'} size={15} />
                              <span className="text-[11px] font-bold">
                                {isCheckInComplete
                                  ? 'Check-in completed — you can now start your test.'
                                  : 'Check-in is required before you can start this test.'}
                              </span>
                            </div>
                          </>
                        )}
                        


                        {hasResult && (
                          <div className="mt-2 text-[12px] font-bold text-success">
                            Overall Score: {(enrolment as any).result.overall}/120 ({(enrolment as any).result.cefr})
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isPaymentRetryable ? (
                      <Link
                        to="/checkout"
                        state={{ retryEnrolment: enrolment }}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-bold no-underline whitespace-nowrap transition-colors hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isPaymentMissing ? 'Complete payment →' : 'Retry payment →'}
                      </Link>
                    ) : isPaymentPending ? (
                      <Button
                        variant="primary"
                        size="medium"
                        className="w-full sm:w-auto whitespace-nowrap"
                        onClick={() => setRefreshKey((k) => k + 1)}
                      >
                        Check payment status
                      </Button>
                    ) : testStarted ? (
                      <Link
                        to="/results"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-bold no-underline whitespace-nowrap transition-colors hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        View results →
                      </Link>
                    ) : isCheckInComplete ? (
                      <Link
                        to="/check-in/start"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-bold no-underline whitespace-nowrap transition-colors hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Start test →
                      </Link>
                    ) : (
                      <Link
                        to="/check-in/about"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-bold no-underline whitespace-nowrap transition-colors hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Check-in →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* What's Next Section */}
            <div className="bg-white rounded-2xl px-7 py-6 border border-border-default">
              <h2 className="text-[16px] font-black text-ink mb-4 leading-tight">
                What&apos;s next?
              </h2>
              <div className="flex flex-col gap-3">
                {NEXT_STEPS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-surface-light no-underline border border-transparent transition-all duration-150 hover:border-brand-primary/25 hover:bg-surface-brand"
                  >
                    <span className="inline-flex items-center justify-center w-8.5 h-8.5 flex-shrink-0 rounded-lg bg-white text-brand-primary shadow-[0_1px_4px_rgba(35,45,63,0.08)]">
                      <AppIcon name={item.icon} size={19} />
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-ink">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate">{item.sub}</div>
                    </div>
                    <span className="text-[14px] text-slate flex-shrink-0">
                      ›
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
