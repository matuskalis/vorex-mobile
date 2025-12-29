import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, layout } from '../theme';

interface ProblemWordChipProps {
  word: string;
  isMarked: boolean;
  onPress: () => void;
}

export function ProblemWordChip({ word, isMarked, onPress }: ProblemWordChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isMarked && styles.chipMarked,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.text, isMarked && styles.textMarked]}>
        {word}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: layout.radius.md,
    backgroundColor: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  chipMarked: {
    backgroundColor: colors.error[500] + '30', // 30% opacity
    borderColor: colors.error[500],
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  text: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  textMarked: {
    color: colors.error[400],
  },
});
