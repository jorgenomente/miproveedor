import React from 'react';

type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'active';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium';
  
  const variantStyles = {
    default: 'bg-[var(--surface-300)] text-[var(--text-primary)]',
    outline: 'bg-transparent border border-[var(--surface-400)] text-[var(--text-primary)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
    error: 'bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20',
    info: 'bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20',
    active: 'bg-[var(--brand-teal-light)]/15 text-[var(--brand-teal-medium)] border border-[var(--brand-teal-light)]/25 shadow-[var(--glow-teal-subtle)]'
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}