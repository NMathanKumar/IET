import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from '@pages/Dashboard/Dashboard';

const mockGetEnrolments = jest.fn();
const mockGetTestTaker = jest.fn();

// Stable reference: Dashboard effects depend on `user`, so a new object per render would loop
const mockUser = { given_name: 'Test' };
jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, isLoading: false }),
}));

jest.mock('@utils/onboarding', () => ({
  hasSeenGuide: jest.fn().mockResolvedValue(true),
  markGuideSeen: jest.fn(),
}));

jest.mock('@pages/Onboarding/Onboarding', () => ({ __esModule: true, default: () => null }));

jest.mock('@services', () => ({
  EnrolmentService: {
    getEnrolments: (...args: unknown[]) => mockGetEnrolments(...args),
    getTestTaker: (...args: unknown[]) => mockGetTestTaker(...args),
  },
}));

const enrolmentWith = (status: string) => ({
  id: 'enrol-1',
  status: 'IN_PROGRESS',
  enrolmentDateTime: new Date().toISOString(),
  product: { id: 'p1', name: 'HST', fee: { country: 'AUS', currency: 'AUD', basePrice: 89 } },
  payment: { status },
});

function CheckoutProbe() {
  const location = useLocation();
  const state = location.state as { retryEnrolment?: { id: string } } | null;
  return <div data-testid="checkout-probe">{state?.retryEnrolment?.id}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkout" element={<CheckoutProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Dashboard payment recovery (MSP-2848)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTestTaker.mockResolvedValue({ givenName: 'Test' });
  });

  it.each([
    ['FAILED', /payment failed/i, /did not go through\. retry/i],
    ['EXPIRED', /payment expired/i, /session expired\. retry/i],
  ])(
    '%s: shows status and a retry action that reuses the enrolment',
    async (status, badge, message) => {
      mockGetEnrolments.mockResolvedValue([enrolmentWith(status)]);

      renderPage();

      expect(await screen.findByText(badge)).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /check-in|start test/i })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('link', { name: /retry payment/i }));
      expect(await screen.findByTestId('checkout-probe')).toHaveTextContent('enrol-1');
    }
  );

  it('PENDING: says confirmation is in progress and offers no new payment link', async () => {
    mockGetEnrolments.mockResolvedValue([enrolmentWith('PENDING')]);

    renderPage();

    expect(await screen.findByText(/payment pending/i)).toBeInTheDocument();
    expect(screen.getAllByText(/do not pay again/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('link', { name: /make payment|retry payment/i })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /check payment status/i }));
    expect(mockGetEnrolments).toHaveBeenCalledTimes(2);
  });

  it('COMPLETED: shows no payment recovery actions', async () => {
    mockGetEnrolments.mockResolvedValue([{ ...enrolmentWith('COMPLETED'), status: 'CONFIRMED' }]);

    renderPage();

    expect(await screen.findByRole('link', { name: /start test/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /retry payment|make payment/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/payment (failed|expired|pending)/i)).not.toBeInTheDocument();
  });

  it('shows refund/reschedule guidance and no self-service controls', async () => {
    mockGetEnrolments.mockResolvedValue([enrolmentWith('FAILED')]);

    renderPage();

    expect(await screen.findByText(/handled by the idp operations team/i)).toBeInTheDocument();
    expect(screen.getByText(/within 21 days of purchase/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /refund|cancel|reschedule/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /refund|cancel|reschedule/i })
    ).not.toBeInTheDocument();
  });
});
