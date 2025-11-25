import { X } from 'lucide-react';

export function Modal() {
  return (
    <div className="flex flex-col gap-6">
      <h3>Modal</h3>
      
      <div className="bg-white border border-[#D8DEE2] rounded-lg shadow-lg max-w-[480px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF1F2]">
          <h3>Confirmar acción</h3>
          <button className="text-[#66707A] hover:text-[#111315]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-6">
          <p className="text-[14px] text-[#66707A]">
            ¿Estás seguro de que deseas realizar esta acción? Esta operación no se puede deshacer.
          </p>
        </div>
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FAFBFC] border-t border-[#EEF1F2] rounded-b-lg">
          <button className="px-4 py-2 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors">
            Cancelar
          </button>
          <button className="px-4 py-2 bg-[#3A9FA1] text-white rounded-lg text-[14px] font-semibold hover:bg-[#2d8486] transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
