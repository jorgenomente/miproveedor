import React from 'react';

interface DSInputFieldProps {
  label: string;
  type?: 'text' | 'tel' | 'email' | 'date';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function DSInputField({ 
  label, 
  type = 'text', 
  placeholder, 
  value = '', 
  onChange,
  required = false,
  disabled = false 
}: DSInputFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[var(--text-secondary)] text-sm">
        {label}
        {required && <span className="text-[var(--status-error)] ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full h-11 px-4 bg-white border border-[var(--surface-300)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal-600)] focus:border-transparent transition-all disabled:bg-[var(--surface-100)] disabled:cursor-not-allowed"
      />
    </div>
  );
}

interface DSTextAreaFieldProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  required?: boolean;
}

export function DSTextAreaField({ 
  label, 
  placeholder, 
  value = '', 
  onChange,
  rows = 3,
  required = false 
}: DSTextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[var(--text-secondary)] text-sm">
        {label}
        {required && <span className="text-[var(--status-error)] ml-1">*</span>}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 bg-white border border-[var(--surface-300)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal-600)] focus:border-transparent transition-all resize-none"
      />
    </div>
  );
}

interface DSSelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function DSSelectField({ 
  label, 
  options, 
  value = '', 
  onChange,
  placeholder = 'Seleccionar...',
  required = false 
}: DSSelectFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[var(--text-secondary)] text-sm">
        {label}
        {required && <span className="text-[var(--status-error)] ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-[var(--surface-300)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal-600)] focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23737373%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-12"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}