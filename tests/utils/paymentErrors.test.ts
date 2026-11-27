import {
  getPaymentErrorInfo,
  getPaymentErrorMessage,
  isAlreadyPaidError,
  PAYMENT_GUIDANCE,
  PAYMENT_SUPPORT_CONTACT,
} from '@utils/paymentErrors';

const apiError = (status: number, message = 'raw backend text') =>
  Object.assign(new Error(message), { status });

describe('paymentErrors', () => {
  it('maps HTTP 409 to an already-paid message', () => {
    const info = getPaymentErrorInfo(apiError(409));
    expect(info.kind).toBe('already-paid');
    expect(info.message).toMatch(/already been paid/i);
    expect(isAlreadyPaidError(apiError(409))).toBe(true);
    expect(isAlreadyPaidError(apiError(500))).toBe(false);
  });

  it.each([400, 401, 403, 404, 422, 429, 500, 502])(
    'never exposes raw message for status %s',
    (status) => {
      const message = getPaymentErrorMessage(
        apiError(status, 'stripe_error sk_live_123 stack at Foo.bar')
      );
      expect(message).not.toMatch(/stripe_error|sk_live|stack|raw backend/i);
      expect(message.length).toBeGreaterThan(0);
    }
  );

  it('masks non-API errors', () => {
    expect(
      getPaymentErrorMessage(new Error('Failed to load Stripe at node_modules/x'))
    ).not.toMatch(/stripe|node_modules/i);
    expect(getPaymentErrorMessage(undefined)).toMatch(/try again/i);
  });

  it('states MVP refund and reschedule rules', () => {
    expect(PAYMENT_GUIDANCE.refund).toMatch(/operations/i);
    expect(PAYMENT_GUIDANCE.reschedule).toMatch(/21 days/i);
    expect(PAYMENT_GUIDANCE.pending).toMatch(/do not pay again/i);
  });

  it('has no support contact until Product confirms one', () => {
    expect(PAYMENT_SUPPORT_CONTACT).toBeNull();
  });
});
