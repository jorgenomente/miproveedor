import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import Isotipo from './imports/Isotipo';
import { useThemeTokens } from '@/lib/landing/useThemeTokens';

export default function Footer() {
  const { tokens } = useThemeTokens();

  return (
    <footer className="relative overflow-hidden px-6 pt-32 pb-12" style={{
      background: tokens.backgrounds.footer
    }}>
      {/* Glow radial desde el centro inferior con animación */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] pointer-events-none" style={{
        background: tokens.glows.aqua,
        filter: 'blur(60px)',
        opacity: '0.15',
        animation: 'ambientGlowBreath 8s ease-in-out infinite'
      }}></div>

      {/* Glow superior suave */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{
        background: tokens.glows.subtle,
        filter: 'blur(50px)',
        opacity: '0.08',
        animation: 'ambientGlowFloat 12s ease-in-out infinite'
      }}></div>

      {/* Toque mínimo de lavanda lateral */}
      <div className="absolute top-1/3 right-0 w-[400px] h-[600px] pointer-events-none" style={{
        background: tokens.glows.lavender,
        filter: 'blur(70px)',
        opacity: '0.3',
        animation: 'ambientGlowPulse 10s ease-in-out infinite 2s'
      }}></div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        backgroundSize: '200px 200px',
        opacity: '0.02'
      }}></div>

      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* Card glass principal con CTA */}
        <div 
          className="rounded-[40px] px-8 py-16 md:px-16 md:py-20 lg:px-20 lg:py-24 backdrop-blur-[24px] relative overflow-hidden mb-20"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: `1.5px solid ${tokens.glass.border}`,
            boxShadow: tokens.glass.shadow + `, ${tokens.glass.innerGlow}`
          }}
        >
          {/* Inner glow aqua */}
          <div className="absolute inset-0 pointer-events-none rounded-[40px]" style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(79,212,228,0.12) 0%, rgba(165,243,252,0.06) 40%, transparent 80%)'
          }}></div>

          {/* Glow decorativo inferior */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{
            background: tokens.glows.aqua,
            filter: 'blur(40px)',
            opacity: '0.1'
          }}></div>

          {/* Content */}
          <div className="relative z-10 text-center space-y-10">
            {/* Título principal */}
            <h2 className="text-[32px] md:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.15] px-2" style={{
              color: tokens.text.heading,
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600
            }}>
              ¿Listo para tener todo ordenado y dejar atrás el caos?
            </h2>
            
            {/* Subtexto */}
            <p className="text-[17px] md:text-[20px] lg:text-[22px] max-w-3xl mx-auto px-2 leading-relaxed" style={{
              color: tokens.text.body,
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 400
            }}>
              Probá MiProveedor y descubrí cómo reducir mensajes, errores y trabajo manual en tu operación B2B.
            </p>
            
            {/* Botones con glow */}
            <div className="flex flex-col sm:flex-row justify-center gap-5 pt-6">
              {/* Botón primario */}
              <div className="relative w-full sm:w-auto group">
                {/* Glow respirante alrededor del botón */}
                <div className="absolute -inset-[2px] rounded-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: tokens.glows.aqua,
                  filter: 'blur(8px)'
                }}></div>
                <div className="absolute -inset-[2px] rounded-[20px] pointer-events-none" style={{
                  background: tokens.glows.aqua,
                  filter: 'blur(8px)',
                  animation: 'buttonGlowPulse 3s ease-in-out infinite'
                }}></div>
                
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: tokens.glows.aqua,
                  filter: 'blur(12px)',
                  opacity: '0.4'
                }}></div>

                <Link 
                  href="/demo"
                  className="w-full sm:w-auto px-10 py-[22px] text-[17px] md:text-[18px] text-white rounded-[20px] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden hover:scale-105"
                  style={{
                    background: tokens.buttons.primary.background,
                    boxShadow: tokens.buttons.primary.shadow + ', inset 0 2px 0 rgba(255,255,255,0.2)',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 600
                  }}
                >
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      backgroundImage: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                      backgroundSize: '200% 100%',
                      animation: 'lightSweepButton 2s ease-in-out infinite'
                    }}
                  ></div>

                  <div 
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 70%)'
                    }}
                  ></div>

                  <span className="relative z-10">Probar MiProveedor</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" strokeWidth={2.5} />
                </Link>
              </div>
              
              {/* Botón secundario */}
              <div className="relative w-full sm:w-auto group">
                {/* Glow respirante para botón secundario */}
                <div className="absolute -inset-[2px] rounded-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: 'linear-gradient(135deg, rgba(79,212,228,0.4) 0%, rgba(165,243,252,0.3) 100%)',
                  filter: 'blur(8px)'
                }}></div>
                
                <Link 
                  href="/demo"
                  className="w-full sm:w-auto px-10 py-[22px] text-[17px] md:text-[18px] backdrop-blur-xl rounded-[20px] transition-all duration-300 relative overflow-hidden hover:scale-105 flex items-center justify-center gap-3"
                  style={{
                    background: tokens.buttons.secondary.background,
                    border: `1.5px solid ${tokens.buttons.secondary.border}`,
                    color: tokens.buttons.secondary.text,
                    boxShadow: tokens.buttons.secondary.shadow + `, ${tokens.glass.innerGlow}`,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    background: 'linear-gradient(135deg, rgba(79,212,228,0.08) 0%, transparent 60%)'
                  }}></div>
                  <Calendar className="w-5 h-5 relative z-10" strokeWidth={2} />
                  <span className="relative z-10">Agendar una demo</span>
                </Link>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 md:gap-8 pt-8 text-[14px] md:text-[15px]">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    background: tokens.brand.aquaPrimary,
                    boxShadow: '0 2px 12px rgba(79,212,228,0.6)'
                  }}
                ></div>
                <span style={{ 
                  color: tokens.text.muted,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Configuración en 5 minutos
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: tokens.brand.aquaSecondary,
                    boxShadow: '0 2px 12px rgba(165,243,252,0.5)'
                  }}
                ></div>
                <span style={{ 
                  color: tokens.text.muted,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Soporte en español
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: tokens.brand.aquaLight,
                    boxShadow: '0 2px 12px rgba(204,251,241,0.5)'
                  }}
                ></div>
                <span style={{ 
                  color: tokens.text.muted,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  Sin permanencia
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles del footer - info base */}
        <div className="border-t pt-10" style={{
          borderColor: 'rgba(255,255,255,0.1)'
        }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo + tagline */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10">
                  <Isotipo />
                </div>
                <span className="text-[18px]" style={{ 
                  color: tokens.text.heading,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600
                }}>
                  MiProveedor
                </span>
              </div>
              <p className="text-[14px] text-center md:text-left" style={{
                color: tokens.text.muted,
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 400
              }}>
                Hecho para distribuidores que quieren menos caos y más control.
              </p>
            </div>

            {/* Links mínimos */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-6 text-[14px]">
              <a 
                href="#" 
                className="transition-colors duration-200 hover:text-white"
                style={{
                  color: tokens.text.muted,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}
              >
                Términos
              </a>
              <a 
                href="#" 
                className="transition-colors duration-200 hover:text-white"
                style={{
                  color: tokens.text.muted,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}
              >
                Privacidad
              </a>
              <span style={{
                color: tokens.text.subtle,
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 400
              }}>
                © 2025 MiProveedor
              </span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes lightSweepButton {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}} />
    </footer>
  );
}
