import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell';

vi.mock('@components/Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

function renderAppShell(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <div>Content</div>
      </AppShell>
    </MemoryRouter>
  );
}

describe('AppShell - Shared top bar (MSP-2715 extended)', () => {
  it('renders a shared page header with back link, title, subtitle, and purchase action', () => {
    renderAppShell('/practice');
    
    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByText(/build confidence and get test-ready with free practice activities/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Back to Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /purchase a test/i })).toBeInTheDocument();
  });

  it('renders H1 title on /settings', () => {
    renderAppShell('/settings');
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('renders H1 title on /dashboard', () => {
    renderAppShell('/dashboard');
    expect(screen.getByRole('heading', { level: 1, name: 'My Dashboard' })).toBeInTheDocument();
  });

  it('renders H1 title on /practice', () => {
    renderAppShell('/practice');
    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument();
  });

  it('renders H1 title on /results', () => {
    renderAppShell('/results');
    expect(screen.getByRole('heading', { level: 1, name: 'My Results' })).toBeInTheDocument();
  });

  it('renders H1 title on /book', () => {
    renderAppShell('/book');
    expect(screen.getByRole('heading', { level: 1, name: 'Purchase Test' })).toBeInTheDocument();
  });

  it('renders H1 title on /test-prepare', () => {
    renderAppShell('/test-prepare');
    expect(screen.getByRole('heading', { level: 1, name: 'Before You Start' })).toBeInTheDocument();
  });

  it('renders H1 title on /check-in/about', () => {
    renderAppShell('/check-in/about');
    expect(screen.getByRole('heading', { level: 1, name: 'Test Check-in' })).toBeInTheDocument();
  });

  it('renders H1 title on /check-in/identity', () => {
    renderAppShell('/check-in/identity');
    expect(screen.getByRole('heading', { level: 1, name: 'Test Check-in' })).toBeInTheDocument();
  });

  it('renders the Purchase a Test action link on every route', () => {
    const routes = [
      '/dashboard',
      '/practice',
      '/results',
      '/settings',
      '/book',
      '/test-prepare',
      '/check-in/about',
    ];
    for (const path of routes) {
      const { unmount } = renderAppShell(path);
      expect(
        screen.getByRole('link', { name: /purchase a test/i }),
        `Purchase a Test link missing on ${path}`
      ).toBeInTheDocument();
      unmount();
    }
  });
});
