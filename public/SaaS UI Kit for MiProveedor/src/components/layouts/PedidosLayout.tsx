import { LayoutDashboard, Package, Users, ShoppingBag, Settings, BarChart3, Search, Bell, HelpCircle, Filter, Download, Plus, MoreVertical } from 'lucide-react';

export function PedidosLayout() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: false },
    { icon: Package, label: 'Pedidos', active: true },
    { icon: Users, label: 'Clientes', active: false },
    { icon: ShoppingBag, label: 'Productos', active: false },
    { icon: BarChart3, label: 'Reportes', active: false },
    { icon: Settings, label: 'Configuración', active: false },
  ];

  const orders = [
    { id: '#10234', client: 'Restaurante El Sol', date: '15 Nov 2025', items: '12 productos', amount: '$4,230.00', status: 'Preparing', statusColor: { bg: '#E6F7F6', text: '#5BC7C0' } },
    { id: '#10233', client: 'Café Central', date: '15 Nov 2025', items: '8 productos', amount: '$1,890.00', status: 'Dispatched', statusColor: { bg: '#E6F4F5', text: '#1F6F75' } },
    { id: '#10232', client: 'Hotel Plaza', date: '14 Nov 2025', items: '24 productos', amount: '$8,450.00', status: 'Paid', statusColor: { bg: '#E6F7F6', text: '#3A9FA1' } },
    { id: '#10231', client: 'Mercado Norte', date: '14 Nov 2025', items: '6 productos', amount: '$2,340.00', status: 'Pending', statusColor: { bg: '#FDF3E4', text: '#E8A351' } },
    { id: '#10230', client: 'Panadería La Espiga', date: '13 Nov 2025', items: '18 productos', amount: '$3,120.00', status: 'Dispatched', statusColor: { bg: '#E6F4F5', text: '#1F6F75' } },
    { id: '#10229', client: 'Restaurante Mar Azul', date: '13 Nov 2025', items: '15 productos', amount: '$5,670.00', status: 'Paid', statusColor: { bg: '#E6F7F6', text: '#3A9FA1' } },
    { id: '#10228', client: 'Cafetería Luna', date: '12 Nov 2025', items: '4 productos', amount: '$890.00', status: 'Cancelled', statusColor: { bg: '#FBECEC', text: '#E96A6A' } },
    { id: '#10227', client: 'Hotel Estrella', date: '12 Nov 2025', items: '32 productos', amount: '$12,340.00', status: 'Paid', statusColor: { bg: '#E6F7F6', text: '#3A9FA1' } },
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
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="mb-2">Pedidos</h1>
                <p className="text-[14px] text-[#66707A]">Gestiona todos tus pedidos</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrar
                </button>
                <button className="px-4 py-2 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <button className="px-4 py-2 bg-[#3A9FA1] text-white rounded-lg text-[14px] font-semibold hover:bg-[#2d8486] transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo pedido
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-[#D8DEE2] rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FAFBFC] border-b border-[#D8DEE2]">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-[#D8DEE2] text-[#3A9FA1] focus:ring-[#5BC7C0]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">PEDIDO</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">CLIENTE</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">FECHA</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">ITEMS</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">MONTO</th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#66707A]">ESTADO</th>
                      <th className="px-6 py-3 text-right text-[12px] font-semibold text-[#66707A]">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr 
                        key={order.id}
                        className={`border-b border-[#EEF1F2] hover:bg-[#FAFBFC] ${index % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'}`}
                      >
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-[#D8DEE2] text-[#3A9FA1] focus:ring-[#5BC7C0]"
                          />
                        </td>
                        <td className="px-6 py-4 text-[14px] font-semibold text-[#111315]">{order.id}</td>
                        <td className="px-6 py-4 text-[14px] text-[#111315]">{order.client}</td>
                        <td className="px-6 py-4 text-[14px] text-[#66707A]">{order.date}</td>
                        <td className="px-6 py-4 text-[14px] text-[#66707A]">{order.items}</td>
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
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#66707A] hover:text-[#111315]">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-[#EEF1F2] flex items-center justify-between">
                <p className="text-[14px] text-[#66707A]">Mostrando 1-8 de 48 pedidos</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors">
                    Anterior
                  </button>
                  <button className="px-3 py-1.5 bg-[#3A9FA1] text-white rounded-lg text-[14px] font-semibold">
                    1
                  </button>
                  <button className="px-3 py-1.5 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors">
                    2
                  </button>
                  <button className="px-3 py-1.5 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors">
                    3
                  </button>
                  <button className="px-3 py-1.5 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors">
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
