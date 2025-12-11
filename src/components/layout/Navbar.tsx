import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, BookOpen, Target, GraduationCap, HelpCircle, User, ServerCog, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const { user, logout, loading } = useAuth();
  const { navigate, isNavigating } = useNavigation();

  const navLinks = [
    { to: '/help', label: 'Help', icon: HelpCircle },
  ];

  // Add admin link for admin users
  if (user?.isAdmin) {
    console.log('Adding Admin link to navbar for user:', user.email);
    navLinks.push({ to: '/7351/admin', label: 'Admin', icon: ServerCog as any });
  } else if (user) {
    console.log('User is not admin:', user.email, 'isAdmin:', user.isAdmin);
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:opacity-90 transition-all duration-300 transform hover:scale-105"
            disabled={isNavigating}
          >
            <img
              src="/sophialogo2.png"
              alt="Sophia Prep"
              className="w-12 h-12 md:w-12 md:h-12 object-contain drop-shadow-lg"
              loading="lazy"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: '#B78628' }}>Sophia Prep</h1>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 ${active
                    ? 'text-white font-semibold shadow-lg'
                    : 'text-white hover:bg-blue-700 hover:shadow-md'
                    }`}
                  style={active ? { backgroundColor: '#B78628' } : undefined}
                >
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Profile / avatar */}
            <button
              onClick={() => navigate(user ? '/profile' : '/login')}
              disabled={isNavigating || loading}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${isActive('/profile') ? 'text-blue-900 font-semibold shadow-lg' : 'text-white hover:bg-blue-700'
                } ${(isNavigating || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={isActive('/profile') ? { backgroundColor: '#B78628' } : undefined}
            >
              {user ? (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-700 font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
            {user && (
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 animate-in spin-in-90 duration-300" />
            ) : (
              <Menu className="w-6 h-6 animate-in spin-in-90 duration-300" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-700 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-2">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${active
                      ? 'text-white font-semibold shadow-lg'
                      : 'text-white hover:bg-blue-700'
                      }`}
                    style={active ? { backgroundColor: '#B78628', animationDelay: `${index * 50}ms` } : { animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
              {/* Profile / admin link for authenticated users on mobile */}
              <button
                onClick={() => {
                  navigate(user ? '/profile' : '/login');
                  setIsMenuOpen(false);
                }}
                disabled={isNavigating || loading}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 w-full text-left ${isActive('/profile') ? 'text-blue-900 font-semibold shadow-lg' : 'text-white hover:bg-blue-700'
                  } ${(isNavigating || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={isActive('/profile') ? { backgroundColor: '#B78628' } : undefined}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{user ? 'Profile' : 'Login'}</span>
              </button>
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 text-white hover:bg-blue-700 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

