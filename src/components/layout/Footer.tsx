import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-blue-950 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
          {/* Brand Section */}
          <div>
            <div className="flex items-right gap-3 mb-4">
              <img
                src="/sophialogo2.png"
                alt="Sophia Prep"
                className="w-12 h-12 object-contain"
                loading="lazy"
              />
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#B78628' }}>Sophia Prep</h3>
                <p className="text-sm text-blue-300">Divinely Inspired to Reign in Knowledge</p>
              </div>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              Your comprehensive platform for JAMB and WAEC exam preparation.
              Master your exams with interactive quizzes and study materials.
            </p>
            {/* Social Media Links */}
            <div className="flex justify-center md:justify-start gap-3">
              <a
                href="https://facebook.com/sophiaprep"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:text-blue-900 rounded-full flex items-center justify-center transition-all"
                style={{ '&:hover': { backgroundColor: '#B78628' } } as any}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B78628'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/sophiaprep"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:text-blue-900 rounded-full flex items-center justify-center transition-all"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B78628'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/sophiaprep"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:text-blue-900 rounded-full flex items-center justify-center transition-all"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B78628'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: '#B78628' }}>Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-blue-200 transition-colors footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/subjects" className="text-blue-200 transition-colors footer-link">
                  Subjects
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-blue-200 transition-colors footer-link">
                  Quiz
                </Link>
              </li>
              <li>
                <Link to="/study" className="text-blue-200 transition-colors footer-link">
                  Study Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: '#B78628' }}>Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-blue-200 transition-colors footer-link">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-blue-200 transition-colors footer-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-blue-200 transition-colors footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-blue-200 transition-colors footer-link">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-blue-200 transition-colors footer-link">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: '#B78628' }}>Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center md:items-start justify-center md:justify-start gap-2 text-blue-200 text-center md:text-left">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a href="mailto:support@sophiaprep.app" className="transition-colors footer-link">
                  support@sophiaprep.app
                </a>
              </li>

              <li className="flex items-center md:items-start justify-center md:justify-start gap-2 text-blue-200 text-center md:text-left">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a href="tel:+2347061735358" className="transition-colors footer-link">
                  +234 706 173 5358
                </a>
              </li>

              <li className="flex items-center md:items-start justify-center md:justify-start gap-2 text-blue-200 text-center md:text-left">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>

          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-blue-300 text-sm text-center md:text-left">
              © {currentYear} Sophia Prep. All rights reserved.
            </p>
            <p className="text-blue-300 text-sm text-center md:text-right">
              Empowering students to excel in JAMB & WAEC examinations
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

