import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { colors, spacing, layout, shadows } from '../theme';
import { ProblemWord } from '../context/PracticeContext';

interface ProblemWordsSummaryProps {
  problemWords: ProblemWord[];
  onPracticePress: () => void;
  maxDisplay?: number;
}

export function ProblemWordsSummary({
  problemWords,
  onPracticePress,
  maxDisplay = 5,
}: ProblemWordsSummaryProps) {
  if (problemWords.length === 0) {
    return null;
  }

  const displayWords = problemWords.slice(0, maxDisplay);
  const remainingCount = problemWords.length - maxDisplay;

  return (
    <Pressable
      onPress={onPracticePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AlertTriangle size={20} color={colors.warning[400]} />
          <Text style={styles.title}>Problem Words</Text>
        </View>
        <ChevronRight size={20} color={colors.text.secondary} />
      </View>

      <View style={styles.wordsRow}>
        {displayWords.map((pw, index) => (
          <View key={pw.word} style={styles.wordBadge}>
            <Text style={styles.wordText}>{pw.word}</Text>
            {pw.occurrences > 1 && (
              <Text style={styles.countText}>{pw.occurrences}x</Text>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={styles.moreText}>+{remainingCount} more</Text>
        )}
      </View>

      <Text style={styles.ctaText}>Practice these</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.warning[500] + '40',
    ...shadows.sm,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  wordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.warning[500] + '20',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: layout.radius.md,
  },
  wordText: {
    color: colors.warning[300],
    fontSize: 14,
    fontWeight: '500',
  },
  countText: {
    color: colors.warning[500],
    fontSize: 12,
    fontWeight: '600',
  },
  moreText: {
    color: colors.text.secondary,
    fontSize: 14,
    alignSelf: 'center',
  },
  ctaText: {
    color: colors.primary[400],
    fontSize: 14,
    fontWeight: '500',
  },
});
