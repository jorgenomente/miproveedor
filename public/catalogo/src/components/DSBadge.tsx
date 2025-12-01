import React from 'react';

interface DSBadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'teal' | 'aqua' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function DSBadge({ children, variant = 'neutral', size = 'md', className = '' }: DSBadgeProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-full transition-all';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const variantClasses = {
    brand: 'bg-[var(--brand-teal-100)] text-[var(--brand-teal-700)] border border-[var(--brand-teal-200)]',
    teal: 'bg-[var(--brand-teal-600)] text-white',
    aqua: 'bg-[var(--brand-aqua-100)] text-[var(--brand-aqua-700)] border border-[var(--brand-aqua-200)]',
    success: 'bg-green-100 text-green-700 border border-green-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    error: 'bg-red-100 text-red-700 border border-red-200',
    neutral: 'bg-[var(--surface-100)] text-[var(--text-secondary)] border border-[var(--surface-200)]',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--surface-300)]'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
