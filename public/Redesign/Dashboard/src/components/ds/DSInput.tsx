import React from 'react';

interface DSInputProps {
  placeholder?: string;
  label?: string;
  type?: 'text' | 'email' | 'search';
  icon?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  isDarkMode?: boolean;
}

export function DSInput({
  placeholder,
  label,
  type = 'text',
  icon,
  value,
  onChange,
  className = '',
  isDarkMode = true
}: DSInputProps) {
  // Dark mode tokens
  const darkTokens = {
    background: '#0c0f11',
    border: '#243035',
    borderFocus: '#1f8a92',
    text: '#ffffff',
    placeholder: '#a0a7a9',
  };

  // Light mode tokens
  const lightTokens = {
    background: '#ffffff',
    border: '#e4e4e4',
    borderFocus: '#1f8a92',
    text: '#111111',
    placeholder: '#6a6a6a',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  return (
    <div className={`content-stretch flex flex-col gap-[6px] ${className}`}>
      {label && (
        <label 
          className="font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] text-[13px]"
          style={{ color: tokens.text }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-[12px] top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            w-full h-[40px] rounded-[8px] 
            ${icon ? 'pl-[40px] pr-[12px]' : 'px-[12px]'}
            font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[21px]
            border focus:outline-none
            transition-colors duration-200
          `}
          style={{
            backgroundColor: tokens.background,
            borderColor: tokens.border,
            color: tokens.text,
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = tokens.borderFocus}
          onBlur={(e) => e.currentTarget.style.borderColor = tokens.border}
        />
        <style>{`
          input::placeholder {
            color: ${tokens.placeholder};
          }
        `}</style>
      </div>
    </div>
  );
}