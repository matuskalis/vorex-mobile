import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Achievement } from '../data/achievements';
import { colors, spacing, theme } from '../theme';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  visible: boolean;
}

const { width } = Dimensions.get('window');
const TOAST_WIDTH = width - 32;

export function AchievementToast({ achievement, onDismiss, visible }: AchievementToastProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        dismissToast();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={dismissToast}
        activeOpacity={0.95}
        style={styles.content}
      >
        {/* Shine effect */}
        <View style={styles.shineOverlay} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Achievement Unlocked!</Text>
          <Text style={styles.xpBadge}>+{achievement.xpReward} XP</Text>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{achievement.icon}</Text>
            <View style={styles.iconGlow} />
          </View>

          <View style={styles.textContent}>
            <Text style={styles.title}>{achievement.title}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
          </View>
        </View>

        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{getCategoryLabel(achievement.category)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    milestone: 'Milestone',
    streak: 'Streak',
    practice: 'Practice',
    mastery: 'Mastery',
    time: 'Time-based',
  };
  return labels[category] || category;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  content: {
    backgroundColor: theme.bgElevated,
    borderRadius: theme.radiusLg,
    borderWidth: 2,
    borderColor: colors.primary[500],
    overflow: 'hidden',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[900],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[700],
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[200],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  xpBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.accent[400],
  },
  mainContent: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[4],
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    zIndex: 1,
  },
  iconGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[500],
    opacity: 0.2,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: theme.radiusSm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[0],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
