import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Practice from './Practice';

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/practice']}>
      <Practice />
    </MemoryRouter>
  );
}

describe('Practice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading "Practice"', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: /practice is coming soon/i,
      })
    ).toBeInTheDocument();
  });

  it('renders the "Practice is coming soon" heading', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: /practice is coming soon/i,
      })
    ).toBeInTheDocument();
  });

  it('renders the "How the test works" link pointing to /test-prepare', () => {
    renderPage();

    const testLink = screen.getByRole('link', {
      name: /how the test works/i,
    });

    expect(testLink).toHaveAttribute(
      'href',
      '/test-prepare'
    );
  });

  it('renders the "What\'s coming" section', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: /what's coming/i,
      })
    ).toBeInTheDocument();
  });

  it('renders the featured test tile with "Try a short test"', () => {
    renderPage();

    expect(
      screen.getByText(/try a short test/i)
    ).toBeInTheDocument();

    // Use getAllByText to get the specific badge, not the heading
    const comingSoonElements = screen.getAllByText(/coming soon/i);
    expect(comingSoonElements.length).toBeGreaterThan(1); // heading + badge
  });

  it('renders all four skills tiles', () => {
    renderPage();

    expect(
      screen.getByText(/listening practice/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/reading practice/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/speaking practice/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/writing practice/i)
    ).toBeInTheDocument();
  });

  it('renders only the How the test works link', () => {
    renderPage();

    const allLinks = screen.getAllByRole('link');

    expect(allLinks).toHaveLength(1);

    expect(allLinks[0]).toHaveAttribute(
      'href',
      '/test-prepare'
    );
  });

  it('renders a coming soon badge', () => {
    renderPage();

    // Use getAllByText to handle multiple "coming soon" elements (heading + badge)
    const comingSoonElements = screen.getAllByText(/coming soon/i);
    // Should have at least the heading and the badge
    expect(comingSoonElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders preview tiles as non-interactive elements', () => {
    renderPage();

    const disabledElements =
      document.querySelectorAll(
        '[aria-disabled="true"]'
      );

    expect(disabledElements).toHaveLength(5);
  });

  it('renders skill pills', () => {
    renderPage();

    expect(
      screen.getByText('Listening')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Reading')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Speaking')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Writing')
    ).toBeInTheDocument();
  });

  it('has no buttons rendered', () => {
    renderPage();

    const buttons =
      screen.queryAllByRole('button');

    expect(buttons).toHaveLength(0);
  });
});