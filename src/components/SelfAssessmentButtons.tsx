import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Check, RotateCcw } from 'lucide-react-native';
import { colors, spacing, layout, shadows } from '../theme';

interface SelfAssessmentButtonsProps {
  onGood: () => void;
  onRetry: () => void;
  disabled?: boolean;
}

export function SelfAssessmentButtons({ onGood, onRetry, disabled = false }: SelfAssessmentButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onRetry}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          styles.retryButton,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        <RotateCcw size={24} color={colors.neutral[300]} />
        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>

      <Pressable
        onPress={onGood}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          styles.goodButton,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        <Check size={24} color={colors.neutral[0]} />
        <Text style={styles.goodText}>Good</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingHorizontal: spacing[4],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: layout.radius.xl,
    ...shadows.sm,
  },
  goodButton: {
    backgroundColor: colors.success[500],
  },
  retryButton: {
    backgroundColor: colors.neutral[700],
    borderWidth: 1,
    borderColor: colors.neutral[600],
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  goodText: {
    color: colors.neutral[0],
    fontSize: 17,
    fontWeight: '600',
  },
  retryText: {
    color: colors.neutral[200],
    fontSize: 17,
    fontWeight: '600',
  },
});
