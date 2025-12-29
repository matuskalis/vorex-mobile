import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useLearning } from '../../src/context/LearningContext';
import { useGamification } from '../../src/context/GamificationContext';
import { usePractice } from '../../src/context/PracticeContext';
import { ProblemWordsSummary } from '../../src/components/ProblemWordsSummary';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Target, Play, Clock, ChevronRight, Flame, Sparkles, Trophy, Mic2 } from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows, darkTheme } from '../../src/theme';
import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '../../src/lib/api-client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// Streak label based on milestone
function getStreakLabel(streak: number): string {
  if (streak >= 100) return 'Legendary!';
  if (streak >= 60) return '2 months!';
  if (streak >= 30) return '1 month!';
  if (streak >= 14) return '2 weeks!';
  if (streak >= 7) return '1 week!';
  return 'day streak';
}

// Motivational messages based on user progress
function getMotivationalMessage(streak: number, todayMinutes: number, goalMinutes: number): string {
  const progress = goalMinutes > 0 ? todayMinutes / goalMinutes : 0;

  if (progress >= 1) {
    return "Goal complete! Practice more to level up faster.";
  }
  if (progress >= 0.5) {
    return "Halfway there! Keep up the momentum.";
  }
  if (streak >= 7) {
    return `${streak} days strong! Don't break the chain.`;
  }
  if (streak >= 3) {
    return "You're building a great habit!";
  }
  if (todayMinutes > 0) {
    return "Great start! A little more practice goes a long way.";
  }
  return "Ready to improve your English?";
}

// Circular Progress Ring Component
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  gradientColors = [colors.primary[400], colors.primary[600]],
  children
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  gradientColors?: string[];
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 1) * circumference);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} />
            <Stop offset="100%" stopColor={gradientColors[1]} />
          </SvgGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.neutral[700]}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.6}
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// Unified Hero Ring - combines time, streak, and XP in one visual
function UnifiedHeroRing({
  timeProgress,
  xpProgress,
  todayMinutes,
  goalMinutes,
  streak,
  level,
  currentXP,
  xpToNext,
  goalComplete,
}: {
  timeProgress: number;
  xpProgress: number;
  todayMinutes: number;
  goalMinutes: number;
  streak: number;
  level: number;
  currentXP: number;
  xpToNext: number;
  goalComplete: boolean;
}) {
  const size = 200;
  const outerStroke = 14;
  const innerStroke = 8;

  const outerRadius = (size - outerStroke) / 2;
  const innerRadius = outerRadius - outerStroke - 8;

  const outerCircumference = outerRadius * 2 * Math.PI;
  const innerCircumference = innerRadius * 2 * Math.PI;

  const outerOffset = outerCircumference - (Math.min(timeProgress, 1) * outerCircumference);
  const innerOffset = innerCircumference - (Math.min(xpProgress, 1) * innerCircumference);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (goalComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [goalComplete]);

  return (
    <Animated.View style={[
      styles.unifiedRingContainer,
      { transform: [{ scale: pulseAnim }] }
    ]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="timeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={goalComplete ? colors.success[400] : colors.primary[400]} />
            <Stop offset="100%" stopColor={goalComplete ? colors.success[500] : colors.accent[400]} />
          </SvgGradient>
          <SvgGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent[400]} />
            <Stop offset="100%" stopColor={colors.accent[500]} />
          </SvgGradient>
        </Defs>

        {/* Outer ring - Time progress (background) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke={darkTheme.colors.border.default}
          strokeWidth={outerStroke}
          fill="none"
        />
        {/* Outer ring - Time progress (fill) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="url(#timeGradient)"
          strokeWidth={outerStroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference} ${outerCircumference}`}
          strokeDashoffset={outerOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Inner ring - XP progress (background) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke={darkTheme.colors.border.default}
          strokeWidth={innerStroke}
          fill="none"
          opacity={0.5}
        />
        {/* Inner ring - XP progress (fill) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke="url(#xpGradient)"
          strokeWidth={innerStroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference} ${innerCircumference}`}
          strokeDashoffset={innerOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.unifiedRingCenter}>
        {goalComplete ? (
          <>
            <View style={styles.goalCompleteIcon}>
              <Trophy size={28} color={colors.success[400]} strokeWidth={2} />
            </View>
            <Text style={styles.unifiedRingLabel}>Goal Complete!</Text>
          </>
        ) : (
          <>
            <Text style={styles.unifiedRingValue}>{todayMinutes}</Text>
            <Text style={styles.unifiedRingLabel}>/ {goalMinutes} min</Text>
          </>
        )}
      </View>

      {/* Streak badge - positioned at top right */}
      {streak > 0 && (
        <View style={styles.streakBadgeFloat}>
          <Flame size={14} color={colors.accent[400]} strokeWidth={2} fill={colors.accent[400]} />
          <Text style={styles.streakBadgeFloatText}>{streak}</Text>
        </View>
      )}

      {/* Level badge - positioned at bottom */}
      <View style={styles.levelBadgeFloat}>
        <Text style={styles.levelBadgeFloatText}>Lv.{level}</Text>
      </View>
    </Animated.View>
  );
}

// Animated Streak Flame
function StreakFlame({ streak, size = 24 }: { streak: number; size?: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [streak]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Flame
        size={size}
        color={streak > 0 ? colors.accent[400] : colors.neutral[600]}
        strokeWidth={2}
        fill={streak > 0 ? colors.accent[400] : 'transparent'}
      />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { state } = useLearning();
  const { state: gamificationState } = useGamification();
  const { getTopProblemWords } = usePractice();
  const router = useRouter();

  // Backend-synced daily progress
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [goalMinutes, setGoalMinutes] = useState(state.dailyGoalMinutes || 15);

  // Fetch today's goal from backend
  const fetchTodayGoal = useCallback(async () => {
    try {
      const goal = await apiClient.getTodayGoal();
      setTodayMinutes(goal.actual_study_minutes || 0);
      setGoalMinutes(goal.target_study_minutes || 15);
    } catch (err) {
      // Fall back to local state
      setTodayMinutes(state.todayStats.speakingMinutes);
      setGoalMinutes(state.dailyGoalMinutes || 15);
    }
  }, [state.todayStats.speakingMinutes, state.dailyGoalMinutes]);

  useEffect(() => {
    fetchTodayGoal();
  }, [fetchTodayGoal]);

  // Get problem words for display
  const problemWords = getTopProblemWords(5);

  // Placement test CTA
  if (!state.hasCompletedPlacement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.placementGradient}>
          <View style={styles.placementContainer}>
            <View style={styles.placementIconGlow}>
              <View style={styles.placementIconContainer}>
                <Target size={40} color={colors.primary[400]} strokeWidth={1.5} />
              </View>
            </View>
            <Text style={styles.placementTitle}>Discover Your Level</Text>
            <Text style={styles.placementSubtitle}>
              Take a quick speaking test to unlock your personalized learning path
            </Text>
            <Link href="/placement-test" asChild>
              <TouchableOpacity style={styles.placementButton} activeOpacity={0.9}>
                <View style={styles.placementButtonGradient}>
                  <Text style={styles.placementButtonText}>Begin Assessment</Text>
                  <ChevronRight size={20} color={colors.neutral[0]} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </Link>
            <View style={styles.placementMeta}>
              <Clock size={14} color={colors.neutral[500]} strokeWidth={2} />
              <Text style={styles.placementMetaText}>5 minutes</Text>
              <View style={styles.placementDot} />
              <Mic2 size={14} color={colors.neutral[500]} strokeWidth={2} />
              <Text style={styles.placementMetaText}>Voice-based</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const dailyProgress = goalMinutes > 0
    ? Math.min(todayMinutes / goalMinutes, 1)
    : 0;

  // Calculate XP progress to next level
  const currentLevel = gamificationState.level || 1;
  const xpForNextLevel = (currentLevel + 1) * 100;
  const xpInCurrentLevel = gamificationState.xp - (currentLevel * 100);
  const xpProgress = xpInCurrentLevel / 100; // Each level is 100 XP
  const currentStreak = gamificationState.streak?.currentStreak || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {/* Unified Hero Section */}
        <View style={styles.unifiedHero}>
          {/* Top Row - Date & CEFR Level */}
          <View style={styles.heroTopRow}>
            <Text style={styles.dateText}>{formatDate()}</Text>
            <View style={styles.cefrPill}>
              <Text style={styles.cefrPillText}>{state.cefrLevel || 'A1'}</Text>
            </View>
          </View>

          {/* Greeting */}
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.heroSubtitle}>
            {getMotivationalMessage(
              currentStreak,
              todayMinutes,
              goalMinutes
            )}
          </Text>

          {/* Unified Progress Ring */}
          <View style={styles.unifiedRingWrapper}>
            <UnifiedHeroRing
              timeProgress={dailyProgress}
              xpProgress={xpProgress}
              todayMinutes={todayMinutes}
              goalMinutes={goalMinutes}
              streak={currentStreak}
              level={currentLevel}
              currentXP={xpInCurrentLevel}
              xpToNext={100}
              goalComplete={dailyProgress >= 1}
            />

            {/* Ring Legend */}
            <View style={styles.ringLegend}>
              <View style={styles.ringLegendItem}>
                <View style={[styles.ringLegendDot, { backgroundColor: colors.primary[400] }]} />
                <Text style={styles.ringLegendText}>Time</Text>
              </View>
              <View style={styles.ringLegendItem}>
                <View style={[styles.ringLegendDot, { backgroundColor: colors.accent[400] }]} />
                <Text style={styles.ringLegendText}>XP to level {currentLevel + 1}</Text>
              </View>
            </View>
          </View>

          {/* Continue Button - directly below ring */}
          {/* Routes to Practice tab for self-assessment flow */}
          <Link href="/(tabs)/practice" asChild>
            <Pressable style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
              dailyProgress >= 1 && styles.continueButtonComplete
            ]}>
              <View style={styles.continueButtonInner}>
                {dailyProgress >= 1 ? (
                  <>
                    <Sparkles size={20} color={colors.neutral[0]} strokeWidth={2} />
                    <Text style={styles.continueButtonText}>Bonus Practice</Text>
                  </>
                ) : (
                  <>
                    <Play size={20} color={colors.neutral[0]} strokeWidth={2} fill={colors.neutral[0]} />
                    <Text style={styles.continueButtonText}>
                      {todayMinutes > 0 ? 'Continue' : 'Start Learning'}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </Link>

          {/* Weekly stats pill */}
          <View style={styles.weeklyStatsPill}>
            <Clock size={14} color={colors.neutral[400]} strokeWidth={2} />
            <Text style={styles.weeklyStatsText}>
              {state.weeklyStats.speakingMinutes} min this week
            </Text>
          </View>
        </View>

        {/* Problem Words Section */}
        {problemWords.length > 0 && (
          <View style={styles.srsSection}>
            <ProblemWordsSummary
              problemWords={problemWords}
              onPracticePress={() => router.push('/(tabs)/practice' as any)}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },

  // Unified Hero Section
  unifiedHero: {
    paddingTop: spacing[2],
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[6],
    backgroundColor: darkTheme.colors.background.primary,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  dateText: {
    ...textStyles.labelSmall,
    color: colors.neutral[500],
  },
  cefrPill: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  cefrPillText: {
    ...textStyles.labelMedium,
    color: colors.primary[400],
    fontWeight: '700',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    ...textStyles.bodyMedium,
    color: colors.neutral[500],
    marginTop: spacing[1],
    marginBottom: spacing[5],
  },

  // Unified Ring
  unifiedRingWrapper: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  unifiedRingContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unifiedRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unifiedRingValue: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  unifiedRingLabel: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
    marginTop: -2,
  },
  goalCompleteIcon: {
    marginBottom: spacing[1],
  },
  streakBadgeFloat: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.accent[500] + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: colors.accent[400] + '30',
  },
  streakBadgeFloatText: {
    ...textStyles.labelSmall,
    color: colors.accent[400],
    fontWeight: '700',
  },
  levelBadgeFloat: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: darkTheme.colors.background.elevated,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: darkTheme.colors.border.light,
  },
  levelBadgeFloatText: {
    ...textStyles.labelSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  ringLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[5],
    marginTop: spacing[3],
  },
  ringLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  ringLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ringLegendText: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },

  // Continue Button
  continueButton: {
    backgroundColor: colors.primary[600],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[4],
    ...shadows.md,
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  continueButtonComplete: {
    backgroundColor: colors.success[600],
  },
  continueButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  continueButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
    fontWeight: '600',
  },
  weeklyStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
  },
  weeklyStatsText: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },

  // Legacy styles kept for other components
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },

  // Warm-up Card
  warmupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.screenPadding,
    padding: spacing[4],
    backgroundColor: colors.accent[400] + '10',
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.accent[400] + '20',
    marginBottom: spacing[3],
  },
  warmupIcon: {
    width: 44,
    height: 44,
    borderRadius: layout.radius.lg,
    backgroundColor: colors.accent[400] + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warmupContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  warmupTitle: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  warmupSubtitle: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
  },
  warmupTime: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    backgroundColor: colors.accent[400] + '20',
    borderRadius: layout.radius.md,
  },
  warmupTimeText: {
    ...textStyles.labelSmall,
    color: colors.accent[400],
    fontWeight: '600',
  },

  // Vocab Alert
  vocabAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.screenPadding,
    padding: spacing[4],
    backgroundColor: colors.info[500] + '10',
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.info[500] + '20',
    marginBottom: spacing[4],
  },
  vocabAlertIcon: {
    width: 44,
    height: 44,
    borderRadius: layout.radius.lg,
    backgroundColor: colors.info[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vocabAlertContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  vocabAlertTitle: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  vocabAlertSubtitle: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
  },
  vocabAlertBadge: {
    width: 32,
    height: 32,
    borderRadius: layout.radius.full,
    backgroundColor: colors.info[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  vocabAlertBadgeText: {
    ...textStyles.labelMedium,
    color: colors.neutral[0],
    fontWeight: '700',
  },

  // Sections
  section: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...textStyles.labelMedium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[3],
  },

  // Quick Actions
  quickActionsGrid: {
    gap: spacing[2.5],
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.background.card,
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  quickActionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  quickActionTitle: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  quickActionSubtitle: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
    marginTop: spacing[0.5],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: layout.radius.full,
  },
  badgeText: {
    ...textStyles.labelSmall,
    color: colors.neutral[0],
    fontWeight: '700',
  },

  // Progress Card
  progressCard: {
    backgroundColor: colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStatItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
  progressStatLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },
  miniRingValue: {
    ...textStyles.labelMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  statPill: {
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    minWidth: 80,
  },
  statPillValue: {
    ...textStyles.headlineMedium,
    fontWeight: '700',
  },
  statPillLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[0.5],
  },

  // Journey Card
  journeyCard: {
    backgroundColor: colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  journeyLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  journeyLevelItem: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  journeyDot: {
    width: 20,
    height: 20,
    borderRadius: layout.radius.full,
    backgroundColor: colors.neutral[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  journeyDotCompleted: {
    backgroundColor: colors.primary[500],
  },
  journeyDotCurrent: {
    backgroundColor: colors.primary[500],
    width: 24,
    height: 24,
  },
  journeyDotInner: {
    width: 8,
    height: 8,
    borderRadius: layout.radius.full,
    backgroundColor: colors.neutral[0],
  },
  journeyDotPulse: {
    width: 10,
    height: 10,
    borderRadius: layout.radius.full,
    backgroundColor: colors.neutral[0],
  },
  journeyLine: {
    position: 'absolute',
    top: 10,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.neutral[700],
  },
  journeyLineCompleted: {
    backgroundColor: colors.primary[500],
  },
  journeyLevelText: {
    ...textStyles.labelSmall,
    color: colors.neutral[600],
  },
  journeyLevelTextActive: {
    color: colors.primary[400],
    fontWeight: '600',
  },
  journeyProgress: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  // Placement Test
  placementGradient: {
    flex: 1,
    backgroundColor: colors.primary[900] + '20',
  },
  placementContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  placementIconGlow: {
    padding: spacing[4],
    borderRadius: layout.radius.full,
    backgroundColor: colors.primary[500] + '10',
    marginBottom: spacing[6],
  },
  placementIconContainer: {
    width: 80,
    height: 80,
    borderRadius: layout.radius.full,
    backgroundColor: colors.primary[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placementTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  placementSubtitle: {
    ...textStyles.bodyMedium,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[8],
    maxWidth: 280,
  },
  placementButton: {
    width: '100%',
    borderRadius: layout.radius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  placementButtonGradient: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  placementButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
    fontWeight: '600',
  },
  placementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[5],
  },
  placementMetaText: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },
  placementDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[600],
  },

  // SRS Section
  srsSection: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[4],
  },
  srsReviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.success[500] + '10',
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.success[500] + '20',
  },
  srsReviewIcon: {
    width: 44,
    height: 44,
    borderRadius: layout.radius.lg,
    backgroundColor: colors.success[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  srsReviewContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  srsReviewTitle: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  srsReviewSubtitle: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
  },
  srsReviewBadge: {
    width: 32,
    height: 32,
    borderRadius: layout.radius.full,
    backgroundColor: colors.success[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  srsReviewBadgeText: {
    ...textStyles.labelMedium,
    color: colors.neutral[0],
    fontWeight: '700',
  },

  // Section Header Row (for recommendations)
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  // Recommendations
  recommendationsContainer: {
    gap: spacing[2.5],
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.background.card,
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  recommendationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  recommendationTitle: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  topPickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.accent[500] + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: layout.radius.full,
  },
  topPickText: {
    ...textStyles.labelSmall,
    color: colors.accent[400],
    fontWeight: '600',
  },
  recommendationReason: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  difficultyBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: layout.radius.md,
  },
  difficultyText: {
    ...textStyles.labelSmall,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recommendationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  recommendationTimeText: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },

  bottomSpacer: {
    height: spacing[4],
  },
});
