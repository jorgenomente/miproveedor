import React from 'react';

interface DSButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isDarkMode?: boolean;
}

export function DSButton({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  onClick,
  className = '',
  isDarkMode = true
}: DSButtonProps) {
  const baseClasses = 'box-border content-stretch flex gap-[8px] items-center justify-center transition-all duration-200';
  
  const darkVariants = {
    primary: 'bg-[#1f8a92] hover:bg-[#36aab4] text-white',
    secondary: 'bg-[#1a2125] hover:bg-[#243035] text-white',
    ghost: 'bg-transparent hover:bg-[#1a2125] text-white',
    destructive: 'bg-[#d64545] hover:bg-[#e66060] text-white'
  };

  const lightVariants = {
    primary: 'bg-[#1f8a92] hover:bg-[#36aab4] text-white',
    secondary: 'bg-[#f7f7f7] hover:bg-[#e4e4e4] text-[#111111]',
    ghost: 'bg-transparent hover:bg-[#f7f7f7] text-[#111111]',
    destructive: 'bg-[#d64545] hover:bg-[#e66060] text-white'
  };

  const variantClasses = isDarkMode ? darkVariants : lightVariants;
  
  const sizeClasses = {
    small: 'h-[32px] px-[12px] py-0 rounded-[8px] text-[13px] leading-[19.5px]',
    medium: 'h-[40px] px-[16px] py-0 rounded-[8px] text-[14px] leading-[21px]',
    large: 'h-[48px] px-[24px] py-0 rounded-[12px] text-[15px] leading-[22.5px]'
  };
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && icon}
      <span className="font-['Inter:Regular',sans-serif] font-normal not-italic whitespace-pre">
        {children}
      </span>
    </button>
  );
}