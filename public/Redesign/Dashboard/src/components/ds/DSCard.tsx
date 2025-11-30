import React from 'react';

interface DSCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass-lite';
  className?: string;
  isDarkMode?: boolean;
}

export function DSCard({ children, variant = 'default', className = '', isDarkMode = true }: DSCardProps) {
  const darkTokens = {
    background: '#0c0f11',
    border: '#243035',
    glassBackground: 'rgba(12,15,17,0.8)',
  };

  const lightTokens = {
    background: '#ffffff',
    border: '#e4e4e4',
    glassBackground: 'rgba(255,255,255,0.8)',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;
  
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: variant === 'glass-lite' ? tokens.glassBackground : tokens.background,
      borderColor: tokens.border,
    };
    return baseStyle;
  };

  const variantClasses = {
    default: 'border rounded-[12px] relative',
    elevated: 'border rounded-[12px] relative shadow-[0px_4px_12px_rgba(0,0,0,0.08)]',
    'glass-lite': 'border rounded-[12px] relative backdrop-blur-sm'
  };
  
  return (
    <div 
      className={`${variantClasses[variant]} ${className}`}
      style={getCardStyle()}
    >
      <div className="box-border p-[24px] size-full">
        {children}
      </div>
    </div>
  );
}