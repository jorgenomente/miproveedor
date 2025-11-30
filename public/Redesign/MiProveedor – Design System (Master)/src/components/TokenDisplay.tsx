import React from 'react';

interface ColorTokenProps {
  name: string;
  value: string;
  description?: string;
}

export function ColorToken({ name, value, description }: ColorTokenProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--surface-100)] border border-[var(--surface-400)] rounded-[var(--radius-sm)]">
      <div
        className="w-12 h-12 rounded-[var(--radius-sm)] border border-[var(--surface-400)] flex-shrink-0"
        style={{ backgroundColor: value }}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-[var(--text-primary)] text-[13px] font-medium truncate">
          {name}
        </span>
        <span className="text-[var(--text-tertiary)] text-[12px] font-mono">
          {value}
        </span>
        {description && (
          <span className="text-[var(--text-tertiary)] text-[11px] mt-0.5">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

interface SpacingTokenProps {
  name: string;
  value: string;
}

export function SpacingToken({ name, value }: SpacingTokenProps) {
  const pixels = parseInt(value);
  
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--surface-100)] border border-[var(--surface-400)] rounded-[var(--radius-sm)]">
      <div className="flex items-center justify-center w-16 h-16 bg-[var(--surface-200)] rounded-[var(--radius-sm)]">
        <div
          className="bg-[var(--brand-teal-medium)]"
          style={{ width: `${pixels}px`, height: `${pixels}px` }}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[var(--text-primary)] text-[13px] font-medium">
          {name}
        </span>
        <span className="text-[var(--text-tertiary)] text-[12px] font-mono">
          {value}
        </span>
      </div>
    </div>
  );
}

interface RadiusTokenProps {
  name: string;
  value: string;
}

export function RadiusToken({ name, value }: RadiusTokenProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--surface-100)] border border-[var(--surface-400)] rounded-[var(--radius-sm)]">
      <div className="flex items-center justify-center w-16 h-16 bg-[var(--surface-200)] rounded-[var(--radius-sm)]">
        <div
          className="w-12 h-12 bg-[var(--brand-teal-medium)]"
          style={{ borderRadius: value }}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[var(--text-primary)] text-[13px] font-medium">
          {name}
        </span>
        <span className="text-[var(--text-tertiary)] text-[12px] font-mono">
          {value}
        </span>
      </div>
    </div>
  );
}

interface ShadowTokenProps {
  name: string;
  value: string;
}

export function ShadowToken({ name, value }: ShadowTokenProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--surface-100)] border border-[var(--surface-400)] rounded-[var(--radius-sm)]">
      <div className="flex items-center justify-center w-16 h-16 bg-[var(--surface-200)] rounded-[var(--radius-sm)]">
        <div
          className="w-10 h-10 bg-[var(--surface-100)] rounded-[var(--radius-sm)]"
          style={{ boxShadow: value }}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[var(--text-primary)] text-[13px] font-medium">
          {name}
        </span>
        <span className="text-[var(--text-tertiary)] text-[11px] font-mono truncate max-w-[200px]">
          {value}
        </span>
      </div>
    </div>
  );
}

interface TypographyTokenProps {
  level: string;
  example: string;
}

export function TypographyToken({ level, example }: TypographyTokenProps) {
  const Element = level.toLowerCase() as keyof JSX.IntrinsicElements;
  
  return (
    <div className="p-4 bg-[var(--surface-100)] border border-[var(--surface-400)] rounded-[var(--radius-sm)]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[var(--text-tertiary)] text-[12px] font-medium">
          {level}
        </span>
      </div>
      {React.createElement(Element, { 
        className: 'text-[var(--text-primary)]' 
      }, example)}
    </div>
  );
}
