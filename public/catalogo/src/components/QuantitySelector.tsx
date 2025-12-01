import React, { useState } from 'react';
import { DSButton } from './DSButton';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  initialValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
}

export function QuantitySelector({ 
  initialValue = 1, 
  min = 1, 
  max = 99,
  onChange 
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialValue);

  const handleDecrease = () => {
    if (quantity > min) {
      const newValue = quantity - 1;
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      const newValue = quantity + 1;
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 bg-[var(--surface-100)] border border-[var(--surface-200)] rounded-xl px-3 py-2">
      <button
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[var(--text-secondary)] hover:text-[var(--brand-teal-600)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)] transition-colors"
        aria-label="Disminuir cantidad"
      >
        <Minus className="w-4 h-4" />
      </button>
      
      <span className="min-w-[32px] text-center text-[var(--text-primary)]">
        {quantity}
      </span>
      
      <button
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[var(--text-secondary)] hover:text-[var(--brand-teal-600)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)] transition-colors"
        aria-label="Aumentar cantidad"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}