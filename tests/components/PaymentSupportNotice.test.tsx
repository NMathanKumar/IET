import { render, screen } from '@testing-library/react';
import PaymentSupportNotice from '@components/PaymentSupportNotice';

describe('PaymentSupportNotice', () => {
  it('explains refund and reschedule rules without any self-service controls', () => {
    render(<PaymentSupportNotice variant="failed" />);

    expect(screen.getByText(/handled by the idp operations team/i)).toBeInTheDocument();
    expect(screen.getByText(/within 21 days of purchase/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/request (a )?refund|cancel (my )?(test|enrolment)|reschedule (my )?test/i)
    ).not.toBeInTheDocument();
  });

  it('tells the user not to pay again while pending', () => {
    render(<PaymentSupportNotice variant="pending" />);
    expect(screen.getByText(/do not pay again/i)).toBeInTheDocument();
  });

  it('mentions other payment methods only conditionally on the checkout form', () => {
    render(<PaymentSupportNotice variant="failed" />);
    expect(
      screen.getByText(/if the checkout form offers other payment methods/i)
    ).toBeInTheDocument();
  });

  it('does not show an email address or mailto link', () => {
    const { container } = render(<PaymentSupportNotice variant="general" />);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.textContent).not.toMatch(/@/);
  });
});
