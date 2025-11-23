import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Target, Trophy, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/practice', label: 'Practice', icon: Target },
    { to: '/study', label: 'Study', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.filter(i => i.label !== 'Home').map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                active
                  ? 'text-blue-900'
                  : 'text-gray-500 hover:text-blue-700 active:scale-95'
              }`}
            >
              <div className={`relative transition-all duration-300 ${active ? 'transform -translate-y-1' : ''}`}>
                {active && (
                  <div
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 rounded-full shadow-lg animate-in slide-in-from-top duration-300"
                    style={{ background: 'linear-gradient(to right, #B78628, #D4A855)' }}
                  />
                )}
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  active ? 'bg-blue-50 shadow-md' : ''
                }`}>
                  <Icon
                    className={`w-6 h-6 transition-all duration-300 ${
                      active ? 'text-blue-900 scale-110' : 'text-gray-500'
                    }`}
                  />
                </div>
              </div>
              <span
                className={`text-xs mt-0.5 font-medium transition-all duration-300 ${
                  active ? 'text-blue-900 font-semibold' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

