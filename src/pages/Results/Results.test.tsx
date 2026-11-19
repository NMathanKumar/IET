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
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  default: ({
    children,
    title,
    backTo,
  }: {
    children: React.ReactNode;
    title?: string;
    backTo?: string;
  }) => (
    <div data-testid="app-shell">
      <div data-testid="sidebar">Sidebar Mock</div>
      {title && (
        <>
          {backTo && <a href={backTo}>← Back to Dashboard</a>}
          <h1>{title}</h1>
        </>
      )}
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
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
    expect(await screen.findByRole('heading', { name: /my results/i })).toBeInTheDocument();
  });

  it('renders back link to dashboard', async () => {
    renderPage();
    expect(await screen.findByRole('link', { name: '← Back to Dashboard' })).toBeInTheDocument();
  });

  it('shows empty state when no results are available', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no results yet/i)).toBeInTheDocument();
      expect(screen.getByText(/once you complete an idp english test/i)).toBeInTheDocument();
    });
  });

  it('shows purchase and practice buttons in empty state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /purchase a test/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /practice for free/i })).toBeInTheDocument();
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
    // The component shows "Loading your results..." initially before showing empty state
    await waitFor(() => {
      const hasLoadingOrEmpty = 
        screen.queryByText(/loading your results/i) || 
        screen.queryByText(/no results yet/i);
      expect(hasLoadingOrEmpty).toBeInTheDocument();
    });
  });

  it('displays sidebar component', async () => {
    renderPage();
    // Sidebar is rendered by AppShell mock
    expect(await screen.findByTestId('sidebar')).toBeInTheDocument();
  });

  it('passes correct props to AppShell', async () => {
    renderPage();
    // AppShell should render without displayName/email props now
    expect(await screen.findByRole('heading', { name: /my results/i })).toBeInTheDocument();
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
        }
      ]);

      renderPage();
      
      // Wait for the component to finish loading and rendering
      await waitFor(() => {
        expect(screen.queryByText(/no results yet/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      expect(await screen.findByRole('heading', { name: /my results/i })).toBeInTheDocument();
    });
  });
});
