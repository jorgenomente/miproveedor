import { Link2, ShoppingBag, ClipboardCheck, CreditCard, LayoutDashboard } from 'lucide-react';
import { useThemeTokens } from '../lib/useThemeTokens';

export default function WhatIs() {
  const { tokens, isDark } = useThemeTokens();

  const solutionStoryboard = [
    {
      icon: Link2,
      title: 'Link único para cada tienda',
      description: 'Cada cliente tiene su portal personalizado. Sin confusiones, sin pedidos mezclados.',
    },
    {
      icon: ShoppingBag,
      title: 'Catálogo actualizado sin errores',
      description: 'Precios, disponibilidad y cantidades claras. Carga directa sin llamadas ni consultas.',
    },
    {
      icon: ClipboardCheck,
      title: 'Comprobantes claros y visibles',
      description: 'Suben el pago, lo ves al instante. Estados actualizados en un solo lugar.',
    },
    {
      icon: CreditCard,
      title: 'Cuenta corriente ordenada',
      description: 'Saldos, pagos y deudas sincronizados. Control real sin Excel ni anotaciones.',
    },
    {
      icon: LayoutDashboard,
      title: 'Administración simple y ágil',
      description: 'Todo centralizado: pedidos, remitos, comprobantes y reportes en un panel controlado.',
    }
  ];

  return (
    <section className="px-6 py-40 relative overflow-hidden" style={{
      background: tokens.backgrounds.section
    }}>
      {/* Soft AQUA/MENTA gradient accent con animaciones */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.subtle,
        opacity: isDark ? '0.12' : '0.25',
        animation: 'ambientGlowBreath 11s ease-in-out infinite'
      }}></div>
      
      {/* Micro lavanda - neblina mínima */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.lavender,
        opacity: isDark ? '0.06' : '0.05',
        animation: 'ambientGlowFloat 10s ease-in-out infinite 2s'
      }}></div>
      
      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* Header elegante */}
        <div className="text-center mb-20 space-y-6 relative z-10">
          <h2 className="text-[32px] md:text-4xl lg:text-5xl px-4 leading-tight" style={{
            color: tokens.text.heading,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600
          }}>
            Qué es MiProveedor.app
          </h2>
          <p className="text-[17px] md:text-[21px] max-w-3xl mx-auto leading-relaxed px-4" style={{
            color: tokens.text.body,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 400
          }}>
            El sistema que ordena todo tu flujo B2B en un solo lugar.
          </p>
        </div>

        {/* Storyboard solución - 5 viñetas */}
        <div className="space-y-8 max-w-6xl mx-auto">
          {solutionStoryboard.map((item, index) => {
            const Icon = item.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div
                key={index}
                className={`group rounded-[28px] p-10 backdrop-blur-[24px] relative overflow-hidden hover:scale-[1.01] transition-all duration-250 ${isEven ? 'md:mr-12' : 'md:ml-12'}`}
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(25,60,60,0.70) 0%, rgba(20,50,50,0.65) 100%)' // 5% más luz
                    : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
                  border: `1px solid ${tokens.glass.border}`,
                  boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`
                }}
              >
                {/* Hover glow suave en el borde */}
                <div className="absolute -inset-[1px] rounded-[28px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-250" style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(79,212,228,0.4) 0%, rgba(165,243,252,0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(165,243,252,0.5) 0%, rgba(79,212,228,0.4) 100%)',
                  filter: 'blur(12px)'
                }}></div>
                
                {/* Soft gradient accent */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: isDark
                    ? `radial-gradient(circle at ${isEven ? '20%' : '80%'} 30%, rgba(79,212,228,0.15) 0%, transparent 70%)`
                    : `radial-gradient(circle at ${isEven ? '20%' : '80%'} 30%, rgba(165,243,252,0.12) 0%, transparent 70%)`
                }}></div>
                
                <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
                  {/* Icon container */}
                  <div 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-[22px] flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                    style={{
                      background: isDark ? 'rgba(79,212,228,0.12)' : 'rgba(165,243,252,0.2)',
                      boxShadow: isDark 
                        ? '0 8px 20px rgba(79,212,228,0.2), inset 0 2px 0 rgba(79,212,228,0.25)'
                        : '0 8px 20px rgba(0,0,0,0.04), inset 0 2px 0 rgba(255,255,255,0.8)'
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(79,212,228,0.2) 0%, transparent 60%)'
                        : 'linear-gradient(135deg, rgba(165,243,252,0.15) 0%, transparent 60%)'
                    }}></div>
                    <Icon className="w-9 h-9 md:w-11 md:h-11 relative z-10" style={{ 
                      color: tokens.brand.aquaPrimary 
                    }} strokeWidth={2} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-[20px] md:text-[22px] mb-3 leading-snug" style={{
                      color: tokens.text.heading,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600
                    }}>
                      {item.title}
                    </h3>
                    <p className="text-[16px] md:text-[17px] leading-relaxed" style={{
                      color: tokens.text.body,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
