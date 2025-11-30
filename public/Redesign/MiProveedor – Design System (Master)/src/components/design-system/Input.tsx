import React from 'react';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[var(--text-secondary)] text-[13px] font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full h-10 px-3 ${icon ? 'pl-10' : ''}
            bg-[var(--surface-100)] 
            border border-[var(--surface-400)]
            rounded-[var(--radius-sm)]
            text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)]
            transition-all duration-200
            focus:outline-none focus:border-[var(--brand-teal-medium)] focus:ring-2 focus:ring-[var(--brand-teal-medium)]/20
            ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <span className="text-[var(--error)] text-[12px]">{error}</span>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[var(--text-secondary)] text-[13px] font-medium">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full min-h-[100px] px-3 py-2
          bg-[var(--surface-100)] 
          border border-[var(--surface-400)]
          rounded-[var(--radius-sm)]
          text-[var(--text-primary)]
          placeholder:text-[var(--text-tertiary)]
          transition-all duration-200
          focus:outline-none focus:border-[var(--brand-teal-medium)] focus:ring-2 focus:ring-[var(--brand-teal-medium)]/20
          resize-vertical
          ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-[var(--error)] text-[12px]">{error}</span>
      )}
    </div>
  );
}

export function SearchInput({ className = '', ...props }: Omit<InputProps, 'icon'>) {
  return <Input icon={<Search size={18} />} placeholder="Buscar..." {...props} className={className} />;
}
