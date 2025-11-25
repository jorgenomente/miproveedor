import { Search, Mail, ChevronDown } from 'lucide-react';

export function Inputs() {
  return (
    <div className="flex flex-col gap-6">
      <h3>Inputs</h3>
      
      <div className="flex flex-col gap-4 max-w-[400px]">
        {/* Text Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-[#111315]">Text Input</label>
          <input 
            type="text"
            placeholder="Enter text..."
            className="px-3 py-2 bg-white border border-[#D8DEE2] rounded-lg text-[14px] text-[#111315] placeholder:text-[#66707A] focus:outline-none focus:ring-2 focus:ring-[#5BC7C0] focus:border-transparent"
          />
        </div>

        {/* Input with Icon */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-[#111315]">Input with Icon</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66707A]" />
            <input 
              type="email"
              placeholder="email@example.com"
              className="w-full pl-10 pr-3 py-2 bg-white border border-[#D8DEE2] rounded-lg text-[14px] text-[#111315] placeholder:text-[#66707A] focus:outline-none focus:ring-2 focus:ring-[#5BC7C0] focus:border-transparent"
            />
          </div>
        </div>

        {/* Select Dropdown */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-[#111315]">Select Dropdown</label>
          <div className="relative">
            <select 
              className="w-full appearance-none px-3 py-2 bg-white border border-[#D8DEE2] rounded-lg text-[14px] text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#5BC7C0] focus:border-transparent pr-10"
            >
              <option>Select option...</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66707A] pointer-events-none" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-[#111315]">Search Bar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66707A]" />
            <input 
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-3 py-2 bg-white border border-[#D8DEE2] rounded-lg text-[14px] text-[#111315] placeholder:text-[#66707A] focus:outline-none focus:ring-2 focus:ring-[#5BC7C0] focus:border-transparent"
            />
          </div>
        </div>

        {/* Textarea */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-[#111315]">Textarea</label>
          <textarea 
            placeholder="Enter longer text..."
            rows={4}
            className="px-3 py-2 bg-white border border-[#D8DEE2] rounded-lg text-[14px] text-[#111315] placeholder:text-[#66707A] focus:outline-none focus:ring-2 focus:ring-[#5BC7C0] focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );
}
