import { ShoppingBag, Plus, Minus, ArrowRight, Upload } from 'lucide-react';
import { useState } from 'react';

export default function ClientViewMockup() {
  const [quantities, setQuantities] = useState([2, 1, 3]);

  const products = [
    { name: 'Coca Cola 2.25L', price: '$1.250' },
    { name: 'Galletas Oreo x6', price: '$890' },
    { name: 'Alfajor Jorgito', price: '$450' }
  ];

  const handleQuantityChange = (index: number, change: number) => {
    setQuantities(prev => {
      const newQuantities = [...prev];
      newQuantities[index] = Math.max(0, newQuantities[index] + change);
      return newQuantities;
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #FDFEFE 0%, rgba(223,243,239,0.2) 50%, #FDFEFE 100%)'
    }}>
      {/* Atmospheric background */}
      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full blur-3xl opacity-15" style={{
        background: 'radial-gradient(circle, rgba(165,243,252,0.6) 0%, transparent 100%)'
      }}></div>

      {/* Main Card - Vista del Cliente */}
      <div 
        className="w-full max-w-md rounded-[24px] p-6 md:p-7 backdrop-blur-2xl relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1.5px solid rgba(255,255,255,0.6)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04), inset 0 2px 0 rgba(255,255,255,0.95)'
        }}
      >
        {/* Inner aqua glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(165,243,252,0.16) 0%, transparent 70%)'
        }}></div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div 
            className="w-10 h-10 rounded-[18px] flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'rgba(6,182,212,0.1)',
              boxShadow: '0 4px 12px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.7)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)'
            }}></div>
            <ShoppingBag className="w-5 h-5 relative z-10" style={{ color: '#0891B2' }} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[17px] font-medium" style={{ color: '#0F172A' }}>
              Catálogo
            </h3>
            <p className="text-[13px]" style={{ color: '#64748B' }}>
              KIOSCO CENTRAL
            </p>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3 mb-6 relative z-10">
          {products.map((product, index) => (
            <div
              key={index}
              className="rounded-[20px] p-4 backdrop-blur-lg relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(135deg, rgba(165,243,252,0.08) 0%, transparent 60%)'
              }}></div>
              
              <div className="flex items-center justify-between gap-3 relative z-10">
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium truncate" style={{ color: '#0F172A' }}>
                    {product.name}
                  </p>
                  <p className="text-[14px] font-semibold mt-0.5" style={{ color: '#0891B2' }}>
                    {product.price}
                  </p>
                </div>

                {/* Quantity selector - Glass capsule */}
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    boxShadow: '0 2px 8px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  <button
                    onClick={() => handleQuantityChange(index, -1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[rgba(6,182,212,0.08)] transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <Minus className="w-3.5 h-3.5" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                  </button>
                  
                  <span className="text-[15px] font-semibold min-w-[20px] text-center" style={{ color: '#0F172A' }}>
                    {quantities[index]}
                  </span>
                  
                  <button
                    onClick={() => handleQuantityChange(index, 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[rgba(6,182,212,0.08)] transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Button - Enviar pedido */}
        <button 
          className="w-full py-4 rounded-[18px] font-medium text-[16px] text-white mb-4 relative overflow-hidden hover:brightness-105 transition-all duration-300 relative z-10"
          style={{
            background: 'linear-gradient(135deg, #1A8D90 0%, #0B6668 100%)',
            boxShadow: '0 8px 24px rgba(26,141,144,0.3), 0 2px 8px rgba(11,102,104,0.2)'
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)'
          }}></div>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <span>Enviar pedido</span>
            <ArrowRight className="w-4.5 h-4.5" strokeWidth={2.5} />
          </div>
        </button>

        {/* Secondary Card - Upload comprobante */}
        <div 
          className="rounded-[20px] p-4 backdrop-blur-xl relative overflow-hidden relative z-10"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(165,243,252,0.06) 0%, transparent 60%)'
          }}></div>
          
          <div className="flex items-start gap-3 relative z-10">
            {/* Upload icon */}
            <div 
              className="w-9 h-9 rounded-[16px] flex items-center justify-center flex-shrink-0 relative overflow-hidden"
              style={{
                background: 'rgba(6,182,212,0.08)',
                boxShadow: '0 2px 8px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.6)'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
              }}></div>
              <Upload className="w-4.5 h-4.5 relative z-10" style={{ color: '#0891B2' }} strokeWidth={2.5} />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium mb-0.5" style={{ color: '#0F172A' }}>
                Subir comprobante <span style={{ color: '#94A3B8' }}>(opcional)</span>
              </p>
              <p className="text-[13px]" style={{ color: '#64748B' }}>
                Foto del pago o transferencia
              </p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full opacity-6 pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)'
        }}></div>
      </div>
    </div>
  );
}
