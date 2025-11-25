import { LayoutDashboard, Package, Users, ShoppingBag, Settings, BarChart3 } from 'lucide-react';

export function Navigation() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Package, label: 'Pedidos', active: false },
    { icon: Users, label: 'Clientes', active: false },
    { icon: ShoppingBag, label: 'Productos', active: false },
    { icon: BarChart3, label: 'Reportes', active: false },
    { icon: Settings, label: 'Configuración', active: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h3>Sidebar Navigation</h3>
      
      <div className="bg-white border border-[#D8DEE2] rounded-lg p-4 w-[240px] shadow-sm">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold transition-colors relative
                  ${item.active 
                    ? 'bg-[#E6F4F5] text-[#1F6F75]' 
                    : 'text-[#66707A] hover:bg-[#FAFBFC] hover:text-[#111315]'
                  }
                `}
              >
                {item.active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1F6F75] rounded-r" />
                )}
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
