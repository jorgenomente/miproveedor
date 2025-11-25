import { MoreVertical } from 'lucide-react';

export function DataTable() {
  const orders = [
    { id: '#10234', client: 'Restaurante El Sol', date: '15 Nov 2025', amount: '$4,230.00', status: 'Preparing', statusColor: { bg: '#E6F7F6', text: '#5BC7C0' } },
    { id: '#10233', client: 'Café Central', date: '15 Nov 2025', amount: '$1,890.00', status: 'Dispatched', statusColor: { bg: '#E6F4F5', text: '#1F6F75' } },
    { id: '#10232', client: 'Hotel Plaza', date: '14 Nov 2025', amount: '$8,450.00', status: 'Paid', statusColor: { bg: '#E6F7F6', text: '#3A9FA1' } },
    { id: '#10231', client: 'Mercado Norte', date: '14 Nov 2025', amount: '$2,340.00', status: 'Pending', statusColor: { bg: '#FDF3E4', text: '#E8A351' } },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h3>Table</h3>
      
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
      </div>
    </div>
  );
}
