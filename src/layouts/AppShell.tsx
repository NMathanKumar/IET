/**
 * AppShell - authenticated layout (sidebar, top bar, mobile bottom nav)
 * Persistent layout that wraps protected routes
 * Sidebar and navigation persist across page navigation
 *
 * Navbar shows:
 * - Back link (← Dashboard) on left (for non-Dashboard pages)
 * - Dynamic page title 
 * - Page subtitle
 * - "Purchase a Test →" button (RIGHT)
 * 
 * Page content shows:
 * - Page outlet (main content)
 */

import { Link, NavLink, useLocation, Outlet } from 'react-router-dom';
import AppIcon, { type AppIconName } from '@components/AppIcon';
import { Sidebar } from '@components/Sidebar';

const NAV_ITEMS: { to: string; label: string; icon: AppIconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/results', label: 'My Results', icon: 'results' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/book', label: 'Purchase Test', icon: 'purchase' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'My Dashboard',
  '/results': 'My Results',
  '/practice': 'Practice',
  '/test-prepare': 'Before You Start',
  '/check-in/about': 'Test Check-in',
  '/check-in/identity': 'Test Check-in',
  '/book': 'Purchase Test',
  '/checkout': 'Checkout',
  '/settings': 'Settings',
};

const SUBTITLES: Record<string, string> = {
  '/results': 'Your completed tests and their results will appear here.',
  '/practice': 'Build confidence and get test-ready with free practice activities.',
  '/test-prepare': 'Review requirements and ensure your equipment is ready.',
  '/check-in/about': 'Tell us about yourself to support research and service improvement.',
  '/check-in/identity': 'Upload a clear photo of yourself and a valid identity document.',
  '/book': 'Prove your English. Open your future.',
  '/checkout': 'Complete your purchase to access the test.',
  '/settings': 'Manage your account settings and preferences.',
};

const BACK_LINKS: Record<string, { to: string; text: string }> = {
  '/checkout': { to: '/book', text: '← Back' },
  '/test-prepare': { to: '/practice', text: '← Back to practice' },
  '/check-in/identity': { to: '/check-in/about', text: '← Back to your details' },
};

export default function AppShell() {
  const location = useLocation();
  const pathname = location.pathname;

  // Determine page title
  const pageTitle = TITLES[pathname] ?? 'IDP';
  const subtitle = SUBTITLES[pathname] ?? '';
  const backLink = BACK_LINKS[pathname] || { to: '/dashboard', text: '← Back to Dashboard' };
  
  // Dashboard should not show back link
  const isDashboard = pathname === '/dashboard';

  return (
    <div className="flex min-h-screen bg-[rgb(247,249,250)] md:flex-row flex-col md:pb-0 pb-16">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:pb-0 pb-16 overflow-hidden">
        {/* Top Navbar - shows back link, title, subtitle, and button */}
        <div className="px-4 md:px-[clamp(24px,4vw,56px)] py-5 md:py-6 flex flex-col gap-2">
          {/* Top row: Back link (left), Title (center/left for dashboard), and Purchase button (right) */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {isDashboard && (
                <h1 className="text-[20px] font-black text-ink m-0 leading-tight">
                  {pageTitle}
                </h1>
              )}
              {!isDashboard && (
                <Link
                  to={backLink.to}
                  className="text-[13px] text-slate no-underline font-semibold hover:text-ink transition-colors"
                >
                  {backLink.text}
                </Link>
              )}
            </div>
            <Link
              to="/book"
              className="px-4 py-2 rounded-lg bg-brand-primary text-white text-[12px] font-black no-underline whitespace-nowrap hover:opacity-90 transition-opacity flex-shrink-0"
            >
              Purchase a Test →
            </Link>
          </div>

          {/* Bottom row: Title and subtitle (for non-Dashboard pages) */}
          {!isDashboard && (
            <div>
              <h1 className="text-[20px] font-black text-ink m-0 leading-tight">
                {pageTitle}
              </h1>
              {subtitle && (
                <p className="text-[14px] text-slate mt-1 m-0">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Page Content Area */}
        <div className="flex-1 overflow-auto md:px-[clamp(24px,4vw,56px)] md:py-2 px-4 py-1 min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-subtle shadow-[0_-8px_24px_rgba(35,45,63,0.07)] z-[100] md:hidden flex flex-row px-0 py-[6px]">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-[3px] no-underline px-1 py-1.5 flex-1 ${
                isActive ? 'text-brand-primary' : 'text-slate'
              }`
            }
          >
            <span className="inline-flex items-center justify-center w-[30px] h-[30px] flex-shrink-0 rounded-lg">
              <AppIcon name={icon} size={20} />
            </span>
            <span className="text-[9px] font-bold">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
