import { useState } from 'react';
import { ColorSwatches } from './components/ui-kit/ColorSwatches';
import { TypographyScale } from './components/ui-kit/TypographyScale';
import { SpacingScale } from './components/ui-kit/SpacingScale';
import { Buttons } from './components/ui-kit/Buttons';
import { Inputs } from './components/ui-kit/Inputs';
import { StatusChips } from './components/ui-kit/StatusChips';
import { Cards } from './components/ui-kit/Cards';
import { DataTable } from './components/ui-kit/DataTable';
import { Navigation } from './components/ui-kit/Navigation';
import { TopBar } from './components/ui-kit/TopBar';
import { Modal } from './components/ui-kit/Modal';
import { EmptyState } from './components/ui-kit/EmptyState';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { PedidosLayout } from './components/layouts/PedidosLayout';

export default function App() {
  const [activeView, setActiveView] = useState<'kit' | 'dashboard' | 'pedidos'>('kit');

  if (activeView === 'dashboard') {
    return <DashboardLayout />;
  }

  if (activeView === 'pedidos') {
    return <PedidosLayout />;
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#D8DEE2] sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#1F6F75] mb-2">MiProveedor UI Kit</h1>
              <p className="text-[14px] text-[#66707A]">Stripe-inspired design system</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveView('kit')}
                className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                  activeView === 'kit' 
                    ? 'bg-[#3A9FA1] text-white' 
                    : 'bg-white text-[#111315] border border-[#D8DEE2] hover:bg-[#EEF1F2]'
                }`}
              >
                UI Kit
              </button>
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                  activeView === 'dashboard' 
                    ? 'bg-[#3A9FA1] text-white' 
                    : 'bg-white text-[#111315] border border-[#D8DEE2] hover:bg-[#EEF1F2]'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveView('pedidos')}
                className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                  activeView === 'pedidos' 
                    ? 'bg-[#3A9FA1] text-white' 
                    : 'bg-white text-[#111315] border border-[#D8DEE2] hover:bg-[#EEF1F2]'
                }`}
              >
                Pedidos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UI Kit Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="flex flex-col gap-16">
          {/* Section 1: Colors */}
          <section>
            <ColorSwatches />
          </section>

          <div className="h-px bg-[#D8DEE2]" />

          {/* Section 2: Typography */}
          <section>
            <TypographyScale />
          </section>

          <div className="h-px bg-[#D8DEE2]" />

          {/* Section 3: Spacing */}
          <section>
            <SpacingScale />
          </section>

          <div className="h-px bg-[#D8DEE2]" />

          {/* Section 4: Components */}
          <section>
            <h2 className="mb-8">Components</h2>
            
            <div className="flex flex-col gap-12">
              <Buttons />
              <Inputs />
              <StatusChips />
              <Cards />
              <DataTable />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Navigation />
                <TopBar />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Modal />
                <EmptyState />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
