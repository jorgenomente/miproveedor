import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'elevated' | 'glass';
  className?: string;
}

export function Card({ children, variant = 'base', className = '' }: CardProps) {
  const baseStyles = 'bg-[var(--surface-100)] border rounded-[var(--radius-md)] p-6';
  const variantStyles = {
    base: 'border-[var(--surface-400)]',
    elevated: 'border-[var(--surface-400)] shadow-[var(--shadow-md)]',
    glass: 'border-[var(--glass-border)] backdrop-blur-[var(--glass-blur)] bg-[var(--glass-bg)] shadow-[var(--shadow-sm)]'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'elevated' | 'glass';
}

export function MetricCard({ label, value, change, trend, icon, variant = 'elevated' }: MetricCardProps) {
  const trendColors = {
    up: 'text-[var(--success)]',
    down: 'text-[var(--error)]',
    neutral: 'text-[var(--text-tertiary)]'
  };

  return (
    <Card variant={variant} className={variant === 'glass' ? 'relative ring-1 ring-[var(--brand-teal-light)]/8' : ''}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-tertiary)] text-[13px]">{label}</span>
          <span className="text-[var(--text-primary)] text-[28px] font-semibold">{value}</span>
          {change && trend && (
            <span className={`text-[12px] ${trendColors[trend]}`}>{change}</span>
          )}
        </div>
        {icon && (
          <div className="text-[var(--brand-teal-medium)]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}