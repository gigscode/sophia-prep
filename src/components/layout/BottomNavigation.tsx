import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, Layers, MoreHorizontal } from 'lucide-react';
import { generateAriaLabel } from '../../utils/accessibility';

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
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    route: '/',
    description: 'Go to home page with quiz modes and quick links'
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: BookOpen,
    route: '/practice',
    description: 'Practice questions by subject and topic'
  },
  {
    id: 'quiz',
    label: 'CBT Exam',
    icon: ClipboardList,
    route: '/jamb-exam',
    description: 'Take JAMB CBT exam simulation'
  },
  {
    id: 'study',
    label: 'Study',
    icon: Layers,
    route: '/study',
    description: 'Access study materials and learning resources'
  },
  // {
  //   id: 'more',
  //   label: 'More',
  //   icon: MoreHorizontal,
  //   route: '/more',
  //   description: 'Access profile and additional options'
  // },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (route: string): boolean => {
    if (route === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(route);
  };

  const handleNavigation = (route: string) => {
    // Direct navigation without delays
    navigate(route);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-[1200] safe-area-inset-bottom"
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
            <button
              key={item.id}
              onClick={() => handleNavigation(item.route)}
              className={`
                touch-target-interactive
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200 ease-out
                focus-visible-ring
                interactive-element
                ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
              `}
              aria-label={generateAriaLabel(item.label, item.description)}
              aria-current={active ? 'page' : undefined}
              aria-describedby={`nav-item-${item.id}-description`}
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

                {/* Hidden description for screen readers */}
                <span
                  id={`nav-item-${item.id}-description`}
                  className="sr-only"
                >
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live region for navigation announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="navigation-announcements"
      />
    </nav>
  );
}
