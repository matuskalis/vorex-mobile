/**
 * Vorex Design System
 * Central export for all theme tokens
 */

export { colors } from './colors';
export type { ColorPalette } from './colors';

export { spacing, layout } from './spacing';
export type { SpacingScale, LayoutTokens } from './spacing';

export { fontWeight, fontSize, lineHeight, textStyles } from './typography';
export type { TextStyleName } from './typography';

export { shadows } from './shadows';
export type { ShadowName } from './shadows';

// Theme variants
export { darkTheme, lightTheme, defaultTheme, getTheme } from './themes';
export type { ThemeType, ThemeName } from './themes';

// Quick access to commonly used values
export const theme = {
  // Quick color access
  primary: '#6366f1',
  accent: '#fbbf24',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f97316',
  info: '#3b82f6',

  // Background shortcuts
  bg: '#0a0a0a',
  bgCard: '#1a1a1a',
  bgElevated: '#262626',

  // Text shortcuts
  textPrimary: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',

  // Border
  border: '#262626',
  borderLight: '#404040',

  // Common radius values
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusFull: 9999,
} as const;
