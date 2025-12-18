
import { BookOpen, BookMarked, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from './SectionHeader';
import { QuickLinkCard } from '../cards/QuickLinkCard';
import { CardSkeleton } from '../ui/CardSkeleton';

export interface QuickLinksSectionProps {
  onExpandClick?: () => void;
  className?: string;
}

/**
 * QuickLinksSection Component
 * 
 * Displays a grid of quick access cards for frequently used features.
 * Includes Study Past Questions and Novels.
 * Uses responsive grid layout: 1 column on mobile, 2 columns on tablet and desktop.
 * 
 * Requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 5.4
 * 
 * @param onExpandClick - Optional handler for section expand action
 * @param className - Additional CSS classes for customization
 * @param isLoading - Whether the section is in loading state
 */
export function QuickLinksSection({
  onExpandClick,
  className = '',
  isLoading = false,
}: QuickLinksSectionProps & { isLoading?: boolean }) {
  const navigate = useNavigate();

  // Quick link data with pastel colors from design system
  const quickLinks = [
    {
      id: 'past-questions',
      title: 'Study Past Questions',
      icon: <BookOpen size={40} />,
      backgroundColor: 'hsl(var(--color-sky-blue))', // Sky blue pastel
      iconColor: 'hsl(var(--color-primary-blue))',
      route: '/practice',
    },
    {
      id: 'novels',
      title: 'Novels',
      icon: <BookMarked size={40} />,
      backgroundColor: 'hsl(var(--color-soft-yellow))', // Soft yellow pastel
      iconColor: 'hsl(var(--color-primary-orange))',
      route: '/novels',
    },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {/* Section Header */}
      <SectionHeader
        title="Quick Links"
        actionIcon={onExpandClick ? <ChevronRight size={24} /> : undefined}
        onActionClick={onExpandClick}
      />

      {/* Quick Link Cards Grid - Responsive: 1 column mobile, 2 columns tablet, 2 columns desktop */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-2
          gap-4
          w-full
        "
      >
        {isLoading
          ? Array.from({ length: 2 }).map((_, index) => (
            <CardSkeleton
              key={index}
              variant="quick-link"
              className="animate-fade-in-up animate-delay-0"
            />
          ))
          : quickLinks.map((link, index) => (
            <QuickLinkCard
              key={link.id}
              title={link.title}
              icon={link.icon}
              backgroundColor={link.backgroundColor}
              iconColor={link.iconColor}
              onClick={() => handleCardClick(link.route)}
              aspectRatio="4:3"
              className={`animate-fade-in-up animate-delay-${index * 50}`}
            />
          ))}
      </div>
    </section>
  );
}

export default QuickLinksSection;
