import React from 'react';
import { Product } from './ProductCard';
import { ProductTableRow } from './ProductTableRow';

interface ProductWithCategory extends Product {
  category: string;
}

interface TableViewProps {
  products: ProductWithCategory[];
  onQuantityChange?: (productId: string, quantity: number) => void;
}

export function TableView({ products, onQuantityChange }: TableViewProps) {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block min-w-0 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.9fr_0.9fr_1.2fr] gap-6 px-6 py-3 bg-[var(--surface-200)] border-b border-[var(--surface-300)] rounded-t-2xl min-w-0 overflow-hidden">
          <div className="text-[var(--text-secondary)] uppercase tracking-wide min-w-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            Producto
          </div>
          <div className="text-[var(--text-secondary)] uppercase tracking-wide min-w-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            Precio
          </div>
          <div className="text-[var(--text-secondary)] uppercase tracking-wide min-w-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            Unidad
          </div>
          <div className="text-[var(--text-secondary)] uppercase tracking-wide min-w-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            Categoría
          </div>
          <div className="text-[var(--text-secondary)] uppercase tracking-wide min-w-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            Estado
          </div>
          <div className="text-[var(--text-secondary)] uppercase tracking-wide text-center min-w-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            Cantidad
          </div>
        </div>

        {/* Table Body */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-[var(--surface-200)] shadow-[var(--shadow-sm)] overflow-hidden min-w-0">
          {products.map((product, index) => (
            <ProductTableRow
              key={product.id}
              product={product}
              category={product.category}
              onQuantityChange={onQuantityChange}
              isLast={index === products.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden flex flex-col gap-4">
        {products.map((product) => (
          <ProductTableRow
            key={product.id}
            product={product}
            category={product.category}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </div>
    </div>
  );
}