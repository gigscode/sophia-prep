import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, BookOpen, Target, Trophy, GraduationCap, HelpCircle, User, ServerCog } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const { user } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/practice', label: 'Practice', icon: GraduationCap },
    { to: '/mock-exams', label: 'Mock Exams', icon: Target },
    { to: '/study', label: 'Study Hub', icon: BookOpen },
    { to: '/help', label: 'Help', icon: HelpCircle },
  ];

  if (user?.isAdmin) {
    navLinks.push({ to: '/7351/admin', label: 'Admin', icon: ServerCog as any });
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 hover:opacity-90 transition-all duration-300 transform hover:scale-105">
            <img
              src="/sophialogo2.png"
              alt="Sophia Prep"
              className="w-12 h-12 md:w-12 md:h-12 object-contain drop-shadow-lg"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-yellow-400 tracking-tight">Sophia Prep</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    isActive(link.to)
                      ? 'bg-yellow-400 text-blue-900 font-semibold shadow-lg'
                      : 'text-white hover:bg-blue-700 hover:shadow-md'
                  }`}
                >
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Profile / avatar */}
            <Link
              to={user ? '/profile' : '/login'}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                isActive('/profile') ? 'bg-yellow-400 text-blue-900 font-semibold shadow-lg' : 'text-white hover:bg-blue-700'
              }`}
            >
              {user ? (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-700 font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </Link>
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
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      isActive(link.to)
                        ? 'bg-yellow-400 text-blue-900 font-semibold shadow-lg'
                        : 'text-white hover:bg-blue-700'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
              {/* Profile / admin link for authenticated users on mobile */}
              <Link
                to={user ? '/profile' : '/login'}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  isActive('/profile') ? 'bg-yellow-400 text-blue-900 font-semibold shadow-lg' : 'text-white hover:bg-blue-700'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{user ? 'Profile' : 'Login'}</span>
              </Link>
              {user?.isAdmin && (
                <Link
                  to="/7351/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 text-white hover:bg-blue-700"
                >
                  <ServerCog className="w-5 h-5" />
                  <span className="font-medium">Admin</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

