import React from 'react';

export interface HeroBannerProps {
  title: string;
  description: string;
  buttonText: string;
  buttonAction: () => void;
  gradientColors: [string, string];
  icon?: React.ReactNode;
}

/**
 * HeroBanner Component
 * 
 * A prominent promotional card at the top of the home screen for showcasing
 * important features, promotions, or calls-to-action.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * @param title - The main heading text for the banner
 * @param description - Descriptive text explaining the feature or promotion
 * @param buttonText - Text displayed on the call-to-action button
 * @param buttonAction - Click handler function for the CTA button
 * @param gradientColors - Tuple of two colors for the gradient background [start, end]
 * @param icon - Optional icon element to display in the banner
 */
export function HeroBanner({
  title,
  description,
  buttonText,
  buttonAction,
  gradientColors,
  icon,
}: HeroBannerProps) {
  const [gradientStart, gradientEnd] = gradientColors;

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-2xl
        shadow-md
        p-6
        transition-shadow
        duration-200
        ease-out
        hover:shadow-lg
      "
      style={{
        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
      }}
      role="region"
      aria-label="Hero banner"
    >
      {/* Content Container */}
      <div className="relative z-10 flex flex-col gap-4">
        {/* Icon (if provided) */}
        {icon && (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm">
            {icon}
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {title}
        </h2>

        {/* Description */}
        <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl">
          {description}
        </p>

        {/* Call-to-Action Button */}
        <div className="mt-2">
          <button
            onClick={buttonAction}
            className="
              button-touch-target
              inline-flex
              items-center
              justify-center
              px-6
              py-3
              text-base
              font-semibold
              text-gray-900
              bg-white
              rounded-lg
              shadow-sm
              transition-all
              duration-200
              ease-out
              hover:shadow-md
              hover:scale-105
              active:scale-98
              focus:outline-none
              focus:ring-2
              focus:ring-white
              focus:ring-offset-2
              focus:ring-offset-transparent
            "
            aria-label={buttonText}
          >
            {buttonText}
          </button>
        </div>
      </div>

      {/* Decorative Background Pattern (optional enhancement) */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export default HeroBanner;
