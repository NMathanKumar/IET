import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { EnrolmentService } from '@services';
import type { Product } from '@types';

const CHECKOUT_FEATURES = [
  'A clear score, mapped to CEFR',
  'Reviewed by certified assessors',
  'Accepted by institutions around the globe',
  'Certified in days',
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stripePromise, setStripePromise] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState<boolean>(false);
  const hasCreatedEnrolment = useRef<boolean>(false);

  useEffect(() => {
    // Get product from navigation state
    const state = location.state as { product?: Product } | null;
    const product = state?.product;

    if (!product) {
      setError('No product selected for purchase');
      return;
    }

    setSelectedProduct(product);

    // Create enrolment only once
    if (!hasCreatedEnrolment.current) {
      hasCreatedEnrolment.current = true;
      createEnrolment(product.id);
    }
  }, [location.state]);

  const createEnrolment = async (productId: string) => {
    setLoading(true);
    setError(null);

    try {
      const enrolment = await EnrolmentService.createEnrolment({
        productId: productId,
      });

      if (enrolment) {
        await createPaymentSession(enrolment.id);
      } else {
        setError('Failed to create enrolment');
        setLoading(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create enrolment';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const createPaymentSession = async (enrolmentId: string) => {
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
        setError('Failed to create payment session');
        setLoading(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment session';
      setError(errorMessage);
      setLoading(false);
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
                  Failed to load checkout
                </h2>
                <p className="text-[14px] text-brand-red mb-4">
                  {error}
                </p>
                <button
                  onClick={() => navigate('/book', { replace: true })}
                  className="inline-block px-6 py-2 rounded-lg bg-brand-primary text-white text-[13px] font-black no-underline hover:opacity-90 transition"
                >
                  Back to test selection
                </button>
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
