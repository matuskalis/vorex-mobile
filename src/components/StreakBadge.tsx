import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useGamification } from '../context/GamificationContext';
import { colors, spacing, theme } from '../theme';

interface StreakBadgeProps {
  onPress?: () => void;
  compact?: boolean;
  showDetails?: boolean;
}

export function StreakBadge({ onPress, compact = false, showDetails = true }: StreakBadgeProps) {
  const { state, useStreakFreeze } = useGamification();
  const { currentStreak, longestStreak, freezeAvailable, todayPracticeMinutes } = state.streak;

  const hasMinimumPractice = todayPracticeMinutes >= 5;
  const streakColor = currentStreak > 0 ? colors.warning[500] : colors.neutral[600];

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.compactContainer}>
        <Text style={[styles.fireIcon, { color: streakColor }]}>🔥</Text>
        <Text style={styles.compactStreakNumber}>{currentStreak}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        currentStreak === 0 && styles.containerInactive,
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={[styles.fireIcon, { fontSize: 32 }]}>🔥</Text>
          {currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {currentStreak === 0 ? 'Start Your Streak!' : 'Day Streak'}
          </Text>
          {currentStreak > 0 && (
            <Text style={styles.subtitle}>
              {!hasMinimumPractice && 'Practice 5+ min to keep it going'}
              {hasMinimumPractice && 'Streak secured for today!'}
            </Text>
          )}
        </View>
      </View>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Longest Streak</Text>
            <Text style={styles.detailValue}>{longestStreak} days</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Today's Practice</Text>
            <Text style={styles.detailValue}>{todayPracticeMinutes} min</Text>
          </View>

          {freezeAvailable && (
            <>
              <View style={styles.divider} />
              <View style={[styles.detailItem, styles.freezeItem]}>
                <Text style={styles.freezeIcon}>❄️</Text>
                <Text style={styles.freezeText}>Freeze Available</Text>
              </View>
            </>
          )}
        </View>
      )}

      {currentStreak > 0 && !hasMinimumPractice && (
        <View style={styles.warningBar}>
          <Text style={styles.warningText}>
            ⚠️ Practice 5+ minutes today to maintain your streak
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusLg,
    borderWidth: 2,
    borderColor: colors.warning[500],
    overflow: 'hidden',
  },
  containerInactive: {
    borderColor: colors.neutral[700],
    opacity: 0.8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  iconContainer: {
    position: 'relative',
  },
  fireIcon: {
    fontSize: 40,
  },
  streakBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.warning[500],
    borderRadius: theme.radiusFull,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
  },
  streakNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  details: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: colors.neutral[700],
  },
  freezeItem: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  freezeIcon: {
    fontSize: 14,
  },
  freezeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info[400],
  },
  warningBar: {
    backgroundColor: colors.warning[900],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.warning[700],
  },
  warningText: {
    fontSize: 12,
    color: colors.warning[300],
    textAlign: 'center',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: theme.radiusMd,
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  compactStreakNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
});
