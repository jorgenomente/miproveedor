import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[var(--brand-teal-medium)] text-white hover:bg-[#228A94] hover:shadow-[var(--glow-teal-subtle)] active:bg-[var(--brand-teal-deep)] active:shadow-[var(--glow-teal-medium)]',
    secondary: 'bg-[var(--surface-300)] text-[var(--text-primary)] hover:bg-[var(--surface-400)] active:bg-[var(--surface-400)]',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-200)] active:bg-[var(--surface-300)]',
    destructive: 'bg-[var(--error)] text-white hover:opacity-90 active:opacity-80',
    outline: 'bg-transparent text-[var(--brand-teal-medium)] border border-[var(--brand-teal-light)]/30 hover:border-[var(--brand-teal-light)]/50 hover:bg-[var(--brand-teal-light)]/5 active:bg-[var(--brand-teal-light)]/10'
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-4 text-[14px]',
    lg: 'h-12 px-6 text-[15px]'
  };

  const radiusStyles = {
    sm: 'rounded-[var(--radius-sm)]',
    md: 'rounded-[var(--radius-sm)]',
    lg: 'rounded-[var(--radius-md)]'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${radiusStyles[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ 
  icon, 
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props 
}: ButtonProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const baseStyles = 'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[var(--brand-teal-medium)] text-white hover:bg-[#228A94] hover:shadow-[var(--glow-teal-subtle)]',
    secondary: 'bg-[var(--surface-300)] text-[var(--text-primary)] hover:bg-[var(--surface-400)]',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-200)]',
    destructive: 'bg-[var(--error)] text-white hover:opacity-90',
    outline: 'bg-transparent text-[var(--brand-teal-medium)] border border-[var(--brand-teal-light)]/30 hover:border-[var(--brand-teal-light)]/50'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} rounded-[var(--radius-sm)] ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}