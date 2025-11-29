import { useState, useEffect } from 'react';
import { Receipt, Link2, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useThemeTokens } from '../lib/useThemeTokens';

export default function Hero() {
  const { tokens, isDark } = useThemeTokens();
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let timeoutId: number;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const scrollY = window.scrollY;
        const maxScroll = 800;
        const scrollProgress = Math.min(scrollY / maxScroll, 1);
        
        const maxYOffset = 6;
        const maxXOffset = 1;
        
        const y = scrollProgress * maxYOffset;
        const x = scrollProgress * maxXOffset;
        
        setParallaxOffset({ x, y });
      }, 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-16 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32" style={{
      background: tokens.backgrounds.hero
    }}>
      {/* Enhanced atmospheric glow con animaciones */}
      <div className="absolute top-[15%] right-[25%] w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.aqua,
        opacity: tokens.glows.opacity,
        animation: 'ambientGlowBreath 8s ease-in-out infinite'
      }}></div>
      
      <div className="absolute top-[30%] left-[10%] w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.subtle,
        opacity: isDark ? '0.12' : '0.20',
        animation: 'ambientGlowFloat 12s ease-in-out infinite'
      }}></div>

      <div className="absolute bottom-[20%] right-[15%] w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.subtle,
        opacity: isDark ? '0.10' : '0.18',
        animation: 'ambientGlowPulse 10s ease-in-out infinite'
      }}></div>

      {/* Micro lavanda */}
      <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.lavender,
        opacity: isDark ? '0.06' : '0.05',
        animation: 'ambientGlowBreath 9s ease-in-out infinite 2s'
      }}></div>
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        backgroundSize: '200px 200px',
        opacity: isDark ? '0.025' : '0.012'
      }}></div>
      
      <div className="max-w-[1240px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left side - Content */}
          <div className="space-y-8 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            {/* Pill Badge */}
            <div className="inline-flex items-center justify-center">
              <div 
                className="pill-badge px-6 py-3 rounded-[16px] backdrop-blur-[20px] relative overflow-hidden"
                style={{
                  background: tokens.badge.background,
                  border: `1.5px solid ${tokens.badge.border}`,
                  boxShadow: tokens.badge.shadow + `, ${tokens.glass.innerGlow}`
                }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(79,212,228,0.15) 0%, rgba(165,243,252,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(79,212,228,0.1) 0%, rgba(165,243,252,0.08) 100%)'
                }}></div>
                
                <div 
                  className="absolute inset-0 pointer-events-none light-sweep"
                  style={{
                    backgroundImage: isDark 
                      ? 'linear-gradient(110deg, transparent 30%, rgba(79,212,228,0.3) 50%, transparent 70%)'
                      : 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                    backgroundSize: '200% 100%'
                  }}
                ></div>
                
                <span className="text-[15px] relative z-10" style={{ 
                  color: tokens.badge.text,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600
                }}>
                  Pedidos B2B sin caos
                </span>
              </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-[40px] md:text-5xl lg:text-6xl leading-[1.1] tracking-tight px-4 lg:px-0" style={{
              color: tokens.text.heading,
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600
            }}>
              El sistema que elimina el caos de pedidos y comprobantes.
            </h1>
            
            {/* Subheading */}
            <p className="text-[17px] md:text-[19px] leading-relaxed px-4 lg:px-0" style={{
              color: tokens.text.body,
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 400,
              maxWidth: '580px'
            }}>
              Pedidos, pagos y cuentas corrientes ordenadas en un solo panel.<br />
              Menos WhatsApp, menos planillas, menos errores.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4 px-4 lg:px-0">
              <div className="relative w-full sm:w-auto group">
                {/* Glow respirante alrededor del botón */}
                <div className="absolute -inset-[2px] rounded-[16px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: tokens.glows.aqua,
                  filter: 'blur(8px)'
                }}></div>
                <div className="absolute -inset-[2px] rounded-[16px] pointer-events-none" style={{
                  background: tokens.glows.aqua,
                  filter: 'blur(8px)',
                  animation: 'buttonGlowPulse 3s ease-in-out infinite'
                }}></div>
                
                <button 
                  className="w-full sm:w-auto px-8 py-[18px] text-[17px] text-white rounded-[16px] hover:brightness-110 transition-all duration-300 relative overflow-hidden"
                  style={{
                    background: tokens.buttons.primary.background,
                    boxShadow: tokens.buttons.primary.shadow,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 60%)'
                  }}></div>
                  <span className="relative z-10">Probar MiProveedor</span>
                </button>
              </div>
              <div className="relative w-full sm:w-auto group">
                {/* Glow respirante para botón secundario */}
                <div className="absolute -inset-[2px] rounded-[16px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(79,212,228,0.4) 0%, rgba(165,243,252,0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(165,243,252,0.5) 0%, rgba(79,212,228,0.4) 100%)',
                  filter: 'blur(8px)'
                }}></div>
                
                <button 
                  className="w-full sm:w-auto px-8 py-[18px] text-[17px] rounded-[16px] hover:brightness-95 transition-all duration-300 backdrop-blur-xl relative overflow-hidden"
                  style={{
                    background: tokens.buttons.secondary.background,
                    border: `1.5px solid ${tokens.buttons.secondary.border}`,
                    color: tokens.buttons.secondary.text,
                    boxShadow: tokens.buttons.secondary.shadow + `, ${tokens.glass.innerGlow}`,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(79,212,228,0.15) 0%, transparent 60%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)'
                  }}></div>
                  <span className="relative z-10">Ver cómo funciona</span>
                </button>
              </div>
            </div>

            {/* Trust line */}
            <div className="pt-2 px-4 lg:px-0">
              <p className="text-[14px] md:text-[15px] italic" style={{
                color: tokens.text.muted,
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 400
              }}>
                Pensado para distribuidores que trabajan con muchas tiendas y poco tiempo.
              </p>
            </div>
          </div>
          
          {/* Right side - Product Mockup with PARALLAX */}
          <div 
            className="relative mt-12 lg:mt-0 max-w-lg mx-auto lg:max-w-none"
            style={{
              transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
              transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* Shadow below mockup */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[90%] h-[120px] pointer-events-none" style={{
              background: isDark 
                ? 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 40%, transparent 80%)'
                : 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 40%, transparent 80%)',
              filter: 'blur(70px)',
              opacity: isDark ? 0.8 : 0.6
            }}></div>

            {/* Glow aqua con animación de respiración */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[85%] h-[100px] pointer-events-none" style={{
              background: tokens.glows.aqua,
              filter: 'blur(50px)',
              opacity: isDark ? 0.5 : 0.5,
              animation: 'mockupGlow 6s ease-in-out infinite'
            }}></div>
            
            {/* Ambient light glow detrás del mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] pointer-events-none -z-10" style={{
              background: isDark 
                ? 'radial-gradient(circle, rgba(79,212,228,0.15) 0%, rgba(165,243,252,0.08) 30%, transparent 60%)'
                : 'radial-gradient(circle, rgba(165,243,252,0.25) 0%, rgba(79,212,228,0.15) 30%, transparent 60%)',
              filter: 'blur(60px)',
              animation: 'ambientGlowBreath 7s ease-in-out infinite'
            }}></div>

            {/* Main Panel - Dashboard */}
            <div 
              className="rounded-[32px] p-6 md:p-8 backdrop-blur-[32px] relative overflow-hidden"
              style={{
                background: tokens.glass.card,
                border: `1.5px solid ${tokens.glass.border}`,
                boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`,
                transform: 'perspective(1000px) rotateY(-2deg) rotateX(2deg)'
              }}
            >
              <div className="absolute inset-0 rounded-[32px] pointer-events-none" style={{
                background: isDark
                  ? 'radial-gradient(circle at 50% 0%, rgba(79,212,228,0.18) 0%, rgba(165,243,252,0.12) 50%, transparent 80%)'
                  : 'radial-gradient(circle at 50% 0%, rgba(79,212,228,0.12) 0%, rgba(165,243,252,0.08) 50%, transparent 80%)'
              }}></div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h3 className="text-[18px] md:text-[20px] mb-1" style={{
                    color: tokens.text.heading,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600
                  }}>
                    Panel de Pedidos
                  </h3>
                  <p className="text-[13px] md:text-[14px]" style={{
                    color: tokens.text.muted,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 400
                  }}>
                    Hoy · 23 de noviembre
                  </p>
                </div>
                <div 
                  className="px-4 py-2 rounded-full backdrop-blur-xl"
                  style={{
                    background: tokens.badge.background,
                    border: `1px solid ${tokens.badge.border}`,
                    boxShadow: tokens.badge.shadow
                  }}
                >
                  <span className="text-[13px]" style={{
                    color: tokens.badge.text,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600
                  }}>
                    8 nuevos
                  </span>
                </div>
              </div>

              {/* Lista de pedidos */}
              <div className="space-y-3 relative z-10">
                {/* Pedido 1 - Pagado */}
                <div
                  className="rounded-[20px] p-4 md:p-5 backdrop-blur-lg relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(79,212,228,0.12)' : 'rgba(165,243,252,0.25)',
                    border: `1px solid ${tokens.glass.border}`,
                    boxShadow: isDark 
                      ? '0 4px 16px rgba(79,212,228,0.2), inset 0 1px 0 rgba(79,212,228,0.25)'
                      : '0 4px 16px rgba(79,212,228,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(79,212,228,0.15) 0%, transparent 60%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 60%)'
                  }}></div>
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-[15px] md:text-[16px]" style={{
                          color: tokens.text.heading,
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 500
                        }}>
                          Kiosco El Trébol
                        </p>
                        <span 
                          className="px-2.5 py-1 rounded-full text-[11px] md:text-[12px] flex items-center gap-1"
                          style={{
                            background: isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.2)',
                            color: isDark ? '#6EE7B7' : '#059669',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 500
                          }}
                        >
                          <CheckCircle className="w-3 h-3" strokeWidth={2.5} />
                          Pagado
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] md:text-[14px] flex-wrap" style={{
                        color: tokens.text.muted,
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 400
                      }}>
                        <span>Pedido #2847</span>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: tokens.text.heading }}>$24.900</span>
                      </div>
                    </div>
                    <div className="text-[12px] md:text-[13px] text-right flex-shrink-0" style={{
                      color: tokens.text.muted,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      hace 5 min
                    </div>
                  </div>
                </div>

                {/* Pedido 2 - Pendiente */}
                <div
                  className="rounded-[20px] p-4 md:p-5 backdrop-blur-lg relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(13,38,38,0.5)' : 'rgba(255,255,255,0.7)',
                    border: `1px solid ${tokens.glass.border}`,
                    boxShadow: isDark 
                      ? '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(79,212,228,0.15)'
                      : '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, transparent 60%)'
                  }}></div>
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-[15px] md:text-[16px]" style={{
                          color: tokens.text.heading,
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 500
                        }}>
                          Despensa Don Mario
                        </p>
                        <span 
                          className="px-2.5 py-1 rounded-full text-[11px] md:text-[12px] flex items-center gap-1"
                          style={{
                            background: 'rgba(251,191,36,0.2)',
                            color: isDark ? '#FCD34D' : '#D97706',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 500
                          }}
                        >
                          <Clock className="w-3 h-3" strokeWidth={2.5} />
                          Pendiente
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] md:text-[14px] flex-wrap" style={{
                        color: tokens.text.muted,
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 400
                      }}>
                        <span>Pedido #2846</span>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: tokens.text.heading }}>$18.200</span>
                      </div>
                    </div>
                    <div className="text-[12px] md:text-[13px] text-right flex-shrink-0" style={{
                      color: tokens.text.muted,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      hace 12 min
                    </div>
                  </div>
                </div>

                {/* Pedido 3 - Vence pronto */}
                <div
                  className="rounded-[20px] p-4 md:p-5 backdrop-blur-lg relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(13,38,38,0.5)' : 'rgba(255,255,255,0.7)',
                    border: `1px solid ${tokens.glass.border}`,
                    boxShadow: isDark 
                      ? '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(79,212,228,0.15)'
                      : '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(135deg, rgba(255,111,97,0.08) 0%, transparent 60%)'
                  }}></div>
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-[15px] md:text-[16px]" style={{
                          color: tokens.text.heading,
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 500
                        }}>
                          Almacén La Esquina
                        </p>
                        <span 
                          className="px-2.5 py-1 rounded-full text-[11px] md:text-[12px] flex items-center gap-1"
                          style={{
                            background: 'rgba(255,111,97,0.2)',
                            color: isDark ? '#FCA5A5' : '#DC2626',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 500
                          }}
                        >
                          <AlertCircle className="w-3 h-3" strokeWidth={2.5} />
                          Vence hoy
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] md:text-[14px] flex-wrap" style={{
                        color: tokens.text.muted,
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 400
                      }}>
                        <span>Cuenta corriente</span>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: tokens.text.heading }}>$52.100</span>
                      </div>
                    </div>
                    <div className="text-[12px] md:text-[13px] text-right flex-shrink-0" style={{
                      color: tokens.text.muted,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      Hoy
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer stats */}
              <div className="mt-6 pt-6 border-t relative z-10" style={{
                borderColor: isDark ? 'rgba(79,212,228,0.15)' : 'rgba(0,0,0,0.06)'
              }}>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] md:text-[12px] mb-1" style={{
                      color: tokens.text.muted,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      Total hoy
                    </p>
                    <p className="text-[16px] md:text-[18px]" style={{
                      color: tokens.text.heading,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600
                    }}>
                      $95.200
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] md:text-[12px] mb-1" style={{
                      color: tokens.text.muted,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      Pedidos
                    </p>
                    <p className="text-[16px] md:text-[18px]" style={{
                      color: tokens.text.heading,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600
                    }}>
                      23
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] md:text-[12px] mb-1" style={{
                      color: tokens.text.muted,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 400
                    }}>
                      Tiendas
                    </p>
                    <p className="text-[16px] md:text-[18px]" style={{
                      color: tokens.text.heading,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600
                    }}>
                      18
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full pointer-events-none" style={{
                background: tokens.glows.aqua,
                opacity: isDark ? '0.12' : '0.08'
              }}></div>
            </div>

            {/* Floating element 1 - Comprobante */}
            <div 
              className="absolute -top-6 -right-4 md:-right-8 px-4 md:px-5 py-3 md:py-3.5 rounded-[20px] backdrop-blur-[24px] overflow-hidden"
              style={{
                background: tokens.glass.card,
                border: `1.5px solid ${tokens.glass.border}`,
                boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`,
                transform: 'perspective(1000px) rotateY(5deg) rotateX(-3deg)'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: tokens.glows.aqua,
                opacity: isDark ? '0.2' : '0.15'
              }}></div>
              <div className="flex items-center gap-3 relative z-10">
                <div 
                  className="w-9 h-9 rounded-[16px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: tokens.badge.background,
                    boxShadow: tokens.badge.shadow
                  }}
                >
                  <Receipt className="w-4.5 h-4.5" style={{ color: tokens.brand.aquaPrimary }} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] md:text-[14px] mb-0.5" style={{
                    color: tokens.text.heading,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}>
                    Comprobante cargado
                  </p>
                  <p className="text-[11px] md:text-[12px]" style={{
                    color: tokens.text.muted,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 400
                  }}>
                    $24.900 · Aroma Natural
                  </p>
                </div>
              </div>
            </div>

            {/* Floating element 2 - Link */}
            <div 
              className="absolute top-1/3 -left-4 md:-left-8 px-4 md:px-5 py-3 md:py-3.5 rounded-[20px] backdrop-blur-[24px] overflow-hidden hidden md:block"
              style={{
                background: tokens.glass.card,
                border: `1.5px solid ${tokens.glass.border}`,
                boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`,
                transform: 'perspective(1000px) rotateY(-5deg) rotateX(3deg)'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: tokens.glows.subtle,
                opacity: isDark ? '0.2' : '0.15'
              }}></div>
              <div className="flex items-center gap-3 relative z-10">
                <div 
                  className="w-9 h-9 rounded-[16px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: tokens.badge.background,
                    boxShadow: tokens.badge.shadow
                  }}
                >
                  <Link2 className="w-4.5 h-4.5" style={{ color: tokens.brand.aquaPrimary }} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] md:text-[14px] mb-0.5" style={{
                    color: tokens.text.heading,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}>
                    Link generado
                  </p>
                  <p className="text-[11px] md:text-[12px]" style={{
                    color: tokens.text.muted,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 400
                  }}>
                    miproveedor.app/c/abc123
                  </p>
                </div>
              </div>
            </div>

            {/* Floating element 3 - Notificación */}
            <div 
              className="absolute -bottom-6 left-8 md:left-12 px-4 md:px-5 py-3 md:py-3.5 rounded-[20px] backdrop-blur-[24px] overflow-hidden"
              style={{
                background: tokens.glass.card,
                border: `1.5px solid ${tokens.glass.border}`,
                boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`,
                transform: 'perspective(1000px) rotateY(-3deg) rotateX(-2deg)'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: tokens.glows.aqua,
                opacity: isDark ? '0.2' : '0.12'
              }}></div>
              <div className="flex items-center gap-3 relative z-10">
                <div 
                  className="w-9 h-9 rounded-[16px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: tokens.badge.background,
                    boxShadow: tokens.badge.shadow
                  }}
                >
                  <Bell className="w-4.5 h-4.5" style={{ color: tokens.brand.aquaPrimary }} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] md:text-[14px] mb-0.5" style={{
                    color: tokens.text.heading,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}>
                    Nuevo pedido
                  </p>
                  <p className="text-[11px] md:text-[12px]" style={{
                    color: tokens.text.muted,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 400
                  }}>
                    Kiosco Central · hace 2 min
                  </p>
                </div>
              </div>
            </div>

            {/* Glow effects behind floating elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{
              background: tokens.glows.aqua,
              opacity: isDark ? '0.10' : '0.12'
            }}></div>
            <div className="absolute top-1/3 -left-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{
              background: tokens.glows.subtle,
              opacity: isDark ? '0.10' : '0.12'
            }}></div>
            <div className="absolute -bottom-8 left-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{
              background: tokens.glows.subtle,
              opacity: isDark ? '0.10' : '0.12'
            }}></div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes lightSweep {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .light-sweep {
          animation: lightSweep 2.8s ease-in-out infinite;
        }

        .pill-badge {
          animation: pillGlow 4s ease-in-out infinite;
        }

        @keyframes pillGlow {
          0%, 100% {
            box-shadow: ${tokens.badge.shadow}, ${tokens.glass.innerGlow};
          }
          50% {
            box-shadow: ${tokens.badge.shadow}, 0 0 30px ${isDark ? 'rgba(79,212,228,0.3)' : 'rgba(79,212,228,0.15)'}, ${tokens.glass.innerGlow};
          }
        }
      `}} />
    </section>
  );
}
