import { Package, User, ShoppingBag, MoreVertical } from 'lucide-react';

export function Cards() {
  return (
    <div className="flex flex-col gap-6">
      <h3>Cards</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pedido Card */}
        <div className="bg-white border border-[#D8DEE2] rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F7F6] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#3A9FA1]" />
              </div>
              <div>
                <h3 className="text-[14px]">Pedido #10234</h3>
                <p className="text-[12px] text-[#66707A]">Cliente: María González</p>
              </div>
            </div>
            <button className="text-[#66707A] hover:text-[#111315]">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-[#EEF1F2]">
            <div>
              <p className="text-[12px] text-[#66707A]">Total</p>
              <p className="text-[16px] font-semibold text-[#111315]">$4,230.00</p>
            </div>
            <div 
              className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ backgroundColor: '#E6F7F6', color: '#5BC7C0' }}
            >
              Preparing
            </div>
          </div>
        </div>

        {/* Cliente Card */}
        <div className="bg-white border border-[#D8DEE2] rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F4F5] flex items-center justify-center">
                <User className="w-5 h-5 text-[#1F6F75]" />
              </div>
              <div>
                <h3 className="text-[14px]">Restaurante El Sol</h3>
                <p className="text-[12px] text-[#66707A]">cliente@elsol.com</p>
              </div>
            </div>
            <button className="text-[#66707A] hover:text-[#111315]">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-[#EEF1F2]">
            <div>
              <p className="text-[12px] text-[#66707A]">Total Pedidos</p>
              <p className="text-[16px] font-semibold text-[#111315]">24</p>
            </div>
            <button className="text-[14px] font-semibold text-[#3A9FA1] hover:text-[#1F6F75]">
              Ver detalles
            </button>
          </div>
        </div>

        {/* Producto Card */}
        <div className="bg-white border border-[#D8DEE2] rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF3E4] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#E8A351]" />
              </div>
              <div>
                <h3 className="text-[14px]">Tomate Roma</h3>
                <p className="text-[12px] text-[#66707A]">SKU: TOM-001</p>
              </div>
            </div>
            <button className="text-[#66707A] hover:text-[#111315]">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-[#EEF1F2]">
            <div>
              <p className="text-[12px] text-[#66707A]">Precio/kg</p>
              <p className="text-[16px] font-semibold text-[#111315]">$45.00</p>
            </div>
            <div>
              <p className="text-[12px] text-[#66707A] text-right">Stock</p>
              <p className="text-[16px] font-semibold text-[#1F6F75] text-right">150 kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
