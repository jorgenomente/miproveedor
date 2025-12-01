import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-ui)] border border-[var(--surface-border)] hover:border-[var(--surface-border-hover)] transition-all"
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
          <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">Modo oscuro</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
          <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">Modo claro</span>
        </>
      )}
    </button>
  );
}