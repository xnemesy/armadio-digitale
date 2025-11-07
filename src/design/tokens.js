// Simple design tokens with light/dark themes and helpers.
// Usage:
//   import { useThemeTokens } from '../design/tokens';
//   const t = useThemeTokens();
//   <View style={{ backgroundColor: t.colors.surface, padding: t.spacing.md }} />

import { useColorScheme } from 'react-native';

const base = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
      xxl: 28,
    },
    weights: {
      regular: '400',
      medium: '600',
      bold: '700',
    },
  },
  durations: {
    fast: 120,
    normal: 200,
    slow: 320,
  },
  elevation: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
  },
};

export const lightColors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  accent: '#4F46E5',
  placeholder: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  shadow: 'rgba(0,0,0,0.08)'
};

export const darkColors = {
  background: '#0B0F1A',
  surface: '#111827',
  border: '#1F2937',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  accent: '#818CF8',
  placeholder: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F87171',
  shadow: 'rgba(0,0,0,0.5)'
};

export function getTokens(mode = 'light') {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return {
    ...base,
    colors,
    // Shadow helper for iOS; Android should use elevation tokens.
    shadow: (level = 'sm') => {
      const map = {
        xs: { shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
        sm: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
        md: { shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
        lg: { shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      };
      return { shadowColor: colors.shadow, ...(map[level] || map.sm) };
    },
  };
}

export function useThemeTokens() {
  const scheme = useColorScheme() || 'light';
  return getTokens(scheme);
}

export default getTokens;
