import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@components/common/Button';
import { EnrolmentService } from '@services';
import type { Enrolment } from '@services/enrolment';

export default function PurchaseReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const checkoutSessionId = searchParams.get('session_id');

        if (!checkoutSessionId) {
          setError('Payment session ID not found. Please contact support.');
          setLoading(false);
          return;
        }

        const enrolments = await EnrolmentService.getEnrolments();
        const matchedEnrolment = enrolments.find(
          (e: Enrolment) => e.payment?.checkoutSessionId === checkoutSessionId
        );

        if (!matchedEnrolment) {
          setError('Could not find your payment. Please contact support.');
          setLoading(false);
          return;
        }

        if (matchedEnrolment.payment?.status === 'COMPLETED') {
          setEnrolment(matchedEnrolment);
          setSuccess(true);
        } else if (matchedEnrolment.payment?.status === 'PENDING') {
          setError('Payment is still being processed. Please refresh the page.');
        } else if (matchedEnrolment.payment?.status === 'FAILED') {
          setError('Payment failed. Please try again.');
        } else if (matchedEnrolment.payment?.status === 'EXPIRED') {
          setError('Payment session expired. Please start a new purchase.');
        } else {
          setError('Payment verification failed. Please contact support.');
        }

        setLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to verify payment';
        setError(errorMessage);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin mb-3"></div>
          <p className="text-[13px] text-slate">Verifying payment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="w-full max-w-[550px] bg-white rounded-xl border border-border-subtle shadow-sm p-7 md:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-surface-error-light flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand-red" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h1 className="text-[20px] font-black text-brand-red mb-2">Payment failed</h1>
            <p className="text-[13px] text-slate mb-6">{error}</p>

            <div className="w-full flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="medium"
                fullWidth
                onClick={() => navigate('/dashboard', { replace: true })}
              >
                Dashboard
              </Button>
              <button
                onClick={() => navigate('/book', { replace: true })}
                className="w-full px-6 py-2.5 rounded-lg border-2 border-brand-primary text-brand-primary text-[12px] font-black hover:bg-brand-primary hover:text-white transition duration-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success && enrolment) {
    const purchaseDate = new Date(enrolment.enrolmentDateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="flex items-center justify-center w-full px-4">
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[420px] bg-white rounded-xl border border-success/15 shadow-sm p-5 md:p-6">
          <div className="flex flex-col items-center">
            {/* Success Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 mb-3">
              <div className="w-1 h-1 rounded-full bg-success"></div>
              <span className="text-[9px] font-bold text-success uppercase tracking-wide">
                Purchase Complete
              </span>
            </div>

            {/* Success Icon */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success/15 to-success/5 border border-success/30 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-[20px] md:text-[22px] font-black text-ink text-center mb-1">
              Payment successful
            </h1>

            {/* Description */}
            <p className="text-[11px] text-slate text-center mb-5">
              Your test is purchased and ready to begin.
            </p>

            {/* Summary Section */}
            <div className="w-full bg-surface-secondary rounded-lg p-3 md:p-4 mb-5 space-y-3">
              {/* Test Name */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[10px] text-slate font-medium">Test</span>
                <span className="text-[11px] font-bold text-ink">
                  {enrolment.product.name}
                </span>
              </div>

              {/* Amount Paid */}
              <div className="flex items-center justify-between py-1.5 border-t border-b border-border-subtle">
                <span className="text-[10px] text-slate font-medium">Amount paid</span>
                <span className="text-[11px] font-bold text-ink">
                  {enrolment.payment?.currency} {enrolment.payment?.amount}
                </span>
              </div>

              {/* Purchase Date */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[10px] text-slate font-medium">Purchase date</span>
                <span className="text-[11px] font-bold text-ink">
                  {purchaseDate}
                </span>
              </div>

              {/* Confirmation */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[10px] text-slate font-medium">Confirmation</span>
                <span className="text-[10px] text-success font-bold">
                  Email sent
                </span>
              </div>
            </div>

            {/* Primary CTA */}
            <Button
              variant="primary"
              size="medium"
              fullWidth
              onClick={() => navigate('/dashboard', { replace: true })}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return null;
}
