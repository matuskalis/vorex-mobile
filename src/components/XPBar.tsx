import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useGamification } from '../context/GamificationContext';
import { getLevelProgress } from '../data/achievements';
import { colors, spacing, theme } from '../theme';

interface XPBarProps {
  showXPNumbers?: boolean;
  compact?: boolean;
}

export function XPBar({ showXPNumbers = true, compact = false }: XPBarProps) {
  const { state } = useGamification();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(state.xp)).current;

  const levelProgress = getLevelProgress(state.xp);
  const { currentLevel, currentLevelXP, nextLevelXP, progress } = levelProgress;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [progress]);

  useEffect(() => {
    Animated.timing(xpAnim, {
      toValue: state.xp,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [state.xp]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.levelBadgeCompact}>
          <Text style={styles.levelTextCompact}>{currentLevel}</Text>
        </View>
        <View style={styles.barContainerCompact}>
          <View style={styles.barBackgroundCompact}>
            <Animated.View
              style={[
                styles.barFillCompact,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelLabel}>Level</Text>
          <Text style={styles.levelNumber}>{currentLevel}</Text>
        </View>
        {showXPNumbers && (
          <View style={styles.xpInfo}>
            <Text style={styles.xpText}>
              {Math.floor(currentLevelXP)} / {nextLevelXP} XP
            </Text>
            <Text style={styles.totalXp}>Total: {state.xp.toLocaleString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <View style={styles.barShine} />
          </Animated.View>
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <Text style={styles.nextLevelText}>
        {nextLevelXP - Math.floor(currentLevelXP)} XP to Level {currentLevel + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusLg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: theme.radiusMd,
    minWidth: 80,
  },
  levelLabel: {
    fontSize: 11,
    color: colors.neutral[200],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[0],
    marginTop: 2,
  },
  xpInfo: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalXp: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  barContainer: {
    position: 'relative',
    marginBottom: spacing[2],
  },
  barBackground: {
    height: 12,
    backgroundColor: colors.neutral[800],
    borderRadius: theme.radiusFull,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: theme.radiusFull,
    position: 'relative',
    overflow: 'hidden',
  },
  barShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressText: {
    position: 'absolute',
    right: spacing[2],
    top: -2,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral[0],
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextLevelText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  levelBadgeCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelTextCompact: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
  barContainerCompact: {
    flex: 1,
  },
  barBackgroundCompact: {
    height: 8,
    backgroundColor: colors.neutral[800],
    borderRadius: theme.radiusFull,
    overflow: 'hidden',
  },
  barFillCompact: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: theme.radiusFull,
  },
});
