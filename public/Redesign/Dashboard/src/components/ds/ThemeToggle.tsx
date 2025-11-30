import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative w-[56px] h-[28px] bg-[#1a2125] rounded-full transition-colors duration-300 hover:bg-[#243035]"
      aria-label="Toggle theme"
    >
      <div
        className={`
          absolute top-[2px] left-[2px] w-[24px] h-[24px] 
          bg-[#1f8a92] rounded-full transition-transform duration-300
          flex items-center justify-center
          ${isDark ? 'translate-x-[28px]' : 'translate-x-0'}
          shadow-[0_0_8px_rgba(31,138,146,0.5)]
        `}
      >
        {isDark ? (
          <Moon size={14} className="text-white" />
        ) : (
          <Sun size={14} className="text-white" />
        )}
      </div>
    </button>
  );
}
