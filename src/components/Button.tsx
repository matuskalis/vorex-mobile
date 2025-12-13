import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, layout, textStyles as themeTextStyles, shadows } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
  ].filter(Boolean) as TextStyle[];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...containerStyles,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.neutral[0] : colors.primary[500]}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyles}>{children}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: layout.radius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primaryContainer: {
    backgroundColor: colors.primary[500],
    ...shadows.sm,
  },
  secondaryContainer: {
    backgroundColor: colors.neutral[800],
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  dangerContainer: {
    backgroundColor: colors.error[500],
    ...shadows.sm,
  },

  // Sizes
  smContainer: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  mdContainer: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
  },
  lgContainer: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },

  // Text
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: colors.neutral[0],
    ...themeTextStyles.labelLarge,
  },
  secondaryText: {
    color: colors.text.primary,
    ...themeTextStyles.labelLarge,
  },
  outlineText: {
    color: colors.primary[500],
    ...themeTextStyles.labelLarge,
  },
  ghostText: {
    color: colors.primary[500],
    ...themeTextStyles.labelLarge,
  },
  dangerText: {
    color: colors.neutral[0],
    ...themeTextStyles.labelLarge,
  },
  disabledText: {
    color: colors.text.disabled,
  },

  // Size-specific text
  smText: {
    ...themeTextStyles.labelMedium,
  },
  mdText: {
    ...themeTextStyles.labelLarge,
  },
  lgText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
