import { ClipboardCheck, Check, Clock, List } from 'lucide-react';

export default function DistributorMobileMockup() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #FDFEFE 0%, rgba(223,243,239,0.2) 50%, #FDFEFE 100%)'
    }}>
      {/* Atmospheric background */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-15" style={{
        background: 'radial-gradient(circle, rgba(153,246,228,0.6) 0%, transparent 100%)'
      }}></div>

      {/* Main Mobile Container - Vista del Distribuidor */}
      <div 
        className="w-full max-w-[400px] rounded-[24px] p-5 backdrop-blur-[32px] relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1.5px solid rgba(255,255,255,0.6)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04), inset 0 2px 0 rgba(255,255,255,0.95)'
        }}
      >
        {/* Inner aqua-green glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(153,246,228,0.16) 0%, transparent 70%)'
        }}></div>

        {/* Header - Mobile compact */}
        <div className="flex items-center gap-2.5 mb-4 relative z-10">
          <div 
            className="w-9 h-9 rounded-[16px] flex items-center justify-center relative overflow-hidden flex-shrink-0"
            style={{
              background: 'rgba(20,184,166,0.1)',
              boxShadow: '0 4px 12px rgba(20,184,166,0.15), inset 0 1px 0 rgba(255,255,255,0.7)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)'
            }}></div>
            <ClipboardCheck className="w-4.5 h-4.5 relative z-10" style={{ color: '#14B8A6' }} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-medium truncate leading-tight" style={{ color: '#0F172A' }}>
              Pedidos de la tienda
            </h3>
            <p className="text-[12px] truncate leading-tight" style={{ color: '#0F172A' }}>
              KIOSCO CENTRAL
            </p>
            <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: '#64748B' }}>
              Pedidos listos para procesar
            </p>
          </div>
        </div>

        {/* Pedido List - Mobile stacked */}
        <div className="space-y-3 mb-4 relative z-10">
          {/* Pedido 1 - Recibido */}
          <div
            className="rounded-[18px] p-3.5 backdrop-blur-lg relative overflow-hidden"
            style={{
              background: 'rgba(153,246,228,0.25)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 16px rgba(20,184,166,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 60%)'
            }}></div>
            
            <div className="flex items-start justify-between gap-2.5 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-[14px] font-medium" style={{ color: '#0F172A' }}>
                    Pedido recibido
                  </p>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: 'rgba(14,165,233,0.15)',
                      color: '#0284C7'
                    }}
                  >
                    Nuevo
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: '#64748B' }}>
                  Total: $24.900 · hace 3 min
                </p>
              </div>
              <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                style={{
                  background: '#14B8A6',
                  boxShadow: '0 0 8px rgba(20,184,166,0.4)'
                }}
              ></div>
            </div>
          </div>

          {/* Pedido 2 - Pago pendiente */}
          <div
            className="rounded-[18px] p-3.5 backdrop-blur-lg relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, transparent 60%)'
            }}></div>
            
            <div className="flex items-start justify-between gap-2.5 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-[14px] font-medium" style={{ color: '#0F172A' }}>
                    Comprobante pendiente
                  </p>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: 'rgba(251,191,36,0.15)',
                      color: '#D97706'
                    }}
                  >
                    Revisar
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: '#64748B' }}>
                  Esperando foto del pago
                </p>
                <p className="text-[12px]" style={{ color: '#64748B' }}>
                  Pedido #1043
                </p>
              </div>
              <Clock className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#D97706' }} strokeWidth={2.5} />
            </div>
          </div>

          {/* Pedido 3 - Pago verificado */}
          <div
            className="rounded-[18px] p-3.5 backdrop-blur-lg relative overflow-hidden"
            style={{
              background: 'rgba(153,246,228,0.15)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 16px rgba(20,184,166,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 60%)'
            }}></div>
            
            <div className="flex items-start justify-between gap-2.5 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-[14px] font-medium" style={{ color: '#0F172A' }}>
                    Pago verificado
                  </p>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1"
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      color: '#059669'
                    }}
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                    OK
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: '#64748B' }}>
                  Cuenta actualizada
                </p>
                <p className="text-[12px]" style={{ color: '#64748B' }}>
                  Pedido #1030
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Stacked for mobile */}
        <div className="space-y-2.5 mb-3.5 relative z-10">
          {/* Button 1 - Confirmar pago */}
          <button 
            className="w-full py-3.5 rounded-[18px] font-medium text-[14px] relative overflow-hidden"
            style={{
              background: 'rgba(153,246,228,0.35)',
              border: '1px solid rgba(255,255,255,0.6)',
              color: '#0D9488',
              boxShadow: '0 4px 12px rgba(20,184,166,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 60%)'
            }}></div>
            <div className="flex items-center justify-center gap-2 relative z-10">
              <Check className="w-4 h-4" strokeWidth={2.5} />
              <span>Confirmar pago</span>
            </div>
          </button>

          {/* Button 2 - Ver historial */}
          <button 
            className="w-full py-3.5 rounded-[18px] font-medium text-[14px] relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.6)',
              color: '#475569',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)'
            }}></div>
            <div className="flex items-center justify-center gap-2 relative z-10">
              <List className="w-4 h-4" strokeWidth={2.5} />
              <span>Ver historial</span>
            </div>
          </button>
        </div>

        {/* Footer sync pill - Mobile centered */}
        <div 
          className="rounded-[16px] px-4 py-3 backdrop-blur-xl relative overflow-hidden relative z-10"
          style={{
            background: 'rgba(153,246,228,0.2)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 8px rgba(20,184,166,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)'
          }}></div>
          
          <div className="flex items-center justify-center gap-2 relative z-10">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16,185,129,0.5)'
              }}
            ></div>
            <p className="text-[12px] font-medium text-center" style={{ color: '#0D9488' }}>
              Sincronizado en tiempo real
            </p>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full opacity-6 pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)'
        }}></div>
      </div>
    </div>
  );
}
