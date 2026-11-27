import { PAYMENT_GUIDANCE, PAYMENT_SUPPORT_CONTACT } from '@utils/paymentErrors';

type PaymentSupportVariant = 'failed' | 'expired' | 'pending' | 'general';

interface PaymentSupportNoticeProps {
  /** Which payment situation to explain. */
  variant: PaymentSupportVariant;
  className?: string;
}

/**
 * MVP support guidance for payment, refund and reschedule issues.
 * Text only: no refund, cancel or reschedule controls (self-service is not supported).
 * A contact is shown only when PAYMENT_SUPPORT_CONTACT has been confirmed by Product.
 */
export default function PaymentSupportNotice({
  variant,
  className = '',
}: PaymentSupportNoticeProps) {
  const lead = variant === 'general' ? null : PAYMENT_GUIDANCE[variant];

  return (
    <div
      data-testid="payment-support-notice"
      className={`text-left text-xs text-slate bg-surface-light rounded-lg p-4 ${className}`}
    >
      <p className="font-bold text-ink mb-1">Need help with your payment?</p>
      {lead && <p className="mb-2">{lead}</p>}
      <p className="mb-2">{PAYMENT_GUIDANCE.refund}</p>
      <p className={PAYMENT_SUPPORT_CONTACT ? 'mb-2' : undefined}>{PAYMENT_GUIDANCE.reschedule}</p>
      {PAYMENT_SUPPORT_CONTACT && <p>Contact: {PAYMENT_SUPPORT_CONTACT}</p>}
    </div>
  );
}
