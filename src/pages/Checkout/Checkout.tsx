import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import PaymentSupportNotice from '@components/PaymentSupportNotice';
import { EnrolmentService } from '@services';
import type { Enrolment } from '@services/enrolment';
import type { Product } from '@types';
import { getPaymentErrorInfo, type PaymentErrorKind } from '@utils/paymentErrors';

const CHECKOUT_FEATURES = [
  'A clear score, mapped to CEFR',
  'Reviewed by certified assessors',
  'Accepted by institutions around the globe',
  'Certified in days',
];

type CheckoutProduct = Pick<Product, 'id' | 'name' | 'fees'>;

interface CheckoutState {
  product?: CheckoutProduct;
  /**
   * Enrolment already created (or reused) for this purchase. Stored in the history entry so a
   * refresh or Back reuses it instead of creating another enrolment.
   */
  enrolmentId?: string;
  /** Set when retrying payment for an existing enrolment. No new enrolment is created. */
  retryEnrolment?: Enrolment;
}

const enrolmentTime = (e: Enrolment): number => Date.parse(e.enrolmentDateTime) || 0;

/**
 * Newest IN_PROGRESS enrolment for the same product that can still be paid:
 * its payment is absent, FAILED or EXPIRED. PENDING and COMPLETED payments are never reused.
 */
function findReusableEnrolment(enrolments: Enrolment[], productId: string): Enrolment | undefined {
  return enrolments
    .filter((e) => {
      const status: string = e.status;
      const paymentStatus: string | undefined = e.payment?.status;
      return (
        e.product?.id === productId &&
        status === 'IN_PROGRESS' &&
        (!e.payment || paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED')
      );
    })
    .sort((a, b) => enrolmentTime(b) - enrolmentTime(a))[0];
}

/** Error kinds shown by Checkout: API error kinds plus a payment that is still being confirmed. */
type CheckoutErrorKind = PaymentErrorKind | 'pending';

const PENDING_PAYMENT_MESSAGE =
  'Your payment is being confirmed. Please do not pay again. This can take a few minutes.';
const ALREADY_PAID_MESSAGE = 'This test has already been paid for. You do not need to pay again.';
const UNKNOWN_STATUS_MESSAGE =
  'We could not confirm the status of this payment. Please go to your dashboard and check its status.';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<CheckoutErrorKind | null>(null);
  const [lookupFailed, setLookupFailed] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<CheckoutProduct | null>(null);
  const [stripePromise, setStripePromise] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState<boolean>(false);
  const hasCreatedEnrolment = useRef<boolean>(false);
  const enrolmentIdRef = useRef<string | null>(null);
  /** Set when Checkout was opened with a known enrolmentId (refresh / Back / remount). */
  const knownEnrolmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get product (new purchase) or existing enrolment (payment retry) from navigation state
    const state = location.state as CheckoutState | null;
    const retry = state?.retryEnrolment;
    const knownEnrolmentId = state?.enrolmentId;
    const product: CheckoutProduct | undefined = retry
      ? { id: retry.product.id, name: retry.product.name, fees: [retry.product.fee] }
      : state?.product;

    if (!product) {
      setError('No product selected for purchase');
      return;
    }

    setSelectedProduct(product);

    // Start only once
    if (!hasCreatedEnrolment.current) {
      hasCreatedEnrolment.current = true;
      if (retry) {
        // Retry reuses the existing enrolment; never create a new one
        enrolmentIdRef.current = retry.id;
        setLoading(true);
        createPaymentSession(retry.id);
      } else if (knownEnrolmentId) {
        // Refresh / Back / remount: the enrolment is already known, so never create another.
        // Its payment may have moved on since this history entry was written, so check first.
        enrolmentIdRef.current = knownEnrolmentId;
        knownEnrolmentIdRef.current = knownEnrolmentId;
        resumeKnownEnrolment(knownEnrolmentId);
      } else {
        startPurchase(product);
      }
    }
  }, [location.state]);

  const showError = (err: unknown) => {
    const info = getPaymentErrorInfo(err);
    setError(info.message);
    setErrorKind(info.kind);
    setLoading(false);
  };

  const showStatus = (kind: CheckoutErrorKind, message: string) => {
    setError(message);
    setErrorKind(kind);
    setLoading(false);
  };

  // Known enrolment: start a new payment session only when the payment can still be paid
  // (absent, FAILED or EXPIRED). PENDING or already paid enrolments never get another session.
  // If the status cannot be read we stop (fail closed) rather than risk a second payment.
  const resumeKnownEnrolment = async (enrolmentId: string) => {
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setLookupFailed(false);

    let current: Enrolment | undefined;
    try {
      const enrolments = await EnrolmentService.getEnrolments();
      current = enrolments.find((e) => e.id === enrolmentId);
    } catch (err) {
      setLookupFailed(true);
      showError(err);
      return;
    }

    if (!current) {
      showStatus('not-found', UNKNOWN_STATUS_MESSAGE);
      return;
    }

    const status: string = current.status;
    const paymentStatus: string | undefined = current.payment?.status;

    // CONFIRMED / COMPLETED enrolments are paid (see EnrolmentStatus)
    if (paymentStatus === 'COMPLETED' || status !== 'IN_PROGRESS') {
      showStatus('already-paid', ALREADY_PAID_MESSAGE);
      return;
    }

    if (paymentStatus === 'PENDING') {
      showStatus('pending', PENDING_PAYMENT_MESSAGE);
      return;
    }

    if (current.payment && paymentStatus !== 'FAILED' && paymentStatus !== 'EXPIRED') {
      // Unknown payment status: do not start another payment
      showStatus('not-found', UNKNOWN_STATUS_MESSAGE);
      return;
    }

    // Show the price stored on the enrolment: that is what will be charged
    setSelectedProduct({
      id: current.product.id,
      name: current.product.name,
      fees: [current.product.fee],
    });
    await createPaymentSession(enrolmentId);
  };

  // Record the enrolment in the current history entry so a refresh or Back reuses it
  const rememberEnrolment = (product: CheckoutProduct, enrolmentId: string) => {
    const nextState: CheckoutState = { product, enrolmentId };
    navigate('/checkout', { replace: true, state: nextState });
  };

  // New purchase: reuse an unpaid enrolment for this product if one exists, otherwise create one.
  // If the lookup fails we stop (fail closed): creating an enrolment blindly could duplicate it.
  const startPurchase = async (product: CheckoutProduct) => {
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setLookupFailed(false);

    let existing: Enrolment | undefined;
    try {
      existing = findReusableEnrolment(await EnrolmentService.getEnrolments(), product.id);
    } catch (err) {
      setLookupFailed(true);
      showError(err);
      return;
    }

    if (existing) {
      // Use the fee snapshot stored on the enrolment: that is what will be charged
      const snapshot: CheckoutProduct = {
        id: existing.product.id,
        name: existing.product.name,
        fees: [existing.product.fee],
      };
      enrolmentIdRef.current = existing.id;
      setSelectedProduct(snapshot);
      rememberEnrolment(snapshot, existing.id);
      await createPaymentSession(existing.id);
      return;
    }

    await createEnrolment(product);
  };

  const createEnrolment = async (product: CheckoutProduct) => {
    setLoading(true);
    setError(null);
    setErrorKind(null);

    try {
      const enrolment = await EnrolmentService.createEnrolment({
        productId: product.id,
      });

      if (enrolment) {
        enrolmentIdRef.current = enrolment.id;
        rememberEnrolment(product, enrolment.id);
        await createPaymentSession(enrolment.id);
      } else {
        showError(undefined);
      }
    } catch (err) {
      showError(err);
    }
  };

  const createPaymentSession = async (enrolmentId: string) => {
    setError(null);
    setErrorKind(null);

    try {
      const session = await EnrolmentService.createPaymentSession(enrolmentId);

      if (session) {
        // Initialize Stripe with the publishableKey from backend
        const stripe = await loadStripe(session.publishableKey);
        setStripePromise(stripe);

        // Store clientSecret for Embedded Checkout
        setClientSecret(session.clientSecret);
        setPaymentReady(true);
        setLoading(false);
      } else {
        showError(undefined);
      }
    } catch (err) {
      showError(err);
    }
  };

  const retryPaymentSession = () => {
    if (!enrolmentIdRef.current) return;
    setLoading(true);
    createPaymentSession(enrolmentIdRef.current);
  };

  const retryLookup = () => {
    if (knownEnrolmentIdRef.current) {
      resumeKnownEnrolment(knownEnrolmentIdRef.current);
    } else if (selectedProduct) {
      startPurchase(selectedProduct);
    }
  };

  // Show loading state
  if (loading && !error) {
    return (
      <div className="max-w-[900px] mx-auto pb-12 px-4 sm:px-6 md:px-4">
        <div className="max-w-[600px]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mb-4"></div>
            <p className="text-[14px] text-slate">Setting up your test purchase...</p>
            <p className="text-[12px] text-slate mt-2">Please wait while we create your enrolment and payment session</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const hasEnrolment = enrolmentIdRef.current !== null;
    const canRetry =
      hasEnrolment &&
      !lookupFailed &&
      errorKind !== 'already-paid' &&
      errorKind !== 'not-found' &&
      errorKind !== 'auth' &&
      errorKind !== 'pending';
    const heading =
      errorKind === 'already-paid'
        ? 'Payment already completed'
        : errorKind === 'pending'
          ? 'Payment pending'
          : 'Failed to load checkout';

    return (
      <div className="max-w-[900px] mx-auto pb-12 px-4 sm:px-6 md:px-4">
        <div className="max-w-[600px]">
          <div className="bg-surface-error-light border-2 border-surface-error-light rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-error-light flex items-center justify-center flex-shrink-0 text-brand-red">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-[18px] font-black text-brand-red mb-2">
                  {heading}
                </h2>
                <p className="text-[14px] text-brand-red mb-4">
                  {error}
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {lookupFailed && errorKind !== 'auth' && (
                    <Button variant="primary" size="medium" onClick={retryLookup}>
                      Try again
                    </Button>
                  )}
                  {errorKind === 'pending' && (
                    <Button variant="primary" size="medium" onClick={retryLookup}>
                      Check payment status
                    </Button>
                  )}
                  {canRetry && (
                    <Button variant="primary" size="medium" onClick={retryPaymentSession}>
                      Try payment again
                    </Button>
                  )}
                  {hasEnrolment ? (
                    <button
                      onClick={() => navigate('/dashboard', { replace: true })}
                      className="inline-block px-6 py-2 rounded-lg border-2 border-brand-primary text-brand-primary text-[13px] font-black hover:opacity-90 transition"
                    >
                      Go to Dashboard
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/book', { replace: true })}
                      className="inline-block px-6 py-2 rounded-lg bg-brand-primary text-white text-[13px] font-black no-underline hover:opacity-90 transition"
                    >
                      Back to test selection
                    </button>
                  )}
                </div>
                {errorKind !== 'already-paid' && (
                  <PaymentSupportNotice variant={errorKind === 'pending' ? 'pending' : 'failed'} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use selectedProduct state for pricing display
  if (!selectedProduct) {
    return (
      <div className="max-w-[900px] mx-auto pb-12 px-4 sm:px-6 md:px-4">
        <div className="max-w-[600px]">
          <p className="text-slate text-center py-8">Loading...</p>
        </div>
      </div>
    );
  }

  // Get the fee for Australia (or first available fee)
  const ausFee = selectedProduct.fees.find((f: { country: string }) => f.country === 'AUS') || selectedProduct.fees[0];
  const price = ausFee?.basePrice ?? 89;
  const currency = ausFee?.currency ?? 'AUD';

  return (
    <>
      <div className="max-w-[900px] mx-auto pb-12 px-4 sm:px-6 md:px-4">
        <div className="max-w-[600px]">

          {/* Order Summary Card */}
          <Card 
            bordered={true}
            padding="lg"
            shadow="sm"
            className="bg-surface-brand border-accent-yellow mb-8"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[15px] font-bold text-ink">
                  {selectedProduct.name}
                </span>
              </div>
              <span className="text-[18px] font-black text-ink">${price} {currency}</span>
            </div>
            <div className="text-[13px] text-slate mb-4">
              ONE TIME TEST · UP TO 80 MINS · Results in 48 hours
            </div>
            <div className="border-t border-accent-yellow pt-4">
              <div className="text-[13px] text-slate flex flex-col gap-2.5">
                {CHECKOUT_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <span className="text-brand-primary font-black">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Payment Form Section */}
          <div className="mb-8">
            <h2 className="text-[16px] font-black text-ink mb-6">
              Payment information
            </h2>

            {/* Stripe Embedded Checkout */}
            {paymentReady && stripePromise && clientSecret ? (
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            ) : (
              <div className="text-center py-8">
                <p className="text-[13px] text-slate">Initializing payment form...</p>
              </div>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="terms"
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="terms" className="text-[13px] text-slate cursor-pointer">
              I agree to the{' '}
              <span className="text-brand-primary font-bold">
                Terms of Service and Privacy Policy
              </span>
            </label>
          </div>

          {/* Pay Button - Hidden when Stripe Embedded Checkout is active */}
          {!paymentReady && (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                type="button"
                className="mb-3"
              >
                Pay ${price} {currency}
              </Button>
              <p className="text-[12px] text-slate text-center">
                CONDITIONS APPLY · Secure payment
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
