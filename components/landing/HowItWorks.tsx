import { Settings, ShoppingCart, LayoutDashboard } from 'lucide-react';
import { useThemeTokens } from '@/lib/landing/useThemeTokens';

export default function HowItWorks() {
  const { tokens, isDark } = useThemeTokens();

  const steps = [
    {
      number: '01',
      icon: Settings,
      title: 'El distribuidor configura su panel',
      features: [
        'Carga catálogo',
        'Define precios',
        'Genera links únicos'
      ],
      mockupText: 'Panel proveedor',
    },
    {
      number: '02',
      icon: ShoppingCart,
      title: 'Las tiendas hacen sus pedidos',
      features: [
        'Ven catálogo',
        'Cargan cantidades',
        'Adjuntan comprobantes',
        'Ven historial'
      ],
      mockupText: 'Vista tienda',
    },
    {
      number: '03',
      icon: LayoutDashboard,
      title: 'Todo se sincroniza automáticamente',
      features: [
        'Estados claros',
        'Pagos registrados',
        'Cuenta corriente ordenada',
        'Reportes listos'
      ],
      mockupText: 'Dashboard final',
    }
  ];

  return (
    <section id="como-funciona" className="px-6 py-40 relative overflow-hidden" style={{
      background: tokens.backgrounds.section
    }}>
      {/* Glow vertical leve para atmósfera - centro */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full pointer-events-none" style={{
        background: isDark 
          ? 'linear-gradient(180deg, transparent 0%, rgba(79,212,228,0.15) 20%, rgba(165,243,252,0.12) 50%, rgba(79,212,228,0.15) 80%, transparent 100%)'
          : 'linear-gradient(180deg, transparent 0%, rgba(79,212,228,0.08) 20%, rgba(165,243,252,0.06) 50%, rgba(79,212,228,0.08) 80%, transparent 100%)',
        boxShadow: isDark 
          ? '0 0 80px rgba(79,212,228,0.2), 0 0 40px rgba(165,243,252,0.15)'
          : '0 0 80px rgba(79,212,228,0.1), 0 0 40px rgba(165,243,252,0.08)',
        filter: 'blur(2px)'
      }}></div>

      {/* Atmospheric lighting - AQUA/MENTA con animaciones */}
      <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.aqua,
        opacity: isDark ? '0.10' : '0.25',
        animation: 'ambientGlowBreath 9s ease-in-out infinite'
      }}></div>
      
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.subtle,
        opacity: isDark ? '0.08' : '0.2',
        animation: 'ambientGlowFloat 11s ease-in-out infinite'
      }}></div>
      
      {/* Micro lavanda */}
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.lavender,
        opacity: isDark ? '0.05' : '0.04',
        animation: 'ambientGlowPulse 10s ease-in-out infinite 2s'
      }}></div>

      {/* Glow vertical desde arriba */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{
        background: tokens.glows.aqua,
        filter: 'blur(40px)',
        opacity: isDark ? '0.06' : '0.05'
      }}></div>

      {/* Glow vertical desde abajo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{
        background: tokens.glows.aqua,
        filter: 'blur(40px)',
        opacity: isDark ? '0.06' : '0.05'
      }}></div>

      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-[32px] md:text-4xl lg:text-5xl leading-tight" style={{
            color: tokens.text.heading,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600
          }}>
            Cómo funciona MiProveedor
          </h2>
          <p className="text-[17px] md:text-xl max-w-3xl mx-auto" style={{ 
            color: tokens.text.body,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 400
          }}>
            Tres pasos claros para que pedidos y pagos fluyan sin caos.
          </p>
        </div>

        {/* Steps - 3 columnas con glass */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="group rounded-[32px] p-10 relative overflow-hidden hover:scale-[1.01] transition-all duration-250 h-full"
                style={{
                  background: tokens.glass.card,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1.4px solid ${tokens.glass.border}`,
                  boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`
                }}
              >
                {/* Hover glow suave en el borde */}
                <div className="absolute -inset-[1px] rounded-[32px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-250" style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(79,212,228,0.4) 0%, rgba(165,243,252,0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(165,243,252,0.5) 0%, rgba(79,212,228,0.4) 100%)',
                  filter: 'blur(12px)'
                }}></div>
                
                {/* Soft inner glow - Más sutil */}
                <div className="absolute inset-0 pointer-events-none rounded-[32px]" style={{
                  background: isDark
                    ? 'radial-gradient(circle at 50% 0%, rgba(79,212,228,0.08) 0%, transparent 70%)'
                    : 'radial-gradient(circle at 50% 0%, rgba(165,243,252,0.12) 0%, transparent 70%)'
                }}></div>

                {/* Atmospheric glow behind - Reducido */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: tokens.glows.aqua,
                  filter: 'blur(60px)',
                  opacity: isDark ? '0.10' : '0.2'
                }}></div>

                {/* Number - Grande con micro-glow suave */}
                <div className="relative mb-6">
                  {/* Micro-glow detrás del número - Más sutil */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      textShadow: isDark 
                        ? `0 0 30px rgba(79,212,228,0.25), 0 0 15px rgba(79,212,228,0.25)`
                        : `0 0 40px rgba(165,243,252,0.2), 0 0 20px rgba(165,243,252,0.2)`,
                      filter: 'blur(8px)',
                      opacity: isDark ? 0.4 : 0.4
                    }}
                  >
                    <div className="text-[120px] md:text-[140px] leading-none" style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 800,
                      color: tokens.brand.aquaPrimary,
                      opacity: isDark ? 0.08 : 0.06
                    }}>
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Número principal con gradiente */}
                  <div className="text-[120px] md:text-[140px] leading-none relative z-10" style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 800,
                    backgroundImage: isDark 
                      ? `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, ${tokens.brand.aquaPrimary} 100%)`
                      : `linear-gradient(135deg, rgba(17,17,17,0.15) 0%, ${tokens.brand.aquaPrimary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    opacity: isDark ? 0.12 : 0.08
                  }}>
                    {step.number}
                  </div>
                </div>

                {/* Icon - Glass circle con blur */}
                <div 
                  className="w-16 h-16 md:w-18 md:h-18 rounded-[22px] flex items-center justify-center mb-7 relative z-10 overflow-hidden"
                  style={{
                    background: tokens.badge.background,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1.2px solid ${tokens.glass.border}`,
                    boxShadow: tokens.badge.shadow
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)'
                  }}></div>
                  <Icon className="w-8 h-8 md:w-9 md:h-9 relative z-10" style={{ 
                    color: tokens.brand.aquaPrimary 
                  }} strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className="text-[19px] md:text-[21px] mb-5 relative z-10 leading-snug" style={{
                  color: tokens.text.heading,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600
                }}>
                  {step.title}
                </h3>

                {/* Features list */}
                <ul className="space-y-3 mb-6 relative z-10">
                  {step.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-[14px] md:text-[15px]" style={{ 
                      color: tokens.text.body,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      <div 
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                        style={{ 
                          background: tokens.brand.aquaPrimary,
                          boxShadow: isDark 
                            ? `0 0 6px rgba(79,212,228,0.35)`
                            : `0 0 6px rgba(165,243,252,0.15)`
                        }}
                      ></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Mini-mockup placeholder - Glass */}
                <div 
                  className="rounded-[18px] p-4 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(10,31,31,0.7)' : 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: `1px solid ${tokens.glass.border}`,
                    boxShadow: isDark 
                      ? '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                      : '0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(79,212,228,0.08) 0%, transparent 60%)'
                      : 'linear-gradient(135deg, rgba(165,243,252,0.1) 0%, transparent 60%)'
                  }}></div>
                  <p className="text-[13px] text-center relative z-10 italic" style={{ 
                    color: tokens.text.muted,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 400
                  }}>
                    {step.mockupText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        backgroundSize: '200px 200px',
        opacity: isDark ? '0.025' : '0.012'
      }}></div>
    </section>
  );
}
