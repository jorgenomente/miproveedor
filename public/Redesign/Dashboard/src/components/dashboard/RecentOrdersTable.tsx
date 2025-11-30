import React from 'react';
import { DSBadge } from '../ds/DSBadge';
import { DSButton } from '../ds/DSButton';
import { DSTableRow } from '../ds/DSTableRow';
import { ArrowRight } from 'lucide-react';

interface Order {
  id: string;
  cliente: string;
  producto: string;
  monto: string;
  estado: 'Activo' | 'Pendiente' | 'Error';
  fecha: string;
}

const orders: Order[] = [
  { id: '#ORD-001', cliente: 'Ana García', producto: 'Laptop Dell XPS 15', monto: '$1,299.00', estado: 'Activo', fecha: '30/11/2025' },
  { id: '#ORD-002', cliente: 'Carlos Méndez', producto: 'iPhone 15 Pro', monto: '$999.00', estado: 'Pendiente', fecha: '30/11/2025' },
  { id: '#ORD-003', cliente: 'María López', producto: 'Samsung Galaxy S24', monto: '$899.00', estado: 'Activo', fecha: '29/11/2025' },
  { id: '#ORD-004', cliente: 'Juan Pérez', producto: 'MacBook Air M2', monto: '$1,199.00', estado: 'Error', fecha: '29/11/2025' },
  { id: '#ORD-005', cliente: 'Laura Sánchez', producto: 'iPad Pro 12.9"', monto: '$1,099.00', estado: 'Activo', fecha: '28/11/2025' }
];

interface RecentOrdersTableProps {
  isDarkMode?: boolean;
}

export function RecentOrdersTable({ isDarkMode = true }: RecentOrdersTableProps) {
  const darkTokens = {
    headerText: '#a0a7a9',
    textPrimary: '#ffffff',
    textSecondary: '#d4d8d9',
    textTertiary: '#a0a7a9',
  };

  const lightTokens = {
    headerText: '#6a6a6a',
    textPrimary: '#111111',
    textSecondary: '#3a3a3a',
    textTertiary: '#6a6a6a',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  const getStatusVariant = (estado: Order['estado']): 'success' | 'warning' | 'error' | 'default' => {
    switch (estado) {
      case 'Activo':
        return 'success';
      case 'Pendiente':
        return 'warning';
      case 'Error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header Row */}
      <DSTableRow isDarkMode={isDarkMode} isHeader>
        <div className="flex-1 grid grid-cols-12 gap-[16px] items-center">
          {/* Pedido - 2 cols */}
          <div className="col-span-2">
            <span 
              className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[21px]"
              style={{ color: tokens.headerText }}
            >
              Pedido
            </span>
          </div>
          
          {/* Cliente - 2 cols */}
          <div className="col-span-2">
            <span 
              className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[21px]"
              style={{ color: tokens.headerText }}
            >
              Cliente
            </span>
          </div>
          
          {/* Producto - 3 cols */}
          <div className="col-span-3">
            <span 
              className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[21px]"
              style={{ color: tokens.headerText }}
            >
              Producto
            </span>
          </div>
          
          {/* Monto - 2 cols */}
          <div className="col-span-2">
            <span 
              className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[21px]"
              style={{ color: tokens.headerText }}
            >
              Monto
            </span>
          </div>
          
          {/* Estado - 2 cols */}
          <div className="col-span-2">
            <span 
              className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[21px]"
              style={{ color: tokens.headerText }}
            >
              Estado
            </span>
          </div>
          
          {/* Acción - 1 col */}
          <div className="col-span-1">
          </div>
        </div>
      </DSTableRow>

      {/* Data Rows */}
      {orders.map((order) => (
        <DSTableRow key={order.id} isDarkMode={isDarkMode}>
          <div className="flex-1 grid grid-cols-12 gap-[16px] items-center min-w-0">
            {/* Pedido - 2 cols */}
            <div className="col-span-2 min-w-0">
              <span 
                className="font-['Inter:Medium',sans-serif] font-medium text-[14px] leading-[21px]"
                style={{ color: tokens.textPrimary }}
              >
                {order.id}
              </span>
              <p 
                className="font-['Inter:Regular',sans-serif] text-[13px] leading-[19.5px]"
                style={{ color: tokens.textTertiary }}
              >
                {order.fecha}
              </p>
            </div>
            
            {/* Cliente - 2 cols */}
            <div className="col-span-2 min-w-0">
              <span 
                className="font-['Inter:Regular',sans-serif] text-[14px] leading-[21px] truncate block"
                style={{ color: tokens.textPrimary }}
              >
                {order.cliente}
              </span>
            </div>
            
            {/* Producto - 3 cols */}
            <div className="col-span-3 min-w-0">
              <span 
                className="font-['Inter:Regular',sans-serif] text-[14px] leading-[21px] truncate block"
                style={{ color: tokens.textSecondary }}
              >
                {order.producto}
              </span>
            </div>
            
            {/* Monto - 2 cols */}
            <div className="col-span-2 shrink-0">
              <span 
                className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[15px] leading-[22.5px]"
                style={{ color: tokens.textPrimary }}
              >
                {order.monto}
              </span>
            </div>
            
            {/* Estado - 2 cols */}
            <div className="col-span-2 shrink-0">
              <DSBadge variant={getStatusVariant(order.estado)} isDarkMode={isDarkMode}>
                {order.estado}
              </DSBadge>
            </div>
            
            {/* Acción - 1 col */}
            <div className="col-span-1 shrink-0 flex justify-end">
              <DSButton 
                variant="secondary" 
                size="small" 
                isDarkMode={isDarkMode}
                className="h-[36px]"
              >
                <ArrowRight size={16} />
              </DSButton>
            </div>
          </div>
        </DSTableRow>
      ))}
    </div>
  );
}