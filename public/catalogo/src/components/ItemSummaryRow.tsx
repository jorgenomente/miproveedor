import React from 'react';
import { X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ItemSummaryRowProps {
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string;
  onRemove?: () => void;
}

export function ItemSummaryRow({ 
  productName, 
  quantity, 
  price, 
  imageUrl, 
  onRemove 
}: ItemSummaryRowProps) {
  const subtotal = quantity * price;

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--surface-200)] hover:border-[var(--surface-300)] transition-all group min-w-0">
      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--surface-100)] border border-[var(--surface-200)]">
        <ImageWithFallback
          src={imageUrl}
          alt={productName}
          className="w-full h-full object-cover"
          style={{ borderRadius: '8px' }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[var(--text-primary)] text-sm m-0 truncate">
          {productName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[var(--text-secondary)] text-xs">
            {quantity} × ${price.toLocaleString('es-CL')}
          </span>
        </div>
        <span className="text-[var(--brand-teal-600)] text-sm">
          ${subtotal.toLocaleString('es-CL')}
        </span>
      </div>

      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-100)] text-[var(--text-tertiary)] hover:text-[var(--status-error)] transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Eliminar"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}