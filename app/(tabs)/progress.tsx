import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useLearning } from '../../src/context/LearningContext';
import { useGamification } from '../../src/context/GamificationContext';
import { useSRSStats } from '../../src/contexts';
import Svg, { Circle } from 'react-native-svg';
import { TrendingUp, Clock, Target, Calendar, Award, Flame, RefreshCw, AlertCircle } from 'lucide-react-native';
import { colors, spacing, layout, textStyles, darkTheme } from '../../src/theme';
import { apiClient, SessionStats, DailyBreakdown, ProgressSummary } from '../../src/lib/api-client';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Circular Progress Ring Component
function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = colors.primary[500],
  bgColor = darkTheme.colors.border.default,
  children
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 1) * circumference);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
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

// Performance Metric Card with Ring
function MetricRing({
  label,
  value,
  change,
  color,
}: {
  label: string;
  value: number;
  change: string;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <ProgressRing progress={value / 100} size={72} strokeWidth={6} color={color}>
        <Text style={[styles.metricValue, { color }]}>{value}%</Text>
      </ProgressRing>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricChange}>
        <TrendingUp size={10} color={colors.success[500]} strokeWidth={2.5} />
        <Text style={styles.metricChangeText}>{change}</Text>
      </View>
    </View>
  );
}

// Day Activity Indicator
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function DayIndicator({
  day,
  minutes,
  isToday,
  dayIndex,
  onPress
}: {
  day: string;
  minutes: number;
  isToday: boolean;
  dayIndex: number;
  onPress: (dayName: string, minutes: number, isToday: boolean) => void;
}) {
  const maxMinutes = 30;
  const progress = Math.min(minutes / maxMinutes, 1);
  const hasActivity = minutes > 0;

  return (
    <TouchableOpacity
      style={styles.dayIndicator}
      onPress={() => onPress(DAY_NAMES[dayIndex], minutes, isToday)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.dayDot,
        hasActivity && styles.dayDotActive,
        isToday && styles.dayDotToday,
        { opacity: hasActivity ? 0.3 + (progress * 0.7) : 0.2 }
      ]} />
      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
    </TouchableOpacity>
  );
}

export default function ProgressScreen() {
  const { state } = useLearning();
  const { state: gamificationState } = useGamification();
  const srsStats = useSRSStats();

  // Backend data state
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyBreakdown[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch backend data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, breakdownData, summaryData] = await Promise.all([
        apiClient.getSessionStats(),
        apiClient.getDailyBreakdown(7),
        apiClient.getProgressSummary().catch(() => null),
      ]);
      setSessionStats(statsData);
      setDailyBreakdown(breakdownData.days);
      setProgressSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setIsLoading(false);
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

  // Calculate weekly minutes from backend data
  const weeklyMinutes = DAYS_OF_WEEK.map((_, index) => {
    const dayData = dailyBreakdown[index];
    return dayData ? Math.round((dayData.total_speaking_time || 0) / 60) : 0;
  });

  const dailyProgress = state.dailyGoalMinutes > 0
    ? Math.min(state.todayStats.speakingMinutes / state.dailyGoalMinutes, 1)
    : 0;

  const weeklyTotal = weeklyMinutes.reduce((a, b) => a + b, 0);
  const todayIndex = new Date().getDay();
  const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  // Handle day circle tap
  const handleDayPress = useCallback((dayName: string, minutes: number, isToday: boolean) => {
    const title = isToday ? `${dayName} (Today)` : dayName;
    const message = minutes > 0
      ? `You practiced for ${minutes} minute${minutes !== 1 ? 's' : ''} on ${dayName}.`
      : `No practice recorded for ${dayName}.`;

    Alert.alert(title, message, [{ text: 'OK' }]);
  }, []);

  // Format time from seconds
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[400]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Track your learning journey</Text>
          </View>
          <View style={styles.levelBadge}>
            <Award size={14} color={darkTheme.colors.background.primary} strokeWidth={2.5} />
            <Text style={styles.levelText}>{state.cefrLevel || 'A1'}</Text>
          </View>
        </View>

        {/* Daily Goal Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <ProgressRing
              progress={dailyProgress}
              size={120}
              strokeWidth={10}
              color={dailyProgress >= 1 ? colors.success[500] : colors.primary[500]}
            >
              <View style={styles.heroRingContent}>
                <Text style={styles.heroValue}>{state.todayStats.speakingMinutes}</Text>
                <Text style={styles.heroUnit}>min</Text>
              </View>
            </ProgressRing>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>Today's Goal</Text>
              <Text style={styles.heroTarget}>Target: {state.dailyGoalMinutes} minutes</Text>
              <View style={styles.heroProgressBar}>
                <View style={[styles.heroProgressFill, { flex: dailyProgress }]} />
              </View>
              <Text style={styles.heroRemaining}>
                {dailyProgress >= 1
                  ? 'Goal complete!'
                  : `${Math.max(state.dailyGoalMinutes - state.todayStats.speakingMinutes, 0)} min to go`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Calendar size={16} color={colors.primary[500]} strokeWidth={2} />
              <Text style={styles.cardTitle}>This Week</Text>
            </View>
            <Text style={styles.weeklyTotal}>{weeklyTotal}m total</Text>
          </View>
          <View style={styles.weekGrid}>
            {DAYS_OF_WEEK.map((day, index) => (
              <DayIndicator
                key={index}
                day={day}
                minutes={weeklyMinutes[index]}
                isToday={index === adjustedTodayIndex}
                dayIndex={index}
                onPress={handleDayPress}
              />
            ))}
          </View>
          <View style={styles.streakRow}>
            <Flame size={16} color={colors.accent[500]} strokeWidth={2} fill={colors.accent[500]} />
            <Text style={styles.streakText}>
              {progressSummary?.streak_days ?? gamificationState.streakDays ?? 0} day streak
            </Text>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.trendBadge}>
            <TrendingUp size={12} color={colors.success[500]} strokeWidth={2.5} />
            <Text style={styles.trendText}>Improving</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricRing
            label="Pronunciation"
            value={state.weeklyStats.pronunciationScore}
            change="+13%"
            color={colors.primary[500]}
          />
          <MetricRing
            label="Fluency"
            value={state.weeklyStats.fluencyScore}
            change="+8%"
            color={colors.success[500]}
          />
          <MetricRing
            label="Grammar"
            value={state.weeklyStats.grammarScore}
            change="+4%"
            color={colors.accent[500]}
          />
        </View>

        {/* Monthly Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Month</Text>
          </View>
          <View style={styles.monthlyGrid}>
            <View style={styles.monthlyItem}>
              <View style={[styles.monthlyIcon, { backgroundColor: colors.primary[500] + '20' }]}>
                <Clock size={18} color={colors.primary[500]} strokeWidth={2} />
              </View>
              <Text style={styles.monthlyValue}>
                {sessionStats ? formatTime(sessionStats.total_speaking_time) : '--'}
              </Text>
              <Text style={styles.monthlyLabel}>Speaking Time</Text>
            </View>
            <View style={styles.monthlyItem}>
              <View style={[styles.monthlyIcon, { backgroundColor: colors.success[500] + '20' }]}>
                <Target size={18} color={colors.success[500]} strokeWidth={2} />
              </View>
              <Text style={styles.monthlyValue}>
                {sessionStats?.total_sessions ?? '--'}
              </Text>
              <Text style={styles.monthlyLabel}>Sessions</Text>
            </View>
          </View>
          <View style={styles.monthlyGrid}>
            <View style={styles.monthlyItem}>
              <View style={[styles.monthlyIcon, { backgroundColor: colors.accent[500] + '20' }]}>
                <Award size={18} color={colors.accent[500]} strokeWidth={2} />
              </View>
              <Text style={styles.monthlyValue}>
                {srsStats?.cards_learned ?? '--'}
              </Text>
              <Text style={styles.monthlyLabel}>Cards Learned</Text>
            </View>
            <View style={styles.monthlyItem}>
              <View style={[styles.monthlyIcon, { backgroundColor: colors.info[500] + '20' }]}>
                <Calendar size={18} color={colors.info[500]} strokeWidth={2} />
              </View>
              <Text style={styles.monthlyValue}>
                {Math.round(srsStats?.average_retention ?? 0)}%
              </Text>
              <Text style={styles.monthlyLabel}>SRS Retention</Text>
            </View>
          </View>
        </View>

        {/* CEFR Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Level Progress</Text>
            <Text style={styles.progressPercent}>65%</Text>
          </View>
          <View style={styles.cefrContainer}>
            <View style={styles.cefrLevels}>
              {['A1', 'A2', 'B1', 'B2', 'C1'].map((level, index) => {
                const currentIndex = ['A1', 'A2', 'B1', 'B2', 'C1'].indexOf(state.cefrLevel || 'A1');
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <View key={level} style={styles.cefrLevel}>
                    <View style={[
                      styles.cefrDot,
                      isCompleted && styles.cefrDotCompleted,
                      isCurrent && styles.cefrDotCurrent,
                    ]}>
                      {isCompleted && <Text style={styles.cefrCheck}>✓</Text>}
                      {isCurrent && <View style={styles.cefrDotInner} />}
                    </View>
                    <Text style={[
                      styles.cefrLabel,
                      (isCompleted || isCurrent) && styles.cefrLabelActive,
                    ]}>
                      {level}
                    </Text>
                    {index < 4 && (
                      <View style={[
                        styles.cefrLine,
                        index < currentIndex && styles.cefrLineCompleted,
                      ]} />
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={styles.cefrHint}>
              Keep practicing to reach {['A1', 'A2', 'B1', 'B2', 'C1'][(['A1', 'A2', 'B1', 'B2', 'C1'].indexOf(state.cefrLevel || 'A1') + 1)] || 'fluency'}!
            </Text>
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
    marginTop: spacing[0.5],
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.accent[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: layout.radius.full,
  },
  levelText: {
    ...textStyles.labelMedium,
    color: darkTheme.colors.background.primary,
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    backgroundColor: darkTheme.colors.background.card,
    marginHorizontal: layout.screenPadding,
    marginTop: spacing[4],
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
  },
  heroRingContent: {
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  heroUnit: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: -4,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  heroTarget: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  heroProgressBar: {
    height: 6,
    backgroundColor: darkTheme.colors.border.default,
    borderRadius: layout.radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  heroProgressFill: {
    height: 6,
    backgroundColor: colors.primary[500],
    borderRadius: layout.radius.full,
  },
  heroRemaining: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },

  // Cards
  card: {
    backgroundColor: darkTheme.colors.background.card,
    marginHorizontal: layout.screenPadding,
    marginTop: spacing[4],
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  cardTitle: {
    ...textStyles.labelMedium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weeklyTotal: {
    ...textStyles.labelMedium,
    color: colors.primary[500],
    fontWeight: '600',
  },

  // Week Grid
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  dayIndicator: {
    alignItems: 'center',
    gap: spacing[2],
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
  },
  dayDotActive: {
    backgroundColor: colors.primary[500],
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: colors.accent[500],
  },
  dayLabel: {
    ...textStyles.caption,
    color: colors.neutral[600],
  },
  dayLabelToday: {
    color: colors.accent[500],
    fontWeight: '600',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.border.default,
  },
  streakText: {
    ...textStyles.labelMedium,
    color: colors.accent[500],
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...textStyles.labelMedium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.success[500] + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.full,
  },
  trendText: {
    ...textStyles.labelSmall,
    color: colors.success[500],
    fontWeight: '600',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    gap: spacing[3],
  },
  metricCard: {
    flex: 1,
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[0.5],
    marginTop: spacing[1],
  },
  metricChangeText: {
    ...textStyles.labelSmall,
    color: colors.success[500],
    fontWeight: '600',
  },

  // Monthly Grid
  monthlyGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background.primary,
    borderRadius: layout.radius.lg,
    padding: spacing[4],
  },
  monthlyIcon: {
    width: 40,
    height: 40,
    borderRadius: layout.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  monthlyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing[0.5],
  },
  monthlyLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },

  // CEFR Progress
  cefrContainer: {
    alignItems: 'center',
  },
  cefrLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing[4],
    position: 'relative',
  },
  cefrLevel: {
    alignItems: 'center',
    flex: 1,
  },
  cefrDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: darkTheme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    zIndex: 1,
  },
  cefrDotCompleted: {
    backgroundColor: colors.success[500],
  },
  cefrDotCurrent: {
    backgroundColor: colors.primary[500],
    borderWidth: 3,
    borderColor: colors.primary[500] + '40',
  },
  cefrDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral[0],
  },
  cefrCheck: {
    color: colors.neutral[0],
    fontSize: 14,
    fontWeight: '700',
  },
  cefrLabel: {
    ...textStyles.labelSmall,
    color: colors.neutral[600],
  },
  cefrLabelActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  cefrLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: darkTheme.colors.border.default,
    zIndex: 0,
  },
  cefrLineCompleted: {
    backgroundColor: colors.success[500],
  },
  cefrHint: {
    ...textStyles.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  progressPercent: {
    ...textStyles.labelMedium,
    color: colors.primary[500],
    fontWeight: '600',
  },

  bottomSpacer: {
    height: spacing[4],
  },
});
