import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}

export function Select({ label, error, options, icon, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[var(--text-secondary)] text-[13px] font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
            {icon}
          </div>
        )}
        <select
          className={`
            w-full h-10 ${icon ? 'pl-10 pr-10' : 'px-3 pr-10'}
            bg-[var(--surface-100)] 
            border border-[var(--surface-400)]
            rounded-[var(--radius-sm)]
            text-[var(--text-primary)]
            transition-all duration-200
            appearance-none
            cursor-pointer
            focus:outline-none focus:border-[var(--brand-teal-medium)] focus:ring-2 focus:ring-[var(--brand-teal-medium)]/20
            ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" 
        />
      </div>
      {error && (
        <span className="text-[var(--error)] text-[12px]">{error}</span>
      )}
    </div>
  );
}
