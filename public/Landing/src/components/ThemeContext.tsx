import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Intentar obtener tema del localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('miproveedor-theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Guardar tema en localStorage
    localStorage.setItem('miproveedor-theme', theme);
    
    // Aplicar clase al documento para transiciones globales
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
