import React, { useState } from 'react';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked: controlledChecked, onChange, label, disabled = false }: ToggleProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleChange = () => {
    if (disabled) return;
    const newValue = !checked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <div
        onClick={handleChange}
        className={`
          relative w-11 h-6 rounded-full transition-all duration-200
          ${checked ? 'bg-[var(--brand-teal-medium)] shadow-[var(--glow-teal-subtle)]' : 'bg-[var(--surface-400)]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full 
            transition-transform duration-200 shadow-sm
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      {label && (
        <span className="text-[var(--text-primary)] text-[14px]">{label}</span>
      )}
    </label>
  );
}

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked: controlledChecked, onChange, label, disabled = false }: CheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleChange = () => {
    if (disabled) return;
    const newValue = !checked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <div
        onClick={handleChange}
        className={`
          w-5 h-5 rounded-[4px] border-2 transition-all duration-200
          flex items-center justify-center
          ${checked 
            ? 'bg-[var(--brand-teal-medium)] border-[var(--brand-teal-medium)]' 
            : 'bg-[var(--surface-100)] border-[var(--surface-400)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="text-[var(--text-primary)] text-[14px]">{label}</span>
      )}
    </label>
  );
}

interface RadioProps {
  checked?: boolean;
  onChange?: () => void;
  label?: string;
  name?: string;
  disabled?: boolean;
}

export function Radio({ checked = false, onChange, label, name, disabled = false }: RadioProps) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <div
        onClick={() => !disabled && onChange?.()}
        className={`
          w-5 h-5 rounded-full border-2 transition-all duration-200
          flex items-center justify-center
          ${checked 
            ? 'border-[var(--brand-teal-medium)]' 
            : 'border-[var(--surface-400)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {checked && (
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-teal-medium)]" />
        )}
      </div>
      {label && (
        <span className="text-[var(--text-primary)] text-[14px]">{label}</span>
      )}
    </label>
  );
}