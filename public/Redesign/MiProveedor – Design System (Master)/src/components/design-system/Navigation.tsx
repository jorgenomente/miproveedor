import React, { useState } from 'react';
import { Home, Package, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  collapsible?: boolean;
}

export function Sidebar({ items, collapsible = true }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        bg-[var(--surface-100)] border-r border-[var(--surface-400)]
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
        h-screen flex flex-col
      `}
    >
      {/* Logo / Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--surface-400)]">
        {!collapsed && (
          <span className="text-[var(--text-primary)] font-semibold">MiProveedor</span>
        )}
        {collapsible && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-[var(--surface-200)] rounded-[var(--radius-sm)] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]
              transition-all duration-200
              ${item.active 
                ? 'bg-[var(--brand-teal-light)]/12 text-[var(--brand-teal-medium)] shadow-[var(--glow-teal-subtle)]' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-200)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="text-[14px] font-medium truncate">{item.label}</span>
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
}

interface TopbarProps {
  title?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  return (
    <header className="h-16 bg-[var(--surface-100)] border-b border-[var(--surface-400)] px-6 flex items-center justify-between">
      {title && (
        <h1 className="text-[var(--text-primary)] font-semibold">{title}</h1>
      )}
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </header>
  );
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-[13px]">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-[var(--text-tertiary)]">/</span>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-[var(--text-primary)] font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}