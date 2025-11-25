import { Search, Bell, HelpCircle } from 'lucide-react';

export function TopBar() {
  return (
    <div className="flex flex-col gap-6">
      <h3>Top Bar</h3>
      
      <div className="bg-white border border-[#D8DEE2] rounded-lg shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
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
      </div>
    </div>
  );
}
