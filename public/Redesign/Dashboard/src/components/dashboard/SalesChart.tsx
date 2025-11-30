import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { mes: 'Ene', ventas: 4500, meta: 5000 },
  { mes: 'Feb', ventas: 5200, meta: 5500 },
  { mes: 'Mar', ventas: 4800, meta: 5200 },
  { mes: 'Abr', ventas: 6100, meta: 6000 },
  { mes: 'May', ventas: 7200, meta: 6500 },
  { mes: 'Jun', ventas: 6800, meta: 7000 },
  { mes: 'Jul', ventas: 8100, meta: 7500 },
  { mes: 'Ago', ventas: 7500, meta: 8000 },
  { mes: 'Sep', ventas: 8900, meta: 8500 },
  { mes: 'Oct', ventas: 9200, meta: 9000 },
  { mes: 'Nov', ventas: 10500, meta: 9500 },
  { mes: 'Dic', ventas: 11200, meta: 10000 }
];

interface SalesChartProps {
  isDarkMode?: boolean;
}

export function SalesChart({ isDarkMode = true }: SalesChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const darkTokens = {
    gridStroke: '#243035',
    axisStroke: '#a0a7a9',
    tooltipBackground: '#1a2125',
    tooltipBorder: '#243035',
    tooltipText: '#ffffff',
    tooltipLabel: '#d4d8d9',
    loadingText: '#a0a7a9',
  };

  const lightTokens = {
    gridStroke: '#e4e4e4',
    axisStroke: '#6a6a6a',
    tooltipBackground: '#ffffff',
    tooltipBorder: '#e4e4e4',
    tooltipText: '#111111',
    tooltipLabel: '#6a6a6a',
    loadingText: '#6a6a6a',
  };

  const tokens = isDarkMode ? darkTokens : lightTokens;

  if (!mounted) {
    return <div className="w-full h-[320px] flex items-center justify-center">
      <p className="text-[14px]" style={{ color: tokens.loadingText }}>Cargando gráfica...</p>
    </div>;
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1f8a92" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#1f8a92" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4fd4e4" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#4fd4e4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.gridStroke} vertical={false} />
          <XAxis 
            dataKey="mes" 
            stroke={tokens.axisStroke}
            tick={{ fill: tokens.axisStroke, fontSize: 12 }}
            axisLine={{ stroke: tokens.gridStroke }}
          />
          <YAxis 
            stroke={tokens.axisStroke}
            tick={{ fill: tokens.axisStroke, fontSize: 12 }}
            axisLine={{ stroke: tokens.gridStroke }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: tokens.tooltipBackground,
              border: `1px solid ${tokens.tooltipBorder}`,
              borderRadius: '8px',
              color: tokens.tooltipText
            }}
            labelStyle={{ color: tokens.tooltipLabel }}
          />
          <Area 
            type="monotone" 
            dataKey="meta" 
            stroke="#4fd4e4" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorMeta)" 
          />
          <Area 
            type="monotone" 
            dataKey="ventas" 
            stroke="#1f8a92" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVentas)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}