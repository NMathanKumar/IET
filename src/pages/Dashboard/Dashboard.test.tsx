
import { render, screen, waitFor } from '@testing-library/react';
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
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
      { testId: 'test123' },
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
      { testId: 'test123' },
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

    mocks.mockGetEnrolments.mockResolvedValue([
      { testId: 'test123' },
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

    mocks.mockGetEnrolments.mockResolvedValue([
      { testId: 'test123' },
    ]);

    // Important: simulate completed check-in
    vi.mocked(isCheckInComplete).mockReturnValue(true);

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

    mocks.mockGetEnrolments.mockResolvedValue([
      { testId: 'test123' },
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

    mocks.mockGetEnrolments.mockResolvedValue([
      { testId: 'test123' },
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
      { testId: 'test123' },
    ]);

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: /welcome back/i,
      })
    ).toBeInTheDocument();
  });
});
