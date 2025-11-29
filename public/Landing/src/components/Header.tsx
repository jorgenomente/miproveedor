import { ArrowRight } from 'lucide-react';
import Isotipo from '../imports/Isotipo';
import ThemeToggle from './ThemeToggle';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from '../lib/themeTokens';

export default function Header() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tokens = isDark ? darkTheme : lightTheme;

  return (
    <header 
      className="sticky top-0 z-50 h-[72px] backdrop-blur-xl relative overflow-visible"
      style={{
        background: isDark 
          ? 'rgba(15,46,46,0.85)'
          : 'rgba(255,255,255,0.85)',
        borderBottom: isDark
          ? '1.5px solid rgba(79,212,228,0.25)'
          : '1.5px solid rgba(255,255,255,0.6)',
        boxShadow: isDark
          ? '0 4px 20px rgba(0,0,0,0.2), 0 0 30px rgba(79,212,228,0.08)'
          : '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      {/* Navigation Glow - Halo suave debajo del nav con animación */}
      <div 
        className="absolute -bottom-4 left-0 right-0 h-8 pointer-events-none" 
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(79,212,228,0.15) 0%, rgba(165,243,252,0.1) 40%, transparent 100%)'
            : 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(79,212,228,0.08) 0%, rgba(165,243,252,0.05) 40%, transparent 100%)',
          filter: 'blur(16px)',
          opacity: isDark ? 0.9 : 0.8,
          animation: 'ambientGlowPulse 8s ease-in-out infinite'
        }}
      ></div>

      {/* Inner gradient highlight */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(79,212,228,0.08) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(165,243,252,0.02) 100%)',
        }}
      ></div>
      
      <div className="max-w-[1240px] mx-auto px-6 h-full relative z-10">
        <div className="flex items-center justify-between h-full">
          {/* Left side - Logo + Brand name */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12">
              <Isotipo />
            </div>
            <span 
              className="text-xl" 
              style={{ 
                fontFamily: 'Poppins, sans-serif', 
                fontWeight: 600,
                color: tokens.text.heading,
              }}
            >
              MiProveedor
            </span>
          </div>
          
          {/* Right side - Theme Toggle + CTA button */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* CTA Button */}
            <div className="relative group">
              {/* Glow respirante alrededor del botón */}
              <div className="absolute -inset-[2px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: isDark
                  ? 'radial-gradient(circle, rgba(79,212,228,0.4) 0%, rgba(165,243,252,0.3) 100%)'
                  : 'radial-gradient(circle, rgba(165,243,252,0.5) 0%, rgba(79,212,228,0.4) 100%)',
                filter: 'blur(8px)'
              }}></div>
              
              <button 
                className="flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-sm transition-all duration-300 relative overflow-hidden hover:scale-105" 
                style={{
                  background: isDark
                    ? 'rgba(79,212,228,0.12)'
                    : 'rgba(255,255,255,0.4)',
                  border: isDark
                    ? '1.5px solid rgba(79,212,228,0.3)'
                    : '1.5px solid rgba(79,212,228,0.25)',
                  boxShadow: isDark
                    ? '0 2px 12px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.25)'
                    : '0 2px 12px rgba(79,212,228,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                  style={{
                    background: isDark
                      ? 'radial-gradient(circle at 50% 50%, rgba(79,212,228,0.25) 0%, transparent 70%)'
                      : 'radial-gradient(circle at 50% 50%, rgba(79,212,228,0.15) 0%, transparent 70%)',
                    boxShadow: isDark
                      ? '0 0 20px rgba(79,212,228,0.4)'
                      : '0 0 20px rgba(79,212,228,0.3)',
                  }}
                ></div>
                <span 
                  className="text-[15px] relative z-10" 
                  style={{ 
                    color: tokens.brand.aquaPrimary,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  Entrar
                </span>
                <ArrowRight 
                  className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform" 
                  style={{ color: tokens.brand.aquaPrimary }} 
                  strokeWidth={2.5} 
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
