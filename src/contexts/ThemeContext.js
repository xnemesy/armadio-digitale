import React, { createContext, useState, useEffect, useContext } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTokens } from '../design/tokens';

const THEME_STORAGE_KEY = '@theme_preference';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('dark'); // 'light', 'dark', 'auto'
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (themeMode === 'auto') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        // When in auto mode, React will re-render with system scheme
      });
      return () => subscription.remove();
    }
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const setTheme = (mode) => {
    if (['light', 'dark', 'auto'].includes(mode)) {
      setThemeMode(mode);
      saveThemePreference(mode);
    }
  };

  // Get effective theme (resolve 'auto' to actual light/dark)
  const getEffectiveTheme = () => {
    if (themeMode === 'auto') {
      const systemScheme = Appearance.getColorScheme();
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return themeMode;
  };

  const effectiveTheme = getEffectiveTheme();
  const tokens = getTokens(effectiveTheme);

  const value = {
    themeMode, // 'light', 'dark', 'auto'
    effectiveTheme, // 'light' or 'dark' (resolved)
    tokens, // Design tokens for current theme
    setTheme,
    isLoading,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // In production builds, provide fallback instead of throwing
    console.warn('useTheme called outside ThemeProvider, using default theme');
    return {
      themeMode: 'dark',
      effectiveTheme: 'dark',
      tokens: getTokens('dark'),
      setTheme: () => {},
      isLoading: false,
      isDark: true,
      isLight: false,
    };
  }
  return context;
};

export default ThemeContext;
