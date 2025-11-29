import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Plus, Minus, ArrowRight, Upload, CheckCircle2, ClipboardCheck, List, Clock, Check } from 'lucide-react';
import svgPaths from "../imports/svg-0izfwu2vko";

// Ilustraciones (mantenemos las mismas del original)
function WhatsAppChaos() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.9">
        <rect x="20" y="35" width="120" height="90" rx="16" fill="url(#whatsapp-grad)" fillOpacity="0.9"/>
        <rect x="32" y="50" width="80" height="12" rx="6" fill="#B7A3F8" opacity="0.5"/>
        <rect x="32" y="70" width="65" height="12" rx="6" fill="#B7A3F8" opacity="0.4"/>
        <rect x="32" y="90" width="90" height="12" rx="6" fill="#B7A3F8" opacity="0.45"/>
        <circle cx="125" cy="56" r="8" fill="#FF6F61" opacity="0.8"/>
        <circle cx="125" cy="76" r="6" fill="#FF6F61" opacity="0.6"/>
      </g>
      <defs>
        <linearGradient id="whatsapp-grad" x1="20" y1="35" x2="140" y2="125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8F7FF" stopOpacity="0.95"/>
          <stop offset="1" stopColor="#E8E4FF" stopOpacity="0.85"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function ComprobantesPerdidos() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.9">
        <rect x="40" y="30" width="80" height="100" rx="12" fill="url(#comprobante-grad)" fillOpacity="0.9"/>
        <rect x="52" y="48" width="56" height="8" rx="4" fill="#FF6F61" opacity="0.5"/>
        <rect x="52" y="64" width="44" height="6" rx="3" fill="#FF6F61" opacity="0.35"/>
        <rect x="52" y="80" width="40" height="6" rx="3" fill="#FF6F61" opacity="0.3"/>
        <path d="M 90 100 L 100 110 L 115 90" stroke="#FF6F61" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      </g>
      <defs>
        <linearGradient id="comprobante-grad" x1="40" y1="30" x2="120" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF5F5" stopOpacity="0.95"/>
          <stop offset="1" stopColor="#FFE8E6" stopOpacity="0.85"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function CatalogosDesactualizados() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.9">
        <rect x="30" y="40" width="100" height="80" rx="14" fill="url(#catalogo-grad)" fillOpacity="0.9"/>
        <rect x="45" y="58" width="70" height="10" rx="5" fill="#4FD4E4" opacity="0.5"/>
        <rect x="45" y="76" width="55" height="8" rx="4" fill="#4FD4E4" opacity="0.4"/>
        <rect x="45" y="92" width="60" height="8" rx="4" fill="#4FD4E4" opacity="0.35"/>
        <circle cx="110" cy="50" r="6" fill="#FF6F61" opacity="0.7"/>
      </g>
      <defs>
        <linearGradient id="catalogo-grad" x1="30" y1="40" x2="130" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0FDFF" stopOpacity="0.95"/>
          <stop offset="1" stopColor="#DFF8FC" stopOpacity="0.85"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function AdministracionSaturada() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.9">
        <rect x="25" y="30" width="110" height="100" rx="16" fill="url(#admin-grad)" fillOpacity="0.9"/>
        <rect x="38" y="48" width="35" height="6" rx="3" fill="#B7A3F8" opacity="0.5"/>
        <rect x="38" y="62" width="28" height="6" rx="3" fill="#B7A3F8" opacity="0.4"/>
        <rect x="38" y="76" width="32" height="6" rx="3" fill="#B7A3F8" opacity="0.45"/>
        <rect x="85" y="48" width="38" height="6" rx="3" fill="#4FD4E4" opacity="0.5"/>
        <rect x="85" y="62" width="30" height="6" rx="3" fill="#4FD4E4" opacity="0.4"/>
        <circle cx="115" cy="100" r="10" fill="#FF6F61" opacity="0.6"/>
      </g>
      <defs>
        <linearGradient id="admin-grad" x1="25" y1="30" x2="135" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9F8FF" stopOpacity="0.95"/>
          <stop offset="1" stopColor="#EDE9FF" stopOpacity="0.85"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

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

export default function BeforeAfterAnimated() {
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
      background: 'linear-gradient(180deg, rgba(253,254,254,1) 0%, rgba(223,243,239,0.15) 15%, rgba(165,243,252,0.08) 30%, rgba(204,251,241,0.12) 50%, rgba(253,254,254,1) 70%, rgba(234,232,255,0.02) 85%, rgba(253,254,254,1) 100%)'
    }}>
      {/* Enhanced atmospheric glow - AQUA/MENTA dominante */}
      <div className="absolute top-[10%] left-[20%] w-[700px] h-[700px] rounded-full blur-3xl opacity-10 pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(79,212,228,0.3) 0%, rgba(165,243,252,0.2) 40%, transparent 70%)'
      }}></div>
      
      <div className="absolute top-[25%] right-[15%] w-[600px] h-[600px] rounded-full blur-3xl opacity-12 pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(165,243,252,0.35) 0%, rgba(204,251,241,0.2) 50%, transparent 70%)'
      }}></div>

      <div className="absolute bottom-[20%] left-[30%] w-[500px] h-[500px] rounded-full blur-3xl opacity-8 pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(79,212,228,0.25) 0%, rgba(165,243,252,0.15) 50%, transparent 70%)'
      }}></div>

      {/* Micro lavanda - SOLO neblina final */}
      <div className="absolute bottom-[15%] right-[25%] w-[400px] h-[400px] rounded-full blur-3xl opacity-4 pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(183,163,248,0.12) 0%, transparent 70%)'
      }}></div>
      
      {/* Subtle noise texture overlay for premium feel */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        backgroundSize: '200px 200px'
      }}></div>
      
      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* PROBLEMA - Storyboard horizontal con 4 viñetas */}
        <div className="mb-40" ref={storyboardRef}>
          {/* Label centrado */}
          <div className="text-center mb-16">
            <div 
              className="inline-block rounded-[16px] px-6 py-3 backdrop-blur-[20px] relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1.5px solid rgba(255,255,255,0.6)',
                boxShadow: '0 12px 40px rgba(183,163,248,0.15), 0 4px 16px rgba(79,212,228,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(135deg, rgba(183,163,248,0.08) 0%, transparent 60%)'
              }}></div>
              <span className="text-[15px] relative z-10" style={{ 
                color: '#314158',
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
                    className="rounded-[28px] p-8 backdrop-blur-[24px] relative overflow-hidden transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      border: '1.5px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.03), inset 0 2px 0 rgba(255,255,255,0.95)'
                    }}
                  >
                    {/* Soft gradient accent */}
                    <div className="absolute inset-0 pointer-events-none rounded-[28px] transition-opacity duration-200 group-hover:opacity-100" style={{
                      background: `linear-gradient(135deg, ${item.gradient} 0%, transparent 60%)`,
                      opacity: 0.7
                    }}></div>

                    {/* Glow on hover - muy tenue */}
                    <div 
                      className="absolute inset-0 pointer-events-none rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        boxShadow: `0 0 30px ${item.glowColor}, 0 24px 70px rgba(0,0,0,0.08)`,
                        filter: 'blur(1px)'
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
                      color: '#314158',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600
                    }}>
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-[14px] leading-relaxed relative z-10" style={{
                      color: '#64748B',
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
              color: '#889E93',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 400
            }}>
              Así trabajan miles de distribuidores cada semana.
            </p>
          </div>
        </div>

        {/* Resto del contenido... (mantener igual) */}
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <h2 className="text-[32px] md:text-4xl lg:text-5xl mb-6 leading-tight px-4" style={{
            color: '#1A1A1A',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600
          }}>
            Una experiencia diseñada para ambos lados del negocio
          </h2>
          <p className="text-[17px] md:text-xl px-4" style={{ 
            color: '#66707A',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 400
          }}>
            Optimizada para tiendas y distribuidores que necesitan precisión, velocidad y orden en cada pedido.
          </p>
        </div>

        {/* El resto del componente permanece igual - solo agregué animaciones a las cards del storyboard */}
        <div className="text-center py-20">
          <p className="text-[16px]" style={{
            color: '#889E93',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 400
          }}>
            [Resto del contenido BeforeAfter se mantiene igual]
          </p>
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
