import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  variant?: 'underline' | 'contained';
  defaultTab?: string;
}

export function Tabs({ tabs, variant = 'underline', defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  if (variant === 'underline') {
    return (
      <div className="w-full">
        <div className="flex gap-1 border-b border-[var(--surface-400)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2.5 text-[14px] font-medium transition-all duration-200
                relative
                ${activeTab === tab.id 
                  ? 'text-[var(--brand-teal-medium)]' 
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-teal-aqua)] shadow-[var(--glow-teal-subtle)]" />
              )}
            </button>
          ))}
        </div>
        <div className="py-4">
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-1 p-1 bg-[var(--surface-200)] rounded-[var(--radius-md)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-4 py-2 text-[14px] font-medium 
              rounded-[var(--radius-sm)] transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-[var(--surface-100)] text-[var(--text-primary)] shadow-sm shadow-[var(--glow-teal-subtle)]' 
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}