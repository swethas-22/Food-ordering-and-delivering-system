import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { authService } from '../services/parceloServices';

const ThemeContext = createContext();

const THEME_NAMES = {
  midnight: 'Midnight Luxe (Black & Gold)',
  royal: 'Royal Coastal (Blue & Ivory)',
  velvet: 'Velvet Heritage (Burgundy & Beige)',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('parcelo_theme') || 'midnight';
  });
  const { showToast } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('parcelo_theme', theme);
  }, [theme]);

  const setTheme = (newTheme, notify = true) => {
    if (!THEME_NAMES[newTheme]) return;
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('parcelo_theme', newTheme);

    const token = localStorage.getItem('parcelo_access_token');
    if (token) {
      authService.updatePreferences({ theme: newTheme }).catch(() => {});
    }

    if (notify) {
      showToast(`Palette switched to ${THEME_NAMES[newTheme]}`);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeNames: THEME_NAMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
