/**
 * Vorex Design System - Theme Variants
 * Light and dark theme configurations
 */

import { colors } from './colors';

// Dark theme uses dark grey backgrounds (not pure black) as per design guidelines
export const darkTheme = {
  name: 'dark' as const,
  colors: {
    background: {
      primary: '#121212',    // Dark grey, not pure black
      secondary: '#1a1a1a',
      tertiary: '#1f1f1f',
      card: '#1e1e1e',
      elevated: '#2a2a2a',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      tertiary: '#808080',
      disabled: '#595959',
      inverse: '#121212',
      link: colors.primary[400],
    },
    border: {
      default: '#2a2a2a',
      light: '#404040',
      focus: colors.primary[500],
    },
    // Semantic colors inherit from main palette
    primary: colors.primary,
    accent: colors.accent,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    neutral: colors.neutral,
  },
};

// Light theme with high contrast for readability
export const lightTheme = {
  name: 'light' as const,
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#fafafa',
      card: '#ffffff',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#525252',
      tertiary: '#737373',
      disabled: '#a3a3a3',
      inverse: '#ffffff',
      link: colors.primary[600],
    },
    border: {
      default: '#e5e5e5',
      light: '#f0f0f0',
      focus: colors.primary[500],
    },
    // Semantic colors - slightly adjusted for light backgrounds
    primary: colors.primary,
    accent: colors.accent,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    neutral: colors.neutral,
  },
};

export type DarkThemeType = typeof darkTheme;
export type LightThemeType = typeof lightTheme;
export type ThemeType = DarkThemeType | LightThemeType;
export type ThemeName = 'light' | 'dark';

// Default theme
export const defaultTheme = darkTheme;

// Theme accessor
export function getTheme(name: ThemeName): ThemeType {
  return name === 'light' ? lightTheme : darkTheme;
}
