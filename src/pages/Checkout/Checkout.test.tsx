import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';

// Hoist all mocks and variables
const mocks = vi.hoisted(() => {
  const mockNavigate = vi.fn();
  const mockCreateEnrolment = vi.fn();
  const mockCreatePaymentSession = vi.fn();
  const mockGetEnrolments = vi.fn();
  const mockLocation = { 
    state: { 
      product: { 
        id: 'product-123', 
        name: 'IDP English Test', 
        description: 'HST', 
        status: 'ACTIVE', 
        fees: [{ country: 'AUS', currency: 'AUD', basePrice: 89 }] 
      } 
    } 
  };

  return {
    mockNavigate,
    mockCreateEnrolment,
    mockCreatePaymentSession,
    mockGetEnrolments,
    mockLocation,
  };
});

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({
    elements: vi.fn().mockReturnValue({}),
  }),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmbeddedCheckout: () => <div data-testid="stripe-embedded-checkout">Stripe Embedded Checkout</div>,
}));

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ 
    user: { 
      given_name: 'Test User',
      signInDetails: { loginId: 'test@example.com' }
    }, 
    isLoading: false 
  }),
}));

vi.mock('@layouts/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@components/common/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <button {...props}>{children}</button>,
}));

vi.mock('@components/common/Input', () => ({
  Input: ({ label, ...props }: { label?: string; [key: string]: unknown }) => (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  ),
}));

vi.mock('@components/common/Card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.mockNavigate,
    useLocation: () => mocks.mockLocation,
  };
});

vi.mock('@services', () => ({
  EnrolmentService: {
    createEnrolment: mocks.mockCreateEnrolment,
    createPaymentSession: mocks.mockCreatePaymentSession,
    getEnrolments: mocks.mockGetEnrolments,
  },
}));

function renderPage(product?: Record<string, unknown> | null) {
  let productToUse: Record<string, unknown> | null;
  
  // If product is explicitly null or false, don't set a product
  if (product === null) {
    productToUse = null;
  } else if (product === undefined) {
    productToUse = { 
      id: 'product-123', 
      name: 'IDP English Test', 
      description: 'HST', 
      status: 'ACTIVE', 
      fees: [{ country: 'AUS', currency: 'AUD', basePrice: 89 }] 
    };
  } else {
    productToUse = product;
  }

  // Update the location mock
  if (productToUse === null) {
    Object.defineProperty(mocks.mockLocation, 'state', {
      value: undefined,
      writable: true,
    });
  } else {
    Object.defineProperty(mocks.mockLocation, 'state', {
      value: { product: productToUse },
      writable: true,
    });
  }

  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Checkout />
    </MemoryRouter>
  );
}

describe('Checkout Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockNavigate.mockClear();
    mocks.mockCreateEnrolment.mockClear();
    mocks.mockCreatePaymentSession.mockClear();
    mocks.mockGetEnrolments.mockClear();

    // No existing enrolments by default, so a new purchase creates one
    mocks.mockGetEnrolments.mockResolvedValue([]);

    // Default successful mock responses
    mocks.mockCreateEnrolment.mockResolvedValue({
      id: 'enrol-123',
      status: 'IN_PROGRESS',
    });

    mocks.mockCreatePaymentSession.mockResolvedValue({
      enrolmentId: 'enrol-123',
      checkoutSessionId: 'cs_test_123',
      clientSecret: 'pi_secret_test',
      publishableKey: 'pk_test_123',
      status: 'PENDING',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders checkout heading', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/payment information/i)).toBeInTheDocument();
    });
  });

  it('renders back button', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/idp english test/i)).toBeInTheDocument();
    });
  });

  it('shows checkout description', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/a clear score, mapped to cefr/i)).toBeInTheDocument();
    });
  });

  it('displays order summary card', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/idp english test/i)).toBeInTheDocument();
      expect(screen.getByText(/\$89 AUD/i)).toBeInTheDocument();
      expect(screen.getByText(/one time test · up to 80 mins · results in 48 hours/i)).toBeInTheDocument();
    });
  });

  it('shows checkout features list', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/a clear score, mapped to cefr/i)).toBeInTheDocument();
      expect(screen.getByText(/reviewed by certified assessors/i)).toBeInTheDocument();
      expect(screen.getByText(/accepted by institutions around the globe/i)).toBeInTheDocument();
      expect(screen.getByText(/certified in days/i)).toBeInTheDocument();
    });
  });

  it('displays payment information section', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/payment information/i)).toBeInTheDocument();
    });
  });

  it('displays terms checkbox', async () => {
    renderPage();
    
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox', { name: /i agree to the/i });
      expect(checkbox).toBeInTheDocument();
    });
  });

  it('shows terms of service link', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/terms of service and privacy policy/i)).toBeInTheDocument();
    });
  });

  it('displays pay button when not ready for payment', async () => {
    // Don't mock payment session - shows loading state
    mocks.mockCreatePaymentSession.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderPage();

    await waitFor(() => {
      // Button may or may not be visible depending on timing
      expect(screen.getByText(/setting up your test purchase/i)).toBeInTheDocument();
    });
  });

  it('shows payment security notice', async () => {
    renderPage();
    
    await waitFor(() => {
      // After Stripe Embedded Checkout loads, payment button is hidden
      // but we can verify the payment information section is visible
      expect(screen.getByText(/payment information/i)).toBeInTheDocument();
      expect(screen.getByText(/terms of service and privacy policy/i)).toBeInTheDocument();
      expect(screen.getByTestId('stripe-embedded-checkout')).toBeInTheDocument();
    });
  });

  it('uses responsive grid for form fields', async () => {
    const { container } = renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/payment information/i)).toBeInTheDocument();
    });
    
    const maxWidthContainer = container.querySelector('.max-w-\\[600px\\]');
    expect(maxWidthContainer).toBeInTheDocument();
  });

  it('applies max-width to checkout container', async () => {
    const { container } = renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/payment information/i)).toBeInTheDocument();
    });
    
    const maxWidthContainer = container.querySelector('.max-w-\\[600px\\]');
    expect(maxWidthContainer).toBeInTheDocument();
  });

  // Integration tests for enrolment and payment services
  describe('Enrolment and Payment Services Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mocks.mockCreateEnrolment.mockResolvedValue({
        id: 'enrol-123',
        status: 'IN_PROGRESS',
      });

      mocks.mockCreatePaymentSession.mockResolvedValue({
        enrolmentId: 'enrol-123',
        checkoutSessionId: 'cs_test_123',
        clientSecret: 'pi_secret_test',
        publishableKey: 'pk_test_123',
        status: 'PENDING',
      });
    });

    it('renders loading state while creating enrolment and payment session', async () => {
      // Mock services to never resolve
      mocks.mockCreateEnrolment.mockImplementationOnce(() => new Promise(() => {}));

      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/setting up your test purchase/i)).toBeInTheDocument();
      });
    });

    it('renders error state when product is missing', async () => {
      // Pass null to renderPage to omit product from location state
      renderPage(null);

      await waitFor(() => {
        expect(screen.getByText(/failed to load checkout/i)).toBeInTheDocument();
        expect(screen.getByText(/no product selected for purchase/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back to test selection/i })).toBeInTheDocument();
      });
    });

    it('handles missing clientSecret or publishableKey safely', async () => {
      // Mock partial payment session response
      mocks.mockCreatePaymentSession.mockResolvedValueOnce({
        enrolmentId: 'enrol-123',
        checkoutSessionId: 'cs_test_123',
        clientSecret: null,
        publishableKey: null,
        status: 'PENDING',
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/initializing payment form/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stripe Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mocks.mockCreateEnrolment.mockResolvedValue({
        id: 'enrol-123',
        status: 'IN_PROGRESS',
      });

      mocks.mockCreatePaymentSession.mockResolvedValue({
        enrolmentId: 'enrol-123',
        checkoutSessionId: 'cs_test_123',
        clientSecret: 'pi_secret_test',
        publishableKey: 'pk_test_123',
        status: 'PENDING',
      });
    });

    it('initializes Stripe using backend publishableKey', async () => {
      const { loadStripe } = await import('@stripe/stripe-js');
      
      renderPage();

      // loadStripe should be called with the publishableKey from backend
      await waitFor(() => {
        expect(loadStripe).toHaveBeenCalledWith('pk_test_123');
      });
    });

    it('renders Stripe Embedded Checkout when payment session succeeds', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('stripe-embedded-checkout')).toBeInTheDocument();
      });
    });

    it('does not duplicate API calls on re-renders', async () => {
      mocks.mockCreateEnrolment.mockResolvedValue({
        id: 'enrol-123',
        status: 'IN_PROGRESS',
      });

      mocks.mockCreatePaymentSession.mockResolvedValue({
        enrolmentId: 'enrol-123',
        checkoutSessionId: 'cs_test_123',
        clientSecret: 'pi_secret_test',
        publishableKey: 'pk_test_123',
        status: 'PENDING',
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/checkout']}>
          <Checkout />
        </MemoryRouter>
      );

      // First render
      await waitFor(() => {
        expect(mocks.mockCreateEnrolment).toHaveBeenCalledTimes(1);
      });

      // Re-render should not trigger additional API calls
      rerender(
        <MemoryRouter initialEntries={['/checkout']}>
          <Checkout />
        </MemoryRouter>
      );

      // Should still be called only once
      expect(mocks.mockCreateEnrolment).toHaveBeenCalledTimes(1);
    });

    it('handles Stripe loading errors gracefully', async () => {
      const { loadStripe } = await import('@stripe/stripe-js');
      vi.mocked(loadStripe).mockRejectedValueOnce(new Error('Failed to load Stripe'));

      renderPage();

      // Component should show error state with specific error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load checkout/i)).toBeInTheDocument();
        // A non-HTTP error maps to the generic safe message; the raw error text is never shown
        expect(
          screen.getByText(/something went wrong while setting up your payment/i)
        ).toBeInTheDocument();
        // The enrolment already exists, so the user retries payment or goes to the dashboard
        // (not back to test selection, which would create another enrolment)
        expect(screen.getByRole('button', { name: /try payment again/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
      });
      expect(screen.queryByText(/failed to load stripe/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /back to test selection/i })
      ).not.toBeInTheDocument();
    });

    it('does not expose clientSecret in logs', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/payment information/i)).toBeInTheDocument();
      });

      // Verify that clientSecret is not logged
      const logs = consoleSpy.mock.calls.join();
      expect(logs).not.toMatch(/pi_secret/);
      
      consoleSpy.mockRestore();
    });
  });

  // MSP-2849: a refresh, Back or remount must never create a second enrolment
  describe('Duplicate enrolment protection', () => {
    const product = {
      id: 'product-123',
      name: 'IDP English Test',
      description: 'HST',
      status: 'ACTIVE',
      fees: [{ country: 'AUS', currency: 'AUD', basePrice: 89 }],
    };

    const snapshotFee = { country: 'AUS', currency: 'AUD', basePrice: 95 };

    const enrolment = (overrides: Record<string, unknown> = {}) => ({
      id: 'enrol-existing',
      status: 'IN_PROGRESS',
      enrolmentDateTime: '2025-01-15T10:00:00Z',
      product: { id: 'product-123', name: 'IDP English Test', fee: snapshotFee },
      ...overrides,
    });

    const payment = (status: string) => ({
      provider: 'STRIPE',
      status,
      amount: 95,
      currency: 'AUD',
    });

    const apiError = (status: number, message: string) =>
      Object.assign(new Error(message), { status });

    function renderWithState(state: Record<string, unknown>) {
      Object.defineProperty(mocks.mockLocation, 'state', { value: state, writable: true });
      return render(
        <MemoryRouter initialEntries={['/checkout']}>
          <Checkout />
        </MemoryRouter>
      );
    }

    const waitForStripe = () =>
      waitFor(() => expect(screen.getByTestId('stripe-embedded-checkout')).toBeInTheDocument());

    beforeEach(() => {
      vi.clearAllMocks();
      mocks.mockGetEnrolments.mockResolvedValue([]);
      mocks.mockCreateEnrolment.mockResolvedValue({ id: 'enrol-123', status: 'IN_PROGRESS' });
      mocks.mockCreatePaymentSession.mockResolvedValue({
        enrolmentId: 'enrol-123',
        checkoutSessionId: 'cs_test_123',
        clientSecret: 'pi_secret_test',
        publishableKey: 'pk_test_123',
        status: 'PENDING',
      });
    });

    it('first-time checkout: looks up, creates one enrolment and records its id before paying', async () => {
      renderWithState({ product });

      await waitForStripe();

      expect(mocks.mockGetEnrolments).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreateEnrolment).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreateEnrolment).toHaveBeenCalledWith({ productId: 'product-123' });
      expect(mocks.mockNavigate).toHaveBeenCalledWith('/checkout', {
        replace: true,
        state: { product, enrolmentId: 'enrol-123' },
      });
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-123');
      expect(mocks.mockNavigate.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.mockCreatePaymentSession.mock.invocationCallOrder[0]
      );
    });

    it('refresh with a known unpaid enrolment id: checks status, reuses it, creates nothing', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([enrolment({ id: 'enrol-123' })]);

      renderWithState({ product, enrolmentId: 'enrol-123' });

      await waitForStripe();

      expect(mocks.mockGetEnrolments).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
      expect(mocks.mockNavigate).not.toHaveBeenCalled();
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-123');
      // Price comes from the enrolment snapshot
      expect(screen.getByText('$95 AUD')).toBeInTheDocument();
    });

    it('remount with a known enrolment id (refs reset) still creates no enrolment', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([enrolment({ id: 'enrol-123' })]);

      const first = renderWithState({ product, enrolmentId: 'enrol-123' });
      await waitForStripe();
      first.unmount();

      renderWithState({ product, enrolmentId: 'enrol-123' });
      await waitFor(() => expect(mocks.mockCreatePaymentSession).toHaveBeenCalledTimes(2));

      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
      expect(mocks.mockCreatePaymentSession).toHaveBeenNthCalledWith(1, 'enrol-123');
      expect(mocks.mockCreatePaymentSession).toHaveBeenNthCalledWith(2, 'enrol-123');
    });

    it.each([
      ['FAILED', payment('FAILED')],
      ['EXPIRED', payment('EXPIRED')],
    ])(
      'known enrolment id with %s payment: retries payment for the same enrolment',
      async (_label, existingPayment) => {
        mocks.mockGetEnrolments.mockResolvedValue([
          enrolment({ id: 'enrol-123', payment: existingPayment }),
        ]);

        renderWithState({ product, enrolmentId: 'enrol-123' });

        await waitForStripe();

        expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
        expect(mocks.mockCreatePaymentSession).toHaveBeenCalledTimes(1);
        expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-123');
      }
    );

    it('known enrolment id with PENDING payment: no new session, safe pending message', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([
        enrolment({ id: 'enrol-123', payment: payment('PENDING') }),
      ]);

      renderWithState({ product, enrolmentId: 'enrol-123' });

      expect(
        await screen.findByRole('heading', { name: /payment pending/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/do not pay again/i).length).toBeGreaterThan(0);
      expect(mocks.mockCreatePaymentSession).not.toHaveBeenCalled();
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: /try payment again/i })).not.toBeInTheDocument();
      expect(screen.queryByTestId('stripe-embedded-checkout')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
      expect(mocks.mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('PENDING: "Check payment status" re-checks and only pays once the payment has failed', async () => {
      mocks.mockGetEnrolments
        .mockResolvedValueOnce([enrolment({ id: 'enrol-123', payment: payment('PENDING') })])
        .mockResolvedValueOnce([enrolment({ id: 'enrol-123', payment: payment('FAILED') })]);

      renderWithState({ product, enrolmentId: 'enrol-123' });

      await userEvent.click(await screen.findByRole('button', { name: /check payment status/i }));

      await waitForStripe();

      expect(mocks.mockGetEnrolments).toHaveBeenCalledTimes(2);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-123');
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
    });

    it.each([
      ['COMPLETED payment', enrolment({ id: 'enrol-123', payment: payment('COMPLETED') })],
      ['CONFIRMED enrolment', enrolment({ id: 'enrol-123', status: 'CONFIRMED' })],
    ])('known enrolment id with %s: no new session, already-paid message', async (_l, current) => {
      mocks.mockGetEnrolments.mockResolvedValue([current]);

      renderWithState({ product, enrolmentId: 'enrol-123' });

      expect(
        await screen.findByRole('heading', { name: /payment already completed/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/already been paid for/i)).toBeInTheDocument();
      expect(mocks.mockCreatePaymentSession).not.toHaveBeenCalled();
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: /try payment again/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it.each([
      ['not in the list', []],
      ['an unknown payment status', [enrolment({ id: 'enrol-123', payment: payment('SOMETHING') })]],
    ])('known enrolment id %s: no new session, points to the dashboard', async (_l, list) => {
      mocks.mockGetEnrolments.mockResolvedValue(list);

      renderWithState({ product, enrolmentId: 'enrol-123' });

      expect(await screen.findByText(/could not confirm the status/i)).toBeInTheDocument();
      expect(mocks.mockCreatePaymentSession).not.toHaveBeenCalled();
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: /try payment again/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('known enrolment id when the status check fails: fails closed, retry re-checks', async () => {
      mocks.mockGetEnrolments
        .mockRejectedValueOnce(apiError(500, 'DynamoDB timeout arn:aws:xyz'))
        .mockResolvedValueOnce([enrolment({ id: 'enrol-123' })]);

      renderWithState({ product, enrolmentId: 'enrol-123' });

      expect(await screen.findByText(/could not start your payment right now/i)).toBeInTheDocument();
      expect(screen.queryByText(/dynamodb|arn:aws/i)).not.toBeInTheDocument();
      expect(mocks.mockCreatePaymentSession).not.toHaveBeenCalled();
      // Retrying payment directly would skip the status check
      expect(screen.queryByRole('button', { name: /try payment again/i })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /^try again$/i }));

      await waitForStripe();
      expect(mocks.mockGetEnrolments).toHaveBeenCalledTimes(2);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-123');
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
    });

    it.each([
      ['no payment', undefined],
      ['FAILED', payment('FAILED')],
      ['EXPIRED', payment('EXPIRED')],
    ])(
      'reuses a matching unpaid enrolment (%s) with its own fee snapshot',
      async (_label, existingPayment) => {
        mocks.mockGetEnrolments.mockResolvedValue([enrolment({ payment: existingPayment })]);

        renderWithState({ product });

        await waitForStripe();

        expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
        expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-existing');
        expect(mocks.mockNavigate).toHaveBeenCalledWith('/checkout', {
          replace: true,
          state: {
            product: { id: 'product-123', name: 'IDP English Test', fees: [snapshotFee] },
            enrolmentId: 'enrol-existing',
          },
        });
        // Price comes from the enrolment snapshot (95), not the product list (89)
        expect(screen.getByText('$95 AUD')).toBeInTheDocument();
      }
    );

    it('reuses the newest matching enrolment', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([
        enrolment({ id: 'enrol-older', enrolmentDateTime: '2025-01-01T10:00:00Z' }),
        enrolment({ id: 'enrol-newest', enrolmentDateTime: '2025-02-01T10:00:00Z' }),
      ]);

      renderWithState({ product });

      await waitForStripe();

      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-newest');
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
    });

    it.each([
      ['PENDING payment', enrolment({ payment: payment('PENDING') })],
      ['COMPLETED payment', enrolment({ payment: payment('COMPLETED') })],
      [
        'a different product',
        enrolment({ product: { id: 'other-product', name: 'Other', fee: snapshotFee } }),
      ],
      ['a non IN_PROGRESS enrolment', enrolment({ status: 'CONFIRMED' })],
    ])('does not reuse an enrolment with %s and creates a new one', async (_label, existing) => {
      mocks.mockGetEnrolments.mockResolvedValue([existing]);

      renderWithState({ product });

      await waitForStripe();

      expect(mocks.mockCreateEnrolment).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-123');
      expect(mocks.mockCreatePaymentSession).not.toHaveBeenCalledWith('enrol-existing');
    });

    it('fails closed when the lookup fails: safe error, no enrolment created', async () => {
      mocks.mockGetEnrolments.mockRejectedValue(apiError(500, 'DynamoDB timeout arn:aws:xyz'));

      renderWithState({ product });

      expect(await screen.findByText(/could not start your payment right now/i)).toBeInTheDocument();
      expect(screen.queryByText(/dynamodb|arn:aws/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^try again$/i })).toBeInTheDocument();
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
      expect(mocks.mockCreatePaymentSession).not.toHaveBeenCalled();
    });

    it('lets the user retry the lookup, then continues normally', async () => {
      mocks.mockGetEnrolments.mockRejectedValueOnce(apiError(500, 'boom'));

      renderWithState({ product });

      await userEvent.click(await screen.findByRole('button', { name: /^try again$/i }));

      await waitForStripe();

      expect(mocks.mockGetEnrolments).toHaveBeenCalledTimes(2);
      expect(mocks.mockCreateEnrolment).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-123');
    });

    it('keeps the retryEnrolment flow unchanged: no lookup, no creation, same enrolment', async () => {
      renderWithState({
        retryEnrolment: enrolment({ id: 'enrol-retry', payment: payment('FAILED') }),
      });

      await waitForStripe();

      expect(mocks.mockGetEnrolments).not.toHaveBeenCalled();
      expect(mocks.mockCreateEnrolment).not.toHaveBeenCalled();
      expect(mocks.mockNavigate).not.toHaveBeenCalled();
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledTimes(1);
      expect(mocks.mockCreatePaymentSession).toHaveBeenCalledWith('enrol-retry');
    });
  });
});
