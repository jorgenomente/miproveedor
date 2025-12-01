import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Download } from 'lucide-react';
import { DSBadge } from './DSBadge';
import { DSButton } from './DSButton';

export interface OrderItem {
  id: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  dateTime: string;
  estimatedDelivery: string;
  deliveryZone: string;
  status: 'pendiente' | 'completado' | 'cancelado';
  total: number;
  deliveryMethod: string;
  paymentMethod: string;
  collectionMethod: string;
  items: OrderItem[];
  ordersCount?: number;
}

interface OrderCardProps {
  order: Order;
  onDownloadReceipt?: (orderId: string) => void;
}

export function OrderCard({ order, onDownloadReceipt }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completado':
        return 'teal';
      case 'pendiente':
        return 'aqua';
      case 'cancelado':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completado':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--surface-200)] shadow-[var(--shadow-sm)] overflow-hidden">
      {/* Header - Always Visible */}
      <div className="px-6 py-5 border-b border-[var(--surface-200)]">
        {/* Top Row: Order Number + Amount + Expand Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h5 className="text-[var(--text-primary)] m-0">
              Pedido #{order.orderNumber}
            </h5>
            <span className="text-[var(--text-secondary)]">·</span>
            <span className="text-[var(--text-primary)]">
              $ {order.total.toLocaleString('es-CL')}
            </span>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-[var(--surface-100)] rounded-lg transition-colors"
            aria-label={isExpanded ? 'Contraer pedido' : 'Expandir pedido'}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
            </motion.div>
          </button>
        </div>

        {/* Date & Time + Zone/Estimated Delivery Chip */}
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[var(--text-secondary)] text-sm m-0">
            {order.dateTime}
          </p>
          <DSBadge variant="neutral" size="sm">
            {order.estimatedDelivery} · {order.deliveryZone}
          </DSBadge>
        </div>

        {/* Status Chips Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <DSBadge variant={getStatusBadgeVariant(order.status)} size="sm">
            {getStatusText(order.status)}
          </DSBadge>
          <DSBadge variant="neutral" size="sm">
            {order.paymentMethod}
          </DSBadge>
          <DSBadge variant="neutral" size="sm">
            {order.collectionMethod}
          </DSBadge>
          {order.ordersCount && (
            <DSBadge variant="warning" size="sm">
              Pedidos: {order.ordersCount}
            </DSBadge>
          )}
        </div>

        {/* Download Button */}
        <div className="flex justify-end">
          <DSButton
            variant="secondary"
            size="sm"
            onClick={() => onDownloadReceipt?.(order.id)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Descargar remito
          </DSButton>
        </div>
      </div>

      {/* Expandable Content - Products Table */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 py-5 bg-[var(--surface-50)]">
              {/* Products Table - Desktop */}
              <div className="hidden md:block">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 pb-3 border-b border-[var(--surface-300)]">
                  <div className="text-[var(--text-secondary)] uppercase tracking-wide" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Producto
                  </div>
                  <div className="text-[var(--text-secondary)] uppercase tracking-wide text-center" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Cant.
                  </div>
                  <div className="text-[var(--text-secondary)] uppercase tracking-wide text-right" style={{ fontSize: '12px', fontWeight: 600 }}>
                    P. Unit
                  </div>
                  <div className="text-[var(--text-secondary)] uppercase tracking-wide text-right" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Subtotal
                  </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[var(--surface-200)]">
                  {order.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[var(--text-primary)] m-0 truncate">{item.productName}</p>
                        <p className="text-[var(--text-tertiary)] text-sm m-0 mt-0.5">{item.unit}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[var(--text-primary)] m-0">{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-primary)] m-0">
                          $ {item.unitPrice.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-primary)] m-0">
                          {item.quantity} · $ {item.unitPrice.toLocaleString('es-CL')} = <span className="font-medium">$ {item.subtotal.toLocaleString('es-CL')}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Row */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 pt-4 mt-4 border-t border-[var(--surface-300)]">
                  <div></div>
                  <div></div>
                  <div className="text-right">
                    <p className="text-[var(--text-secondary)] m-0">Total:</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--text-primary)] m-0">
                      $ {order.total.toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products List - Mobile */}
              <div className="md:hidden space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 border border-[var(--surface-200)]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] m-0 truncate">{item.productName}</p>
                        <p className="text-[var(--text-tertiary)] text-sm m-0 mt-0.5">{item.unit}</p>
                      </div>
                      <p className="text-[var(--text-primary)] m-0 ml-3">
                        x{item.quantity}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--surface-200)]">
                      <p className="text-[var(--text-secondary)] text-sm m-0">
                        $ {item.unitPrice.toLocaleString('es-CL')} c/u
                      </p>
                      <p className="text-[var(--text-primary)] m-0">
                        $ {item.subtotal.toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Total - Mobile */}
                <div className="bg-white rounded-xl p-4 border-2 border-[var(--surface-300)]">
                  <div className="flex justify-between items-center">
                    <p className="text-[var(--text-secondary)] m-0">Total del pedido:</p>
                    <p className="text-[var(--text-primary)] m-0">
                      $ {order.total.toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
