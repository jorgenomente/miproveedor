import React from 'react';

interface DSTableRowProps {
  children: React.ReactNode;
  isDarkMode?: boolean;
  isHeader?: boolean;
  className?: string;
}

export function DSTableRow({ 
  children, 
  isDarkMode = true, 
  isHeader = false,
  className = '' 
}: DSTableRowProps) {
  const darkTokens = {
    background: isHeader ? '#0c0f11' : 'transparent',
    hoverBackground: '#13181b',
    borderColor: '#243035',
  };

  const lightTokens = {
    background: isHeader ? '#f7f7f7' : 'transparent',
    hoverBackground: '#f7f7f7',
    borderColor: '#e4e4e4',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={`flex items-center px-[24px] py-[20px] transition-colors ${className}`}
      style={{
        backgroundColor: isHeader 
          ? tokens.background 
          : isHovered && !isHeader 
            ? tokens.hoverBackground 
            : 'transparent',
        borderBottom: `1px solid ${tokens.borderColor}`,
      }}
      onMouseEnter={() => !isHeader && setIsHovered(true)}
      onMouseLeave={() => !isHeader && setIsHovered(false)}
    >
      {children}
    </div>
  );
}
