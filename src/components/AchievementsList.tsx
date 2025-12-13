import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useGamification } from '../context/GamificationContext';
import { ACHIEVEMENTS, Achievement, AchievementCategory } from '../data/achievements';
import { colors, spacing, theme } from '../theme';

interface AchievementsListProps {
  category?: AchievementCategory;
  compact?: boolean;
}

export function AchievementsList({ category, compact = false }: AchievementsListProps) {
  const { state } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Filter achievements by category
  const filteredAchievements = ACHIEVEMENTS.filter(achievement => {
    if (category) return achievement.category === category;
    if (selectedCategory === 'all') return true;
    return achievement.category === selectedCategory;
  });

  // Check if achievement is unlocked
  const isUnlocked = (achievementId: string): boolean => {
    return state.unlockedAchievements.some(a => a.achievementId === achievementId);
  };

  // Get unlock date
  const getUnlockDate = (achievementId: string): string | null => {
    const unlocked = state.unlockedAchievements.find(a => a.achievementId === achievementId);
    if (!unlocked) return null;
    return new Date(unlocked.unlockedAt).toLocaleDateString();
  };

  // Calculate progress
  const unlockedCount = filteredAchievements.filter(a => isUnlocked(a.id)).length;
  const totalCount = filteredAchievements.length;
  const progressPercentage = Math.round((unlockedCount / totalCount) * 100);

  const categories: (AchievementCategory | 'all')[] = ['all', 'milestone', 'streak', 'practice', 'mastery', 'time'];

  const renderCategoryFilter = () => {
    if (category) return null; // Don't show filter if category is fixed

    return (
      <View style={styles.categoryFilter}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.categoryButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === item && styles.categoryButtonTextActive,
                ]}
              >
                {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryScrollContent}
        />
      </View>
    );
  };

  const renderAchievement = ({ item: achievement }: { item: Achievement }) => {
    const unlocked = isUnlocked(achievement.id);
    const unlockDate = getUnlockDate(achievement.id);

    if (compact) {
      return (
        <View style={[styles.achievementCardCompact, !unlocked && styles.achievementLocked]}>
          <Text style={styles.iconCompact}>{achievement.icon}</Text>
          <View style={styles.textContainerCompact}>
            <Text style={[styles.titleCompact, !unlocked && styles.textLocked]}>
              {achievement.title}
            </Text>
          </View>
          {unlocked && <Text style={styles.checkmark}>✓</Text>}
          {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
      );
    }

    return (
      <View style={[styles.achievementCard, !unlocked && styles.achievementLocked]}>
        <View style={styles.achievementHeader}>
          <View style={styles.iconContainer}>
            <Text style={[styles.icon, !unlocked && styles.iconLocked]}>{achievement.icon}</Text>
            {unlocked && (
              <View style={styles.unlockedBadge}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.achievementContent}>
            <Text style={[styles.title, !unlocked && styles.textLocked]}>
              {achievement.title}
            </Text>
            <Text style={[styles.description, !unlocked && styles.textLocked]}>
              {achievement.description}
            </Text>
          </View>

          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{achievement.xpReward}</Text>
            <Text style={styles.xpLabel}>XP</Text>
          </View>
        </View>

        {unlocked && unlockDate && (
          <View style={styles.achievementFooter}>
            <Text style={styles.unlockDate}>Unlocked on {unlockDate}</Text>
          </View>
        )}

        {!unlocked && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Achievements</Text>
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>
            {unlockedCount} / {totalCount}
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
        </View>
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={item => item.id}
        renderItem={renderAchievement}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressHeader: {
    padding: spacing[4],
    backgroundColor: theme.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[800],
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 60,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[800],
    borderRadius: theme.radiusFull,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: theme.radiusFull,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  categoryFilter: {
    backgroundColor: theme.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[800],
  },
  categoryScrollContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  categoryButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: theme.radiusMd,
    backgroundColor: colors.neutral[800],
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[500],
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryButtonTextActive: {
    color: colors.neutral[0],
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  achievementCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusLg,
    borderWidth: 2,
    borderColor: colors.primary[500],
    overflow: 'hidden',
    position: 'relative',
  },
  achievementLocked: {
    borderColor: colors.neutral[700],
    opacity: 0.6,
  },
  achievementHeader: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[800],
    borderRadius: theme.radiusMd,
  },
  icon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.3,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    backgroundColor: colors.success[500],
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: colors.neutral[0],
  },
  achievementContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  textLocked: {
    color: colors.text.disabled,
  },
  xpBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary[900],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: theme.radiusMd,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary[300],
  },
  xpLabel: {
    fontSize: 10,
    color: colors.primary[400],
    textTransform: 'uppercase',
  },
  achievementFooter: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  unlockDate: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  lockedOverlay: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
  },
  lockIcon: {
    fontSize: 20,
    opacity: 0.5,
  },

  // Compact styles
  achievementCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    padding: spacing[3],
    borderRadius: theme.radiusMd,
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  iconCompact: {
    fontSize: 24,
  },
  textContainerCompact: {
    flex: 1,
  },
  titleCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
