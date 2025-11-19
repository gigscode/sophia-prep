import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-blue-950 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-right gap-3 mb-4">
              <img 
                src="/sophialogo2.png" 
                alt="Sophia Prep" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="text-xl font-bold text-yellow-400">Sophia Prep</h3>
                <p className="text-sm text-blue-300">Divinely Inspired to Reign in Knowledge</p>
              </div>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              Your comprehensive platform for JAMB and WAEC exam preparation. 
              Master your exams with interactive quizzes and study materials.
            </p>
            {/* Social Media Links */}
            <div className="flex gap-3">
              <a 
                href="https://facebook.com/sophiaprep" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:bg-yellow-400 hover:text-blue-900 rounded-full flex items-center justify-center transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/sophiaprep" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:bg-yellow-400 hover:text-blue-900 rounded-full flex items-center justify-center transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com/sophiaprep" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:bg-yellow-400 hover:text-blue-900 rounded-full flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-yellow-400 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/subjects" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Subjects
                </Link>
              </li>
              <li>
                <Link to="/practice" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Practice Mode
                </Link>
              </li>
              <li>
                <Link to="/mock-exams" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Mock Exams
                </Link>
              </li>
              <li>
                <Link to="/study" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Study Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold text-yellow-400 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-blue-200 hover:text-yellow-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-yellow-400 mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-blue-200">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a href="mailto:support@sophiaprep.app" className="hover:text-yellow-400 transition-colors">
                  support@sophiaprep.app
                </a>
              </li>
              <li className="flex items-start gap-2 text-blue-200">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a href="tel:+2348012345678" className="hover:text-yellow-400 transition-colors">
                  +234 801 234 5678
                </a>
              </li>
              <li className="flex items-start gap-2 text-blue-200">
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

