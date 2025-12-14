/**
 * FeatureCard Usage Examples
 * 
 * This file demonstrates various ways to use the FeatureCard component
 * according to the modern UI redesign specifications.
 */


import { FeatureCard } from './FeatureCard';

// Example icons (in real usage, these would come from a library like lucide-react)
const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

export function FeatureCardExamples() {
  return (
    <div className="p-8 space-y-8" style={{ backgroundColor: 'hsl(var(--color-bg-page))' }}>
      <h1 className="text-3xl font-bold mb-6">FeatureCard Examples</h1>

      {/* Practice Mode Card - Orange */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Practice Mode Card</h2>
        <div className="max-w-sm">
          <FeatureCard
            title="Practice Mode"
            description="Familiarize yourself with exam questions. See explanations after each answer and time yourself manually."
            icon={<BookIcon />}
            iconBackgroundColor="hsl(var(--color-pastel-peach))"
            backgroundColor="hsl(var(--color-bg-card))"
            onClick={() => console.log('Navigate to Practice Mode')}
            size="large"
          />
        </div>
      </div>

      {/* CBT Quiz Card - Green */}
      <div>
        <h2 className="text-xl font-semibold mb-4">CBT Quiz Card</h2>
        <div className="max-w-sm">
          <FeatureCard
            title="CBT Quiz (Past Questions)"
            description="Timed quiz simulating real JAMB exam conditions. Automatic submission after time elapses."
            icon={<ClipboardIcon />}
            iconBackgroundColor="hsl(var(--color-pastel-mint))"
            backgroundColor="hsl(var(--color-bg-card))"
            onClick={() => console.log('Navigate to CBT Quiz')}
            size="large"
          />
        </div>
      </div>

      {/* Quick Link Cards - Different Sizes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Link Cards (Various Sizes)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            title="Study Hub"
            icon={<BookIcon />}
            iconBackgroundColor="hsl(var(--color-pastel-lavender))"
            onClick={() => console.log('Navigate to Study Hub')}
            size="small"
          />
          <FeatureCard
            title="Video Lessons"
            icon={<BookIcon />}
            iconBackgroundColor="hsl(var(--color-pastel-sky))"
            onClick={() => console.log('Navigate to Videos')}
            size="medium"
          />
          <FeatureCard
            title="Past Questions"
            description="Access comprehensive past questions"
            icon={<ClipboardIcon />}
            iconBackgroundColor="hsl(var(--color-pastel-yellow))"
            onClick={() => console.log('Navigate to Past Questions')}
            size="large"
          />
        </div>
      </div>

      {/* Grid Layout Example */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Grid Layout (2 columns)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <FeatureCard
            title="Practice Mode"
            description="Learn at your own pace"
            icon={<BookIcon />}
            iconBackgroundColor="hsl(var(--color-primary-orange))"
            onClick={() => console.log('Practice')}
          />
          <FeatureCard
            title="CBT Quiz"
            description="Timed exam simulation"
            icon={<ClipboardIcon />}
            iconBackgroundColor="hsl(var(--color-primary-green))"
            onClick={() => console.log('Quiz')}
          />
        </div>
      </div>
    </div>
  );
}

export default FeatureCardExamples;
