import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';

interface CartItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

interface FloatingCartProps {
  items: CartItem[];
  isCartOpen: boolean;
  onToggleCart: () => void;
  onRemoveItem?: (itemId: string) => void;
}

export function FloatingCart({ 
  items, 
  isCartOpen,
  onToggleCart
}: FloatingCartProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = items.length === 0;

  return (
    <>
      {/* Mobile Version - Bottom Left */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="lg:hidden fixed bottom-10 left-4 z-30"
      >
        <button
          onClick={onToggleCart}
          className="bg-white rounded-2xl border border-[var(--surface-200)] shadow-[var(--shadow-lg)] px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-50)] transition-colors"
          aria-label="Abrir carrito"
        >
          <div className={`relative p-2 rounded-lg ${!isEmpty ? 'bg-[var(--brand-aqua-100)]' : 'bg-[var(--surface-100)]'}`}>
            <ShoppingCart className={`w-5 h-5 ${!isEmpty ? 'text-[var(--brand-aqua-600)]' : 'text-[var(--text-tertiary)]'}`} strokeWidth={1.5} />
            {itemCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--brand-teal-600)] text-white rounded-full flex items-center justify-center text-xs">
                {itemCount}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)]">
              Carrito
            </span>
            <span className="text-[var(--text-tertiary)] text-sm">
              ({itemCount})
            </span>
          </div>
        </button>
      </motion.div>

      {/* Desktop Version - Bottom Left */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:block fixed bottom-10 left-6 z-30"
      >
        <button
          onClick={onToggleCart}
          className="bg-white rounded-2xl border border-[var(--surface-200)] shadow-[var(--shadow-lg)] px-5 py-4 flex items-center gap-3 hover:bg-[var(--surface-50)] transition-colors"
          aria-label="Abrir carrito"
        >
          <div className={`relative p-2 rounded-lg ${!isEmpty ? 'bg-[var(--brand-aqua-100)]' : 'bg-[var(--surface-100)]'}`}>
            <ShoppingCart className={`w-5 h-5 ${!isEmpty ? 'text-[var(--brand-aqua-600)]' : 'text-[var(--text-tertiary)]'}`} strokeWidth={1.5} />
            {itemCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--brand-teal-600)] text-white rounded-full flex items-center justify-center text-xs">
                {itemCount}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)]">
              Carrito
            </span>
            <span className="text-[var(--text-tertiary)] text-sm">
              ({itemCount})
            </span>
          </div>
        </button>
      </motion.div>
    </>
  );
}