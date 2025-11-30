import React from 'react';
import { TrendingUp } from 'lucide-react';

interface Product {
  nombre: string;
  ventas: number;
  ingresos: string;
  cambio: string;
}

const products: Product[] = [
  { nombre: 'Laptop Dell XPS 15', ventas: 234, ingresos: '$303,866', cambio: '+12%' },
  { nombre: 'iPhone 15 Pro', ventas: 189, ingresos: '$188,811', cambio: '+8%' },
  { nombre: 'Samsung Galaxy S24', ventas: 156, ingresos: '$140,244', cambio: '+15%' },
  { nombre: 'MacBook Air M2', ventas: 142, ingresos: '$170,258', cambio: '+5%' },
  { nombre: 'iPad Pro 12.9"', ventas: 128, ingresos: '$140,672', cambio: '+18%' }
];

interface TopProductsCardProps {
  isDarkMode?: boolean;
}

export function TopProductsCard({ isDarkMode = true }: TopProductsCardProps) {
  const darkTokens = {
    itemBackground: '#13181b',
    itemBackgroundHover: '#1a2125',
    iconBackground: '#1a2125',
    textPrimary: '#ffffff',
    textSecondary: '#a0a7a9',
  };

  const lightTokens = {
    itemBackground: '#f7f7f7',
    itemBackgroundHover: '#efefef',
    iconBackground: '#ffffff',
    textPrimary: '#111111',
    textSecondary: '#6a6a6a',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  return (
    <div className="flex flex-col gap-[16px]">
      {products.map((product, index) => (
        <div
          key={product.nombre}
          className="flex items-center justify-between px-[20px] py-[16px] rounded-[8px] transition-colors gap-[16px]"
          style={{ backgroundColor: tokens.itemBackground }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.itemBackgroundHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tokens.itemBackground}
        >
          {/* Left Column: Icon + Text (with min-w-0 for truncate) */}
          <div className="flex items-center gap-[16px] min-w-0 flex-1">
            {/* Number Icon - shrink-0 prevents vertical stretching */}
            <div 
              className="w-[40px] h-[40px] rounded-[8px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: tokens.iconBackground }}
            >
              <span 
                className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px]"
                style={{ color: '#36aab4' }}
              >
                {index + 1}
              </span>
            </div>
            {/* Text Content - min-w-0 allows truncate to work */}
            <div className="min-w-0 flex-1">
              <p 
                className="font-['Inter:Medium',sans-serif] font-medium text-[14px] leading-[21px] truncate"
                style={{ color: tokens.textPrimary }}
              >
                {product.nombre}
              </p>
              <p 
                className="font-['Inter:Regular',sans-serif] text-[12px] leading-[18px] truncate"
                style={{ color: tokens.textSecondary }}
              >
                {product.ventas} unidades vendidas
              </p>
            </div>
          </div>
          
          {/* Right Column: Numbers - shrink-0 keeps alignment */}
          <div className="text-right shrink-0">
            <p 
              className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[15px] leading-[22.5px] whitespace-nowrap"
              style={{ color: tokens.textPrimary }}
            >
              {product.ingresos}
            </p>
            <div className="flex items-center gap-[4px] justify-end">
              <TrendingUp size={12} className="shrink-0" style={{ color: '#12b272' }} />
              <span 
                className="font-['Inter:Medium',sans-serif] font-medium text-[12px] leading-[18px]"
                style={{ color: '#12b272' }}
              >
                {product.cambio}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}