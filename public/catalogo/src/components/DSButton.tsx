import React from 'react';

interface DSButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DSButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  className = '' 
}: DSButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 rounded-xl'
  };

  const variantClasses = {
    primary: 'bg-[var(--brand-teal-medium)] text-white hover:bg-[var(--brand-teal-light)] active:bg-[var(--brand-teal-deep)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] active:bg-[var(--surface-ui)]',
    outline: 'bg-transparent text-[var(--brand-teal-medium)] border-2 border-[var(--brand-teal-medium)] hover:bg-[var(--surface-subtle)]',
    secondary: 'bg-[var(--surface-ui)] text-[var(--text-primary)] hover:bg-[var(--surface-border)] active:bg-[var(--surface-border-hover)]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}