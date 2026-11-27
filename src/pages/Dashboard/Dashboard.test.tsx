
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { isCheckInComplete } from '@utils/checkIn';

// Create mocks before vi.mock factories run
const mocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetTestTaker: vi.fn(),
  mockGetEnrolments: vi.fn(),
  mockAuthState: {
    user: null as null | { username: string; given_name?: string },
    isLoading: false,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mocks.mockNavigate,
    useLocation: () => ({ state: null, pathname: '/dashboard' }),
  };
});

vi.mock('@layouts/AppShell', () => ({
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

vi.mock('@services', () => ({
  EnrolmentService: {
    getTestTaker: mocks.mockGetTestTaker,
    getEnrolments: mocks.mockGetEnrolments,
  },
}));

vi.mock('@utils/checkIn', () => ({
  isCheckInComplete: vi.fn(() => false),
}));

vi.mock('@utils/onboarding', () => ({
  hasSeenGuide: vi.fn().mockResolvedValue(true),
  markGuideSeen: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../Onboarding/Onboarding', () => ({
  default: () => null,
}));

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => mocks.mockAuthState,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockGetTestTaker.mockResolvedValue({
      givenName: 'Test',
      familyName: 'User',
    });

    // Default to new user
    mocks.mockGetEnrolments.mockResolvedValue([]);

    // Default check-in status
    vi.mocked(isCheckInComplete).mockReturnValue(false);

    mocks.mockAuthState = {
      user: null,
      isLoading: false,
    };
  });

  it('redirects to /signin when unauthenticated and not loading', async () => {
    mocks.mockAuthState = {
      user: null,
      isLoading: false,
    };

    renderPage();

    await waitFor(() => {
      expect(mocks.mockNavigate).toHaveBeenCalledWith('/signin', {
        replace: true,
      });
    });
  });

  it('does not redirect or load data while auth is initialising', () => {
    mocks.mockAuthState = {
      user: null,
      isLoading: true,
    };

    renderPage();

    expect(mocks.mockNavigate).not.toHaveBeenCalled();
    expect(mocks.mockGetTestTaker).not.toHaveBeenCalled();
    expect(mocks.mockGetEnrolments).not.toHaveBeenCalled();
  });

  it('renders welcome heading with user first name when authenticated', async () => {
    mocks.mockAuthState = {
      user: {
        username: 'test@example.com',
        given_name: 'Agnes',
      },
      isLoading: false,
    };

    mocks.mockGetTestTaker.mockResolvedValue({
      givenName: 'Agnes',
      familyName: '',
    });

    mocks.mockGetEnrolments.mockResolvedValue([
      { 
        id: 'test123',
        testId: 'test123',
        product: { name: 'IDP English Test' },
        status: 'CONFIRMED',
        enrolmentDateTime: new Date().toISOString(),
        testWindow: {
          closesOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ]);

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: /welcome back, agnes/i,
      })
    ).toBeInTheDocument();
  });

  it('calls EnrolmentService.getTestTaker once when authenticated', async () => {
    mocks.mockAuthState = {
      user: { username: 'test@example.com' },
      isLoading: false,
    };

    mocks.mockGetEnrolments.mockResolvedValue([
      {
        id: 'test123',
        testId: 'test123',
        product: { name: 'IDP English Test' },
        status: 'CONFIRMED',
        enrolmentDateTime: new Date().toISOString(),
        testWindow: {
          closesOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(mocks.mockGetTestTaker).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call EnrolmentService.getTestTaker when loading', () => {
    mocks.mockAuthState = {
      user: null,
      isLoading: true,
    };

    renderPage();

    expect(mocks.mockGetTestTaker).not.toHaveBeenCalled();
  });

  it('shows Check-in CTA when check-in is not complete', async () => {
    mocks.mockAuthState = {
      user: { username: 'test@example.com' },
      isLoading: false,
    };

    // Paid enrolment (payment COMPLETED) that is still IN_PROGRESS: check-in is not complete
    mocks.mockGetEnrolments.mockResolvedValue([
      {
        id: 'test123',
        testId: 'test123',
        product: { name: 'IDP English Test' },
        status: 'IN_PROGRESS',
        payment: { provider: 'STRIPE', status: 'COMPLETED', amount: 89, currency: 'AUD' },
        enrolmentDateTime: new Date().toISOString(),
        testWindow: {
          closesOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ]);

    vi.mocked(isCheckInComplete).mockReturnValue(false);

    renderPage();

    expect(
      await screen.findByRole('link', { name: /check-in/i })
    ).toBeInTheDocument();
  });

  it('shows Start test CTA when check-in is complete', async () => {
    mocks.mockAuthState = {
      user: { username: 'test@example.com' },
      isLoading: false,
    };

    // Mock enrolment with completed check-in (status is CONFIRMED)
    mocks.mockGetEnrolments.mockResolvedValue([
      {
        id: 'test123',
        testId: 'test123',
        product: { name: 'IDP English Test' },
        status: 'CONFIRMED', // Check-in complete
        enrolmentDateTime: new Date().toISOString(),
        testWindow: {
          closesOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ]);

    renderPage();

    expect(
      await screen.findByRole('link', { name: /start test/i })
    ).toBeInTheDocument();
  });

  it('renders all four skill score cards', async () => {
    mocks.mockAuthState = {
      user: { username: 'test@example.com' },
      isLoading: false,
    };

    // Mock enrolment with completed test and results
    mocks.mockGetEnrolments.mockResolvedValue([
      {
        id: 'test123',
        testId: 'test123',
        product: { name: 'IDP English Test' },
        status: 'COMPLETED',
        enrolmentDateTime: new Date().toISOString(),
        testWindow: {
          closesOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        result: {
          certId: 'CERT-123',
          overall: 78,
          cefr: 'B2',
          skills: [],
        },
      },
    ]);

    renderPage();

    // Dashboard shows What's Next section with next steps links when user has enrolments
    await waitFor(() => {
      expect(screen.getByText("What's next?")).toBeInTheDocument();
    });
    
    // Verify the NEXT_STEPS are rendered
    expect(screen.getByText(/download official certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/request score review/i)).toBeInTheDocument();
    expect(screen.getByText(/practice to improve/i)).toBeInTheDocument();
    expect(screen.getByText(/search accepting institutions/i)).toBeInTheDocument();
  });

  it('renders View full results link pointing to /results', async () => {
    mocks.mockAuthState = {
      user: { username: 'test@example.com' },
      isLoading: false,
    };

    // Mock enrolment with completed test
    mocks.mockGetEnrolments.mockResolvedValue([
      {
        id: 'test123',
        testId: 'test123',
        product: { name: 'IDP English Test' },
        status: 'COMPLETED',
        enrolmentDateTime: new Date().toISOString(),
        testWindow: {
          closesOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        result: {
          certId: 'CERT-123',
          overall: 78,
          cefr: 'B2',
          skills: [],
        },
      },
    ]);

    renderPage();

    // Dashboard links to results for certificate download and score review
    await waitFor(() => {
      const downloadLink = screen.getByRole('link', {
        name: /download official certificate/i,
      });
      expect(downloadLink).toHaveAttribute('href', '/results');
    });
  });

  it('does not crash when EnrolmentService.getTestTaker rejects', async () => {
    mocks.mockGetTestTaker.mockRejectedValue(
      new Error('Network error')
    );

    mocks.mockAuthState = {
      user: { username: 'test@example.com' },
      isLoading: false,
    };

    mocks.mockGetEnrolments.mockResolvedValue([
      {
        id: 'test123',
        testId: 'test123',
        product: { name: 'IDP English Test' },
        status: 'CONFIRMED',
        enrolmentDateTime: new Date().toISOString(),
        testWindow: {
          closesOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ]);

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: /welcome back/i,
      })
    ).toBeInTheDocument();
  });

  // H2: an unpaid enrolment must never look like an active test
  describe('Payment status of enrolment cards', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();

    const card = (overrides: Record<string, unknown> = {}) => ({
      id: 'enrol-1',
      product: {
        id: 'p1',
        name: 'IDP English Test',
        fee: { country: 'AUS', currency: 'AUD', basePrice: 89 },
      },
      status: 'IN_PROGRESS',
      enrolmentDateTime: daysAgo(2),
      ...overrides,
    });

    const pay = (status: string) => ({ provider: 'STRIPE', status, amount: 89, currency: 'AUD' });

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Same rule as the Dashboard countdown: purchase date + 21 days
    const expectedCloseDate = (enrolmentDateTime: string) => {
      const close = new Date(enrolmentDateTime);
      close.setDate(close.getDate() + 21);
      return close.toLocaleDateString();
    };

    // Renders Dashboard with a /checkout route that shows which enrolment it received
    async function renderWithCheckoutProbe() {
      const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
      function CheckoutProbe() {
        const location = actual.useLocation();
        const state = location.state as { retryEnrolment?: { id: string } } | null;
        return <div data-testid="checkout-probe">{state?.retryEnrolment?.id}</div>;
      }
      return render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <actual.Routes>
            <actual.Route path="/dashboard" element={<Dashboard />} />
            <actual.Route path="/checkout" element={<CheckoutProbe />} />
          </actual.Routes>
        </MemoryRouter>
      );
    }

    const expectNoActiveTest = () => {
      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /check-in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /start test/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/check-in is required|check-in completed/i)).not.toBeInTheDocument();
      expect(screen.queryByText('TEST NOT STARTED')).not.toBeInTheDocument();
    };

    const expectNoPaymentActions = () => {
      expect(
        screen.queryByRole('link', { name: /complete payment|retry payment/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /check payment status/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/^PAYMENT /)).not.toBeInTheDocument();
    };

    beforeEach(() => {
      mocks.mockAuthState = {
        user: { username: 'test@example.com' },
        isLoading: false,
      };
    });

    it('missing payment: "Payment not completed", Complete payment reuses the enrolment, no active test', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([card()]);

      await renderWithCheckoutProbe();

      expect(await screen.findByText('PAYMENT NOT COMPLETED')).toBeInTheDocument();
      expect(screen.getByText(/complete payment to activate your test/i)).toBeInTheDocument();
      expectNoActiveTest();
      expect(screen.queryByRole('link', { name: /retry payment/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /check payment status/i })
      ).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('link', { name: /complete payment/i }));
      expect(await screen.findByTestId('checkout-probe')).toHaveTextContent('enrol-1');
    });

    it('unknown payment status: status guidance and only Check payment status', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([card({ payment: pay('SOMETHING_NEW') })]);

      await renderWithCheckoutProbe();

      expect(await screen.findByText('PAYMENT PENDING')).toBeInTheDocument();
      expect(screen.getAllByText(/do not pay again/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /check payment status/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /complete payment|retry payment/i })
      ).not.toBeInTheDocument();
      expectNoActiveTest();
    });

    it('PENDING: only Check payment status, which re-fetches without starting a payment', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([card({ payment: pay('PENDING') })]);

      await renderWithCheckoutProbe();

      expect(await screen.findByText('PAYMENT PENDING')).toBeInTheDocument();
      expect(screen.getAllByText(/do not pay again/i).length).toBeGreaterThan(0);
      expect(
        screen.queryByRole('link', { name: /complete payment|retry payment/i })
      ).not.toBeInTheDocument();
      expectNoActiveTest();

      await userEvent.click(screen.getByRole('button', { name: /check payment status/i }));
      await waitFor(() => expect(mocks.mockGetEnrolments).toHaveBeenCalledTimes(2));
      expect(screen.queryByTestId('checkout-probe')).not.toBeInTheDocument();
    });

    it.each([
      ['FAILED', 'PAYMENT FAILED', /did not go through\. retry/i],
      ['EXPIRED', 'PAYMENT EXPIRED', /session expired\. retry/i],
    ])(
      '%s: keeps Retry payment for the same enrolment, no active test',
      async (status, badge, message) => {
        mocks.mockGetEnrolments.mockResolvedValue([card({ payment: pay(status) })]);

        await renderWithCheckoutProbe();

        expect(await screen.findByText(badge)).toBeInTheDocument();
        expect(screen.getByText(message)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /complete payment/i })).not.toBeInTheDocument();
        expectNoActiveTest();

        await userEvent.click(screen.getByRole('link', { name: /retry payment/i }));
        expect(await screen.findByTestId('checkout-probe')).toHaveTextContent('enrol-1');
      }
    );

    it('COMPLETED payment (IN_PROGRESS): active test with countdown, valid date and Check-in', async () => {
      const enrolment = card({ payment: pay('COMPLETED') });
      mocks.mockGetEnrolments.mockResolvedValue([enrolment]);

      renderPage();

      expect(await screen.findByRole('link', { name: /check-in/i })).toBeInTheDocument();
      expect(screen.getByText('TEST NOT STARTED')).toBeInTheDocument();
      // No testWindow yet: the "by" date follows the countdown rule (purchase + 21 days)
      const closeDate = expectedCloseDate(enrolment.enrolmentDateTime as string);
      expect(
        screen.getByText(new RegExp(`\\d+ days left \\(by ${escapeRegExp(closeDate)}\\)`))
      ).toBeInTheDocument();
      expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument();
      expectNoPaymentActions();
    });

    it('COMPLETED payment with a backend testWindow: keeps showing its closing date', async () => {
      const closesOn = new Date(Date.now() + 10 * DAY_MS).toISOString();
      mocks.mockGetEnrolments.mockResolvedValue([
        card({ payment: pay('COMPLETED'), testWindow: { opensOn: daysAgo(1), closesOn } }),
      ]);

      renderPage();

      const backendDate = new Date(closesOn).toLocaleDateString();
      expect(
        await screen.findByText(new RegExp(`\\(by ${escapeRegExp(backendDate)}\\)`))
      ).toBeInTheDocument();
      expectNoPaymentActions();
    });

    it('CONFIRMED enrolment without a payment object is paid: Start test, no payment actions', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([card({ status: 'CONFIRMED' })]);

      renderPage();

      expect(await screen.findByRole('link', { name: /start test/i })).toBeInTheDocument();
      expectNoPaymentActions();
    });

    it('COMPLETED enrolment without a payment object is paid: View results, no payment actions', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([card({ status: 'COMPLETED' })]);

      renderPage();

      expect(await screen.findByRole('link', { name: /view results/i })).toBeInTheDocument();
      expect(screen.getByText('TEST COMPLETED')).toBeInTheDocument();
      expectNoPaymentActions();
    });

    it('mixed list: paid and unpaid cards each show their own state', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([
        card({ id: 'enrol-paid', payment: pay('COMPLETED') }),
        card({ id: 'enrol-unpaid' }),
      ]);

      await renderWithCheckoutProbe();

      expect(await screen.findByText('PAYMENT NOT COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('TEST NOT STARTED')).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: /check-in/i })).toHaveLength(1);
      expect(screen.getAllByText(/days left/i)).toHaveLength(1);
      expect(screen.getAllByRole('link', { name: /complete payment/i })).toHaveLength(1);

      await userEvent.click(screen.getByRole('link', { name: /complete payment/i }));
      expect(await screen.findByTestId('checkout-probe')).toHaveTextContent('enrol-unpaid');
    });
  });
});
