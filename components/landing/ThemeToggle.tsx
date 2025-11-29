import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from '@/lib/landing/themeTokens';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const tokens = isDark ? darkTheme : lightTheme;

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        background: isDark 
          ? 'rgba(79,212,228,0.15)'
          : 'rgba(165,243,252,0.2)',
        border: isDark 
          ? '1.5px solid rgba(79,212,228,0.3)'
          : '1.5px solid rgba(255,255,255,0.6)',
        boxShadow: isDark
          ? '0 4px 12px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.25)'
          : '0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
      aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
    >
      {/* Track inner glow */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(79,212,228,0.2) 0%, transparent 60%)'
            : 'linear-gradient(135deg, rgba(165,243,252,0.15) 0%, transparent 60%)',
        }}
      />

      {/* Knob */}
      <div
        className="absolute top-[3px] w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
        style={{
          left: isDark ? 'calc(100% - 27px)' : '3px',
          background: isDark
            ? 'linear-gradient(135deg, #4FD4E4 0%, #3BBFD2 100%)'
            : 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
          boxShadow: isDark
            ? '0 4px 12px rgba(79,212,228,0.4), 0 0 20px rgba(79,212,228,0.3)'
            : '0 4px 12px rgba(8,145,178,0.25), 0 2px 6px rgba(14,116,144,0.15)',
        }}
      >
        {/* Icon */}
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        )}
      </div>

      {/* Decorative icons in track */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun 
          className="w-3 h-3 transition-opacity duration-300" 
          style={{
            opacity: isDark ? 0.2 : 0.4,
            color: isDark ? 'rgba(255,255,255,0.3)' : tokens.brand.aquaPrimary,
          }}
          strokeWidth={2}
        />
        <Moon 
          className="w-3 h-3 transition-opacity duration-300" 
          style={{
            opacity: isDark ? 0.5 : 0.2,
            color: isDark ? tokens.brand.aquaPrimary : 'rgba(0,0,0,0.2)',
          }}
          strokeWidth={2}
        />
      </div>
    </button>
  );
}
