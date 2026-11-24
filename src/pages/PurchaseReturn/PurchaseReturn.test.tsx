import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import PurchaseReturn from './PurchaseReturn';

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

// Mock EnrolmentService
vi.mock('@services', () => ({
  EnrolmentService: {
    getEnrolments: vi.fn(),
  },
}));

// Mock components
vi.mock('@components/common/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

function renderPage(sessionId?: string | null) {
  const navigate = vi.fn();
  const setSearchParams = vi.fn();
  
  vi.mocked(useNavigate).mockReturnValue(navigate);
  vi.mocked(useSearchParams).mockReturnValue([
    new URLSearchParams(sessionId ? `?session_id=${sessionId}` : ''),
    setSearchParams,
  ]);

  return { render: () => render(
    <MemoryRouter initialEntries={['/purchase/return']}>
      <PurchaseReturn />
    </MemoryRouter>
  ), navigate };
}

describe('PurchaseReturn Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();
      expect(screen.getByText(/verifying payment/i)).toBeInTheDocument();
    });

    it('shows loading spinner', () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      const { container } = renderComponent();
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    beforeEach(async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockResolvedValue([
        {
          id: 'enrol-123',
          enrolmentDateTime: '2024-11-23T10:00:00Z',
          product: {
            id: 'prod-hst',
            name: 'HST',
            fee: { country: 'AUS', currency: 'AUD', basePrice: 89 },
          },
          payment: {
            checkoutSessionId: 'cs_test_123',
            status: 'COMPLETED',
            amount: 89,
            currency: 'AUD',
            provider: 'STRIPE',
            createdOn: '2025-01-15T09:30:00Z',
          },
        },
      ] as any);
    });

    it('renders success message when payment is verified', async () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
      });
    });

    it('displays purchase complete badge', async () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/purchase complete/i)).toBeInTheDocument();
      });
    });

    it('displays test name', async () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('HST')).toBeInTheDocument();
      });
    });

    it('displays amount paid', async () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/AUD 89/)).toBeInTheDocument();
      });
    });

    it('displays purchase date', async () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/November 23, 2024/)).toBeInTheDocument();
      });
    });

    it('displays confirmation status', async () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/email sent/i)).toBeInTheDocument();
      });
    });

    it('shows "Go to Dashboard" button', async () => {
      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
      });
    });

    it('navigates to dashboard when "Go to Dashboard" is clicked', async () => {
      const { render: renderComponent, navigate } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /go to dashboard/i });
        button.click();
        expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  describe('Error State', () => {
    it('shows error when session_id is missing', async () => {
      const { render: renderComponent } = renderPage(null);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/payment session id not found/i)).toBeInTheDocument();
      });
    });

    it('shows error when enrolment with matching checkout session is not found', async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockResolvedValue([]);

      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/could not find your payment/i)).toBeInTheDocument();
      });
    });

    it('shows error when getEnrolments fails', async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockRejectedValue(
        new Error('API request failed')
      );

      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        const errorElement = screen.queryByText(/api request failed/i);
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('shows specific error when payment status is PENDING', async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockResolvedValue([
        {
          id: 'enrol-123',
          payment: {
            checkoutSessionId: 'cs_test_123',
            status: 'PENDING',
          },
        },
      ] as any);

      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/payment is still being processed/i)).toBeInTheDocument();
      });
    });

    it('shows specific error when payment status is FAILED', async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockResolvedValue([
        {
          id: 'enrol-123',
          payment: {
            checkoutSessionId: 'cs_test_123',
            status: 'FAILED',
          },
        },
      ] as any);

      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        const paymentFailedElement = screen.queryAllByText(/payment failed/i)[0];
        expect(paymentFailedElement).toBeInTheDocument();
      });
    });

    it('shows specific error when payment status is EXPIRED', async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockResolvedValue([
        {
          id: 'enrol-123',
          payment: {
            checkoutSessionId: 'cs_test_123',
            status: 'EXPIRED',
          },
        },
      ] as any);

      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/payment session expired/i)).toBeInTheDocument();
      });
    });

    it('displays "Dashboard" button in error state', async () => {
      const { render: renderComponent } = renderPage(null);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
      });
    });

    it('displays "Try again" button in error state', async () => {
      const { render: renderComponent } = renderPage(null);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('navigates to dashboard on "Dashboard" click', async () => {
      const { render: renderComponent, navigate } = renderPage(null);
      renderComponent();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /dashboard/i });
        button.click();
        expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('navigates to book page on "Try again" click', async () => {
      const { render: renderComponent, navigate } = renderPage(null);
      renderComponent();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /try again/i });
        button.click();
        expect(navigate).toHaveBeenCalledWith('/book', { replace: true });
      });
    });
  });

  describe('Payment Verification', () => {
    it('calls getEnrolments to find matching checkout session', async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockResolvedValue([
        {
          id: 'enrol-123',
          enrolmentDateTime: '2024-11-23T10:00:00Z',
          product: { id: 'prod-123', name: 'HST', fee: { basePrice: 89, currency: 'AUD', country: 'AUS' } },
          payment: {
            checkoutSessionId: 'cs_test_123',
            status: 'COMPLETED',
            amount: 89,
            currency: 'AUD',
          },
        },
      ] as any);

      const { render: renderComponent } = renderPage('cs_test_123');
      renderComponent();

      await waitFor(() => {
        expect(EnrolmentService.getEnrolments).toHaveBeenCalled();
      });
    });

    it('does not call getEnrolments if session_id is missing', async () => {
      const { EnrolmentService } = await import('@services');

      const { render: renderComponent } = renderPage(null);
      renderComponent();

      await waitFor(() => {
        expect(EnrolmentService.getEnrolments).not.toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies max-width container', async () => {
      const { EnrolmentService } = await import('@services');
      vi.mocked(EnrolmentService.getEnrolments).mockResolvedValue([
        {
          id: 'enrol-123',
          enrolmentDateTime: '2024-11-23T10:00:00Z',
          product: { id: 'prod-123', name: 'HST', fee: { basePrice: 89, currency: 'AUD', country: 'AUS' } },
          payment: {
            checkoutSessionId: 'cs_test_123',
            status: 'COMPLETED',
            amount: 89,
            currency: 'AUD',
          },
        },
      ] as any);

      const { render: renderComponent } = renderPage('cs_test_123');
      const { container } = renderComponent();

      await waitFor(() => {
        const maxWidthContainer = container.querySelector('.max-w-\\[420px\\]');
        expect(maxWidthContainer).toBeInTheDocument();
      });
    });
  });
});

