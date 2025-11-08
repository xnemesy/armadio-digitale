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

// "The Athletic" inspired dark palette (matches src/theme/colors.js)
export const darkColors = {
  background: '#121212',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  border: '#374151',
  borderLight: '#4B5563',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  accent: '#10B981',
  accentDark: '#059669',
  accentLight: '#34D399',
  placeholder: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  shadow: 'rgba(0,0,0,0.5)',
  // Navigation specific
  navBackground: '#1A1A1A',
  navInactive: '#6B7280',
  navActive: '#10B981',
};

export const lightColors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceLight: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#10B981',
  accentDark: '#059669',
  accentLight: '#34D399',
  placeholder: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  shadow: 'rgba(0,0,0,0.08)',
  // Navigation specific
  navBackground: '#FFFFFF',
  navInactive: '#9CA3AF',
  navActive: '#10B981',
};

// BACKWARD COMPATIBILITY ADAPTER
// Re-export dark colors as COLORS for existing code that uses src/theme/colors.js
export const COLORS = {
  background: darkColors.background,
  surface: darkColors.surface,
  surfaceLight: darkColors.surfaceLight,
  primary: darkColors.accent,
  primaryDark: darkColors.accentDark,
  primaryLight: darkColors.accentLight,
  textPrimary: darkColors.textPrimary,
  textSecondary: darkColors.textSecondary,
  textMuted: darkColors.textMuted,
  border: darkColors.border,
  borderLight: darkColors.borderLight,
  success: darkColors.success,
  warning: darkColors.warning,
  error: darkColors.error,
  info: darkColors.info,
  navBackground: darkColors.navBackground,
  navInactive: darkColors.navInactive,
  navActive: darkColors.navActive,
};

export function getTokens(mode = 'dark') {
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
  const scheme = useColorScheme() || 'dark'; // Default to dark per "The Athletic" aesthetic
  return getTokens(scheme);
}

export default getTokens;
