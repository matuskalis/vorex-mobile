import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, layout, shadows } from '../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'highlighted';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  padding = 5,
}: CardProps) {
  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    { padding: spacing[padding] },
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyles,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: layout.radius.xl,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },

  // Variants
  default: {
    backgroundColor: colors.background.card,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.background.elevated,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  highlighted: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.primary[500],
    ...shadows.lg,
  },
});
