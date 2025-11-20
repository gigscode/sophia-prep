import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={("bg-white rounded-2xl shadow-sm p-6 " + className).trim()}>
      {children}
    </div>
  );
}

export default Card;
