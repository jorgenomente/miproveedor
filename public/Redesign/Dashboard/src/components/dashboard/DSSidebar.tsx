import React from 'react';
import { Home, BarChart3, Users, Settings, FileText, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
  isDarkMode?: boolean;
}

function SidebarItem({ icon, label, isActive = false, onClick, isCollapsed = false, isDarkMode = true }: SidebarItemProps) {
  const darkTokens = {
    activeBackground: '#1f8a92',
    activeShadow: '0_0_12px_rgba(31,138,146,0.4)',
    inactiveText: '#d4d8d9',
    hoverBackground: '#1a2125',
  };

  const lightTokens = {
    activeBackground: '#1f8a92',
    activeShadow: '0_0_12px_rgba(31,138,146,0.4)',
    inactiveText: '#6a6a6a',
    hoverBackground: '#f7f7f7',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-[12px] px-[16px] py-[10px] rounded-[8px]
        transition-all duration-200
        ${isActive ? 'text-white' : ''}
      `}
      style={{
        backgroundColor: isActive ? tokens.activeBackground : 'transparent',
        color: isActive ? '#ffffff' : tokens.inactiveText,
        boxShadow: isActive ? tokens.activeShadow : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = tokens.hoverBackground;
          e.currentTarget.style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = tokens.inactiveText;
        }
      }}
    >
      <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
        {icon}
      </div>
      {!isCollapsed && (
        <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px]">
          {label}
        </span>
      )}
    </button>
  );
}

interface DSSidebarProps {
  isDarkMode?: boolean;
}

export function DSSidebar({ isDarkMode = true }: DSSidebarProps) {
  const [activeItem, setActiveItem] = React.useState('Dashboard');
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const darkTokens = {
    background: '#0c0f11',
    border: '#243035',
    text: '#ffffff',
    textSecondary: '#a0a7a9',
    surface: '#1a2125',
    surfaceHover: '#243035',
  };

  const lightTokens = {
    background: '#ffffff',
    border: '#e4e4e4',
    text: '#111111',
    textSecondary: '#6a6a6a',
    surface: '#f7f7f7',
    surfaceHover: '#e4e4e4',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard' },
    { icon: <BarChart3 size={20} />, label: 'Analíticas' },
    { icon: <Package size={20} />, label: 'Productos' },
    { icon: <Users size={20} />, label: 'Clientes' },
    { icon: <FileText size={20} />, label: 'Reportes' },
    { icon: <Settings size={20} />, label: 'Configuración' }
  ];

  return (
    <div 
      className={`h-full border-r flex flex-col transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
      style={{
        backgroundColor: tokens.background,
        borderColor: tokens.border,
      }}
    >
      {/* Logo */}
      <div 
        className="px-[24px] py-[24px] border-b"
        style={{ borderColor: tokens.border }}
      >
        {!isCollapsed ? (
          <>
            <h1 
              className="font-['Inter:Bold',sans-serif] font-bold text-[20px]"
              style={{ color: tokens.text }}
            >
              MiProveedor
            </h1>
            <p 
              className="font-['Inter:Regular',sans-serif] text-[12px] mt-[4px]"
              style={{ color: tokens.textSecondary }}
            >
              Sistema de Gestión
            </p>
          </>
        ) : (
          <div className="w-[32px] h-[32px] bg-[#1f8a92] rounded-[8px] flex items-center justify-center mx-auto">
            <span className="font-['Inter:Bold',sans-serif] text-[14px] text-white">MP</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <div 
        className="px-[16px] py-[16px] border-b"
        style={{ borderColor: tokens.border }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full h-[40px] rounded-[8px] flex items-center justify-center transition-colors"
          style={{ backgroundColor: tokens.surface }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.surfaceHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tokens.surface}
        >
          {isCollapsed ? (
            <ChevronRight size={20} style={{ color: tokens.text }} />
          ) : (
            <ChevronLeft size={20} style={{ color: tokens.text }} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-[16px] py-[24px] flex flex-col gap-[8px]">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={activeItem === item.label}
            onClick={() => setActiveItem(item.label)}
            isCollapsed={isCollapsed}
            isDarkMode={isDarkMode}
          />
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div 
          className="px-[24px] py-[24px] border-t"
          style={{ borderColor: tokens.border }}
        >
          <div className="flex items-center gap-[12px]">
            <div 
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: tokens.surface }}
            >
              <span 
                className="font-['Inter:Medium',sans-serif] text-[14px]"
                style={{ color: tokens.text }}
              >
                AD
              </span>
            </div>
            <div>
              <p 
                className="font-['Inter:Medium',sans-serif] text-[13px]"
                style={{ color: tokens.text }}
              >
                Admin User
              </p>
              <p 
                className="font-['Inter:Regular',sans-serif] text-[11px]"
                style={{ color: tokens.textSecondary }}
              >
                admin@empresa.com
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isCollapsed && (
        <div 
          className="px-[16px] py-[24px] border-t"
          style={{ borderColor: tokens.border }}
        >
          <div 
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: tokens.surface }}
          >
            <span 
              className="font-['Inter:Medium',sans-serif] text-[14px]"
              style={{ color: tokens.text }}
            >
              AD
            </span>
          </div>
        </div>
      )}
    </div>
  );
}