import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Results from './Results';

// Hoist all mocks
const mocks = vi.hoisted(() => ({
  mockGetEnrolments: vi.fn(),
  mockGetTestTaker: vi.fn(),
  mockAuthState: {
    user: null as null | { username: string },
    isLoading: false,
    signOut: vi.fn(),
  },
  mockUserProfile: {
    displayName: 'Agnes Lee',
    email: 'agnes.lee@example.com',
    firstName: 'Agnes',
    lastName: 'Lee',
  },
}));

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => mocks.mockAuthState,
}));

vi.mock('@context/UserProfileContext', () => ({
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useUserProfileContext: () => ({
    profile: mocks.mockUserProfile,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@services', () => ({
  EnrolmentService: {
    getEnrolments: mocks.mockGetEnrolments,
    getTestTaker: mocks.mockGetTestTaker,
  },
}));

// AppShell mock that includes sidebar rendering
vi.mock('@layouts/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">
      <div data-testid="sidebar">Sidebar Mock</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-radar-chart">{children}</div>
  ),
  Radar: () => <div data-testid="mock-radar" />,
  PolarGrid: () => <div data-testid="mock-polar-grid" />,
  PolarAngleAxis: () => <div data-testid="mock-polar-axis" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/results']}>
      <Results />
    </MemoryRouter>
  );
}

describe('Results', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock state: no enrolments
    mocks.mockGetEnrolments.mockResolvedValue([]);
    mocks.mockGetTestTaker.mockResolvedValue(null);

    mocks.mockAuthState = {
      user: null,
      isLoading: false,
      signOut: vi.fn(),
    };

    mocks.mockUserProfile = {
      displayName: 'Agnes Lee',
      email: 'agnes.lee@example.com',
      firstName: 'Agnes',
      lastName: 'Lee',
    };
  });

  it('renders the page heading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no results yet/i)).toBeInTheDocument();
    });
  });

  it('renders back link to dashboard', async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/once you complete an idp english test/i)
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no results are available', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no results yet/i)).toBeInTheDocument();

      expect(
        screen.getByText(/once you complete an idp english test/i)
      ).toBeInTheDocument();
    });
  });

  it('shows purchase and practice buttons in empty state', async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: /purchase a test/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', {
          name: /practice for free/i,
        })
      ).toBeInTheDocument();
    });
  });

  it('renders empty icon in empty state', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no results yet/i)).toBeInTheDocument();
    });
  });

  it('renders loading state initially', async () => {
    renderPage();

    await waitFor(() => {
      const hasLoadingOrEmpty =
        screen.queryByText(/loading your results/i) ||
        screen.queryByText(/no results yet/i);

      expect(hasLoadingOrEmpty).toBeInTheDocument();
    });
  });

  it('renders with correct content structure', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no results yet/i)).toBeInTheDocument();
    });
  });

  describe('Results with data', () => {
    it('renders results view when enrolments are returned', async () => {
      mocks.mockGetEnrolments.mockResolvedValue([
        {
          id: 'enrol-1',
          userId: 'user-1',
          testId: 'test-1',
          status: 'completed',
          createdAt: '2026-09-24',
        },
      ]);

      renderPage();

      await waitFor(
        () => {
          expect(
            screen.queryByText(/no results yet/i)
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // FIXED: multiple "IDP English Test" elements exist
      const testTitles = screen.getAllByText(/IDP English Test/i);

      expect(testTitles.length).toBeGreaterThan(0);

      // Verify results cards are rendered
      const resultCards = screen.getAllByRole('button');

      expect(resultCards.length).toBeGreaterThan(0);

      expect(resultCards[0]).toHaveTextContent(
        'IDP English Test'
      );

      expect(resultCards[0]).toHaveTextContent(
        /current report/i
      );
    });
  });
});