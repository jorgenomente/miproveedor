import React from 'react';
import { Product } from './ProductCard';
import { DSBadge } from './DSBadge';
import { QuantitySelector } from './QuantitySelector';
import { ProductThumbnail } from './ProductThumbnail';

interface ProductTableRowProps {
  product: Product;
  category: string;
  onQuantityChange?: (productId: string, quantity: number) => void;
  isLast?: boolean;
}

export function ProductTableRow({ product, category, onQuantityChange, isLast = false }: ProductTableRowProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'nuevo':
        return 'success';
      case 'oferta':
        return 'error';
      case 'sin-stock':
        return 'neutral';
      default:
        return 'aqua';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'nuevo':
        return 'Nuevo';
      case 'oferta':
        return 'Oferta';
      case 'sin-stock':
        return 'Sin stock';
      case 'disponible':
        return 'Disponible';
      default:
        return status;
    }
  };

  return (
    <>
      {/* Mobile Card Layout - DSCard */}
      <div className="lg:hidden bg-white rounded-2xl p-4 border border-[var(--surface-200)] shadow-[var(--shadow-sm)] min-w-0">
        {/* Product Image and Name */}
        <div className="flex gap-3 mb-3 min-w-0">
          <ProductThumbnail src={product.imageUrl} alt={product.title} />
          <div className="flex-1 min-w-0">
            <h5 className="text-[var(--text-primary)] m-0 truncate">{product.title}</h5>
            <p className="text-[var(--text-secondary)] text-sm m-0 mt-1 truncate">{product.brand}</p>
            {product.description && (
              <p className="text-[var(--text-tertiary)] text-xs m-0 mt-1 truncate">{product.description}</p>
            )}
          </div>
        </div>

        {/* Hashtags */}
        {product.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.hashtags.map((tag, index) => (
              <DSBadge key={index} variant="neutral" size="sm">
                {tag}
              </DSBadge>
            ))}
          </div>
        )}

        {/* Category and Status */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--surface-200)]">
          <DSBadge variant="neutral" size="sm">
            {category}
          </DSBadge>
          <DSBadge variant={getStatusBadgeVariant(product.status)} size="sm">
            {getStatusText(product.status)}
          </DSBadge>
        </div>

        {/* Price Block */}
        <div className="space-y-2 mb-4 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)] line-through text-sm">
              ${product.originalPrice.toLocaleString('es-CL')}
            </span>
            <DSBadge variant="success" size="sm">
              -{product.discount}%
            </DSBadge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[var(--text-primary)] text-2xl">
              ${product.currentPrice.toLocaleString('es-CL')}
            </span>
            <span className="text-[var(--text-tertiary)] text-sm">
              / {product.unit}
            </span>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="flex justify-end">
          <QuantitySelector
            onChange={(quantity) => onQuantityChange?.(product.id, quantity)}
          />
        </div>
      </div>

      {/* Desktop Table Row */}
      <div className={`hidden lg:grid grid-cols-[2fr_1.2fr_0.8fr_0.9fr_0.9fr_1.2fr] gap-6 px-6 items-center bg-[var(--surface-100)] hover:bg-[var(--surface-50)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 min-w-0 ${!isLast ? 'border-b border-[var(--surface-300)]' : ''}`} style={{ minHeight: '96px' }}>
        {/* Column 1: PRODUCTO - Image + Name + Brand + Description + Hashtags */}
        <div className="flex gap-3 items-start min-w-0 py-4">
          <div className="flex-shrink-0">
            <ProductThumbnail src={product.imageUrl} alt={product.title} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <h5 className="text-[var(--text-primary)] m-0 truncate">{product.title}</h5>
            <p className="text-[var(--text-secondary)] text-sm m-0 truncate">{product.brand}</p>
            {product.description && (
              <p className="text-[var(--text-tertiary)] text-xs m-0 truncate">{product.description}</p>
            )}
            {product.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.hashtags.map((tag, index) => (
                  <DSBadge key={index} variant="neutral" size="sm">
                    {tag}
                  </DSBadge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: PRECIO - Old Price (tachado) + Current Price + Discount Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[var(--text-tertiary)] line-through text-sm truncate">
              $ {product.originalPrice.toLocaleString('es-CL')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[var(--text-primary)] text-lg truncate">
                $ {product.currentPrice.toLocaleString('es-CL')}
              </span>
              <span className="text-[var(--text-tertiary)] text-xs">
                · {product.unit.toLowerCase()}
              </span>
            </div>
          </div>
          <DSBadge variant="success" size="sm">
            -{product.discount}%
          </DSBadge>
        </div>

        {/* Column 3: UNIDAD */}
        <div className="min-w-0">
          <span className="text-[var(--text-secondary)] truncate block">
            {product.unit}
          </span>
        </div>

        {/* Column 4: CATEGORÍA - Badge */}
        <div className="min-w-0">
          <DSBadge variant="neutral" size="sm">
            {category}
          </DSBadge>
        </div>

        {/* Column 5: ESTADO - Badge */}
        <div className="min-w-0">
          <DSBadge variant={getStatusBadgeVariant(product.status)} size="sm">
            {getStatusText(product.status)}
          </DSBadge>
        </div>

        {/* Column 6: CANTIDAD - Quantity Selector */}
        <div className="flex justify-center min-w-0">
          <QuantitySelector
            onChange={(quantity) => onQuantityChange?.(product.id, quantity)}
          />
        </div>
      </div>
    </>
  );
}