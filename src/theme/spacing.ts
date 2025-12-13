/**
 * SpeakSharp Design System - Spacing
 * Consistent spacing scale (4px base unit)
 */

export const spacing = {
  // Base spacing scale
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

// Semantic spacing aliases
export const layout = {
  screenPadding: spacing[4], // 16px - standard screen edge padding
  cardPadding: spacing[4], // 16px - padding inside cards
  sectionGap: spacing[6], // 24px - gap between major sections
  itemGap: spacing[3], // 12px - gap between list items
  inlineGap: spacing[2], // 8px - gap between inline elements

  // Safe areas
  tabBarHeight: 80,
  headerHeight: 56,

  // Border radius
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
} as const;

export type SpacingScale = typeof spacing;
export type LayoutTokens = typeof layout;
