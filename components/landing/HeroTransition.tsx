import { useThemeTokens } from '@/lib/landing/useThemeTokens';

export default function HeroTransition() {
  const { tokens, isDark } = useThemeTokens();

  return (
    <section className="relative overflow-hidden py-24 px-6" style={{
      background: isDark 
        ? 'linear-gradient(180deg, rgba(10,31,31,0.9) 0%, rgba(13,38,38,0.8) 30%, rgba(15,46,46,0.75) 50%, rgba(13,38,38,0.8) 70%, #0D2626 100%)'
        : 'linear-gradient(180deg, rgba(253,254,254,0.5) 0%, rgba(223,243,239,0.12) 30%, rgba(165,243,252,0.08) 50%, rgba(204,251,241,0.1) 70%, rgba(253,254,254,1) 100%)'
    }}>
      {/* Glow radial suave - aqua */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none" style={{
        background: tokens.glows.aqua,
        filter: 'blur(40px)',
        opacity: isDark ? '0.12' : '0.10'
      }}></div>

      {/* Glow inferior */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none" style={{
        background: tokens.glows.subtle,
        filter: 'blur(50px)',
        opacity: isDark ? '0.10' : '0.08'
      }}></div>

      {/* Tagline de transición */}
      <div className="max-w-[1240px] mx-auto relative z-10">
        <p className="text-center text-[16px] md:text-[17px] leading-relaxed max-w-3xl mx-auto" style={{
          color: tokens.text.muted,
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 400
        }}>
          Diseñado para distribuidores que necesitan velocidad, claridad y menos WhatsApp.
        </p>
      </div>

      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        backgroundSize: '200px 200px',
        opacity: isDark ? '0.025' : '0.012'
      }}></div>
    </section>
  );
}
