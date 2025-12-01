# Modern UI Redesign - Design System

This directory contains the design system tokens and utilities for the Sophia Prep modern UI redesign.

## Files

- **design-tokens.css** - All design system tokens (colors, typography, spacing, etc.)
- **animations.css** - Animation utilities and keyframes for micro-interactions

## Usage

### Using Design Tokens

Design tokens are available as CSS custom properties and can be used in your components:

```css
.my-component {
  /* Colors */
  background-color: hsl(var(--color-bg-card));
  color: hsl(var(--color-text-primary));
  
  /* Spacing */
  padding: var(--content-padding);
  margin-bottom: var(--section-spacing);
  
  /* Typography */
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  
  /* Border Radius */
  border-radius: var(--radius-lg);
  
  /* Shadows */
  box-shadow: var(--shadow-md);
  
  /* Transitions */
  transition: all var(--transition-base);
}
```

### Using Tailwind Classes

The design tokens are also integrated into Tailwind CSS. You can use them via utility classes:

```tsx
<div className="bg-primary-blue text-white rounded-lg p-6 shadow-md">
  <h2 className="text-3xl font-bold mb-4">Hello World</h2>
  <p className="text-sm text-text-secondary">Description text</p>
</div>
```

### Color System

**Primary Colors:**
- `primary-blue` - #3B82F6 - Main brand color
- `primary-orange` - #F97316 - Practice Mode
- `primary-green` - #10B981 - CBT Quiz, Success
- `primary-purple` - #8B5CF6 - Creative content

**Pastel Accents:**
- `pastel-mint` - #D1FAE5 - Study materials
- `pastel-peach` - #FED7AA - Warm actions
- `pastel-lavender` - #E9D5FF - Videos
- `pastel-sky` - #DBEAFE - Past questions
- `pastel-yellow` - #FEF3C7 - Events

**Text Colors:**
- `text-primary` - #1E293B - Main text
- `text-secondary` - #64748B - Secondary text
- `text-muted` - #94A3B8 - Muted text

### Typography Scale

```tsx
<h1 className="text-4xl font-bold">Hero Heading</h1>
<h2 className="text-3xl font-bold">Page Heading</h2>
<h3 className="text-2xl font-semibold">Card Title</h3>
<h4 className="text-xl font-semibold">Section Header</h4>
<p className="text-base">Body text</p>
<span className="text-sm">Description</span>
<small className="text-xs">Caption</small>
```

### Spacing System

Based on 4px base unit:

```tsx
<div className="p-4">   {/* 16px padding */}
<div className="mb-6">  {/* 24px margin-bottom */}
<div className="gap-8"> {/* 32px gap */}
```

### Animation Classes

```tsx
{/* Card with hover effect */}
<div className="card-hover animate-fade-in-up animate-delay-0">
  Card content
</div>

{/* Button with press effect */}
<button className="button-press transition-smooth">
  Click me
</button>

{/* Staggered card animations */}
<div className="animate-fade-in-up animate-delay-0">Card 1</div>
<div className="animate-fade-in-up animate-delay-50">Card 2</div>
<div className="animate-fade-in-up animate-delay-100">Card 3</div>
```

### Responsive Design

Use Tailwind's responsive prefixes with the design tokens:

```tsx
<div className="
  p-4 md:p-6 lg:p-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
  gap-4
">
  {/* Responsive layout */}
</div>
```

**Breakpoints:**
- Mobile: 0px - 639px (default)
- Tablet: 640px+ (md:)
- Desktop: 1024px+ (lg:)

### Component Examples

#### Feature Card

```tsx
<div className="
  bg-bg-card
  rounded-lg
  p-6
  shadow-md
  card-hover
  animate-fade-in-up
">
  <div className="
    w-12 h-12
    rounded-full
    bg-pastel-sky
    flex items-center justify-center
    mb-4
  ">
    <Icon className="text-primary-blue" />
  </div>
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-sm text-text-secondary">Card description</p>
</div>
```

#### Hero Banner

```tsx
<div className="
  bg-gradient-to-r from-primary-blue to-primary-purple
  rounded-xl
  p-6
  shadow-lg
  text-white
">
  <h2 className="text-3xl font-bold mb-2">Hero Title</h2>
  <p className="text-base mb-4">Hero description</p>
  <button className="
    bg-white
    text-primary-blue
    px-6 py-3
    rounded-lg
    font-semibold
    button-press
  ">
    Call to Action
  </button>
</div>
```

## Accessibility

- All colors meet WCAG AA contrast standards (4.5:1 minimum)
- Touch targets are minimum 44px × 44px
- Animations respect `prefers-reduced-motion`
- Focus indicators are visible for keyboard navigation

## Best Practices

1. **Use design tokens** instead of hardcoded values
2. **Maintain consistency** by using the spacing scale
3. **Follow the typography hierarchy** for readable content
4. **Use semantic colors** for status indicators
5. **Add animations** for better user feedback
6. **Test responsiveness** at all breakpoints
7. **Ensure accessibility** with proper contrast and touch targets

## References

- Design Document: `.kiro/specs/modern-ui-redesign/design.md`
- Requirements: `.kiro/specs/modern-ui-redesign/requirements.md`
- Tasks: `.kiro/specs/modern-ui-redesign/tasks.md`
