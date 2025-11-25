import { Package } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col gap-6">
      <h3>Empty State</h3>
      
      <div className="bg-white border border-[#D8DEE2] rounded-lg p-12 flex flex-col items-center justify-center text-center max-w-[400px] shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#EEF1F2] flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-[#66707A]" />
        </div>
        <h3 className="mb-2">No hay pedidos</h3>
        <p className="text-[14px] text-[#66707A] mb-6">
          Aún no tienes pedidos registrados. Crea tu primer pedido para comenzar.
        </p>
        <button className="px-4 py-2 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors">
          Crear pedido
        </button>
      </div>
    </div>
  );
}
