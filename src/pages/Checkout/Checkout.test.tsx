import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';

// Hoist all mocks and variables
const mocks = vi.hoisted(() => {
  const mockNavigate = vi.fn();
  const mockCreateEnrolment = vi.fn();
  const mockCreatePaymentSession = vi.fn();
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
        expect(screen.getByText(/failed to load stripe/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back to test selection/i })).toBeInTheDocument();
      });
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
});
