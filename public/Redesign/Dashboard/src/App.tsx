import React, { useState } from 'react';
import { DSSidebar } from './components/dashboard/DSSidebar';
import { DSTopbar } from './components/dashboard/DSTopbar';
import { KPICard } from './components/dashboard/KPICard';
import { DSCard } from './components/ds/DSCard';
import { DSButton } from './components/ds/DSButton';
import { SalesChart } from './components/dashboard/SalesChart';
import { RecentOrdersTable } from './components/dashboard/RecentOrdersTable';
import { TopProductsCard } from './components/dashboard/TopProductsCard';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Plus,
  Download,
  MoreVertical
} from 'lucide-react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const darkTokens = {
    background: '#0c0f11',
  };

  const lightTokens = {
    background: '#ffffff',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div 
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: tokens.background }}
      >
        {/* Sidebar */}
        <DSSidebar isDarkMode={isDarkMode} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <DSTopbar 
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          />

          {/* Content Area - 12 Column Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-[32px]">
              {/* KPIs Section - 12 Column Grid */}
              <div className="grid grid-cols-12 gap-[24px] mb-[32px]">
                <div className="col-span-3">
                  <KPICard
                    title="Ingresos Totales"
                    value="$125,430"
                    change="+12.5%"
                    changeType="positive"
                    icon={DollarSign}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className="col-span-3">
                  <KPICard
                    title="Total Pedidos"
                    value="1,248"
                    change="+8.2%"
                    changeType="positive"
                    icon={ShoppingCart}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className="col-span-3">
                  <KPICard
                    title="Nuevos Clientes"
                    value="342"
                    change="-3.1%"
                    changeType="negative"
                    icon={Users}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className="col-span-3">
                  <KPICard
                    title="Tasa Conversión"
                    value="3.2%"
                    change="+0.8%"
                    changeType="positive"
                    icon={TrendingUp}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

              {/* Charts & Stats Row - 12 Column Grid */}
              <div className="grid grid-cols-12 gap-[24px] mb-[32px]">
                {/* Sales Chart - 8 columns */}
                <div className="col-span-8">
                  <DSCard variant="elevated" isDarkMode={isDarkMode}>
                    <div className="flex items-center justify-between mb-[24px]">
                      <div>
                        <h3 
                          className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[18px] leading-[27px] mb-[4px]"
                          style={{ color: isDarkMode ? '#ffffff' : '#111111' }}
                        >
                          Ventas Mensuales
                        </h3>
                        <p 
                          className="font-['Inter:Regular',sans-serif] text-[13px] leading-[19.5px]"
                          style={{ color: isDarkMode ? '#a0a7a9' : '#6a6a6a' }}
                        >
                          Comparación de ventas vs meta del año
                        </p>
                      </div>
                      <div className="flex gap-[8px]">
                        <DSButton variant="ghost" size="small" isDarkMode={isDarkMode}>
                          <Download size={16} />
                        </DSButton>
                        <DSButton variant="ghost" size="small" isDarkMode={isDarkMode}>
                          <MoreVertical size={16} />
                        </DSButton>
                      </div>
                    </div>
                    <SalesChart isDarkMode={isDarkMode} />
                  </DSCard>
                </div>

                {/* Top Products - 4 columns */}
                <div className="col-span-4">
                  <DSCard variant="elevated" isDarkMode={isDarkMode}>
                    <div className="mb-[24px]">
                      <h3 
                        className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[18px] leading-[27px] mb-[4px]"
                        style={{ color: isDarkMode ? '#ffffff' : '#111111' }}
                      >
                        Top Productos
                      </h3>
                      <p 
                        className="font-['Inter:Regular',sans-serif] text-[13px] leading-[19.5px]"
                        style={{ color: isDarkMode ? '#a0a7a9' : '#6a6a6a' }}
                      >
                        Más vendidos este mes
                      </p>
                    </div>
                    <TopProductsCard isDarkMode={isDarkMode} />
                  </DSCard>
                </div>
              </div>

              {/* Recent Orders Table - Full Width */}
              <DSCard variant="elevated" isDarkMode={isDarkMode}>
                <div className="flex items-center justify-between mb-[24px]">
                  <div>
                    <h3 
                      className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[18px] leading-[27px] mb-[4px]"
                      style={{ color: isDarkMode ? '#ffffff' : '#111111' }}
                    >
                      Pedidos Recientes
                    </h3>
                    <p 
                      className="font-['Inter:Regular',sans-serif] text-[13px] leading-[19.5px]"
                      style={{ color: isDarkMode ? '#a0a7a9' : '#6a6a6a' }}
                    >
                      Últimas transacciones realizadas
                    </p>
                  </div>
                  <DSButton variant="primary" size="medium" isDarkMode={isDarkMode}>
                    <Plus size={16} />
                    Nuevo Pedido
                  </DSButton>
                </div>
                <RecentOrdersTable isDarkMode={isDarkMode} />
              </DSCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}