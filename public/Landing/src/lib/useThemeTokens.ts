import { useTheme } from '../components/ThemeContext';
import { lightTheme, darkTheme, ThemeTokens } from './themeTokens';

/**
 * Hook personalizado que retorna los tokens del tema activo
 * Basado exactamente en LIGHT BASE y DARK BASE de Figma
 */
export function useThemeTokens(): { 
  tokens: ThemeTokens; 
  isDark: boolean;
  theme: 'light' | 'dark';
} {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tokens = isDark ? darkTheme : lightTheme;

  return { tokens, isDark, theme };
}
