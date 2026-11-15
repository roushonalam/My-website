import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from './Logo';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/study-hub', label: 'AI Study Hub', end: false },
  { to: '/quiz', label: 'Smart Quiz', end: false },
  { to: '/tutor', label: 'Live Tutor', end: false },
  { to: '/settings', label: 'Settings', end: false },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Brand mark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg py-0.5 text-[#1E1B4B] transition-opacity hover:opacity-90"
        >
          <Logo size={32} />
          <span className="text-lg font-bold tracking-tight">EduGenius AI</span>
        </Link>

        {/* Zone 2: Desktop navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 border-b-2 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[#4338CA] text-[#4338CA]'
                    : 'border-transparent text-slate-600 hover:text-[#1E1B4B]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Primary CTA + Mobile menu button */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/study-hub"
            className="hidden whitespace-nowrap shrink-0 rounded-xl bg-[#4338CA] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3730A3] sm:inline-flex"
          >
            Try AI Free
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#1E1B4B] transition-colors hover:bg-slate-50 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#4338CA]/10 text-[#4338CA]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#1E1B4B]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/study-hub"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl bg-[#4338CA] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3]"
            >
              Try AI Free
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
