import React from 'react';
import { DSBadge } from './DSBadge';
import { QuantitySelector } from './QuantitySelector';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface Product {
  id: string;
  title: string;
  brand: string;
  status: 'nuevo' | 'disponible' | 'sin-stock' | 'oferta';
  description?: string;
  hashtags: string[];
  originalPrice: number;
  discount: number;
  currentPrice: number;
  unit: string;
  imageUrl: string;
}

interface ProductCardProps {
  product: Product;
  onQuantityChange?: (productId: string, quantity: number) => void;
}

export function ProductCard({ product, onQuantityChange }: ProductCardProps) {
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

  const getBrandVariant = (brand: string) => {
    if (brand.toLowerCase().includes('max')) return 'teal';
    if (brand.toLowerCase() === 'iarte') return 'brand';
    return 'neutral';
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[var(--surface-200)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--surface-300)] hover:-translate-y-0.5 transition-all duration-300 min-w-0">
      {/* Image - Fixed Height ~256px */}
      <div className="relative w-full h-64 overflow-hidden bg-[var(--surface-100)]">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
          style={{ borderRadius: '16px 16px 0 0' }}
        />
      </div>

      {/* Content - Reduced padding ~12% (p-4 → p-3.5) */}
      <div className="p-3.5 space-y-2.5 min-w-0">
        {/* Title - H4 DS */}
        <h4 className="text-[var(--text-primary)] m-0 truncate">{product.title}</h4>

        {/* Brand - text-secondary */}
        <p className="text-[var(--text-secondary)] text-sm m-0 truncate">{product.brand}</p>

        {/* Status Badge */}
        <div className="flex flex-wrap gap-2">
          <DSBadge variant={getStatusBadgeVariant(product.status)} size="sm">
            {getStatusText(product.status)}
          </DSBadge>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-[var(--text-secondary)] text-sm m-0 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Hashtags - DSBadge neutral */}
        {product.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.hashtags.map((tag, index) => (
              <DSBadge key={index} variant="neutral" size="sm">
                {tag}
              </DSBadge>
            ))}
          </div>
        )}

        {/* Price Block - Reduced top padding ~10% */}
        <div className="space-y-2 pt-2.5 border-t border-[var(--surface-200)] min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
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
              {product.unit}
            </span>
          </div>
        </div>

        {/* Quantity Selector - Reduced top padding ~10% */}
        <div className="pt-2.5">
          <QuantitySelector
            onChange={(quantity) => onQuantityChange?.(product.id, quantity)}
          />
        </div>
      </div>
    </div>
  );
}