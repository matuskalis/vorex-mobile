import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useLearning } from '../../src/context/LearningContext';
import { useVocabulary } from '../../src/context/VocabularyContext';
import { useGamification } from '../../src/context/GamificationContext';
import { XPBar } from '../../src/components/XPBar';
import { StreakBadge } from '../../src/components/StreakBadge';
import { Target, Play, Coffee, TrendingUp, Clock, ChevronRight, Zap, Mic2, Sun, BookOpen, Users, Brain, Trophy } from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../../src/theme';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const { state } = useLearning();
  const { getDueTodayWords, getStats } = useVocabulary();
  const { state: gamificationState } = useGamification();

  // If user hasn't completed placement test, show CTA
  if (!state.hasCompletedPlacement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.placementContainer}>
          <View style={styles.placementIconContainer}>
            <Target size={48} color={colors.primary[500]} strokeWidth={1.5} />
          </View>
          <Text style={styles.placementTitle}>Let's find your level</Text>
          <Text style={styles.placementDescription}>
            Take a quick speaking test to personalize your learning journey.
            We'll assess your pronunciation, grammar, and fluency.
          </Text>
          <Link href="/placement-test" asChild>
            <TouchableOpacity style={styles.placementButton} activeOpacity={0.85}>
              <Text style={styles.placementButtonText}>Start Placement Test</Text>
              <ChevronRight size={20} color={colors.neutral[0]} strokeWidth={2.5} />
            </TouchableOpacity>
          </Link>
          <View style={styles.placementTimeContainer}>
            <Clock size={14} color={colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.placementTime}>Takes about 5 minutes</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const progressToNextLevel = 65; // TODO: Calculate from actual data
  const currentLevelIndex = CEFR_LEVELS.indexOf(state.cefrLevel || 'A1');
  const dailyProgress = state.dailyGoalMinutes > 0
    ? Math.min(state.todayStats.speakingMinutes / state.dailyGoalMinutes, 1)
    : 0;

  const vocabStats = getStats();
  const dueWords = getDueTodayWords();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formatDate()}</Text>
            <Text style={styles.greeting}>Ready to practice?</Text>
          </View>
          <View style={styles.weeklyStats}>
            <Text style={styles.weeklyMinutes}>{state.weeklyStats.speakingMinutes}</Text>
            <Text style={styles.weeklyLabel}>min this week</Text>
          </View>
        </View>

        {/* Gamification - XP Bar and Streak */}
        <View style={styles.gamificationSection}>
          <XPBar showXPNumbers={true} />
          <StreakBadge showDetails={true} />
        </View>

        {/* Warm-up Card - Show if available */}
        {state.hasWarmupAvailable && (
          <Link href="/warm-up" asChild>
            <Pressable style={({ pressed }) => [styles.warmupCard, pressed && styles.cardPressed]}>
              <View style={styles.warmupHeader}>
                <View style={styles.warmupBadge}>
                  <Sun size={14} color={colors.accent[400]} strokeWidth={2.5} />
                  <Text style={styles.warmupBadgeText}>WARM-UP</Text>
                </View>
                <View style={styles.warmupTimeContainer}>
                  <Clock size={14} color={colors.text.tertiary} strokeWidth={2} />
                  <Text style={styles.warmupTime}>~2 min</Text>
                </View>
              </View>
              <View style={styles.warmupContent}>
                <BookOpen size={24} color={colors.accent[400]} strokeWidth={2} />
                <View style={styles.warmupInfo}>
                  <Text style={styles.warmupTitle}>Yesterday's Review</Text>
                  <Text style={styles.warmupDescription}>
                    Quick warm-up based on your last session
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />
              </View>
            </Pressable>
          </Link>
        )}

        {/* Vocabulary Review Card - Show if words are due */}
        {dueWords.length > 0 && (
          <Link href="/vocabulary-review" asChild>
            <Pressable style={({ pressed }) => [styles.vocabCard, pressed && styles.cardPressed]}>
              <View style={styles.vocabHeader}>
                <View style={styles.vocabBadge}>
                  <Brain size={14} color={colors.neutral[0]} strokeWidth={2.5} />
                  <Text style={styles.vocabBadgeText}>VOCABULARY</Text>
                </View>
                <View style={styles.vocabDueBadge}>
                  <Text style={styles.vocabDueText}>{dueWords.length}</Text>
                </View>
              </View>
              <View style={styles.vocabContent}>
                <BookOpen size={24} color={colors.info[400]} strokeWidth={2} />
                <View style={styles.vocabInfo}>
                  <Text style={styles.vocabTitle}>Review Vocabulary</Text>
                  <Text style={styles.vocabDescription}>
                    {dueWords.length} {dueWords.length === 1 ? 'word' : 'words'} ready to review
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />
              </View>
            </Pressable>
          </Link>
        )}

        {/* Daily Lesson Card */}
        <Link href="/lesson" asChild>
          <Pressable style={({ pressed }) => [styles.dailyLessonCard, pressed && styles.cardPressed]}>
            <View style={styles.lessonHeader}>
              <View style={styles.lessonBadge}>
                <Zap size={12} color={colors.neutral[0]} strokeWidth={2.5} />
                <Text style={styles.lessonBadgeText}>TODAY</Text>
              </View>
              <View style={styles.lessonTimeContainer}>
                <Clock size={14} color={colors.text.tertiary} strokeWidth={2} />
                <Text style={styles.lessonTime}>~15 min</Text>
              </View>
            </View>
            <Text style={styles.lessonTitle}>Today's Speaking Session</Text>
            <Text style={styles.lessonDescription}>
              Practice conversation, pronunciation drills, and vocabulary
            </Text>
            <View style={styles.lessonProgress}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { flex: dailyProgress }]} />
              </View>
              <Text style={styles.progressText}>
                {state.todayStats.speakingMinutes}/{state.dailyGoalMinutes} min today
              </Text>
            </View>
            <View style={styles.startButton}>
              <Play size={18} color={colors.neutral[0]} strokeWidth={2.5} fill={colors.neutral[0]} />
              <Text style={styles.startButtonText}>Start Session</Text>
            </View>
          </Pressable>
        </Link>

        {/* Current Level */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelLabel}>Current Level</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelValue}>{state.cefrLevel || 'A1'}</Text>
            </View>
          </View>
          <View style={styles.levelProgress}>
            {CEFR_LEVELS.map((level, index) => (
              <View key={level} style={styles.levelDotContainer}>
                <View
                  style={[
                    styles.levelDot,
                    index <= currentLevelIndex && styles.levelDotActive,
                    index === currentLevelIndex && styles.levelDotCurrent,
                  ]}
                />
                <Text style={[
                  styles.levelDotText,
                  index <= currentLevelIndex && styles.levelDotTextActive,
                ]}>
                  {level}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.levelProgressBar}>
            <View style={[styles.levelProgressFill, { flex: progressToNextLevel / 100 }]} />
          </View>
          <Text style={styles.levelProgressText}>
            {progressToNextLevel}% to {CEFR_LEVELS[currentLevelIndex + 1] || 'C1'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Practice</Text>

          {/* Pronunciation Drill Card */}
          <Link href="/pronunciation-drill" asChild>
            <Pressable style={({ pressed }) => [styles.quickActionCard, pressed && styles.cardPressed]}>
              <View style={styles.quickActionIconContainer}>
                <Mic2 size={24} color={colors.primary[500]} strokeWidth={2} />
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Pronunciation Drill</Text>
                <Text style={styles.quickActionDescription}>
                  Practice tricky sounds with instant feedback
                </Text>
              </View>
              <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />
            </Pressable>
          </Link>

          {/* Role Play Scenarios */}
          <Link href="/role-play" asChild>
            <Pressable style={({ pressed }) => [styles.quickActionCard, pressed && styles.cardPressed]}>
              <View style={styles.quickActionIconContainer}>
                <Users size={24} color={colors.accent[400]} strokeWidth={2} />
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Role Play Scenarios</Text>
                <Text style={styles.quickActionDescription}>
                  Practice real conversations with AI personas
                </Text>
              </View>
              <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />
            </Pressable>
          </Link>

          {/* Vocabulary List */}
          <Link href="/vocabulary" asChild>
            <Pressable style={({ pressed }) => [styles.quickActionCard, pressed && styles.cardPressed]}>
              <View style={styles.quickActionIconContainer}>
                <Brain size={24} color={colors.info[400]} strokeWidth={2} />
              </View>
              <View style={styles.quickActionInfo}>
                <View style={styles.vocabTitleRow}>
                  <Text style={styles.quickActionTitle}>My Vocabulary</Text>
                  {vocabStats.total > 0 && (
                    <View style={styles.vocabCountBadge}>
                      <Text style={styles.vocabCountText}>{vocabStats.total}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickActionDescription}>
                  Review and manage your learned words
                </Text>
              </View>
              <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={2} />
            </Pressable>
          </Link>
        </View>

        {/* Analytics Snapshot */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <TrendingUp size={16} color={colors.primary[500]} strokeWidth={2} />
            <Text style={styles.analyticsTitle}>This Week's Progress</Text>
          </View>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {state.weeklyStats.fluencyScore}%
              </Text>
              <Text style={styles.analyticsLabel}>Fluency</Text>
              <View style={[styles.analyticsBar, { backgroundColor: colors.primary[900] }]}>
                <View style={[styles.analyticsBarFill, { flex: state.weeklyStats.fluencyScore / 100, backgroundColor: colors.primary[500] }]} />
              </View>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {state.weeklyStats.pronunciationScore}%
              </Text>
              <Text style={styles.analyticsLabel}>Pronunciation</Text>
              <View style={[styles.analyticsBar, { backgroundColor: colors.success[900] }]}>
                <View style={[styles.analyticsBarFill, { flex: state.weeklyStats.pronunciationScore / 100, backgroundColor: colors.success[500] }]} />
              </View>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {state.weeklyStats.grammarScore}%
              </Text>
              <Text style={styles.analyticsLabel}>Grammar</Text>
              <View style={[styles.analyticsBar, { backgroundColor: colors.accent[900] }]}>
                <View style={[styles.analyticsBarFill, { flex: state.weeklyStats.grammarScore / 100, backgroundColor: colors.accent[500] }]} />
              </View>
            </View>
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
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },
  gamificationSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  // Placement Test CTA
  placementContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  placementIconContainer: {
    width: 96,
    height: 96,
    borderRadius: layout.radius.full,
    backgroundColor: colors.primary[500] + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  placementTitle: {
    ...textStyles.headlineLarge,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  placementDescription: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  placementButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: layout.radius.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    ...shadows.md,
  },
  placementButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
  placementTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginTop: spacing[4],
  },
  placementTime: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  dateText: {
    ...textStyles.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  greeting: {
    ...textStyles.headlineMedium,
    color: colors.text.primary,
  },
  weeklyStats: {
    alignItems: 'flex-end',
  },
  weeklyMinutes: {
    ...textStyles.displaySmall,
    color: colors.primary[500],
  },
  weeklyLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  // Daily Lesson Card
  dailyLessonCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: layout.screenPadding,
    padding: spacing[5],
    borderRadius: layout.radius['2xl'],
    borderWidth: 1,
    borderColor: colors.primary[500],
    marginBottom: spacing[4],
    ...shadows.lg,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  lessonBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: layout.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  lessonBadgeText: {
    ...textStyles.labelSmall,
    color: colors.neutral[0],
  },
  lessonTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  lessonTime: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  lessonTitle: {
    ...textStyles.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  lessonDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[5],
  },
  lessonProgress: {
    marginBottom: spacing[5],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.neutral[800],
    borderRadius: layout.radius.full,
    marginBottom: spacing[2],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.accent[400],
    borderRadius: layout.radius.full,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  startButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3.5],
    borderRadius: layout.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  startButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
  // Level Card
  levelCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: layout.screenPadding,
    padding: spacing[5],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  levelLabel: {
    ...textStyles.labelMedium,
    color: colors.text.tertiary,
  },
  levelBadge: {
    backgroundColor: colors.accent[400] + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.md,
  },
  levelValue: {
    ...textStyles.headlineMedium,
    color: colors.accent[400],
  },
  levelProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  levelDotContainer: {
    alignItems: 'center',
    gap: spacing[1.5],
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: layout.radius.full,
    backgroundColor: colors.neutral[700],
  },
  levelDotActive: {
    backgroundColor: colors.primary[500],
  },
  levelDotCurrent: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  levelDotText: {
    ...textStyles.labelSmall,
    color: colors.text.disabled,
  },
  levelDotTextActive: {
    color: colors.primary[400],
  },
  levelProgressBar: {
    height: 4,
    backgroundColor: colors.neutral[800],
    borderRadius: layout.radius.full,
    marginBottom: spacing[2],
    flexDirection: 'row',
  },
  levelProgressFill: {
    height: 4,
    backgroundColor: colors.primary[500],
    borderRadius: layout.radius.full,
  },
  levelProgressText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  // Quick Actions Section
  quickActionsContainer: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...textStyles.labelMedium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  quickActionCard: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: layout.radius.lg,
    backgroundColor: colors.primary[500] + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  quickActionInfo: {
    flex: 1,
  },
  quickActionTitle: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  quickActionDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  // Analytics Card
  analyticsCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: layout.screenPadding,
    padding: spacing[5],
    borderRadius: layout.radius.xl,
    ...shadows.sm,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  analyticsTitle: {
    ...textStyles.labelMedium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsValue: {
    ...textStyles.headlineMedium,
    color: colors.text.primary,
    marginBottom: spacing[0.5],
  },
  analyticsLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  },
  analyticsBar: {
    width: '100%',
    height: 4,
    borderRadius: layout.radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  analyticsBarFill: {
    height: 4,
    borderRadius: layout.radius.full,
  },
  bottomSpacer: {
    height: spacing[6],
  },
  // Warm-up Card
  warmupCard: {
    backgroundColor: colors.accent[400] + '15',
    marginHorizontal: layout.screenPadding,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.accent[400] + '30',
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  warmupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  warmupBadge: {
    backgroundColor: colors.accent[400],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: layout.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  warmupBadgeText: {
    ...textStyles.labelSmall,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  warmupTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  warmupTime: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  warmupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  warmupInfo: {
    flex: 1,
  },
  warmupTitle: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  warmupDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  // Vocabulary Card
  vocabCard: {
    backgroundColor: colors.info[500] + '15',
    marginHorizontal: layout.screenPadding,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.info[500] + '30',
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  vocabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  vocabBadge: {
    backgroundColor: colors.info[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: layout.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  vocabBadgeText: {
    ...textStyles.labelSmall,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  vocabDueBadge: {
    backgroundColor: colors.info[500],
    width: 28,
    height: 28,
    borderRadius: layout.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vocabDueText: {
    ...textStyles.labelMedium,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  vocabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  vocabInfo: {
    flex: 1,
  },
  vocabTitle: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  vocabDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  vocabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  vocabCountBadge: {
    backgroundColor: colors.info[500] + '30',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: layout.radius.md,
  },
  vocabCountText: {
    ...textStyles.caption,
    color: colors.info[400],
    fontWeight: '700',
  },
});
