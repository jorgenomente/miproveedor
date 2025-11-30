import React from 'react';

interface DSBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  isDarkMode?: boolean;
}

export function DSBadge({ children, variant = 'default', className = '', isDarkMode = true }: DSBadgeProps) {
  const baseClasses = 'box-border content-stretch flex gap-[6px] h-[28px] items-center px-[10px] py-[4px] rounded-[8px]';
  
  const darkVariants = {
    default: 'bg-[#1a2125] text-white',
    outline: 'bg-transparent border border-[#243035] text-white',
    success: 'bg-[rgba(18,178,114,0.1)] border border-[rgba(18,178,114,0.2)] text-[#12b272]',
    warning: 'bg-[rgba(229,161,0,0.1)] border border-[rgba(229,161,0,0.2)] text-[#e5a100]',
    error: 'bg-[rgba(214,69,69,0.1)] border border-[rgba(214,69,69,0.2)] text-[#d64545]',
    info: 'bg-[rgba(37,150,212,0.1)] border border-[rgba(37,150,212,0.2)] text-[#2596d4]'
  };

  const lightVariants = {
    default: 'bg-[#f7f7f7] text-[#111111]',
    outline: 'bg-transparent border border-[#e4e4e4] text-[#111111]',
    success: 'bg-[rgba(18,178,114,0.1)] border border-[rgba(18,178,114,0.2)] text-[#12b272]',
    warning: 'bg-[rgba(229,161,0,0.1)] border border-[rgba(229,161,0,0.2)] text-[#e5a100]',
    error: 'bg-[rgba(214,69,69,0.1)] border border-[rgba(214,69,69,0.2)] text-[#d64545]',
    info: 'bg-[rgba(37,150,212,0.1)] border border-[rgba(37,150,212,0.2)] text-[#2596d4]'
  };

  const variantClasses = isDarkMode ? darkVariants : lightVariants;
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[18px] not-italic text-[12px] text-nowrap whitespace-pre">
        {children}
      </p>
    </div>
  );
}