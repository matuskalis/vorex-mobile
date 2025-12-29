import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react-native';
import { darkTheme, colors, spacing, layout, textStyles } from '../../src/theme';
import { SwipeablePhraseCard } from '../../src/components/SwipeablePhraseCard';
import { usePractice } from '../../src/context/PracticeContext';

export default function PracticeScreen() {
  const {
    state,
    startSession,
    recordAttempt,
    nextPhrase,
    completeSession,
    resetSession,
    getCurrentPhrase,
    isSessionComplete,
    getSessionProgress,
  } = usePractice();

  const [showSummary, setShowSummary] = useState(false);

  // Start session on mount if none exists
  useEffect(() => {
    if (!state.currentSession && !state.isLoading) {
      startSession(5);
    }
  }, [state.isLoading]);

  // Handle phrase completion
  const handleSelfAssess = (rating: 'good' | 'retry', problemWords: string[]) => {
    const currentPhrase = getCurrentPhrase();
    if (currentPhrase) {
      recordAttempt(currentPhrase.id, currentPhrase.text, rating, problemWords);
    }
  };

  const handleNextPhrase = () => {
    if (isSessionComplete()) {
      setShowSummary(true);
    } else {
      nextPhrase();
    }
  };

  const handleFinishSession = () => {
    completeSession();
    router.back();
  };

  const handleNewSession = () => {
    setShowSummary(false);
    startSession(5);
  };

  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const currentPhrase = getCurrentPhrase();
  const progress = getSessionProgress();

  // Session Summary
  if (showSummary || isSessionComplete()) {
    const attempts = state.currentSession?.attempts || [];
    const goodCount = attempts.filter(a => a.selfRating === 'good').length;
    const problemWordsThisSession = [...new Set(attempts.flatMap(a => a.problemWords))];

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Session Complete!</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{goodCount}</Text>
                <Text style={styles.statLabel}>Phrases Nailed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{attempts.length}</Text>
                <Text style={styles.statLabel}>Total Practiced</Text>
              </View>
            </View>

            {problemWordsThisSession.length > 0 && (
              <View style={styles.problemWordsInline}>
                <Text style={styles.problemWordsTitle}>Words to practice:</Text>
                <View style={styles.problemWordsList}>
                  {problemWordsThisSession.map((word, i) => (
                    <View key={word} style={styles.problemWordBadge}>
                      <Text style={styles.problemWordText}>{word}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.summaryActions}>
            <Pressable
              onPress={handleNewSession}
              style={({ pressed }) => [
                styles.actionButton,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <RotateCcw size={20} color={colors.text.primary} />
              <Text style={styles.secondaryButtonText}>Practice More</Text>
            </Pressable>

            <Pressable
              onPress={handleFinishSession}
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Check size={20} color={colors.neutral[0]} />
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Practice Flow
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.progressText}>
          {progress.current} of {progress.total}
        </Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(progress.current / progress.total) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Phrase Card */}
      {currentPhrase && (
        <SwipeablePhraseCard
          key={currentPhrase.id}
          phrase={currentPhrase}
          onSelfAssess={handleSelfAssess}
          onComplete={handleNextPhrase}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  progressText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: colors.neutral[800],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },

  // Summary styles
  summaryContainer: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
  },
  summaryTitle: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing[6],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing[5],
  },
  statValue: {
    color: colors.success[400],
    fontSize: 36,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.default,
  },
  problemWordsInline: {
    width: '100%',
    marginTop: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.warning[500] + '10',
    borderRadius: layout.radius.lg,
  },
  problemWordsTitle: {
    color: colors.warning[400],
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  problemWordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  problemWordBadge: {
    backgroundColor: colors.warning[500] + '30',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: layout.radius.sm,
  },
  problemWordText: {
    color: colors.warning[300],
    fontSize: 14,
    fontWeight: '500',
  },
  summaryActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[6],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: layout.radius.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
  },
  secondaryButton: {
    backgroundColor: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  primaryButtonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
