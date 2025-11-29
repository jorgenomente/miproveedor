import { MessageSquare, CheckCircle2, Zap, TrendingUp, Clock } from 'lucide-react';
import { useThemeTokens } from '../lib/useThemeTokens';

export default function Benefits() {
  const { tokens, isDark } = useThemeTokens();

  const benefits = [
    {
      icon: MessageSquare,
      metric: '↓ 60%',
      title: 'menos mensajes de WhatsApp',
      explanation: 'Centralizá pedidos y comprobantes sin chats dispersos.',
    },
    {
      icon: CheckCircle2,
      metric: '↓ 70%',
      title: 'menos errores en pedidos',
      explanation: 'Sin cantidades mal cargadas ni artículos repetidos.',
    },
    {
      icon: Zap,
      metric: '↓ 50%',
      title: 'menos carga administrativa',
      explanation: 'Estados claros, comprobantes organizados y reportes automáticos.',
    },
    {
      icon: TrendingUp,
      metric: '+3x',
      title: 'eficiencia en cuentas corrientes',
      explanation: 'Pagos, remitos y deudas se verifican tres veces más rápido.',
    },
    {
      icon: Clock,
      metric: '+8 horas',
      title: 'ganás por semana',
      explanation: 'Automatizás tareas repetitivas y recuperás un día completo de trabajo.',
    }
  ];

  return (
    <section className="px-6 py-40 relative overflow-hidden" style={{
      background: tokens.backgrounds.section
    }}>
      {/* Soft atmospheric light - AQUA/MENTA con animaciones */}
      <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.aqua,
        opacity: isDark ? '0.12' : '0.3',
        animation: 'ambientGlowBreath 10s ease-in-out infinite'
      }}></div>
      
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.subtle,
        opacity: isDark ? '0.10' : '0.2',
        animation: 'ambientGlowFloat 12s ease-in-out infinite'
      }}></div>

      {/* Glow desde abajo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{
        background: tokens.glows.aqua,
        opacity: isDark ? '0.08' : '0.15',
        animation: 'ambientGlowPulse 9s ease-in-out infinite'
      }}></div>
      
      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-[32px] md:text-4xl lg:text-5xl leading-tight" style={{
            color: tokens.text.heading,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600
          }}>
            Resultados reales desde el primer día
          </h2>
          <p className="text-[17px] md:text-xl max-w-3xl mx-auto" style={{ 
            color: tokens.text.body,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 400
          }}>
            Mejoras cuantificables que notarás en tu operación desde la primera semana.
          </p>
        </div>
        
        {/* Metrics Cards - 5 tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const isLast = index === benefits.length - 1;
            
            return (
              <div
                key={index}
                className={`group rounded-[28px] p-9 relative backdrop-blur-2xl overflow-hidden transition-all duration-250 hover:scale-[1.02] ${isLast ? 'md:col-span-2 lg:col-span-1 md:mx-auto lg:mx-0 md:max-w-md lg:max-w-none' : ''}`}
                style={{
                  background: tokens.glass.card,
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
                
                {/* Soft inner accent */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: isDark
                    ? 'radial-gradient(circle at 70% 20%, rgba(79,212,228,0.1) 0%, transparent 60%)'
                    : 'radial-gradient(circle at 70% 20%, rgba(165,243,252,0.12) 0%, transparent 60%)'
                }}></div>

                {/* Glow tenue - Más sutil en dark */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: tokens.glows.aqua,
                  filter: 'blur(40px)',
                  opacity: isDark ? '0.12' : '0.15'
                }}></div>
                
                {/* Icon container */}
                <div 
                  className="w-14 h-14 md:w-16 md:h-16 rounded-[20px] flex items-center justify-center mb-6 relative z-10 overflow-hidden"
                  style={{
                    background: tokens.badge.background,
                    boxShadow: tokens.badge.shadow
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(79,212,228,0.2) 0%, transparent 60%)'
                      : 'linear-gradient(135deg, rgba(165,243,252,0.15) 0%, transparent 60%)'
                  }}></div>
                  <Icon className="w-7 h-7 md:w-8 md:h-8 relative z-10" style={{ 
                    color: tokens.brand.aquaPrimary 
                  }} strokeWidth={2} />
                </div>
                
                {/* Metric - Grande y bold */}
                <div className="text-4xl md:text-5xl mb-2 relative z-10 leading-none" style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  color: tokens.text.heading
                }}>
                  {benefit.metric}
                </div>
                
                {/* Title */}
                <div className="text-[16px] md:text-[17px] mb-4 relative z-10 leading-snug" style={{ 
                  color: tokens.text.subheading,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600
                }}>
                  {benefit.title}
                </div>
                
                {/* Explanation */}
                <p className="text-[14px] md:text-[15px] leading-relaxed relative z-10" style={{ 
                  color: tokens.text.body,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400
                }}>
                  {benefit.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
