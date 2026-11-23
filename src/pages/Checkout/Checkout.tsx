import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Card } from '@components/common/Card';

const CHECKOUT_FEATURES = [
  'A clear score, mapped to CEFR',
  'Reviewed by certified assessors',
  'Accepted by institutions around the globe',
  'Certified in days',
];

export default function Checkout() {
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
                  IDP English Test
                </span>
              </div>
              <span className="text-[18px] font-black text-ink">$89 AUD</span>
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

            {/* Card Number */}
            <Input
              label="Card number"
              name="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
            />

            {/* Expiry and CVV Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Expiry"
                name="card-expiry"
                autoComplete="cc-exp"
                placeholder="MM / YY"
              />
              <Input
                label="CVV"
                name="card-cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="•••"
              />
            </div>

            {/* Name on Card */}
            <Input
              label="Name on card"
              name="card-name"
              autoComplete="cc-name"
              placeholder="Agnes Lee"
            />
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

          {/* Pay Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            type="button"
            className="mb-3"
          >
            Pay $89 AUD
          </Button>
          <p className="text-[12px] text-slate text-center">
            CONDITIONS APPLY · Secure payment
          </p>
        </div>
      </div>
    </>
  );
}
