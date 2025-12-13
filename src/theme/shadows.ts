/**
 * SpeakSharp Design System - Shadows
 * Elevation system for depth and hierarchy
 */

import { ViewStyle } from 'react-native';
import { colors } from './colors';

// Shadow definitions for iOS and Android
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  xs: {
    shadowColor: colors.neutral[950],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,

  sm: {
    shadowColor: colors.neutral[950],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  md: {
    shadowColor: colors.neutral[950],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  lg: {
    shadowColor: colors.neutral[950],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  xl: {
    shadowColor: colors.neutral[950],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  } as ViewStyle,

  // Glow effects for interactive elements
  glow: {
    primary: {
      shadowColor: colors.primary[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 0,
    } as ViewStyle,

    success: {
      shadowColor: colors.success[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 0,
    } as ViewStyle,

    error: {
      shadowColor: colors.error[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 0,
    } as ViewStyle,
  },
} as const;

export type ShadowName = keyof typeof shadows;
