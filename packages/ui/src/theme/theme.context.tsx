import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightPalette, darkPalette, type ThemeColors } from './colors.js';
import { spacing, radii, type Spacing, type Radii } from './spacing.js';
import { typography, type Typography } from './typography.js';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  colors: ThemeColors;
  spacing: Spacing;
  radii: Radii;
  typography: Typography;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => {
    return isDark ? darkPalette : lightPalette;
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      colors,
      spacing,
      radii,
      typography,
      isDark,
      themeMode,
      setThemeMode,
    };
  }, [colors, isDark, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
