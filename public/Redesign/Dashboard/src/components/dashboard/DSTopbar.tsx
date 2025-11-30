import React from 'react';
import { Search, Bell } from 'lucide-react';
import { DSInput } from '../ds/DSInput';

interface DSTopbarProps {
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export function DSTopbar({ isDarkMode = true, onToggleTheme }: DSTopbarProps) {
  // Dark mode tokens
  const darkTokens = {
    background: '#0c0f11',
    border: '#243035',
    text: '#ffffff',
    textSecondary: '#a0a7a9',
    surface: '#1a2125',
    surfaceHover: '#243035',
  };

  // Light mode tokens
  const lightTokens = {
    background: '#ffffff',
    border: '#e4e4e4',
    text: '#111111',
    textSecondary: '#6a6a6a',
    surface: '#f7f7f7',
    surfaceHover: '#e4e4e4',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  return (
    <div 
      className="h-[72px] w-full border-b flex items-center justify-between px-[32px]"
      style={{
        backgroundColor: tokens.background,
        borderColor: tokens.border,
      }}
    >
      {/* Left: Greeting */}
      <div>
        <h2 
          className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[20px]"
          style={{ color: tokens.text }}
        >
          Bienvenido de vuelta
        </h2>
        <p 
          className="font-['Inter:Regular',sans-serif] text-[13px]"
          style={{ color: tokens.textSecondary }}
        >
          Aquí tienes un resumen de tu negocio hoy
        </p>
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-[16px]">
        <DSInput
          type="search"
          placeholder="Buscar..."
          icon={<Search size={16} style={{ color: tokens.textSecondary }} />}
          className="w-[320px]"
          isDarkMode={isDarkMode}
        />
        
        {/* Official DS Toggle Component */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-[12px]"
        >
          <span 
            className="font-['Inter:Regular',sans-serif] text-[14px]"
            style={{ color: tokens.text }}
          >
            Modo oscuro
          </span>
          <div
            className={`
              relative h-[24px] w-[44px] rounded-[1.67772e+07px] transition-all duration-200
              ${isDarkMode ? 'shadow-[0_0_12px_rgba(31,138,146,0.4)]' : ''}
            `}
            style={{
              backgroundColor: isDarkMode ? '#1f8a92' : '#243035'
            }}
          >
            <div
              className={`
                absolute top-[2px] h-[20px] w-[20px] rounded-[1.67772e+07px] bg-white
                shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]
                transition-transform duration-200
                ${isDarkMode ? 'translate-x-[22px]' : 'translate-x-[2px]'}
              `}
            />
          </div>
        </button>

        <div className="relative">
          <button 
            className="w-[40px] h-[40px] rounded-[8px] flex items-center justify-center transition-colors"
            style={{
              backgroundColor: tokens.surface,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.surfaceHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tokens.surface}
          >
            <Bell size={18} style={{ color: tokens.text }} />
          </button>
          <div className="absolute top-[8px] right-[8px] w-[8px] h-[8px] bg-[#d64545] rounded-full" />
        </div>
      </div>
    </div>
  );
}