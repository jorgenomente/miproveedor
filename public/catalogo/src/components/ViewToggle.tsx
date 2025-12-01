import React from 'react';

interface ViewToggleProps {
  activeView: 'tarjetas' | 'tabla';
  onChange: (view: 'tarjetas' | 'tabla') => void;
}

export function ViewToggle({ activeView, onChange }: ViewToggleProps) {
  const baseClasses = 'px-5 py-2.5 text-sm transition-all cursor-pointer';
  const activeClasses = 'bg-[var(--brand-teal-600)] text-white shadow-[0_2px_8px_rgba(20,184,166,0.25)]';
  const inactiveClasses = 'bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-50)] hover:text-[var(--text-primary)]';

  return (
    <div className="inline-flex items-center gap-1 bg-[var(--surface-100)] rounded-xl p-1 border border-[var(--surface-200)]">
      <button
        onClick={() => onChange('tarjetas')}
        className={`${baseClasses} rounded-lg ${activeView === 'tarjetas' ? activeClasses : inactiveClasses}`}
      >
        Tarjetas
      </button>
      <button
        onClick={() => onChange('tabla')}
        className={`${baseClasses} rounded-lg ${activeView === 'tabla' ? activeClasses : inactiveClasses}`}
      >
        Tabla
      </button>
    </div>
  );
}