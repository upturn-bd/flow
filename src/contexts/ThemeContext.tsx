"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, ColorScheme, defaultTheme } from '@/lib/theme/theme-config';

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultTheme.mode);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(defaultTheme.colorScheme);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    const savedScheme = localStorage.getItem('color-scheme') as ColorScheme;
    
    if (savedMode) {
      setModeState(savedMode);
    } else {
      // Default to light mode
      setModeState('light');
    }
    
    if (savedScheme) {
      setColorSchemeState(savedScheme);
    }
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Set mode
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Set color scheme data attribute
    root.setAttribute('data-color-scheme', colorScheme);
    
    // FloppyDisk to localStorage
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('color-scheme', colorScheme);
  }, [mode, colorScheme, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colorScheme,
        setMode,
        setColorScheme,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
