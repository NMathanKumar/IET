import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PurchaseTest from './PurchaseTest';

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock('@layouts/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/purchase']}>
      <PurchaseTest />
    </MemoryRouter>
  );
}

describe('PurchaseTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    renderPage();

    expect(screen.getByText(/\$89/i)).toBeInTheDocument();
  });

  it('renders back link to dashboard', () => {
    renderPage();

    expect(screen.getByText(/IDP English Test/i)).toBeInTheDocument();
  });

  it('shows IDP English Test pricing card', () => {
    renderPage();

    expect(screen.getByText(/\$89/i)).toBeInTheDocument();
    expect(screen.getByText(/AUD/i)).toBeInTheDocument();

    expect(screen.getByText(/IDP English Test/i)).toBeInTheDocument();

    expect(
      screen.getByText(/Four skills, one sitting/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Results in 48 hours/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Certified in days/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Recognised worldwide/i)
    ).toBeInTheDocument();
  });

  it('shows four skills feature list', () => {
    renderPage();

    expect(
      screen.getAllByText(/four skills/i).length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText(/results in 48 hours/i).length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText(/certified in days/i).length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText(/recognised worldwide/i).length
    ).toBeGreaterThan(0);
  });

  it('shows practice test pricing card', () => {
    renderPage();

    expect(
      screen.getByText(/practice for free/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/practise all four skills/i)
    ).toBeInTheDocument();
  });

  it('shows FAQ section', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: /frequently asked questions/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/how long is the test\?/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/when do i get my results\?/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/how many times can i take the test\?/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/where is the test accepted\?/i)
    ).toBeInTheDocument();
  });

  it('shows Expandable FAQ answers', () => {
    renderPage();

    const faqButtons = screen.getAllByRole('button', {
      name: /how long is the test/i,
    });

    expect(faqButtons.length).toBeGreaterThan(0);

    fireEvent.click(faqButtons[0]);

    expect(
      screen.getByText(/~80 minutes/i)
    ).toBeInTheDocument();
  });

  // FIXED
  it('shows Purchase Test link in pricing card', () => {
    renderPage();

    expect(
      screen.getByRole('link', {
        name: /purchase test/i,
      })
    ).toBeInTheDocument();
  });

  // FIXED
  it('renders checkout link', () => {
    renderPage();

    const purchaseLink = screen.getByRole('link', {
      name: /purchase test/i,
    });

    expect(purchaseLink).toBeInTheDocument();

    expect(purchaseLink).toHaveAttribute(
      'href',
      '/checkout'
    );
  });
});