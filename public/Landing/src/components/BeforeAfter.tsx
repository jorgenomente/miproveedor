import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Plus, Minus, ArrowRight, Upload, CheckCircle2, ClipboardCheck, List, Clock, Check } from 'lucide-react';
import svgPaths from "../imports/svg-0izfwu2vko";
import { useThemeTokens } from '../lib/useThemeTokens';

// Hook para detectar cuando un elemento entra en viewport
function useInView(threshold = 0.2) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isInView };
}

export default function BeforeAfter() {
  const { tokens, isDark } = useThemeTokens();
  const { ref: storyboardRef, isInView } = useInView(0.15);
  const chaosStoryboard = [
    {
      title: 'Mensajes desordenados',
      description: 'Pedidos perdidos entre fotos, audios y conversaciones de WhatsApp.',
      gradient: 'rgba(183,163,248,0.08)',
      accentColor: '#B7A3F8',
      glowColor: 'rgba(183,163,248,0.25)',
      IllustrationComponent: WhatsAppChaos
    },
    {
      title: 'Comprobantes perdidos',
      description: 'Pagos duplicados, sin comprobantes o que nunca llegaron.',
      gradient: 'rgba(255,111,97,0.08)',
      accentColor: '#FF6F61',
      glowColor: 'rgba(255,111,97,0.25)',
      IllustrationComponent: ComprobantesPerdidos
    },
    {
      title: 'Catálogos desactualizados',
      description: 'Formularios rotos, Excel desactualizados o PDFs que nadie abre.',
      gradient: 'rgba(79,212,228,0.08)',
      accentColor: '#4FD4E4',
      glowColor: 'rgba(79,212,228,0.25)',
      IllustrationComponent: CatalogosDesactualizados
    },
    {
      title: 'Administración saturada',
      description: 'Intentando unir datos de WhatsApp, Excel y anotaciones dispersas.',
      gradient: 'rgba(183,163,248,0.08)',
      accentColor: '#B7A3F8',
      glowColor: 'rgba(183,163,248,0.25)',
      IllustrationComponent: AdministracionSaturada
    }
  ];

  return (
    <section className="px-6 pt-16 pb-40 md:pt-24 md:pb-40 lg:pt-32 lg:pb-40 relative overflow-hidden" style={{
      background: tokens.backgrounds.section
    }}>
      {/* Enhanced atmospheric glow - AQUA/MENTA dominante con animaciones */}
      <div className="absolute top-[10%] left-[20%] w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.aqua,
        opacity: isDark ? '0.12' : '0.25',
        animation: 'ambientGlowBreath 9s ease-in-out infinite'
      }}></div>
      
      <div className="absolute top-[25%] right-[15%] w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.subtle,
        opacity: isDark ? '0.14' : '0.3',
        animation: 'ambientGlowFloat 11s ease-in-out infinite'
      }}></div>

      <div className="absolute bottom-[20%] left-[30%] w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.aqua,
        opacity: isDark ? '0.10' : '0.22',
        animation: 'ambientGlowPulse 8s ease-in-out infinite'
      }}></div>

      {/* Micro lavanda - SOLO neblina final */}
      <div className="absolute bottom-[15%] right-[25%] w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.lavender,
        opacity: isDark ? '0.06' : '0.05',
        animation: 'ambientGlowBreath 10s ease-in-out infinite 3s'
      }}></div>
      
      {/* Subtle noise texture overlay for premium feel */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        backgroundSize: '200px 200px',
        opacity: isDark ? '0.025' : '0.012'
      }}></div>
      
      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* PROBLEMA - Storyboard horizontal con 4 viñetas */}
        <div className="mb-40" ref={storyboardRef}>
          {/* Label centrado */}
          <div className="text-center mb-16">
            <div 
              className="inline-block rounded-[16px] px-6 py-3 backdrop-blur-[20px] relative overflow-hidden"
              style={{
                background: tokens.badge.background,
                border: `1.5px solid ${tokens.badge.border}`,
                boxShadow: tokens.badge.shadow + `, ${tokens.glass.innerGlow}`
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(183,163,248,0.12) 0%, transparent 60%)'
                  : 'linear-gradient(135deg, rgba(183,163,248,0.08) 0%, transparent 60%)'
              }}></div>
              <span className="text-[15px] relative z-10" style={{ 
                color: isDark ? 'rgba(183,163,248,0.95)' : '#9F7AEA',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600
              }}>
                Si vendés a tiendas, este caos te es familiar
              </span>
            </div>
          </div>

          {/* Storyboard - 4 viñetas horizontales con ilustraciones ANIMADAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {chaosStoryboard.map((item, index) => {
              const IllustrationComponent = item.IllustrationComponent;
              return (
                <div
                  key={index}
                  className="chaos-card group"
                  style={{
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? 'translateY(0)' : 'translateY(8px)',
                    transition: `opacity 400ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 50}ms, transform 400ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 50}ms`
                  }}
                >
                  <div
                    className="group rounded-[28px] p-8 backdrop-blur-[24px] relative overflow-hidden transition-all duration-250"
                    style={{
                      background: isDark 
                        ? 'rgba(25,60,60,0.80)' // 10-15% más luminosidad
                        : tokens.glass.card,
                      border: `1.5px solid ${tokens.glass.border}`,
                      boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`
                    }}
                  >
                    {/* Hover glow suave en el borde */}
                    <div className="absolute -inset-[1px] rounded-[28px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-250" style={{
                      background: `linear-gradient(135deg, ${item.glowColor} 0%, ${item.accentColor}80 100%)`,
                      filter: 'blur(12px)'
                    }}></div>
                    
                    {/* Soft gradient accent */}
                    <div className="absolute inset-0 pointer-events-none rounded-[28px] transition-opacity duration-200 group-hover:opacity-100" style={{
                      background: `linear-gradient(135deg, ${item.gradient} 0%, transparent 60%)`,
                      opacity: 0.7
                    }}></div>

                    {/* Glow on hover - reducido a 0.14 */}
                    <div 
                      className="absolute inset-0 pointer-events-none rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        boxShadow: isDark
                          ? `0 0 30px ${item.glowColor}`
                          : `0 0 30px ${item.glowColor}, 0 24px 70px rgba(0,0,0,0.08)`,
                        filter: 'blur(1px)',
                        opacity: isDark ? 0.14 : 1
                      }}
                    ></div>
                    
                    {/* Illustration con micro-animación */}
                    <div className="mb-6 relative z-10 flex items-center justify-center illustration-container">
                      <div 
                        className="w-full h-[186px] flex items-center justify-center transition-all duration-180 group-hover:scale-[1.02] group-hover:-translate-y-[2px]" 
                        style={{
                          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.04))'
                        }}
                      >
                        <IllustrationComponent />
                      </div>

                      {/* Glow interno en ilustración - muy tenue */}
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-180"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${item.glowColor} 0%, transparent 70%)`,
                          filter: 'blur(20px)'
                        }}
                      ></div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-[17px] mb-3 relative z-10 leading-snug" style={{
                      color: isDark ? tokens.text.heading : '#314158',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600
                    }}>
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-[14px] leading-relaxed relative z-10" style={{
                      color: isDark ? tokens.text.body : '#64748B',
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      {item.description}
                    </p>

                    {/* Indicador micro de color (ícono/highlight) */}
                    <div 
                      className="absolute top-6 right-6 w-3 h-3 rounded-full transition-all duration-160 group-hover:scale-110 group-hover:translate-y-[-1px]"
                      style={{
                        background: item.accentColor,
                        opacity: 0.5,
                        boxShadow: `0 2px 8px ${item.glowColor}`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caption bajo la sección */}
          <div className="text-center px-4">
            <p className="text-[15px] italic relative z-10" style={{ 
              color: isDark ? tokens.text.muted : '#889E93',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 400
            }}>
              Así trabajan miles de distribuidores cada semana.
            </p>
          </div>
        </div>

        {/* OBJETIVO - Main Section Header */}
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <h2 className="text-[32px] md:text-4xl lg:text-5xl mb-6 leading-tight px-4" style={{
            color: isDark ? tokens.text.heading : '#1A1A1A',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600
          }}>
            Una experiencia diseñada para ambos lados del negocio
          </h2>
          <p className="text-[17px] md:text-xl px-4" style={{ 
            color: isDark ? tokens.text.body : '#66707A',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 400
          }}>
            Optimizada para tiendas y distribuidores que necesitan precisión, velocidad y orden en cada pedido.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-[1180px] mx-auto relative">
          {/* Glow vertical suave detrás del contenedor - solo dark */}
          {isDark && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: tokens.glows.aqua,
              filter: 'blur(80px)',
              opacity: 0.10
            }}></div>
          )}
          
          {/* LEFT - Vista del cliente (Aqua tones) */}
          <div className="space-y-8 relative z-10">
            {/* Label - Aqua badge */}
            <div 
              className="inline-block px-5 py-2.5 rounded-full text-[14px] backdrop-blur-xl relative overflow-hidden"
              style={{
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(165,243,252,0.35)',
                border: isDark ? '1px solid rgba(79,212,228,0.25)' : '1px solid rgba(255,255,255,0.6)',
                color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(6,130,178,0.95)',
                boxShadow: isDark 
                  ? '0 2px 8px rgba(79,212,228,0.12), inset 0 1px 0 rgba(79,212,228,0.15)' 
                  : '0 2px 8px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                opacity: 1
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(79,212,228,0.12) 0%, transparent 60%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)'
              }}></div>
              <span className="relative z-10">Vista del cliente</span>
            </div>

            {/* Mockup - REALISTIC CLIENT VIEW */}
            <div 
              className="rounded-[24px] p-10 backdrop-blur-[32px] relative overflow-hidden"
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
              <div className="flex items-center gap-3 mb-7 relative z-10">
                <div 
                  className="w-10 h-10 rounded-[18px] flex items-center justify-center relative overflow-hidden flex-shrink-0"
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] md:text-[17px] truncate" style={{ 
                    color: '#0F172A',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}>
                    Catálogo — KIOSCO CENTRAL
                  </h3>
                  <p className="text-[12px] md:text-[13px] truncate" style={{ 
                    color: '#64748B',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 400
                  }}>
                    Productos disponibles hoy
                  </p>
                </div>
              </div>

              {/* Product List */}
              <div className="space-y-4 mb-7 relative z-10">
                {/* Product 1 */}
                <div
                  className="rounded-[18px] p-3.5 md:p-4 backdrop-blur-lg relative overflow-hidden"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] md:text-[15px] truncate" style={{ 
                        color: '#0F172A',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 500
                      }}>
                        Coca Cola 2.25L
                      </p>
                      <p className="text-[13px] md:text-[14px] mt-0.5" style={{ 
                        color: '#0891B2',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
                      }}>
                        $1.250
                      </p>
                    </div>
                    <div 
                      className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-xl flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(6,182,212,0.2)',
                        boxShadow: '0 2px 8px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                      }}
                    >
                      <button className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <Minus className="w-3 h-3" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                      </button>
                      <span className="text-[14px] md:text-[15px] min-w-[16px] text-center" style={{ 
                        color: '#0F172A',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
                      }}>2</span>
                      <button className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <Plus className="w-3 h-3" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product 2 */}
                <div
                  className="rounded-[18px] p-3.5 md:p-4 backdrop-blur-lg relative overflow-hidden"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] md:text-[15px] truncate" style={{ 
                        color: '#0F172A',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 500
                      }}>
                        Galletas Oreo x6
                      </p>
                      <p className="text-[13px] md:text-[14px] mt-0.5" style={{ 
                        color: '#0891B2',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
                      }}>
                        $890
                      </p>
                    </div>
                    <div 
                      className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-xl flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(6,182,212,0.2)',
                        boxShadow: '0 2px 8px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                      }}
                    >
                      <button className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <Minus className="w-3 h-3" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                      </button>
                      <span className="text-[14px] md:text-[15px] min-w-[16px] text-center" style={{ 
                        color: '#0F172A',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
                      }}>1</span>
                      <button className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <Plus className="w-3 h-3" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product 3 */}
                <div
                  className="rounded-[18px] p-3.5 md:p-4 backdrop-blur-lg relative overflow-hidden"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] md:text-[15px] truncate" style={{ 
                        color: '#0F172A',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 500
                      }}>
                        Alfajor Jorgito
                      </p>
                      <p className="text-[13px] md:text-[14px] mt-0.5" style={{ 
                        color: '#0891B2',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
                      }}>
                        $450
                      </p>
                    </div>
                    <div 
                      className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-xl flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(6,182,212,0.2)',
                        boxShadow: '0 2px 8px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                      }}
                    >
                      <button className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <Minus className="w-3 h-3" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                      </button>
                      <span className="text-[14px] md:text-[15px] min-w-[16px] text-center" style={{ 
                        color: '#0F172A',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
                      }}>3</span>
                      <button className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <Plus className="w-3 h-3" style={{ color: '#0891B2' }} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Button - Enviar pedido */}
              <button 
                className="w-full py-3.5 md:py-4 rounded-[18px] text-[15px] md:text-[16px] text-white mb-4 relative overflow-hidden relative z-10"
                style={{
                  background: 'linear-gradient(135deg, #1A8D90 0%, #0B6668 100%)',
                  boxShadow: '0 8px 24px rgba(26,141,144,0.3), 0 2px 8px rgba(11,102,104,0.2)',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 500
                }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)'
                }}></div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <span>Enviar pedido</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </div>
              </button>

              {/* Secondary Card - Upload comprobante */}
              <div 
                className="rounded-[18px] p-3.5 md:p-4 backdrop-blur-xl relative overflow-hidden relative z-10"
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
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] md:text-[14px] mb-0.5" style={{ 
                      color: '#0F172A',
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 500
                    }}>
                      Subir comprobante <span style={{ color: '#94A3B8' }}>(opcional)</span>
                    </p>
                    <p className="text-[12px] md:text-[13px]" style={{ 
                      color: '#64748B',
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      Foto del pago o transferencia
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full opacity-6 pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)'
              }}></div>
            </div>

            {/* List - Clean checks with perfect alignment */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(6,182,212,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#0891B2' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Carga pedidos desde un link único y seguro
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(6,182,212,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#0891B2' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Ve su catálogo actualizado con precios y disponibilidad
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(6,182,212,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#0891B2' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Sube comprobantes sin errores ni conversaciones duplicadas
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(6,182,212,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#0891B2' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Consulta su estado de cuenta en tiempo real
                </p>
              </div>
            </div>

            {/* Editorial message - Small premium card */}
            <div 
              className="rounded-[20px] px-6 py-4 backdrop-blur-xl relative overflow-hidden"
              style={{
                background: isDark ? 'rgba(79,212,228,0.12)' : 'rgba(165,243,252,0.2)',
                border: isDark ? '1px solid rgba(79,212,228,0.3)' : '1px solid rgba(255,255,255,0.6)',
                boxShadow: isDark 
                  ? '0 4px 12px rgba(79,212,228,0.15), inset 0 1px 0 rgba(79,212,228,0.2)'
                  : '0 4px 12px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(79,212,228,0.15) 0%, transparent 60%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)'
              }}></div>
              <p className="text-[15px] relative z-10 leading-relaxed" style={{ 
                color: isDark ? tokens.brand.aquaPrimary : '#0891B2',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500
              }}>
                Todo en un panel pensado para que las tiendas no pierdan tiempo.
              </p>
            </div>
          </div>

          {/* RIGHT - Vista del distribuidor (Cool aqua/gray-green) */}
          <div className="space-y-8">
            {/* Label - Cool gray-green badge */}
            <div 
              className="inline-block px-5 py-2.5 rounded-full text-[14px] backdrop-blur-xl relative overflow-hidden"
              style={{
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(153,246,228,0.3)',
                border: isDark ? '1px solid rgba(79,212,228,0.25)' : '1px solid rgba(255,255,255,0.6)',
                color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(13,148,136,0.95)',
                boxShadow: isDark 
                  ? '0 2px 8px rgba(79,212,228,0.12), inset 0 1px 0 rgba(79,212,228,0.15)' 
                  : '0 2px 8px rgba(20,184,166,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                opacity: 1
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(79,212,228,0.12) 0%, transparent 60%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)'
              }}></div>
              <span className="relative z-10">Vista del distribuidor</span>
            </div>

            {/* Mockup - REALISTIC DISTRIBUTOR VIEW */}
            <div 
              className="rounded-[24px] p-10 backdrop-blur-[32px] relative overflow-hidden"
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

              {/* Header */}
              <div className="flex items-center gap-3 mb-7 relative z-10">
                <div 
                  className="w-10 h-10 rounded-[18px] flex items-center justify-center relative overflow-hidden flex-shrink-0"
                  style={{
                    background: 'rgba(20,184,166,0.1)',
                    boxShadow: '0 4px 12px rgba(20,184,166,0.15), inset 0 1px 0 rgba(255,255,255,0.7)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)'
                  }}></div>
                  <ClipboardCheck className="w-5 h-5 relative z-10" style={{ color: '#14B8A6' }} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] md:text-[17px] truncate" style={{ 
                    color: '#0F172A',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}>
                    Pedidos de la tienda — KIOSCO CENTRAL
                  </h3>
                  <p className="text-[12px] md:text-[13px] truncate" style={{ 
                    color: '#64748B',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 400
                  }}>
                    Pedidos listos para procesar
                  </p>
                </div>
              </div>

              {/* Pedido List */}
              <div className="space-y-4 mb-7 relative z-10">
                {/* Pedido 1 - Recibido */}
                <div
                  className="rounded-[18px] p-3.5 md:p-4 backdrop-blur-lg relative overflow-hidden"
                  style={{
                    background: 'rgba(153,246,228,0.25)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 4px 16px rgba(20,184,166,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 60%)'
                  }}></div>
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] md:text-[15px]" style={{ 
                          color: '#0F172A',
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 500
                        }}>
                          Pedido recibido
                        </p>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[11px] md:text-[12px]"
                          style={{
                            background: 'rgba(14,165,233,0.15)',
                            color: '#0284C7',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 500
                          }}
                        >
                          Nuevo
                        </span>
                      </div>
                      <p className="text-[12px] md:text-[13px]" style={{ 
                        color: '#64748B',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 400
                      }}>
                        Total: $24.900 · hace 3 min
                      </p>
                    </div>
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{
                        background: '#14B8A6',
                        boxShadow: '0 0 8px rgba(20,184,166,0.4)'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Pedido 2 - Pago pendiente */}
                <div
                  className="rounded-[18px] p-3.5 md:p-4 backdrop-blur-lg relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, transparent 60%)'
                  }}></div>
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] md:text-[15px]" style={{ 
                          color: '#0F172A',
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 500
                        }}>
                          Comprobante pendiente
                        </p>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[11px] md:text-[12px]"
                          style={{
                            background: 'rgba(251,191,36,0.15)',
                            color: '#D97706',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 500
                          }}
                        >
                          Revisar
                        </span>
                      </div>
                      <p className="text-[12px] md:text-[13px]" style={{ 
                        color: '#64748B',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 400
                      }}>
                        Esperando foto del pago · Pedido #1043
                      </p>
                    </div>
                    <Clock className="w-4.5 h-4.5 flex-shrink-0 mt-1" style={{ color: '#D97706' }} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Pedido 3 - Pago verificado */}
                <div
                  className="rounded-[18px] p-3.5 md:p-4 backdrop-blur-lg relative overflow-hidden"
                  style={{
                    background: 'rgba(153,246,228,0.15)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 4px 16px rgba(20,184,166,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 60%)'
                  }}></div>
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] md:text-[15px]" style={{ 
                          color: '#0F172A',
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 500
                        }}>
                          Pago verificado
                        </p>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[11px] md:text-[12px] flex items-center gap-1"
                          style={{
                            background: 'rgba(16,185,129,0.15)',
                            color: '#059669',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 500
                          }}
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                          OK
                        </span>
                      </div>
                      <p className="text-[12px] md:text-[13px]" style={{ 
                        color: '#64748B',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 400
                      }}>
                        Cuenta actualizada · Pedido #1030
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mb-4 relative z-10">
                {/* Button 1 - Confirmar pago */}
                <button 
                  className="py-3 md:py-3.5 rounded-[18px] text-[13px] md:text-[14px] relative overflow-hidden"
                  style={{
                    background: 'rgba(153,246,228,0.35)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    color: '#0D9488',
                    boxShadow: '0 4px 12px rgba(20,184,166,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 60%)'
                  }}></div>
                  <div className="flex items-center justify-center gap-1.5 relative z-10">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Confirmar pago</span>
                  </div>
                </button>

                {/* Button 2 - Ver historial */}
                <button 
                  className="py-3 md:py-3.5 rounded-[18px] text-[13px] md:text-[14px] relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    color: '#475569',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)'
                  }}></div>
                  <div className="flex items-center justify-center gap-1.5 relative z-10">
                    <List className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Ver historial</span>
                  </div>
                </button>
              </div>

              {/* Footer mini-card - Sync status */}
              <div 
                className="rounded-[16px] px-3.5 md:px-4 py-2.5 md:py-3 backdrop-blur-xl relative overflow-hidden relative z-10"
                style={{
                  background: 'rgba(153,246,228,0.2)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 2px 8px rgba(20,184,166,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)'
                }}></div>
                
                <div className="flex items-center gap-2 relative z-10">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: '#10B981',
                      boxShadow: '0 0 8px rgba(16,185,129,0.5)'
                    }}
                  ></div>
                  <p className="text-[12px] md:text-[13px]" style={{ 
                    color: '#0D9488',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}>
                    Sincronizado en tiempo real
                  </p>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full opacity-6 pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)'
              }}></div>
            </div>

            {/* List - Clean checks with perfect alignment */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(20,184,166,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(20,184,166,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#14B8A6' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Recibe pedidos listos para procesar
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(20,184,166,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(20,184,166,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#14B8A6' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Valida pagos y comprobantes con un solo clic
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(20,184,166,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(20,184,166,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#14B8A6' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Gestiona estados, entregas y observaciones
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(20,184,166,0.1)',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.1)'
                      : '0 2px 8px rgba(20,184,166,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                    background: isDark 
                      ? 'linear-gradient(180deg, rgba(79,212,228,0.2) 0%, transparent 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                  }}></div>
                  <CheckCircle2 className="w-3.5 h-3.5 relative z-10" style={{ 
                    color: isDark ? tokens.brand.aquaPrimary : '#14B8A6' 
                  }} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ 
                  color: isDark ? tokens.text.body : '#334155',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Centraliza clientes, pedidos y saldos en un único panel
                </p>
              </div>
            </div>

            {/* Editorial message - Small premium card */}
            <div 
              className="rounded-[20px] px-6 py-4 backdrop-blur-xl relative overflow-hidden"
              style={{
                background: isDark ? 'rgba(79,212,228,0.12)' : 'rgba(153,246,228,0.2)',
                border: isDark ? '1px solid rgba(79,212,228,0.3)' : '1px solid rgba(255,255,255,0.6)',
                boxShadow: isDark 
                  ? '0 4px 12px rgba(79,212,228,0.15), inset 0 1px 0 rgba(79,212,228,0.2)'
                  : '0 4px 12px rgba(20,184,166,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(79,212,228,0.15) 0%, transparent 60%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)'
              }}></div>
              <p className="text-[15px] relative z-10 leading-relaxed" style={{ 
                color: isDark ? tokens.brand.aquaPrimary : '#0D9488',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500
              }}>
                Más claridad, menos caos operativo y cero WhatsApps dispersos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .chaos-card:hover > div {
          transform: translateY(-4px);
        }

        .chaos-card > div {
          transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 200ms ease-out;
        }

        .chaos-card:hover > div {
          backdrop-filter: blur(28px);
          box-shadow: 0 24px 70px rgba(0,0,0,0.08), 0 10px 30px rgba(0,0,0,0.04), inset 0 2px 0 rgba(255,255,255,0.95);
        }
      `}} />
    </section>
  );
}

// Illustration Components from Figma Import
function WhatsAppChaos() {
  return (
    <div className="h-[186px] overflow-clip relative shrink-0 w-full" data-name="WhatsAppChaos" style={{ transform: 'scale(0.65)' }}>
      <div className="absolute inset-[14.58%_14.29%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 155 132">
          <path d={svgPaths.p709eb00} fill="var(--fill-0, #B7A3F8)" id="Vector" opacity="0.08" />
        </svg>
      </div>
      <div className="absolute inset-1/4" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 109 93">
          <path d={svgPaths.pcd9cb00} fill="var(--fill-0, #4FD4E4)" id="Vector" opacity="0.06" />
        </svg>
      </div>
      {/* Group - Message bubble with person icon */}
      <div className="absolute contents inset-[42.08%_63.21%_26.67%_18.75%]" data-name="Group">
        <div className="absolute inset-[53.33%_66.43%_26.67%_20%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 38">
            <path d={svgPaths.p21be8d00} fill="var(--fill-0, #E8EEF4)" id="Vector" opacity="0.85" />
          </svg>
        </div>
        <div className="absolute inset-[42.08%_66.43%_42.08%_20%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
            <path d={svgPaths.p26f21c80} fill="var(--fill-0, #FFE4D6)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[42.5%_68.41%_52.5%_21.98%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 10">
            <path d={svgPaths.p2bdf1480} fill="var(--fill-0, #B7A3F8)" id="Vector" opacity="0.6" />
          </svg>
        </div>
        <div className="absolute inset-[48.54%_77.32%_48.54%_20.89%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 6">
            <path d={svgPaths.pe6a3e00} fill="var(--fill-0, #4FD4E4)" id="Vector" opacity="0.45" />
          </svg>
        </div>
      </div>
      {/* Paper/document group */}
      <div className="absolute contents inset-[62.92%_67.86%_8.75%_17.14%]" data-name="Group">
        <div className="absolute inset-[62.92%_67.86%_8.75%_17.14%]" data-name="Vector">
          <div className="absolute inset-[-2.21%_-3.57%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35 56">
              <path d={svgPaths.p32411780} fill="var(--fill-0, white)" id="Vector" opacity="0.95" stroke="var(--stroke-0, #B7A3F8)" strokeWidth="2.32496" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-[66.25%_69.29%_12.08%_18.57%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27 41">
            <path d={svgPaths.p299a9bc0} fill="var(--fill-0, #F7F9FB)" id="Vector" />
          </svg>
        </div>
      </div>
      {/* Alert notification */}
      <div className="absolute contents inset-[18.75%_33.93%_60.42%_44.29%]" data-name="Group">
        <div className="absolute inset-[18.75%_33.93%_60.42%_46.43%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 43 39">
            <path d={svgPaths.p20e6f900} fill="var(--fill-0, white)" id="Vector" opacity="0.92" />
          </svg>
        </div>
        <div className="absolute inset-[18.75%_33.93%_60.42%_46.43%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 43 39">
            <path d={svgPaths.p20e6f900} fill="var(--fill-0, #FF6F61)" id="Vector" opacity="0.06" />
          </svg>
        </div>
        <div className="absolute inset-[24.58%_45.71%_72.08%_51.43%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
            <path d={svgPaths.p335c1400} fill="var(--fill-0, #FF6F61)" id="Vector" opacity="0.45" />
          </svg>
        </div>
      </div>
      {/* Audio wave */}
      <div className="absolute contents inset-[37.5%_5%_46.67%_69.64%]" data-name="Group">
        <div className="absolute inset-[37.5%_7.14%_46.67%_69.64%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 51 30">
            <path d={svgPaths.p16dc1880} fill="var(--fill-0, white)" id="Vector" opacity="0.92" />
          </svg>
        </div>
        <div className="absolute inset-[37.5%_7.14%_46.67%_69.64%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 51 30">
            <path d={svgPaths.p16dc1880} fill="var(--fill-0, #4FD4E4)" id="Vector" opacity="0.06" />
          </svg>
        </div>
        <div className="absolute inset-[42.5%_23.93%_51.67%_73.21%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 11">
            <path d={svgPaths.p20fcb200} fill="var(--fill-0, #4FD4E4)" id="Vector" opacity="0.45" />
          </svg>
        </div>
      </div>
      {/* Text/message bubble */}
      <div className="absolute contents inset-[60.42%_13.93%_21.25%_57.14%]" data-name="Group">
        <div className="absolute inset-[60.42%_16.07%_21.25%_57.14%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 59 35">
            <path d={svgPaths.p221c8400} fill="var(--fill-0, white)" id="Vector" opacity="0.92" />
          </svg>
        </div>
        <div className="absolute inset-[60.42%_16.07%_21.25%_57.14%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 59 35">
            <path d={svgPaths.p221c8400} fill="var(--fill-0, #B7A3F8)" id="Vector" opacity="0.06" />
          </svg>
        </div>
      </div>
      {/* Question mark bubble */}
      <div className="absolute contents inset-[77.08%_36.43%_7.08%_42.86%]" data-name="Group">
        <div className="absolute inset-[77.08%_36.43%_9.58%_42.86%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 25">
            <path d={svgPaths.p385b9400} fill="var(--fill-0, white)" id="Vector" opacity="0.95" />
          </svg>
        </div>
        <div className="absolute inset-[77.08%_36.43%_9.58%_42.86%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 25">
            <path d={svgPaths.p385b9400} fill="var(--fill-0, #4FD4E4)" id="Vector" opacity="0.08" />
          </svg>
        </div>
        <p className="absolute bottom-[12.35%] font-['Inter:Bold',sans-serif] leading-[normal] left-1/2 not-italic right-[43.55%] text-[#4fd4e4] text-[12.4px] text-center text-nowrap top-[79.58%] whitespace-pre" style={{ fontWeight: 700 }}>¿?</p>
      </div>
      {/* Note/sticky note */}
      <div className="absolute bottom-[60%] contents left-[12.5%] right-[68.57%] top-1/4" data-name="Group">
        <div className="absolute bottom-[60%] left-[14.29%] right-[68.57%] top-1/4" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 38 28">
            <path d={svgPaths.p2c2d3830} fill="var(--fill-0, white)" id="Vector" opacity="0.88" />
          </svg>
        </div>
        <div className="absolute bottom-[60%] left-[14.29%] right-[68.57%] top-1/4" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 38 28">
            <path d={svgPaths.p2c2d3830} fill="var(--fill-0, #B7A3F8)" id="Vector" opacity="0.06" />
          </svg>
        </div>
      </div>
      {/* Decorative dot */}
      <div className="absolute inset-[14.17%_44.29%_80.83%_51.43%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p34ff3a00} fill="var(--fill-0, #4FD4E4)" id="Vector" opacity="0.814529" />
        </svg>
      </div>
    </div>
  );
}

function ComprobantesPerdidos() {
  return (
    <div className="h-[186px] w-full relative flex items-center justify-center" style={{ transform: 'scale(0.8)' }}>
      {/* File/document with X */}
      <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
        {/* Document shape */}
        <rect x="20" y="10" width="80" height="110" rx="8" fill="white" opacity="0.92" stroke="#FF6F61" strokeWidth="2"/>
        <rect x="20" y="10" width="80" height="110" rx="8" fill="#FF6F61" opacity="0.06"/>
        
        {/* Document lines */}
        <line x1="35" y1="35" x2="85" y2="35" stroke="#FF6F61" strokeWidth="2" opacity="0.3" strokeLinecap="round"/>
        <line x1="35" y1="50" x2="75" y2="50" stroke="#FF6F61" strokeWidth="2" opacity="0.3" strokeLinecap="round"/>
        <line x1="35" y1="65" x2="80" y2="65" stroke="#FF6F61" strokeWidth="2" opacity="0.3" strokeLinecap="round"/>
        
        {/* Big X mark */}
        <line x1="40" y1="75" x2="80" y2="105" stroke="#FF6F61" strokeWidth="4" strokeLinecap="round"/>
        <line x1="80" y1="75" x2="40" y2="105" stroke="#FF6F61" strokeWidth="4" strokeLinecap="round"/>
        
        {/* Alert circle */}
        <circle cx="90" cy="30" r="12" fill="white" opacity="0.92"/>
        <circle cx="90" cy="30" r="12" fill="#FF6F61" opacity="0.15"/>
        <text x="90" y="36" fontSize="16" fill="#FF6F61" textAnchor="middle" fontWeight="bold">!</text>
      </svg>
    </div>
  );
}

function CatalogosDesactualizados() {
  return (
    <div className="h-[186px] w-full relative flex items-center justify-center" style={{ transform: 'scale(0.75)' }}>
      {/* Excel/table with warning */}
      <svg width="140" height="160" viewBox="0 0 140 160" fill="none">
        {/* Table/spreadsheet */}
        <rect x="15" y="20" width="110" height="90" rx="6" fill="white" opacity="0.92" stroke="#4FD4E4" strokeWidth="2"/>
        <rect x="15" y="20" width="110" height="90" rx="6" fill="#4FD4E4" opacity="0.06"/>
        
        {/* Grid lines */}
        <line x1="15" y1="50" x2="125" y2="50" stroke="#4FD4E4" strokeWidth="1.5" opacity="0.3"/>
        <line x1="15" y1="75" x2="125" y2="75" stroke="#4FD4E4" strokeWidth="1.5" opacity="0.3"/>
        <line x1="52" y1="20" x2="52" y2="110" stroke="#4FD4E4" strokeWidth="1.5" opacity="0.3"/>
        <line x1="88" y1="20" x2="88" y2="110" stroke="#4FD4E4" strokeWidth="1.5" opacity="0.3"/>
        
        {/* Diagonal warning line */}
        <line x1="20" y1="25" x2="120" y2="105" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        
        {/* Clock icon (outdated) */}
        <circle cx="70" cy="130" r="18" fill="white" opacity="0.92" stroke="#4FD4E4" strokeWidth="2"/>
        <circle cx="70" cy="130" r="18" fill="#4FD4E4" opacity="0.08"/>
        <line x1="70" y1="118" x2="70" y2="130" stroke="#4FD4E4" strokeWidth="2" strokeLinecap="round"/>
        <line x1="70" y1="130" x2="77" y2="130" stroke="#4FD4E4" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function AdministracionSaturada() {
  return (
    <div className="h-[186px] w-full relative flex items-center justify-center" style={{ transform: 'scale(0.7)' }}>
      {/* Overlapping scattered documents and notes */}
      <svg width="150" height="180" viewBox="0 0 150 180" fill="none">
        {/* Background document 1 (tilted left) */}
        <g transform="rotate(-12 75 90)">
          <rect x="30" y="40" width="70" height="90" rx="6" fill="white" opacity="0.88" stroke="#B7A3F8" strokeWidth="1.5"/>
          <rect x="30" y="40" width="70" height="90" rx="6" fill="#B7A3F8" opacity="0.06"/>
          <line x1="40" y1="60" x2="85" y2="60" stroke="#B7A3F8" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
          <line x1="40" y1="75" x2="80" y2="75" stroke="#B7A3F8" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
        </g>
        
        {/* Middle document 2 */}
        <rect x="40" y="30" width="70" height="90" rx="6" fill="white" opacity="0.9" stroke="#4FD4E4" strokeWidth="1.5"/>
        <rect x="40" y="30" width="70" height="90" rx="6" fill="#4FD4E4" opacity="0.06"/>
        <line x1="50" y1="50" x2="95" y2="50" stroke="#4FD4E4" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"/>
        <line x1="50" y1="65" x2="90" y2="65" stroke="#4FD4E4" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"/>
        <line x1="50" y1="80" x2="95" y2="80" stroke="#4FD4E4" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"/>
        
        {/* Front document 3 (tilted right) */}
        <g transform="rotate(8 75 90)">
          <rect x="50" y="50" width="70" height="90" rx="6" fill="white" opacity="0.92" stroke="#FF6F61" strokeWidth="1.5"/>
          <rect x="50" y="50" width="70" height="90" rx="6" fill="#FF6F61" opacity="0.06"/>
          <line x1="60" y1="70" x2="105" y2="70" stroke="#FF6F61" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
          <line x1="60" y1="85" x2="100" y2="85" stroke="#FF6F61" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
        </g>
        
        {/* Stress lines/confusion marks */}
        <line x1="10" y1="20" x2="25" y2="10" stroke="#B7A3F8" strokeWidth="2" opacity="0.4" strokeLinecap="round"/>
        <line x1="125" y1="25" x2="140" y2="15" stroke="#4FD4E4" strokeWidth="2" opacity="0.4" strokeLinecap="round"/>
        <line x1="15" y1="150" x2="30" y2="160" stroke="#FF6F61" strokeWidth="2" opacity="0.4" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
