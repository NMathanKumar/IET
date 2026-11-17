/**
 * Sidebar - Reusable authenticated sidebar component
 * Displays logo, navigation, and user profile with centralized data
 * Used across all authenticated pages via AppShell
 * User data is fetched once at app level and cached via UserProfileContext
 */

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useUserProfileContext } from '@context/UserProfileContext';
import AppIcon, { type AppIconName } from '@components/AppIcon';
import idpEnglishTestLogo from '@assets/idp-english-test-logo.png';

const NAV_ITEMS: { to: string; label: string; icon: AppIconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/results', label: 'My Results', icon: 'results' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/book', label: 'Purchase Test', icon: 'purchase' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U'
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useUserProfileContext();

  const { displayName, email } = profile;

  return (
    <aside className="w-[248px] bg-white border-r border-[#e9edf0] flex flex-col flex-shrink-0 sticky top-0 h-screen hidden md:flex">
      {/* Logo */}
      <div className="px-[18px] py-7 border-b border-[#dde2e7]">
        <Link to="/dashboard" className="no-underline">
          <img
            src={idpEnglishTestLogo}
            alt="IDP English Test"
            className="w-full h-auto object-contain block"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-2.5 py-2.5 flex-1">
        <p className="text-[10px] font-bold text-[#55657b] uppercase tracking-[0.1em] px-2 pb-2 m-0">
          Menu
        </p>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-[10px] rounded-lg no-underline text-[13px] font-bold mb-0.5 transition-all duration-150 ${
                isActive
                  ? 'bg-[#fff3ea] text-[#EB7900] border-l-[3px] border-[#EB7900]'
                  : 'text-[#55657b] border-l-[3px] border-transparent'
              }`
            }
          >
            <span className="inline-flex items-center justify-center w-[30px] h-[30px] flex-shrink-0 rounded-lg">
              <AppIcon name={icon} size={18} />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-3.5 border-t border-[#dde2e7] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#eb7900] flex items-center justify-center text-[12px] font-black text-white flex-shrink-0">
          {getInitials(displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-[#232d3f] whitespace-nowrap overflow-hidden text-ellipsis">
            {displayName}
          </div>
          <div className="text-[10px] text-[#55657b] whitespace-nowrap overflow-hidden text-ellipsis">
            {email}
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate('/signin', { replace: true });
          }}
          className="text-[10px] text-[#55657b] font-semibold bg-transparent border-none cursor-pointer p-0 outline-none"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
