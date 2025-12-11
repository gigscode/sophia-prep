
import { QuickLinkCard } from './QuickLinkCard';
import { BookOpen, Video, BookMarked, GraduationCap } from 'lucide-react';

/**
 * QuickLinkCard Examples
 * 
 * Demonstrates the QuickLinkCard component with different pastel colors
 * and icons for various quick access features.
 */

export function QuickLinkCardExamples() {
  const handleClick = (feature: string) => {
    console.log(`Navigating to ${feature}`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        QuickLinkCard Examples
      </h1>

      {/* Square Cards (1:1 aspect ratio) */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Square Cards (1:1)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
          <QuickLinkCard
            title="Study Past Questions"
            icon={<BookOpen size={40} />}
            backgroundColor="hsl(var(--color-pastel-sky))"
            iconColor="hsl(var(--color-primary-blue))"
            onClick={() => handleClick('Past Questions')}
            aspectRatio="1:1"
          />

          <QuickLinkCard
            title="Video Lessons"
            icon={<Video size={40} />}
            backgroundColor="hsl(var(--color-pastel-lavender))"
            iconColor="hsl(var(--color-primary-purple))"
            onClick={() => handleClick('Video Lessons')}
            aspectRatio="1:1"
          />

          <QuickLinkCard
            title="Novels"
            icon={<BookMarked size={40} />}
            backgroundColor="hsl(var(--color-pastel-yellow))"
            iconColor="hsl(var(--color-primary-orange))"
            onClick={() => handleClick('Novels')}
            aspectRatio="1:1"
          />

          <QuickLinkCard
            title="Study Hub"
            icon={<GraduationCap size={40} />}
            backgroundColor="hsl(var(--color-pastel-mint))"
            iconColor="hsl(var(--color-primary-green))"
            onClick={() => handleClick('Study Hub')}
            aspectRatio="1:1"
          />
        </div>
      </section>

      {/* Rectangular Cards (4:3 aspect ratio) */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Rectangular Cards (4:3)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <QuickLinkCard
            title="Study Past Questions"
            icon={<BookOpen size={40} />}
            backgroundColor="hsl(var(--color-pastel-sky))"
            iconColor="hsl(var(--color-primary-blue))"
            onClick={() => handleClick('Past Questions')}
            aspectRatio="4:3"
          />

          <QuickLinkCard
            title="Video Lessons"
            icon={<Video size={40} />}
            backgroundColor="hsl(var(--color-pastel-lavender))"
            iconColor="hsl(var(--color-primary-purple))"
            onClick={() => handleClick('Video Lessons')}
            aspectRatio="4:3"
          />
        </div>
      </section>

      {/* All Pastel Colors */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          All Pastel Colors
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl">
          <QuickLinkCard
            title="Mint Green"
            icon={<BookOpen size={32} />}
            backgroundColor="hsl(var(--color-pastel-mint))"
            iconColor="hsl(var(--color-primary-green))"
            onClick={() => handleClick('Mint')}
          />

          <QuickLinkCard
            title="Peach"
            icon={<Video size={32} />}
            backgroundColor="hsl(var(--color-pastel-peach))"
            iconColor="hsl(var(--color-primary-orange))"
            onClick={() => handleClick('Peach')}
          />

          <QuickLinkCard
            title="Lavender"
            icon={<BookMarked size={32} />}
            backgroundColor="hsl(var(--color-pastel-lavender))"
            iconColor="hsl(var(--color-primary-purple))"
            onClick={() => handleClick('Lavender')}
          />

          <QuickLinkCard
            title="Sky Blue"
            icon={<GraduationCap size={32} />}
            backgroundColor="hsl(var(--color-pastel-sky))"
            iconColor="hsl(var(--color-primary-blue))"
            onClick={() => handleClick('Sky')}
          />

          <QuickLinkCard
            title="Soft Yellow"
            icon={<BookOpen size={32} />}
            backgroundColor="hsl(var(--color-pastel-yellow))"
            iconColor="hsl(var(--color-primary-orange))"
            onClick={() => handleClick('Yellow')}
          />
        </div>
      </section>
    </div>
  );
}

export default QuickLinkCardExamples;
