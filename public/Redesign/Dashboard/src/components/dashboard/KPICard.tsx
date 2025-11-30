import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  isDarkMode?: boolean;
}

export function KPICard({ title, value, change, changeType, icon: Icon, isDarkMode = true }: KPICardProps) {
  const changeColors = {
    positive: '#12b272',
    negative: '#d64545',
    neutral: isDarkMode ? '#a0a7a9' : '#6a6a6a'
  };

  const darkTokens = {
    background: '#0c0f11',
    border: '#243035',
    iconBackground: '#1a2125',
    iconColor: '#36aab4',
    titleColor: '#d4d8d9',
    valueColor: '#ffffff',
    subtextColor: '#a0a7a9',
  };

  const lightTokens = {
    background: '#ffffff',
    border: '#e4e4e4',
    iconBackground: '#f7f7f7',
    iconColor: '#36aab4',
    titleColor: '#6a6a6a',
    valueColor: '#111111',
    subtextColor: '#6a6a6a',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  return (
    <div 
      className="border rounded-[16px] px-[20px] py-[24px] relative shadow-[0px_4px_12px_rgba(0,0,0,0.08)]"
      style={{
        backgroundColor: tokens.background,
        borderColor: tokens.border,
      }}
    >
      {/* Icon */}
      <div 
        className="w-[48px] h-[48px] rounded-[12px] flex items-center justify-center mb-[16px]"
        style={{ backgroundColor: tokens.iconBackground }}
      >
        <Icon size={24} style={{ color: tokens.iconColor }} />
      </div>

      {/* Title */}
      <p 
        className="font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[19.5px] mb-[8px]"
        style={{ color: tokens.titleColor }}
      >
        {title}
      </p>

      {/* Value */}
      <h3 
        className="font-['Inter:Bold',sans-serif] font-bold text-[32px] leading-[38.4px] mb-[8px] tracking-[-0.5px]"
        style={{ color: tokens.valueColor }}
      >
        {value}
      </h3>

      {/* Change */}
      <div className="flex items-center gap-[6px]">
        <span 
          className="font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[19.5px]"
          style={{ color: changeColors[changeType] }}
        >
          {change}
        </span>
        <span 
          className="font-['Inter:Regular',sans-serif] text-[12px] leading-[18px]"
          style={{ color: tokens.subtextColor }}
        >
          vs mes anterior
        </span>
      </div>
    </div>
  );
}