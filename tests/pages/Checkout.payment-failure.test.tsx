import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Checkout from '@pages/Checkout/Checkout';

const mockNavigate = jest.fn();
const mockCreateEnrolment = jest.fn();
const mockCreatePaymentSession = jest.fn();
let mockLocationState: unknown;

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({}),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmbeddedCheckout: () => <div data-testid="stripe-embedded-checkout" />,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

jest.mock('@services', () => ({
  EnrolmentService: {
    createEnrolment: (...args: unknown[]) => mockCreateEnrolment(...args),
    createPaymentSession: (...args: unknown[]) => mockCreatePaymentSession(...args),
  },
}));

const product = {
  id: 'product-123',
  name: 'IDP English Test',
  fees: [{ country: 'AUS', currency: 'AUD', basePrice: 89 }],
};

const existingEnrolment = {
  id: 'enrol-existing',
  product: { id: 'product-123', name: 'IDP English Test', fee: product.fees[0] },
  payment: { status: 'FAILED' },
};

const session = {
  enrolmentId: 'enrol-123',
  checkoutSessionId: 'cs_test_123',
  clientSecret: 'secret',
  publishableKey: 'pk_test_123',
  status: 'PENDING',
};

const apiError = (status: number, message: string) => Object.assign(new Error(message), { status });

function renderPage() {
  return render(
    <MemoryRouter>
      <Checkout />
    </MemoryRouter>
  );
}

describe('Checkout payment failure handling (MSP-2849)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = { product };
    mockCreateEnrolment.mockResolvedValue({ id: 'enrol-123' });
    mockCreatePaymentSession.mockResolvedValue(session);
  });

  it('retry reuses the existing enrolment and does not create a new one', async () => {
    mockLocationState = { retryEnrolment: existingEnrolment };

    renderPage();

    await waitFor(() => expect(screen.getByTestId('stripe-embedded-checkout')).toBeInTheDocument());
    expect(mockCreateEnrolment).not.toHaveBeenCalled();
    expect(mockCreatePaymentSession).toHaveBeenCalledTimes(1);
    expect(mockCreatePaymentSession).toHaveBeenCalledWith('enrol-existing');
  });

  it('shows an already-paid message on HTTP 409 and offers the dashboard, not a retry', async () => {
    mockCreatePaymentSession.mockRejectedValue(
      apiError(409, 'Conflict: payment pi_123 already COMPLETED')
    );

    renderPage();

    expect(await screen.findByText(/already been paid for/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /payment already completed/i })).toBeInTheDocument();
    expect(screen.queryByText(/failed to load checkout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pi_123|conflict/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try payment again/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('masks raw Stripe/API errors', async () => {
    mockCreatePaymentSession.mockRejectedValue(
      apiError(500, 'StripeAPIError: sk_live_abc internal stack trace')
    );

    renderPage();

    expect(await screen.findByText(/could not start your payment right now/i)).toBeInTheDocument();
    expect(screen.queryByText(/stripe|sk_live|stack/i)).not.toBeInTheDocument();
  });

  it('masks errors thrown while creating the enrolment and offers test selection', async () => {
    mockCreateEnrolment.mockRejectedValue(apiError(422, 'validation failed: productId'));

    renderPage();

    expect(await screen.findByText(/we could not start your payment/i)).toBeInTheDocument();
    expect(screen.queryByText(/validation failed|productId/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to test selection/i })).toBeInTheDocument();
  });

  it('retrying a failed session reuses the enrolment created for this purchase', async () => {
    mockCreatePaymentSession
      .mockRejectedValueOnce(apiError(500, 'boom'))
      .mockResolvedValueOnce(session);

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /try payment again/i }));

    await waitFor(() => expect(screen.getByTestId('stripe-embedded-checkout')).toBeInTheDocument());
    expect(mockCreateEnrolment).toHaveBeenCalledTimes(1);
    expect(mockCreatePaymentSession).toHaveBeenNthCalledWith(1, 'enrol-123');
    expect(mockCreatePaymentSession).toHaveBeenNthCalledWith(2, 'enrol-123');
  });

  it('shows refund/reschedule guidance with no self-service controls on failure', async () => {
    mockCreatePaymentSession.mockRejectedValue(apiError(500, 'boom'));

    renderPage();

    expect(await screen.findByText(/handled by the idp operations team/i)).toBeInTheDocument();
    expect(screen.getByText(/within 21 days of purchase/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /refund|cancel|reschedule/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/date/i)).not.toBeInTheDocument();
  });
});
