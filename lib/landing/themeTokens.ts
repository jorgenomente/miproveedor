/**
 * TEMA LIGHT BASE - Extraído exactamente de MiProveedor – LIGHT BASE (Figma)
 * Fondo crema/pastel, glass claro, tipografía oscura
 */
export const lightTheme = {
  // Fondos principales
  backgrounds: {
    primary: 'linear-gradient(180deg, #FFFBF5 0%, #FFFFFF 15%, rgba(165,243,252,0.05) 40%, #FFFFFF 70%, #F7F9FB 100%)',
    hero: 'linear-gradient(180deg, #FFFBF5 0%, #FFFFFF 15%, rgba(165,243,252,0.05) 40%, #FFFFFF 70%, #F7F9FB 100%)',
    section: 'linear-gradient(180deg, #F7F9FB 0%, #FFFFFF 25%, rgba(165,243,252,0.04) 50%, #FFFFFF 75%, #F7F9FB 100%)',
    footer: 'linear-gradient(180deg, #F7F9FB 0%, #FFFFFF 20%, rgba(165,243,252,0.06) 40%, #FFFFFF 60%, #F7F9FB 100%)',
  },

  // Glass/Cards
  glass: {
    card: 'rgba(255,255,255,0.85)',
    cardHover: 'rgba(255,255,255,0.9)',
    border: 'rgba(255,255,255,0.6)',
    shadow: '0 32px 90px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.02)',
    innerGlow: 'inset 0 2px 0 rgba(255,255,255,0.8)',
  },

  // Tipografía
  text: {
    heading: '#111111',
    subheading: '#444444',
    body: '#555555',
    muted: '#888888',
    subtle: '#AAAAAA',
  },

  // Colores de marca
  brand: {
    aquaPrimary: '#0891B2',    // Aqua oscuro para CTAs
    aquaSecondary: '#14B8A6',  // Teal
    aquaLight: '#A5F3FC',      // Aqua claro para acentos
    lavender: '#9F7AEA',       // Lavanda
    coral: '#FF6F61',          // Coral
  },

  // Glows y efectos
  glows: {
    aqua: 'radial-gradient(circle, rgba(79,212,228,0.2) 0%, rgba(165,243,252,0.15) 40%, transparent 70%)',
    lavender: 'radial-gradient(circle, rgba(183,163,248,0.15) 0%, transparent 70%)',
    subtle: 'radial-gradient(circle, rgba(165,243,252,0.25) 0%, rgba(204,251,241,0.15) 50%, transparent 70%)',
    opacity: '0.25',
  },

  // Badges y pills
  badge: {
    background: 'rgba(165,243,252,0.25)',
    border: 'rgba(255,255,255,0.6)',
    text: '#0891B2',
    shadow: '0 12px 40px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)',
  },

  // Botones
  buttons: {
    primary: {
      background: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
      shadow: '0 8px 24px rgba(8,145,178,0.25), 0 2px 8px rgba(14,116,144,0.15)',
      text: '#FFFFFF',
    },
    secondary: {
      background: 'rgba(255,255,255,0.8)',
      border: 'rgba(255,255,255,0.7)',
      text: '#475569',
      shadow: '0 4px 16px rgba(0,0,0,0.03)',
    },
  },
};

/**
 * TEMA DARK BASE - Extraído exactamente de MiProveedor – DARK BASE (Figma)
 * Deep teal/petróleo, glass oscuro, glow cinematográfico
 * REFINADO: Mejorada legibilidad y cohesión visual
 */
export const darkTheme = {
  // Fondos principales - Unificados para mejor cohesión
  backgrounds: {
    primary: 'linear-gradient(180deg, #0A1F1F 0%, #0D2626 20%, #0F2E2E 50%, #0D2626 80%, #0A1F1F 100%)',
    hero: 'linear-gradient(180deg, #0A1F1F 0%, #0D2626 20%, #0F2E2E 50%, #0D2626 80%, #0A1F1F 100%)',
    section: 'linear-gradient(180deg, #0D2626 0%, #0F2E2E 30%, #112E2E 50%, #0F2E2E 70%, #0D2626 100%)',
    footer: 'linear-gradient(180deg, #0C3339 0%, #0F4349 15%, #165B62 35%, #1A6D75 50%, #0E4A52 70%, #0A3A42 100%)',
  },

  // Glass/Cards - Mejorado contraste para legibilidad
  glass: {
    card: 'rgba(20,55,55,0.75)',
    cardHover: 'rgba(25,60,60,0.85)',
    border: 'rgba(79,212,228,0.3)',
    shadow: '0 32px 90px rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.25), 0 0 30px rgba(79,212,228,0.1)',
    innerGlow: 'inset 0 2px 0 rgba(79,212,228,0.15)',
  },

  // Tipografía - Mejorado contraste para legibilidad
  text: {
    heading: 'rgba(255,255,255,0.98)',
    subheading: 'rgba(255,255,255,0.92)',
    body: 'rgba(235,245,250,0.88)',
    muted: 'rgba(200,225,235,0.75)',
    subtle: 'rgba(165,243,252,0.65)',
  },

  // Colores de marca
  brand: {
    aquaPrimary: '#4FD4E4',    // Aqua brillante
    aquaSecondary: '#3BBFD2',  // Aqua medio
    aquaLight: '#A5F3FC',      // Aqua claro
    lavender: '#B7A3F8',       // Lavanda
    coral: '#FF6F61',          // Coral
  },

  // Glows y efectos - Más sutiles para no robar protagonismo
  glows: {
    aqua: 'radial-gradient(circle, rgba(79,212,228,0.35) 0%, rgba(165,243,252,0.2) 40%, rgba(204,251,241,0.12) 60%, transparent 80%)',
    lavender: 'radial-gradient(circle, rgba(183,163,248,0.15) 0%, transparent 70%)',
    subtle: 'radial-gradient(circle, rgba(165,243,252,0.28) 0%, rgba(79,212,228,0.18) 50%, transparent 70%)',
    opacity: '0.14',
  },

  // Badges y pills
  badge: {
    background: 'rgba(79,212,228,0.12)',
    border: 'rgba(79,212,228,0.35)',
    text: '#4FD4E4',
    shadow: '0 12px 40px rgba(79,212,228,0.2), 0 4px 16px rgba(79,212,228,0.15)',
  },

  // Botones
  buttons: {
    primary: {
      background: 'linear-gradient(135deg, #4FD4E4 0%, #3BBFD2 100%)',
      shadow: '0 8px 24px rgba(79,212,228,0.4), 0 2px 8px rgba(59,191,210,0.3), 0 0 30px rgba(79,212,228,0.2)',
      text: '#FFFFFF',
    },
    secondary: {
      background: 'rgba(79,212,228,0.12)',
      border: 'rgba(79,212,228,0.35)',
      text: 'rgba(255,255,255,0.95)',
      shadow: '0 4px 16px rgba(79,212,228,0.15)',
    },
  },
};

export type ThemeTokens = typeof lightTheme;
