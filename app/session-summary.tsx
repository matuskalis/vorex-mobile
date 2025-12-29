import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useLearning } from '../src/context/LearningContext';
import {
  CheckCircle2,
  TrendingUp,
  Target,
  Book,
  Award,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Share2,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';

interface SessionStats {
  speakingMinutes: number;
  wordsSpoken: number;
  pronunciationScore: number | null;  // null = no valid score
  fluencyScore: number | null;        // null = no valid score
  thingsDoneWell: string[];
  areasToImprove: string[];
  vocabularyLearned: string[];
}

export default function SessionSummaryScreen() {
  const { addSpeakingTime, updateScores, saveSessionResult } = useLearning();
  const params = useLocalSearchParams();

  // Parse session stats from params - NO DEFAULTS for scores (must be real)
  const sessionStats: SessionStats = {
    speakingMinutes: Number(params.speakingMinutes) || 0,
    wordsSpoken: Number(params.wordsSpoken) || 0,
    pronunciationScore: params.pronunciationScore ? Number(params.pronunciationScore) : null,
    fluencyScore: params.fluencyScore ? Number(params.fluencyScore) : null,
    thingsDoneWell: params.thingsDoneWell
      ? JSON.parse(params.thingsDoneWell as string)
      : ['Clear pronunciation', 'Natural pacing', 'Good vocabulary usage'],
    areasToImprove: params.areasToImprove
      ? JSON.parse(params.areasToImprove as string)
      : ['Practice "th" sounds', 'Use more varied expressions', 'Work on sentence stress'],
    vocabularyLearned: params.vocabularyLearned
      ? JSON.parse(params.vocabularyLearned as string)
      : ['latte', 'espresso', 'foam'],
  };

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Check if we have valid scores
  const hasValidScores = sessionStats.pronunciationScore !== null && sessionStats.fluencyScore !== null;

  useEffect(() => {
    // Celebration animation for good sessions - only if scores are valid
    if (hasValidScores && sessionStats.pronunciationScore! >= 70 && sessionStats.fluencyScore! >= 70) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }

    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    // Save session data to learning context
    addSpeakingTime(sessionStats.speakingMinutes);
    // Only update scores if they are valid (not null)
    if (hasValidScores) {
      updateScores({
        pronunciation: sessionStats.pronunciationScore!,
        fluency: sessionStats.fluencyScore!,
      });
    }

    // Save session result for warm-up generation
    const sessionResult = {
      sessionId: `session_${Date.now()}`,
      date: new Date().toISOString(),
      speakingMinutes: sessionStats.speakingMinutes,
      wordsSpoken: sessionStats.wordsSpoken,
      pronunciationScore: sessionStats.pronunciationScore,
      fluencyScore: sessionStats.fluencyScore,
      thingsDoneWell: sessionStats.thingsDoneWell,
      areasToImprove: sessionStats.areasToImprove,
      vocabularyLearned: sessionStats.vocabularyLearned,
      mispronuncedWords: [],
      scenarioId: 'coffee_shop',
    };
    saveSessionResult(sessionResult);

    // Navigate back to home
    router.replace('/(tabs)');
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return colors.neutral[400]; // Gray for N/A
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.warning[500];
    return colors.error[500];
  };

  // Format score for display
  const formatScore = (score: number | null) => {
    return score !== null ? `${score}%` : 'N/A';
  };

  const getScoreEmoji = (score: number | null) => {
    if (score === null) return '❓';
    if (score >= 80) return '🌟';
    if (score >= 60) return '👍';
    return '💪';
  };

  const isGoodSession = hasValidScores &&
    sessionStats.pronunciationScore! >= 70 &&
    sessionStats.fluencyScore! >= 70;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with celebration */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {isGoodSession && (
            <Animated.View
              style={[
                styles.celebrationBadge,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Sparkles size={24} color={colors.accent[400]} strokeWidth={2} />
            </Animated.View>
          )}
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.subtitle}>
            {isGoodSession
              ? 'Outstanding work! Keep it up!'
              : 'Great effort! Every session makes you better!'}
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View
          style={[
            styles.statsGrid,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary[500] + '15' }]}>
              <TrendingUp size={24} color={colors.primary[500]} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{sessionStats.speakingMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent[400] + '15' }]}>
              <Book size={24} color={colors.accent[400]} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{sessionStats.wordsSpoken}</Text>
            <Text style={styles.statLabel}>Words Spoken</Text>
          </View>
        </Animated.View>

        {/* Score Cards */}
        <View style={styles.scoresSection}>
          <Text style={styles.sectionTitle}>Your Scores</Text>

          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreEmoji}>{getScoreEmoji(sessionStats.pronunciationScore)}</Text>
                <View>
                  <Text style={styles.scoreLabel}>Pronunciation</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(sessionStats.pronunciationScore) }]}>
                    {formatScore(sessionStats.pronunciationScore)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    flex: (sessionStats.pronunciationScore ?? 0) / 100,
                    backgroundColor: getScoreColor(sessionStats.pronunciationScore),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreEmoji}>{getScoreEmoji(sessionStats.fluencyScore)}</Text>
                <View>
                  <Text style={styles.scoreLabel}>Fluency</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(sessionStats.fluencyScore) }]}>
                    {formatScore(sessionStats.fluencyScore)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    flex: (sessionStats.fluencyScore ?? 0) / 100,
                    backgroundColor: getScoreColor(sessionStats.fluencyScore),
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Things Done Well */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={colors.success[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Things You Did Well</Text>
          </View>
          <View style={styles.listContainer}>
            {sessionStats.thingsDoneWell.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <CheckCircle2 size={18} color={colors.success[500]} strokeWidth={2.5} />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Areas to Improve */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={colors.warning[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Areas to Improve</Text>
          </View>
          <View style={styles.listContainer}>
            {sessionStats.areasToImprove.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.improvementDot} />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* New Vocabulary */}
        {sessionStats.vocabularyLearned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Vocabulary Learned</Text>
            <View style={styles.vocabContainer}>
              {sessionStats.vocabularyLearned.map((word, index) => (
                <View key={index} style={styles.vocabChip}>
                  <Text style={styles.vocabText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tomorrow's Preview */}
        <View style={[styles.section, styles.previewCard]}>
          <Text style={styles.previewTitle}>Tomorrow's Warm-up</Text>
          <Text style={styles.previewText}>
            We've prepared a quick 2-minute warm-up based on today's session. Come back tomorrow to review!
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)/conversation')}
            activeOpacity={0.85}
          >
            <RotateCcw size={18} color={colors.primary[400]} strokeWidth={2.5} />
            <Text style={styles.secondaryButtonText}>Practice Again</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Save & Continue</Text>
          <ChevronRight size={20} color={colors.neutral[0]} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    position: 'relative',
  },
  celebrationBadge: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
  },
  title: {
    ...textStyles.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  statValue: {
    ...textStyles.headlineLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  scoresSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  scoreCard: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  scoreEmoji: {
    fontSize: 32,
  },
  scoreLabel: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing[0.5],
  },
  scoreValue: {
    ...textStyles.headlineMedium,
    fontWeight: '700',
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.neutral[800],
    borderRadius: layout.radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 8,
    borderRadius: layout.radius.full,
  },
  section: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  listContainer: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    gap: spacing[3],
    ...shadows.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  listItemText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  improvementDot: {
    width: 6,
    height: 6,
    borderRadius: layout.radius.full,
    backgroundColor: colors.warning[500],
    marginTop: spacing[2],
  },
  vocabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  vocabChip: {
    backgroundColor: colors.accent[400] + '20',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.accent[400] + '40',
  },
  vocabText: {
    ...textStyles.labelMedium,
    color: colors.accent[400],
  },
  previewCard: {
    backgroundColor: colors.primary[500] + '15',
    padding: spacing[5],
    borderRadius: layout.radius['2xl'],
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  previewTitle: {
    ...textStyles.titleMedium,
    color: colors.primary[400],
    marginBottom: spacing[2],
  },
  previewText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    padding: layout.screenPadding,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  continueButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: layout.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    ...shadows.md,
  },
  continueButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500],
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    ...textStyles.labelMedium,
    color: colors.primary[400],
  },
});
