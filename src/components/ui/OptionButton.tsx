import React from 'react';

export function OptionButton({ optionKey, text, selected, onSelect, disabled = false }: { optionKey: string; text: string; selected?: boolean; onSelect: (k: string) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onSelect(optionKey)}
      aria-pressed={selected}
      className={`w-full text-left p-4 border rounded-lg flex items-start gap-3 transition-shadow ${selected ? 'border-blue-600 shadow-sm bg-blue-50' : 'border-gray-200 bg-white hover:shadow-sm'}`}
      disabled={disabled}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-sm font-semibold">{optionKey}</div>
      <div className="text-sm">{text}</div>
    </button>
  );
}

export default OptionButton;
