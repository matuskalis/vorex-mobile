import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import {
  User,
  Target,
  Bell,
  Mic,
  HelpCircle,
  LogOut,
  ChevronRight,
  Clock,
  Award,
  Flame,
  TrendingUp,
  Zap,
  Crown,
  Settings,
  Star,
  Camera,
  Accessibility,
  Eye,
  Volume2,
  Smartphone
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useLearning } from '../../src/context/LearningContext';
import { useGamification } from '../../src/context/GamificationContext';
import { usePractice } from '../../src/context/PracticeContext';
import { BusinessModeToggle } from '../../src/components/BusinessModeToggle';
import { useSRSStats, useAccessibility, TextSizeScale } from '../../src/contexts';
import { darkTheme, colors, spacing, layout, textStyles } from '../../src/theme';
import { apiClient, SessionStats, SkillProfile } from '../../src/lib/api-client';
import { ACHIEVEMENTS, Achievement } from '../../src/data/achievements';

// Level progress ring
function LevelRing({
  progress,
  size = 100,
  strokeWidth = 8
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 1) * circumference);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={darkTheme.colors.border.default}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary[500]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// Badge Item Component
function BadgeItem({
  achievement,
  isUnlocked,
  progress,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number; // 0-1 for progress toward unlock
}) {
  return (
    <View style={[styles.badgeItem, !isUnlocked && styles.badgeItemLocked]}>
      <Text style={[styles.badgeIcon, !isUnlocked && styles.badgeIconLocked]}>
        {achievement.icon}
      </Text>
      <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]} numberOfLines={1}>
        {achievement.title}
      </Text>
      {!isUnlocked && progress !== undefined && progress > 0 && (
        <View style={styles.badgeProgressBar}>
          <View style={[styles.badgeProgressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
      )}
    </View>
  );
}

// Performance metric ring
function MetricRing({
  value,
  label,
  color,
  size = 68
}: {
  value: number;
  label: string;
  color: string;
  size?: number;
}) {
  const radius = (size - 6) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / 100, 1);
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={styles.metricItem}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={darkTheme.colors.border.default}
            strokeWidth={6}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={6}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={[styles.metricValue, { color }]}>{value}%</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { state } = useLearning();
  const { state: gamificationState } = useGamification();
  const { state: practiceState, toggleBusinessMode } = usePractice();
  const { xp, level, streak } = gamificationState;
  const srsStats = useSRSStats();
  const { settings: accessibilitySettings, updateSettings: updateAccessibility } = useAccessibility();

  // Backend data state
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  const [progressSummary, setProgressSummary] = useState<{
    streak_days: number;
    weekly_progress: number[];
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch backend data
  const fetchData = useCallback(async () => {
    try {
      const [statsData, userData, profileData, progressData] = await Promise.all([
        apiClient.getSessionStats().catch(() => null),
        apiClient.getMe().catch(() => null),
        apiClient.getSkillProfile().catch(() => null),
        apiClient.getProgressSummary().catch(() => null),
      ]);
      if (statsData) setSessionStats(statsData);
      if (userData?.avatar_url) setAvatarUrl(userData.avatar_url);
      if (profileData) setSkillProfile(profileData);
      if (progressData) setProgressSummary(progressData);
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  // Get unlocked achievement IDs - prefer backend data, fallback to local
  const unlockedIds = new Set([
    // Backend earned achievements (primary source)
    ...(skillProfile?.earned_achievements ?? []),
    // Local gamification state (fallback)
    ...gamificationState.unlockedAchievements.map(ua => ua.achievementId),
  ]);

  // Calculate progress for each achievement based on condition type
  const getAchievementProgress = (achievement: Achievement): number => {
    const condition = achievement.condition;
    const streakDays = progressSummary?.streak_days ?? streak.currentStreak;
    const currentLevel = skillProfile?.overall_level ?? level;
    const totalMinutes = Math.floor(state.weeklyStats.speakingMinutes);
    const sessionsCompleted = sessionStats?.total_sessions ?? 0;

    switch (condition.type) {
      case 'streak':
        return condition.value ? streakDays / condition.value : 0;
      case 'level':
        return condition.value ? currentLevel / condition.value : 0;
      case 'practice_time':
        return condition.value ? totalMinutes / condition.value : 0;
      case 'lessons_completed':
        return condition.value ? sessionsCompleted / condition.value : 0;
      case 'first_conversation':
        return sessionsCompleted > 0 ? 1 : 0;
      case 'words_spoken':
        // Estimate words from sessions (avg 50 words per session)
        return condition.value ? (sessionsCompleted * 50) / condition.value : 0;
      default:
        return 0;
    }
  };

  // Get display badges (first 6 from achievements, showing unlocked first, then by progress)
  const displayBadges = [...ACHIEVEMENTS]
    .map(achievement => ({
      achievement,
      isUnlocked: unlockedIds.has(achievement.id),
      progress: getAchievementProgress(achievement),
    }))
    .sort((a, b) => {
      // Unlocked first
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      // Then by progress
      return b.progress - a.progress;
    })
    .slice(0, 6);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const username = user?.email?.split('@')[0] || 'Learner';

  // Use backend skill profile data if available, fallback to local gamification
  const totalXp = skillProfile?.total_xp ?? xp;
  const currentLevel = skillProfile?.overall_level ?? level;
  const xpForCurrentLevel = currentLevel * 100; // XP needed to reach current level
  const xpForNextLevel = (currentLevel + 1) * 100; // XP needed for next level
  const xpInCurrentLevel = totalXp - xpForCurrentLevel; // Progress within current level
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel; // XP needed to level up (always 100)
  const xpProgress = xpNeededForLevel > 0 ? xpInCurrentLevel / xpNeededForLevel : 0;

  const menuItems: MenuItem[] = [
    {
      icon: <Target size={20} color={colors.primary[400]} strokeWidth={2} />,
      label: 'Daily Goal',
    },
    {
      icon: <Bell size={20} color={colors.accent[500]} strokeWidth={2} />,
      label: 'Notifications',
    },
    {
      icon: <Mic size={20} color={colors.success[500]} strokeWidth={2} />,
      label: 'Audio Settings',
    },
    {
      icon: <HelpCircle size={20} color={colors.info[500]} strokeWidth={2} />,
      label: 'Help & Support',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.accent[500];
    return colors.error[500];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[400]}
          />
        }
      >
        {/* Hero Header */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {/* Avatar with Level Ring - Touchable */}
            <TouchableOpacity style={styles.avatarWrapper} activeOpacity={0.8}>
              <LevelRing progress={xpProgress} size={100} strokeWidth={6} />
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarInitial}>
                    {username[0]?.toUpperCase() || 'L'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={12} color={colors.neutral[0]} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.email}>{user?.email}</Text>

              {/* Level Badge */}
              <View style={styles.levelContainer}>
                <View style={styles.levelBadge}>
                  <Award size={14} color={colors.neutral[900]} strokeWidth={2.5} />
                  <Text style={styles.levelText}>Level {currentLevel}</Text>
                </View>
                <View style={styles.cefrBadge}>
                  <Text style={styles.cefrText}>{state.cefrLevel || 'A1'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpSection}>
            <View style={styles.xpHeader}>
              <View style={styles.xpLabelRow}>
                <Zap size={14} color={colors.primary[400]} strokeWidth={2.5} />
                <Text style={styles.xpLabel}>XP Progress</Text>
              </View>
              <Text style={styles.xpValue}>{Math.floor(xpInCurrentLevel)} / {xpNeededForLevel}</Text>
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
            </View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <View style={styles.quickStatIconWrap}>
                <Flame size={16} color={colors.error[400]} strokeWidth={2.5} />
              </View>
              <Text style={styles.quickStatValue}>{progressSummary?.streak_days ?? streak.currentStreak}</Text>
              <Text style={styles.quickStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <View style={styles.quickStatIconWrap}>
                <Clock size={16} color={colors.info[400]} strokeWidth={2.5} />
              </View>
              <Text style={styles.quickStatValue}>
                {Math.floor(state.weeklyStats.speakingMinutes / 60)}h {state.weeklyStats.speakingMinutes % 60}m
              </Text>
              <Text style={styles.quickStatLabel}>Total Time</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <View style={styles.quickStatIconWrap}>
                <Target size={16} color={colors.success[400]} strokeWidth={2.5} />
              </View>
              <Text style={styles.quickStatValue}>{state.dailyGoalMinutes}m</Text>
              <Text style={styles.quickStatLabel}>Daily Goal</Text>
            </View>
          </View>
        </View>

        {/* Badge Cabinet */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={18} color={colors.accent[500]} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.badgeCount}>
              {unlockedIds.size}/{ACHIEVEMENTS.length}
            </Text>
          </View>
          <View style={styles.badgeGrid}>
            {displayBadges.map(({ achievement, isUnlocked, progress }) => (
              <BadgeItem
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isUnlocked}
                progress={progress}
              />
            ))}
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.subscriptionCard} activeOpacity={0.8}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionIconWrap}>
                <Crown size={20} color={colors.accent[500]} strokeWidth={2} />
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTitle}>Free Plan</Text>
                <Text style={styles.subscriptionDesc}>Unlock all features with Pro</Text>
              </View>
            </View>
            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeText}>Upgrade</Text>
              <ChevronRight size={16} color={colors.neutral[0]} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color={colors.primary[400]} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Performance</Text>
          </View>
          <View style={styles.performanceCard}>
            <MetricRing
              value={sessionStats?.average_pronunciation ?? state.weeklyStats.pronunciationScore}
              label="Pronunciation"
              color={getScoreColor(sessionStats?.average_pronunciation ?? state.weeklyStats.pronunciationScore)}
            />
            <MetricRing
              value={sessionStats?.average_fluency ?? state.weeklyStats.fluencyScore}
              label="Fluency"
              color={getScoreColor(sessionStats?.average_fluency ?? state.weeklyStats.fluencyScore)}
            />
          </View>
        </View>

        {/* Practice Mode */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={18} color={colors.primary[400]} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Practice Mode</Text>
          </View>
          <BusinessModeToggle
            enabled={practiceState.businessModeEnabled}
            onToggle={toggleBusinessMode}
          />
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color={colors.primary[400]} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemIcon}>{item.icon}</View>
                <Text style={styles.menuItemText}>{item.label}</Text>
                <ChevronRight size={18} color={darkTheme.colors.text.tertiary} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accessibility Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Accessibility size={18} color={colors.info[400]} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Accessibility</Text>
          </View>
          <View style={styles.menuCard}>
            {/* Text Size */}
            <View style={[styles.accessibilityItem, styles.menuItemBorder]}>
              <View style={styles.accessibilityItemLeft}>
                <View style={styles.menuItemIcon}>
                  <Eye size={20} color={colors.info[400]} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.menuItemText}>Text Size</Text>
                  <Text style={styles.accessibilityDesc}>
                    {accessibilitySettings.textSizeScale.charAt(0).toUpperCase() +
                     accessibilitySettings.textSizeScale.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.textSizeButtons}>
                {(['small', 'medium', 'large', 'extraLarge'] as TextSizeScale[]).map((size, index) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.textSizeButton,
                      accessibilitySettings.textSizeScale === size && styles.textSizeButtonActive,
                    ]}
                    onPress={() => updateAccessibility({ textSizeScale: size })}
                  >
                    <Text style={[
                      styles.textSizeLabel,
                      { fontSize: 10 + (index * 2) },
                      accessibilitySettings.textSizeScale === size && styles.textSizeLabelActive,
                    ]}>A</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reduce Motion */}
            <View style={[styles.accessibilityItem, styles.menuItemBorder]}>
              <View style={styles.accessibilityItemLeft}>
                <View style={styles.menuItemIcon}>
                  <Smartphone size={20} color={colors.accent[500]} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.menuItemText}>Reduce Motion</Text>
                  <Text style={styles.accessibilityDesc}>Minimize animations</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.reduceMotion}
                onValueChange={(value) => updateAccessibility({ reduceMotion: value })}
                trackColor={{ false: darkTheme.colors.border.default, true: colors.primary[500] }}
                thumbColor={colors.neutral[0]}
              />
            </View>

            {/* Haptic Feedback */}
            <View style={[styles.accessibilityItem, styles.menuItemBorder]}>
              <View style={styles.accessibilityItemLeft}>
                <View style={styles.menuItemIcon}>
                  <Volume2 size={20} color={colors.success[500]} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.menuItemText}>Haptic Feedback</Text>
                  <Text style={styles.accessibilityDesc}>Vibration for actions</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.hapticFeedback}
                onValueChange={(value) => updateAccessibility({ hapticFeedback: value })}
                trackColor={{ false: darkTheme.colors.border.default, true: colors.primary[500] }}
                thumbColor={colors.neutral[0]}
              />
            </View>

            {/* High Contrast */}
            <View style={styles.accessibilityItem}>
              <View style={styles.accessibilityItemLeft}>
                <View style={styles.menuItemIcon}>
                  <Eye size={20} color={colors.error[400]} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.menuItemText}>High Contrast</Text>
                  <Text style={styles.accessibilityDesc}>Enhanced visibility</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.highContrastMode}
                onValueChange={(value) => updateAccessibility({ highContrastMode: value })}
                trackColor={{ false: darkTheme.colors.border.default, true: colors.primary[500] }}
                thumbColor={colors.neutral[0]}
              />
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={colors.error[500]} strokeWidth={2} />
            <Text style={styles.signOutText}>Sign Out</Text>
            <ChevronRight size={18} color={colors.error[500]} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vorex v1.3.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background.primary,
  },

  // Hero Card
  heroCard: {
    backgroundColor: darkTheme.colors.background.card,
    margin: layout.screenPadding,
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
    marginBottom: spacing[5],
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarInner: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.headlineMedium.fontSize,
    fontWeight: textStyles.headlineMedium.fontWeight as any,
    marginBottom: spacing[1],
  },
  email: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.bodySmall.fontSize,
    marginBottom: spacing[3],
  },
  levelContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.accent[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.full,
  },
  levelText: {
    color: colors.neutral[900],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '700',
  },
  cefrBadge: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: colors.primary[500] + '40',
  },
  cefrText: {
    color: colors.primary[400],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '700',
  },

  // XP Section
  xpSection: {
    backgroundColor: darkTheme.colors.background.primary,
    borderRadius: layout.radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  xpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  xpLabel: {
    color: darkTheme.colors.text.secondary,
    fontSize: textStyles.caption.fontSize,
    fontWeight: '600',
  },
  xpValue: {
    color: colors.primary[400],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '700',
  },
  xpBarBg: {
    height: 6,
    backgroundColor: darkTheme.colors.border.default,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },

  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  quickStatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkTheme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  quickStatValue: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '700',
  },
  quickStatLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: 10,
  },
  quickStatDivider: {
    width: 1,
    height: 48,
    backgroundColor: darkTheme.colors.border.default,
  },

  // Sections
  section: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.titleLarge.fontSize,
    fontWeight: textStyles.titleLarge.fontWeight as any,
  },

  // Performance Card
  performanceCard: {
    flexDirection: 'row',
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  metricItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },

  // Menu Card
  menuCard: {
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border.default,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  menuItemText: {
    flex: 1,
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '500',
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[500] + '10',
    borderRadius: layout.radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.error[500] + '30',
  },
  signOutText: {
    flex: 1,
    color: colors.error[500],
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
    marginLeft: spacing[3],
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingBottom: spacing[8],
  },
  footerText: {
    color: darkTheme.colors.text.disabled,
    fontSize: textStyles.caption.fontSize,
  },

  // Avatar Image
  avatarImage: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: darkTheme.colors.background.card,
  },

  // Badge Cabinet
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  badgeItem: {
    width: '30%',
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.lg,
    padding: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  badgeItemLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeTitle: {
    color: darkTheme.colors.text.secondary,
    fontSize: 10,
    textAlign: 'center',
  },
  badgeTitleLocked: {
    color: darkTheme.colors.text.disabled,
  },
  badgeProgressBar: {
    width: '100%',
    height: 3,
    backgroundColor: darkTheme.colors.border.default,
    borderRadius: 1.5,
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 1.5,
  },
  badgeCount: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginLeft: 'auto',
  },

  // Subscription Card
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.accent[500] + '30',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  subscriptionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionInfo: {
    gap: spacing[1],
  },
  subscriptionTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },
  subscriptionDesc: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.accent[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.full,
  },
  upgradeText: {
    color: colors.neutral[0],
    fontSize: textStyles.bodySmall.fontSize,
    fontWeight: '700',
  },

  // Accessibility Settings
  accessibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  accessibilityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accessibilityDesc: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginTop: 2,
  },
  textSizeButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  textSizeButton: {
    width: 32,
    height: 32,
    borderRadius: layout.radius.md,
    backgroundColor: darkTheme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  textSizeButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  textSizeLabel: {
    color: darkTheme.colors.text.secondary,
    fontWeight: '600',
  },
  textSizeLabelActive: {
    color: colors.neutral[0],
  },
});
