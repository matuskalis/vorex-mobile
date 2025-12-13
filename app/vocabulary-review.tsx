import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { X, Check, AlertCircle, Smile } from 'lucide-react-native';
import { useVocabulary } from '../src/context/VocabularyContext';
import { VocabCard } from '../src/components/VocabCard';
import { mapButtonToQuality } from '../src/utils/spacedRepetition';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';

type ReviewButton = 'again' | 'hard' | 'good' | 'easy';

export default function VocabularyReviewScreen() {
  const { state, reviewWord, getDueWords } = useVocabulary();
  const [dueWords, setDueWords] = useState(getDueWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [buttonOpacity] = useState(new Animated.Value(0));

  const currentWord = dueWords[currentIndex];
  const remainingCards = dueWords.length - currentIndex;

  useEffect(() => {
    // Show buttons when answer is revealed
    Animated.timing(buttonOpacity, {
      toValue: showAnswer ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showAnswer]);

  useEffect(() => {
    // Reload due words when component mounts
    setDueWords(getDueWords());
  }, []);

  const handleFlip = () => {
    if (!showAnswer) {
      setShowAnswer(true);
    }
  };

  const handleReview = (button: ReviewButton) => {
    if (!currentWord || !showAnswer) return;

    const quality = mapButtonToQuality(button);
    reviewWord(currentWord.id, quality);

    setReviewedCount(prev => prev + 1);
    setShowAnswer(false);

    // Move to next card or finish
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Review session complete
      router.back();
    }
  };

  if (!currentWord) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Check size={64} color={colors.success[500]} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyDescription}>
            You have no words due for review right now. Great job!
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
        >
          <X size={24} color={colors.text.primary} strokeWidth={2} />
        </Pressable>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {reviewedCount} / {dueWords.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(reviewedCount / dueWords.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.remainingBadge}>
          <Text style={styles.remainingText}>{remainingCards}</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{state.dailyReviewsCompleted}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{state.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{state.items.length}</Text>
          <Text style={styles.statLabel}>Total Words</Text>
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardSection}>
        <VocabCard
          item={currentWord}
          showAnswer={showAnswer}
          onFlip={handleFlip}
        />
      </View>

      {/* Review Buttons */}
      <Animated.View style={[styles.buttonsContainer, { opacity: buttonOpacity }]}>
        <View style={styles.buttonsRow}>
          <Pressable
            onPress={() => handleReview('again')}
            disabled={!showAnswer}
            style={({ pressed }) => [
              styles.reviewButton,
              styles.againButton,
              pressed && styles.buttonPressed,
              !showAnswer && styles.buttonDisabled,
            ]}
          >
            <X size={20} color={colors.neutral[0]} strokeWidth={2.5} />
            <Text style={styles.buttonText}>Again</Text>
            <Text style={styles.buttonSubtext}>1 day</Text>
          </Pressable>

          <Pressable
            onPress={() => handleReview('hard')}
            disabled={!showAnswer}
            style={({ pressed }) => [
              styles.reviewButton,
              styles.hardButton,
              pressed && styles.buttonPressed,
              !showAnswer && styles.buttonDisabled,
            ]}
          >
            <AlertCircle size={20} color={colors.neutral[0]} strokeWidth={2.5} />
            <Text style={styles.buttonText}>Hard</Text>
            <Text style={styles.buttonSubtext}>3 days</Text>
          </Pressable>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable
            onPress={() => handleReview('good')}
            disabled={!showAnswer}
            style={({ pressed }) => [
              styles.reviewButton,
              styles.goodButton,
              pressed && styles.buttonPressed,
              !showAnswer && styles.buttonDisabled,
            ]}
          >
            <Check size={20} color={colors.neutral[0]} strokeWidth={2.5} />
            <Text style={styles.buttonText}>Good</Text>
            <Text style={styles.buttonSubtext}>1 week</Text>
          </Pressable>

          <Pressable
            onPress={() => handleReview('easy')}
            disabled={!showAnswer}
            style={({ pressed }) => [
              styles.reviewButton,
              styles.easyButton,
              pressed && styles.buttonPressed,
              !showAnswer && styles.buttonDisabled,
            ]}
          >
            <Smile size={20} color={colors.neutral[0]} strokeWidth={2.5} />
            <Text style={styles.buttonText}>Easy</Text>
            <Text style={styles.buttonSubtext}>2 weeks</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: layout.radius.lg,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: spacing[4],
  },
  progressText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.neutral[800],
    borderRadius: layout.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: layout.radius.full,
  },
  remainingBadge: {
    width: 40,
    height: 40,
    borderRadius: layout.radius.lg,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    marginHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[5],
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.headlineMedium,
    color: colors.primary[400],
    marginBottom: spacing[0.5],
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing[3],
  },
  cardSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[5],
  },
  buttonsContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[5],
    gap: spacing[3],
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  reviewButton: {
    flex: 1,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    borderRadius: layout.radius.xl,
    alignItems: 'center',
    gap: spacing[1],
    ...shadows.md,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  againButton: {
    backgroundColor: colors.error[500],
  },
  hardButton: {
    backgroundColor: colors.warning[500],
  },
  goodButton: {
    backgroundColor: colors.success[500],
  },
  easyButton: {
    backgroundColor: colors.primary[500],
  },
  buttonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
    fontWeight: '600',
  },
  buttonSubtext: {
    ...textStyles.caption,
    color: colors.neutral[0],
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: layout.radius.full,
    backgroundColor: colors.success[500] + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  emptyTitle: {
    ...textStyles.headlineLarge,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  emptyDescription: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  emptyButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3.5],
    paddingHorizontal: spacing[8],
    borderRadius: layout.radius.lg,
    ...shadows.md,
  },
  emptyButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
});
