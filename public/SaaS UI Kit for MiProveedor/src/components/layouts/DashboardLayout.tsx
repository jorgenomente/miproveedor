import { LayoutDashboard, Package, Users, ShoppingBag, Settings, BarChart3, Search, Bell, HelpCircle, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';

export function DashboardLayout() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Package, label: 'Pedidos', active: false },
    { icon: Users, label: 'Clientes', active: false },
    { icon: ShoppingBag, label: 'Productos', active: false },
    { icon: BarChart3, label: 'Reportes', active: false },
    { icon: Settings, label: 'Configuración', active: false },
  ];

  const stats = [
    { label: 'Ventas totales', value: '$48,250', change: '+12.5%', trend: 'up', icon: DollarSign },
    { label: 'Pedidos activos', value: '24', change: '+8.2%', trend: 'up', icon: ShoppingCart },
    { label: 'Clientes nuevos', value: '8', change: '-3.1%', trend: 'down', icon: Users },
    { label: 'Productos vendidos', value: '342', change: '+15.3%', trend: 'up', icon: Package },
  ];

  const recentOrders = [
    { id: '#10234', client: 'Restaurante El Sol', amount: '$4,230.00', status: 'Preparing', statusColor: { bg: '#E6F7F6', text: '#5BC7C0' } },
    { id: '#10233', client: 'Café Central', amount: '$1,890.00', status: 'Dispatched', statusColor: { bg: '#E6F4F5', text: '#1F6F75' } },
    { id: '#10232', client: 'Hotel Plaza', amount: '$8,450.00', status: 'Paid', statusColor: { bg: '#E6F7F6', text: '#3A9FA1' } },
  ];

  return (
    <div className="flex h-screen bg-[#FAFBFC]">
      {/* Sidebar */}
      <div className="w-[240px] bg-white border-r border-[#D8DEE2] flex flex-col">
        <div className="px-6 py-6 border-b border-[#EEF1F2]">
          <h2 className="text-[#1F6F75]">MiProveedor</h2>
        </div>
        
        <nav className="flex-1 px-4 py-6">
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
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#D8DEE2] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-[500px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66707A]" />
                <input 
                  type="search"
                  placeholder="Buscar pedidos, clientes, productos..."
                  className="w-full pl-10 pr-3 py-2 bg-[#FAFBFC] border border-[#D8DEE2] rounded-lg text-[14px] text-[#111315] placeholder:text-[#66707A] focus:outline-none focus:ring-2 focus:ring-[#5BC7C0] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-[#66707A] hover:text-[#111315] hover:bg-[#FAFBFC] rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#66707A] hover:text-[#111315] hover:bg-[#FAFBFC] rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E96A6A] rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#3A9FA1] flex items-center justify-center">
                <span className="text-[14px] font-semibold text-white">MG</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="mb-2">Dashboard</h1>
              <p className="text-[14px] text-[#66707A]">Resumen de tu actividad</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white border border-[#D8DEE2] rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#E6F7F6] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#3A9FA1]" />
                      </div>
                      <div className={`flex items-center gap-1 text-[12px] font-semibold ${stat.trend === 'up' ? 'text-[#1F6F75]' : 'text-[#E96A6A]'}`}>
                        {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stat.change}
                      </div>
                    </div>
                    <p className="text-[12px] text-[#66707A] mb-1">{stat.label}</p>
                    <h2>{stat.value}</h2>
                  </div>
                );
              })}
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-[#D8DEE2] rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-[#EEF1F2] flex items-center justify-between">
                <h3>Pedidos recientes</h3>
                <button className="text-[14px] font-semibold text-[#3A9FA1] hover:text-[#1F6F75]">
                  Ver todos
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FAFBFC] border-b border-[#D8DEE2]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">PEDIDO</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">CLIENTE</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">MONTO</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-[#EEF1F2] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-4 text-[14px] font-semibold text-[#111315]">{order.id}</td>
                        <td className="px-6 py-4 text-[14px] text-[#111315]">{order.client}</td>
                        <td className="px-6 py-4 text-[14px] font-semibold text-[#111315]">{order.amount}</td>
                        <td className="px-6 py-4">
                          <div
                            className="inline-flex px-3 py-1.5 rounded-full text-[12px] font-semibold"
                            style={{ 
                              backgroundColor: order.statusColor.bg,
                              color: order.statusColor.text
                            }}
                          >
                            {order.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
