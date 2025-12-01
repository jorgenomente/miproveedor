import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchBar({ 
  placeholder = 'Buscar...', 
  value = '', 
  onChange 
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[var(--surface-300)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal-600)] focus:border-[var(--brand-teal-600)] hover:border-[var(--surface-400)] transition-all"
      />
    </div>
  );
}