import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions, icon }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
            <Link
              to="/"
              className="flex items-center gap-1 text-blue-200 transition-colors footer-link"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-blue-400" />
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="text-blue-200 transition-colors footer-link"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Header Content */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="flex-shrink-0 w-16 h-16 text-blue-900 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#B78628' }}>
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-blue-200 max-w-3xl">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

