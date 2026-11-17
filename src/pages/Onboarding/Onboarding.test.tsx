import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import OnboardingModal from './Onboarding';

// Mock the AppIcon component
vi.mock('@components/AppIcon', () => ({
  default: ({ name, size }: { name: string; size: number }) => (
    <div data-testid={`app-icon-${name}`} data-size={size}>
      {name}
    </div>
  ),
}));

// Mock useAuth hook
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      given_name: 'Test',
      username: 'testuser',
      email: 'test@example.com',
    },
    isLoading: false,
    setAuthenticatedUser: vi.fn(),
  }),
}));

// Mock EnrolmentService
vi.mock('@services', () => ({
  EnrolmentService: {
    getTestTaker: vi.fn().mockResolvedValue({
      givenName: 'John',
      familyName: 'Doe',
      onboarding_seen: false,
    }),
    updateTestTaker: vi.fn().mockResolvedValue({
      givenName: 'John',
      familyName: 'Doe',
      onboarding_seen: true,
    }),
  },
}));

const mockOnExit = vi.fn().mockResolvedValue(undefined);
const mockOnClose = vi.fn();

function renderModal(isOpen = true) {
  return render(
    <BrowserRouter>
      <OnboardingModal
        isOpen={isOpen}
        onClose={mockOnClose}
        onExit={mockOnExit}
      />
    </BrowserRouter>
  );
}

describe('Onboarding Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <BrowserRouter>
          <OnboardingModal isOpen={false} onClose={mockOnClose} onExit={mockOnExit} />
        </BrowserRouter>
      );
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders backdrop with correct attributes', async () => {
      const { container } = renderModal();
      await waitFor(() => {
        const backdrop = container.querySelector('[role="presentation"]');
        expect(backdrop).toBeInTheDocument();
        expect(backdrop).toHaveClass('bg-black/50');
      });
    });

    it('renders close button (X)', async () => {
      renderModal();
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close onboarding');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton.textContent).toBe('✕');
      });
    });

    it('renders welcome message with user name', async () => {
      renderModal();
      await waitFor(() => {
        expect(screen.getByText(/Welcome, John/)).toBeInTheDocument();
      });
    });

    it('renders step indicator "1 of 2"', async () => {
      renderModal();
      await waitFor(() => {
        expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
      });
    });
  });

  describe('Step 1 Content', () => {
    it('displays "Practice skills for free" title on first step', () => {
      renderModal();
      expect(screen.getByText('Practice skills for free')).toBeInTheDocument();
    });

    it('displays step 1 description', () => {
      renderModal();
      expect(
        screen.getByText(/Try short practice tasks for Listening, Reading, Speaking and Writing/)
      ).toBeInTheDocument();
    });

    it('displays step 1 detail with checkmark', () => {
      renderModal();
      expect(screen.getByText(/Practise at your own pace/)).toBeInTheDocument();
    });

    it('renders "Start practising" button for step 1', () => {
      renderModal();
      expect(screen.getByText('Start practising')).toBeInTheDocument();
    });

    it('renders practice icon on step 1', () => {
      renderModal();
      expect(screen.getByTestId('app-icon-practice')).toBeInTheDocument();
    });
  });

  describe('Step Navigation - Next Button', () => {
    it('renders Next button on first step', () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));
      expect(nextButton).toBeInTheDocument();
    });

    it('navigates to step 2 when Next button is clicked', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByText('Buy when you\'re ready')).toBeInTheDocument();
      });
    });

    it('shows purchase icon on second step', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByTestId('app-icon-purchase')).toBeInTheDocument();
      });
    });

    it('hides Next button on last step', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const updatedNextButton = updatedButtons.find((btn) => btn.textContent?.includes('Next'));
        expect(updatedNextButton).toBeUndefined();
      });
    });
  });

  describe('Step Navigation - Back Button', () => {
    it('does not show Back button on first step', () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const backButton = buttons.find((btn) => btn.textContent?.includes('Back'));
      expect(backButton).toBeUndefined();
    });

    it('shows Back button on second step', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const backButton = updatedButtons.find((btn) => btn.textContent?.includes('Back'));
        expect(backButton).toBeInTheDocument();
      });
    });

    it('navigates to step 1 when Back button is clicked', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const backButton = updatedButtons.find((btn) => btn.textContent?.includes('Back'));
        fireEvent.click(backButton!);
      });

      await waitFor(() => {
        expect(screen.getByText('Practice skills for free')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2 Content', () => {
    it('displays "Buy when you\'re ready" title on second step', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByText('Buy when you\'re ready')).toBeInTheDocument();
      });
    });

    it('displays step 2 description', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(
          screen.getByText(/Choose your test, complete your enrolment/)
        ).toBeInTheDocument();
      });
    });

    it('displays step 2 detail', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(
          screen.getByText(/You have 21 days to take the test after purchase/)
        ).toBeInTheDocument();
      });
    });

    it('renders "Purchase a test" button for step 2', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByText('Purchase a test')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Dots', () => {
    it('renders two progress dots', () => {
      renderModal();
      const dots = screen.getAllByRole('button').filter((btn) => {
        const ariaLabel = btn.getAttribute('aria-label');
        return ariaLabel?.includes('Go to step');
      });
      expect(dots.length).toBe(2);
    });

    it('marks first dot as active on step 1', () => {
      renderModal();
      const dots = screen.getAllByRole('button').filter((btn) => {
        const ariaLabel = btn.getAttribute('aria-label');
        return ariaLabel?.includes('Go to step');
      });
      expect(dots[0].getAttribute('aria-current')).toBe('step');
    });

    it('marks second dot as active on step 2', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) => btn.textContent?.includes('Next'));

      fireEvent.click(nextButton!);

      await waitFor(() => {
        const dots = screen.getAllByRole('button').filter((btn) => {
          const ariaLabel = btn.getAttribute('aria-label');
          return ariaLabel?.includes('Go to step');
        });
        expect(dots[1].getAttribute('aria-current')).toBe('step');
      });
    });

    it('navigates to step 2 when second dot is clicked', async () => {
      renderModal();
      const dots = screen.getAllByRole('button').filter((btn) => {
        const ariaLabel = btn.getAttribute('aria-label');
        return ariaLabel?.includes('Go to step');
      });

      fireEvent.click(dots[1]);

      await waitFor(() => {
        expect(screen.getByText('Buy when you\'re ready')).toBeInTheDocument();
      });
    });

    it('navigates to step 1 when first dot is clicked', async () => {
      renderModal();
      const dots = screen.getAllByRole('button').filter((btn) => {
        const ariaLabel = btn.getAttribute('aria-label');
        return ariaLabel?.includes('Go to step');
      });

      // Go to step 2
      fireEvent.click(dots[1]);

      await waitFor(() => {
        expect(screen.getByText('Buy when you\'re ready')).toBeInTheDocument();
      });

      // Go back to step 1
      fireEvent.click(dots[0]);

      await waitFor(() => {
        expect(screen.getByText('Practice skills for free')).toBeInTheDocument();
      });
    });
  });

  describe('Exit Handlers', () => {
    it('calls onExit and onClose when close button is clicked', async () => {
      renderModal();
      const closeButton = screen.getByLabelText('Close onboarding');

      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnExit).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('calls onExit and onClose when Skip button is clicked', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const skipButton = buttons.find((btn) => btn.textContent?.includes('Skip to dashboard'));

      fireEvent.click(skipButton!);

      await waitFor(() => {
        expect(mockOnExit).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('calls onExit with no navigation on Skip', async () => {
      renderModal();
      const buttons = screen.getAllByRole('button');
      const skipButton = buttons.find((btn) => btn.textContent?.includes('Skip to dashboard'));

      fireEvent.click(skipButton!);

      await waitFor(() => {
        expect(mockOnExit).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents multiple exit calls', async () => {
      renderModal();
      const closeButton = screen.getByLabelText('Close onboarding');

      fireEvent.click(closeButton);
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnExit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('closes modal when Escape key is pressed', async () => {
      renderModal();
      const dialog = screen.getByRole('dialog');

      fireEvent.keyDown(dialog, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnExit).toHaveBeenCalled();
      });
    });
  });

  describe('Backdrop Click', () => {
    it('closes modal when backdrop is clicked', async () => {
      const { container } = renderModal();
      const backdrop = container.querySelector('[role="presentation"]');

      fireEvent.click(backdrop!);

      await waitFor(() => {
        expect(mockOnExit).toHaveBeenCalled();
      });
    });
  });

  describe('ARIA Attributes', () => {
    it('has dialog role', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal="true"', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title');
    });

    it('title has correct id', () => {
      renderModal();
      const title = screen.getByText('Practice skills for free').closest('h1');
      expect(title).toHaveAttribute('id', 'onboarding-title');
    });
  });

  describe('Modal State', () => {
    it('does not render when hasExited is true', () => {
      const { container } = render(
        <BrowserRouter>
          <OnboardingModal
            isOpen={true}
            onClose={mockOnClose}
            onExit={mockOnExit}
          />
        </BrowserRouter>
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();

      // Simulate exit by closing
      const closeButton = screen.getByLabelText('Close onboarding');
      fireEvent.click(closeButton);

      // After exit, modal should be hidden
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
  });
});
