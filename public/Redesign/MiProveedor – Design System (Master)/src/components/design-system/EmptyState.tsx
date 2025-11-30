import React from 'react';
import { Inbox, Search } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-6 p-6 rounded-[var(--radius-lg)] bg-[var(--brand-aqua-soft)]/8 border border-[var(--brand-teal-light)]/10">
        <div className="text-[var(--brand-teal-medium)]">
          {icon || <Inbox size={48} strokeWidth={1.5} />}
        </div>
      </div>
      <h3 className="text-[var(--text-primary)] font-semibold mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--text-tertiary)] text-[14px] mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function SearchEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={<Search size={48} strokeWidth={1.5} />}
      title="No se encontraron resultados"
      description="Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas."
      action={onReset ? { label: 'Limpiar búsqueda', onClick: onReset } : undefined}
    />
  );
}