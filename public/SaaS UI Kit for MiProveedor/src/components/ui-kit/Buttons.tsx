export function Buttons() {
  return (
    <div className="flex flex-col gap-6">
      <h3>Buttons</h3>
      
      <div className="flex flex-wrap gap-4">
        {/* Primary */}
        <button 
          className="px-4 py-2 bg-[#3A9FA1] text-white rounded-lg text-[14px] font-semibold hover:bg-[#2d8486] transition-colors"
        >
          Primary Button
        </button>

        {/* Primary Hover State */}
        <button 
          className="px-4 py-2 bg-[#2d8486] text-white rounded-lg text-[14px] font-semibold"
        >
          Primary Hover
        </button>

        {/* Secondary */}
        <button 
          className="px-4 py-2 bg-white text-[#111315] border border-[#D8DEE2] rounded-lg text-[14px] font-semibold hover:bg-[#EEF1F2] transition-colors"
        >
          Secondary Button
        </button>

        {/* Ghost */}
        <button 
          className="px-4 py-2 bg-transparent text-[#3A9FA1] rounded-lg text-[14px] font-semibold hover:bg-[#E6F7F6] transition-colors"
        >
          Ghost Button
        </button>

        {/* Disabled */}
        <button 
          className="px-4 py-2 bg-[#EEF1F2] text-[#66707A] rounded-lg text-[14px] font-semibold cursor-not-allowed opacity-50"
          disabled
        >
          Disabled Button
        </button>
      </div>
    </div>
  );
}
