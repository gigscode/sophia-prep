import React from 'react';

export function ProgressBar({ value = 0, max = 100, className = '' }: { value?: number; max?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className={`w-full bg-gray-100 rounded-full h-2 overflow-hidden ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default ProgressBar;
