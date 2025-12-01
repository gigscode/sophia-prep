import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, MessageCircle, MoreHorizontal } from 'lucide-react';

/**
 * BottomNavigation Component
 * 
 * Fixed bottom navigation bar with 5 primary navigation items.
 * Implements the modern UI redesign specifications.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, route: '/' },
  { id: 'study', label: 'Study', icon: BookOpen, route: '/study' },
  { id: 'test', label: 'Test', icon: ClipboardList, route: '/quiz' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, route: '/help' },
  { id: 'more', label: 'More', icon: MoreHorizontal, route: '/profile' },
];

export function BottomNavigation() {
  const location = useLocation();

  const isActive = (route: string): boolean => {
    if (route === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(route);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-[1200]"
      style={{
        height: 'var(--bottom-nav-height, 64px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);

          return (
            <Link
              key={item.id}
              to={item.route}
              className={`
                touch-target-interactive
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200 ease-out
                focus-visible-ring
                ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
              `}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative flex flex-col items-center">
                {/* Active indicator dot */}
                {active && (
                  <div
                    className="absolute -top-2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-scale-in"
                    aria-hidden="true"
                  />
                )}

                {/* Icon */}
                <Icon
                  className={`
                    w-6 h-6 transition-all duration-200 ease-out
                    ${active ? 'text-blue-600 scale-110' : 'text-gray-500'}
                  `}
                  aria-hidden="true"
                />

                {/* Label */}
                <span
                  className={`
                    text-xs mt-1 font-medium transition-all duration-200 ease-out
                    ${active ? 'text-blue-600 font-semibold' : 'text-gray-500'}
                  `}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
