import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { useLearning } from '../src/context/LearningContext';
import {
  Volume2,
  Mic,
  Square,
  CheckCircle2,
  X,
  ChevronRight,
  BookOpen,
  Target,
  Brain,
  Clock,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';
import { getSampleWarmupContent, WarmupContent } from '../src/data/warmupContent';

type WarmupStep = 'intro' | 'phrases' | 'pronunciation' | 'quiz' | 'complete';

export default function WarmUpScreen() {
  const { addSpeakingTime, updateScores, clearWarmup } = useLearning();
  const [currentStep, setCurrentStep] = useState<WarmupStep>('intro');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [warmupContent] = useState<WarmupContent>(getSampleWarmupContent());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request audio permissions
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    if (!permissionGranted) return;

    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Simulate feedback (in production, analyze the audio)
      setTimeout(() => {
        handleNextStep();
      }, 500);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'intro':
        setCurrentStep('phrases');
        break;
      case 'phrases':
        if (currentPhraseIndex < warmupContent.phrases.length - 1) {
          setCurrentPhraseIndex(currentPhraseIndex + 1);
        } else {
          setCurrentStep('pronunciation');
          setCurrentPhraseIndex(0);
        }
        break;
      case 'pronunciation':
        if (currentDrillIndex < warmupContent.pronunciationDrills.length - 1) {
          setCurrentDrillIndex(currentDrillIndex + 1);
        } else {
          setCurrentStep('quiz');
          setCurrentDrillIndex(0);
        }
        break;
      case 'quiz':
        if (!quizAnswered && selectedAnswer) {
          setQuizAnswered(true);
        } else if (currentQuizIndex < warmupContent.quizQuestions.length - 1) {
          setCurrentQuizIndex(currentQuizIndex + 1);
          setSelectedAnswer(null);
          setQuizAnswered(false);
        } else {
          setCurrentStep('complete');
        }
        break;
      case 'complete':
        // Save progress, clear warmup flag, and return to home
        addSpeakingTime(2);
        clearWarmup();
        router.replace('/(tabs)');
        break;
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const renderIntro = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeEmoji}>☀️</Text>
        <Text style={styles.welcomeTitle}>Good Morning!</Text>
      </View>

      <View style={styles.motivationCard}>
        <Text style={styles.motivationText}>{warmupContent.motivationalMessage}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Clock size={18} color={colors.primary[500]} strokeWidth={2} />
          <Text style={styles.infoText}>Just 2-3 minutes</Text>
        </View>
        <View style={styles.infoRow}>
          <Target size={18} color={colors.accent[400]} strokeWidth={2} />
          <Text style={styles.infoText}>Review yesterday's session</Text>
        </View>
        <View style={styles.infoRow}>
          <Brain size={18} color={colors.success[500]} strokeWidth={2} />
          <Text style={styles.infoText}>Quick pronunciation drills</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Let's warm up your English skills with a quick review based on yesterday's practice!
      </Text>
    </Animated.View>
  );

  const renderPhrases = () => {
    const phrase = warmupContent.phrases[currentPhraseIndex];

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <BookOpen size={24} color={colors.primary[500]} strokeWidth={2} />
          <Text style={styles.stepTitle}>Practice This Phrase</Text>
        </View>

        <Text style={styles.progressText}>
          Phrase {currentPhraseIndex + 1} of {warmupContent.phrases.length}
        </Text>

        <View style={styles.phraseCard}>
          <Text style={styles.phraseText}>{phrase.phrase}</Text>
          {phrase.translation && (
            <Text style={styles.translationText}>{phrase.translation}</Text>
          )}
        </View>

        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Context</Text>
          <Text style={styles.contextText}>{phrase.context}</Text>
        </View>

        <View style={styles.micContainer}>
          <Pressable onPress={toggleRecording}>
            <Animated.View
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {isRecording ? (
                <Square size={28} color={colors.neutral[0]} fill={colors.neutral[0]} strokeWidth={0} />
              ) : (
                <Mic size={28} color={colors.neutral[0]} strokeWidth={2} />
              )}
            </Animated.View>
          </Pressable>
          <Text style={styles.micHint}>
            {isRecording ? 'Recording... Tap to stop' : 'Tap to practice saying it'}
          </Text>
        </View>
      </View>
    );
  };

  const renderPronunciation = () => {
    const drill = warmupContent.pronunciationDrills[currentDrillIndex];

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Volume2 size={24} color={colors.accent[400]} strokeWidth={2} />
          <Text style={styles.stepTitle}>Pronunciation Drill</Text>
        </View>

        <Text style={styles.progressText}>
          Drill {currentDrillIndex + 1} of {warmupContent.pronunciationDrills.length}
        </Text>

        <View style={styles.phonemeCard}>
          <Text style={styles.phonemeText}>{drill.phoneme}</Text>
          <Text style={styles.drillDescription}>{drill.description}</Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>Tip</Text>
          <Text style={styles.tipText}>{drill.tip}</Text>
        </View>

        <View style={styles.wordsContainer}>
          <Text style={styles.wordsLabel}>Practice these words:</Text>
          {drill.words.map((word, index) => (
            <View key={index} style={styles.wordCard}>
              <Text style={styles.wordText}>{word}</Text>
              <Volume2 size={16} color={colors.text.tertiary} strokeWidth={2} />
            </View>
          ))}
        </View>

        <View style={styles.micContainer}>
          <Pressable onPress={toggleRecording}>
            <Animated.View
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {isRecording ? (
                <Square size={28} color={colors.neutral[0]} fill={colors.neutral[0]} strokeWidth={0} />
              ) : (
                <Mic size={28} color={colors.neutral[0]} strokeWidth={2} />
              )}
            </Animated.View>
          </Pressable>
          <Text style={styles.micHint}>
            {isRecording ? 'Recording... Tap to stop' : 'Tap to practice'}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuiz = () => {
    const question = warmupContent.quizQuestions[currentQuizIndex];
    const allAnswers = [question.correctAnswer, ...question.incorrectAnswers].sort();

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Brain size={24} color={colors.success[500]} strokeWidth={2} />
          <Text style={styles.stepTitle}>Quick Quiz</Text>
        </View>

        <Text style={styles.progressText}>
          Question {currentQuizIndex + 1} of {warmupContent.quizQuestions.length}
        </Text>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        <View style={styles.answersContainer}>
          {allAnswers.map((answer, index) => {
            const isSelected = selectedAnswer === answer;
            const isCorrect = answer === question.correctAnswer;
            const showResult = quizAnswered;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.answerButton,
                  isSelected && styles.answerButtonSelected,
                  showResult && isCorrect && styles.answerButtonCorrect,
                  showResult && isSelected && !isCorrect && styles.answerButtonWrong,
                ]}
                onPress={() => !quizAnswered && setSelectedAnswer(answer)}
                disabled={quizAnswered}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.answerText,
                    isSelected && styles.answerTextSelected,
                    showResult && isCorrect && styles.answerTextCorrect,
                  ]}
                >
                  {answer}
                </Text>
                {showResult && isCorrect && (
                  <CheckCircle2 size={20} color={colors.success[500]} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {quizAnswered && (
          <View
            style={[
              styles.explanationCard,
              selectedAnswer === question.correctAnswer
                ? styles.explanationCardCorrect
                : styles.explanationCardWrong,
            ]}
          >
            <Text style={styles.explanationTitle}>
              {selectedAnswer === question.correctAnswer ? 'Correct!' : 'Not quite!'}
            </Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.completeEmoji}>🎉</Text>
      <Text style={styles.completeTitle}>Warm-up Complete!</Text>
      <Text style={styles.completeText}>
        Great job! You're all warmed up and ready for today's practice.
      </Text>

      <View style={styles.completeSummary}>
        <View style={styles.summaryItem}>
          <CheckCircle2 size={24} color={colors.success[500]} strokeWidth={2} />
          <Text style={styles.summaryText}>
            Practiced {warmupContent.phrases.length} phrases
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <CheckCircle2 size={24} color={colors.success[500]} strokeWidth={2} />
          <Text style={styles.summaryText}>
            Reviewed {warmupContent.pronunciationDrills.length} pronunciation drills
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <CheckCircle2 size={24} color={colors.success[500]} strokeWidth={2} />
          <Text style={styles.summaryText}>
            Completed {warmupContent.quizQuestions.length} quiz questions
          </Text>
        </View>
      </View>
    </View>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return renderIntro();
      case 'phrases':
        return renderPhrases();
      case 'pronunciation':
        return renderPronunciation();
      case 'quiz':
        return renderQuiz();
      case 'complete':
        return renderComplete();
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 'quiz') {
      return selectedAnswer !== null;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
          <X size={24} color={colors.text.tertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {getStepContent()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={handleNextStep}
          disabled={!canProceed()}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 'complete' ? 'Finish' : 'Continue'}
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
  },
  closeButton: {
    padding: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[6],
  },
  stepContainer: {
    flex: 1,
    paddingTop: spacing[4],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  stepTitle: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[5],
  },
  // Intro
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: spacing[3],
  },
  welcomeTitle: {
    ...textStyles.displaySmall,
    color: colors.text.primary,
  },
  motivationCard: {
    backgroundColor: colors.primary[500] + '15',
    padding: spacing[5],
    borderRadius: layout.radius['2xl'],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  motivationText: {
    ...textStyles.titleMedium,
    color: colors.primary[400],
    textAlign: 'center',
    lineHeight: 26,
  },
  infoCard: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    gap: spacing[3],
    marginBottom: spacing[5],
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  infoText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
  },
  description: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Phrases
  phraseCard: {
    backgroundColor: colors.background.card,
    padding: spacing[6],
    borderRadius: layout.radius['2xl'],
    marginBottom: spacing[4],
    alignItems: 'center',
    ...shadows.md,
  },
  phraseText: {
    ...textStyles.headlineMedium,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
  },
  translationText: {
    ...textStyles.bodyMedium,
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },
  contextCard: {
    backgroundColor: colors.accent[400] + '15',
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    marginBottom: spacing[6],
  },
  contextLabel: {
    ...textStyles.labelSmall,
    color: colors.accent[400],
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contextText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  // Pronunciation
  phonemeCard: {
    backgroundColor: colors.background.card,
    padding: spacing[6],
    borderRadius: layout.radius['2xl'],
    alignItems: 'center',
    marginBottom: spacing[4],
    ...shadows.md,
  },
  phonemeText: {
    ...textStyles.displayMedium,
    color: colors.accent[400],
    marginBottom: spacing[2],
  },
  drillDescription: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: colors.info[500] + '15',
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    marginBottom: spacing[5],
  },
  tipLabel: {
    ...textStyles.labelSmall,
    color: colors.info[400],
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tipText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  wordsContainer: {
    marginBottom: spacing[6],
  },
  wordsLabel: {
    ...textStyles.labelMedium,
    color: colors.text.tertiary,
    marginBottom: spacing[3],
  },
  wordCard: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    marginBottom: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  wordText: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
  },
  // Quiz
  questionCard: {
    backgroundColor: colors.background.card,
    padding: spacing[5],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[5],
    ...shadows.md,
  },
  questionText: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
  },
  answersContainer: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  answerButton: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answerButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '10',
  },
  answerButtonCorrect: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[500] + '10',
  },
  answerButtonWrong: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[500] + '10',
  },
  answerText: {
    ...textStyles.bodyLarge,
    color: colors.text.primary,
    flex: 1,
  },
  answerTextSelected: {
    color: colors.primary[400],
  },
  answerTextCorrect: {
    color: colors.success[400],
  },
  explanationCard: {
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
  },
  explanationCardCorrect: {
    backgroundColor: colors.success[500] + '15',
    borderColor: colors.success[500] + '30',
  },
  explanationCardWrong: {
    backgroundColor: colors.warning[500] + '15',
    borderColor: colors.warning[500] + '30',
  },
  explanationTitle: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  explanationText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  // Complete
  completeEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  completeTitle: {
    ...textStyles.displaySmall,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  completeText: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  completeSummary: {
    backgroundColor: colors.background.card,
    padding: spacing[5],
    borderRadius: layout.radius.xl,
    gap: spacing[4],
    ...shadows.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  summaryText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  // Mic
  micContainer: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: layout.radius.full,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    ...shadows.lg,
  },
  micButtonRecording: {
    backgroundColor: colors.error[500],
  },
  micHint: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
  },
  // Footer
  footer: {
    padding: layout.screenPadding,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  nextButton: {
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
  nextButtonDisabled: {
    backgroundColor: colors.neutral[700],
    opacity: 0.5,
  },
  nextButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
});
