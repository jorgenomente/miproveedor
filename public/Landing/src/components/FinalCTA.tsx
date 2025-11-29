import { ArrowRight, Calendar } from 'lucide-react';
import Isotipo from '../imports/Isotipo';

export default function FinalCTA() {
  return (
    <section className="px-6 py-40">
      <div className="max-w-[1240px] mx-auto">
        <div className="relative overflow-hidden rounded-[40px] px-16 py-20 md:px-20 md:py-24 backdrop-blur-2xl" style={{
          background: 'linear-gradient(135deg, #0F2930 0%, #1E777A 25%, #0A3538 60%, #073F43 100%)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.08)'
        }}>
          {/* Enhanced cosmic glow effects con animaciones */}
          <div className="absolute top-0 left-0 w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full blur-3xl opacity-30" style={{
            background: 'radial-gradient(circle, rgba(31,111,117,0.6) 0%, transparent 70%)',
            animation: 'ambientGlowBreath 10s ease-in-out infinite'
          }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full blur-3xl opacity-20" style={{
            background: 'radial-gradient(circle, rgba(223,243,239,0.5) 0%, transparent 70%)',
            animation: 'ambientGlowFloat 12s ease-in-out infinite'
          }}></div>
          <div className="absolute bottom-0 right-0 w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full blur-3xl opacity-15" style={{
            background: 'radial-gradient(circle, rgba(136,158,147,0.5) 0%, transparent 70%)',
            animation: 'ambientGlowPulse 11s ease-in-out infinite 2s'
          }}></div>
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-12">
            {/* Heading fuerte */}
            <h2 className="text-[36px] md:text-5xl lg:text-6xl text-white max-w-4xl mx-auto leading-[1.15] px-2" style={{
              fontWeight: 700
            }}>
              ¿Listo para tener todo ordenado y dejar atrás el caos?
            </h2>
            
            {/* Subcopy */}
            <p className="text-[18px] md:text-[22px] max-w-2xl mx-auto px-2 leading-relaxed" style={{
              color: 'rgba(223,243,239,0.9)'
            }}>
              Probalo gratis y descubrí por qué los distribuidores lo eligen para organizar su operación.
            </p>
            
            {/* CTA Buttons - Principales y secundarios */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 pt-4">
              <div className="relative w-full sm:w-auto group">
                {/* Glow respirante alrededor del botón */}
                <div className="absolute -inset-[2px] rounded-[18px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: 'radial-gradient(circle, rgba(31,111,117,0.8) 0%, rgba(20,184,166,0.6) 100%)',
                  filter: 'blur(8px)'
                }}></div>
                <div className="absolute -inset-[2px] rounded-[18px] pointer-events-none" style={{
                  background: 'radial-gradient(circle, rgba(31,111,117,0.5) 0%, rgba(20,184,166,0.4) 100%)',
                  filter: 'blur(8px)',
                  animation: 'buttonGlowPulse 3s ease-in-out infinite'
                }}></div>
                
                <button 
                  className="w-full sm:w-auto px-10 py-[22px] text-[18px] font-semibold text-white rounded-[18px] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(31,111,117,0.95) 0%, rgba(20,184,166,0.9) 100%)',
                    boxShadow: '0 12px 32px rgba(31,111,117,0.4), inset 0 2px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)'
                    }}
                  ></div>
                  <span className="relative">Probar MiProveedor</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="relative w-full sm:w-auto group">
                {/* Glow respirante para botón secundario */}
                <div className="absolute -inset-[2px] rounded-[18px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(223,243,239,0.2) 100%)',
                  filter: 'blur(8px)'
                }}></div>
                
                <button 
                  className="w-full sm:w-auto px-10 py-[22px] text-[18px] font-medium backdrop-blur-xl rounded-[18px] transition-all duration-300 relative overflow-hidden hover:scale-105 flex items-center justify-center gap-3"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    color: '#F4F2ED',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)'
                  }}></div>
                  <Calendar className="w-5 h-5 relative z-10" strokeWidth={2} />
                  <span className="relative z-10">Agendar una demo</span>
                </button>
              </div>
            </div>
            
            {/* Trust indicators más visible */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-8 pt-12 text-base">
              <div className="flex items-center gap-3">
                <div 
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{
                    background: 'rgba(223,243,239,0.8)',
                    boxShadow: '0 2px 12px rgba(223,243,239,0.5)'
                  }}
                ></div>
                <span style={{ color: 'rgba(223,243,239,0.85)' }}>Configuración en 5 minutos</span>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: 'rgba(136,158,147,0.8)',
                    boxShadow: '0 2px 12px rgba(136,158,147,0.5)'
                  }}
                ></div>
                <span style={{ color: 'rgba(223,243,239,0.85)' }}>Soporte en español</span>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: 'rgba(223,243,239,0.8)',
                    boxShadow: '0 2px 12px rgba(223,243,239,0.5)'
                  }}
                ></div>
                <span style={{ color: 'rgba(223,243,239,0.85)' }}>Sin permanencia</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with logo */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-11 h-11 md:w-12 md:h-12">
              <Isotipo />
            </div>
            <span className="text-[#2F2F2F] text-[19px] md:text-xl" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              MiProveedor
            </span>
          </div>
          <div className="text-[#889E93] text-[15px] md:text-base">
            MiProveedor.app · Pedidos B2B sin caos
          </div>
        </div>
      </div>
    </section>
  );
}
