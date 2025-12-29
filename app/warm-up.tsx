import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
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
  AlertCircle,
  Bug,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';
import { getSampleWarmupContent, WarmupContent } from '../src/data/warmupContent';
import { apiClient } from '../src/lib/api-client';

type WarmupStep = 'intro' | 'phrases' | 'pronunciation' | 'quiz' | 'complete';

// CANONICAL BUILD MARKER
const CANONICAL_BUILD_TIMESTAMP = '2025-12-21T00:00:00Z';

// Debug info structure - CANONICAL VERSION
interface DebugInfo {
  // Audio capture info
  audioDurationMs: number | null;
  audioSizeBytes: number | null;
  mimeType: string | null;
  recordingUri: string | null;
  // Backend status
  backendStatus: 'idle' | 'uploading' | 'success' | 'error' | 'blocked';
  backendError: string | null;
  // Canonical gate results
  valid: boolean | null;
  reason: string | null;
  // Acoustic analysis from gate
  rms: number | null;
  peak: number | null;
  voicedMs: number | null;
  sampleRate: number | null;
  // Scoring (only when valid)
  transcript: string | null;
  fluencyScore: number | null;
  wordCount: number | null;
}

const INITIAL_DEBUG: DebugInfo = {
  audioDurationMs: null,
  audioSizeBytes: null,
  mimeType: 'audio/wav',
  recordingUri: null,
  backendStatus: 'idle',
  backendError: null,
  valid: null,
  reason: null,
  rms: null,
  peak: null,
  voicedMs: null,
  sampleRate: null,
  transcript: null,
  fluencyScore: null,
  wordCount: null,
};

// VERIFICATION MARKER - CANONICAL PIPELINE
console.log(`🟢🟢🟢 WARM-UP CANONICAL PIPELINE BUILD — ${CANONICAL_BUILD_TIMESTAMP} 🟢🟢🟢`);

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

  // REAL PIPELINE STATE
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>(INITIAL_DEBUG);
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Always visible in stabilization mode
  const recordingStartTime = useRef<number>(0);

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
      // Reset debug info for new recording
      setDebugInfo(INITIAL_DEBUG);
      setLastError(null);

      // Clean up any existing recording first
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
        setRecording(null);
      }

      // Custom recording options for iOS that outputs m4a (OpenAI-compatible)
      // HIGH_QUALITY preset outputs CAF format which OpenAI doesn't support
      const recordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      setRecording(newRecording);
      setIsRecording(true);
      recordingStartTime.current = Date.now();
    } catch (err) {
      console.error('Failed to start recording', err);
      setLastError('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      const duration = Date.now() - recordingStartTime.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        setLastError('No audio recorded');
        setDebugInfo(prev => ({
          ...prev,
          backendStatus: 'error',
          backendError: 'No audio URI returned',
        }));
        return;
      }

      // Get file info for debug panel
      const fileInfo = await FileSystem.getInfoAsync(uri);

      // Get expected text based on current step (BEFORE setDebugInfo so we can log it)
      const expectedText = getExpectedText();

      setDebugInfo(prev => ({
        ...prev,
        audioDurationMs: duration,
        audioSizeBytes: fileInfo.exists && fileInfo.size ? fileInfo.size : 0,
        recordingUri: uri,
        backendStatus: 'uploading',
      }));

      // ========================================
      // CANONICAL PIPELINE - CALL BACKEND
      // ========================================
      setIsProcessing(true);

      console.log(`[CANONICAL] Sending to /api/warmup/evaluate — BUILD ${CANONICAL_BUILD_TIMESTAMP}`);
      console.log('[CANONICAL] Audio info:', {
        uri,
        fileSize: fileInfo.exists && fileInfo.size ? fileInfo.size : 0,
        durationMs: duration,
      });

      const result = await apiClient.evaluateWarmup(uri);

      console.log('[CANONICAL] Backend response:', result);

      if (!result.valid) {
        // HARD BLOCK: Gate failed - NO SCORES
        setLastError(result.reason || 'Speech not detected');
        setDebugInfo(prev => ({
          ...prev,
          backendStatus: 'blocked',
          backendError: result.reason || 'Unknown error',
          valid: false,
          reason: result.reason || null,
          rms: result.debug?.rms || null,
          peak: result.debug?.peak || null,
          voicedMs: result.debug?.voiced_ms || null,
          sampleRate: result.debug?.sample_rate || null,
          audioDurationMs: result.debug?.duration_ms || duration,
          transcript: result.debug?.transcript || null,
          fluencyScore: null, // NO SCORE ON BLOCK
          wordCount: null,
        }));
        setIsProcessing(false);
        return; // DO NOT PROCEED - BLOCKED
      }

      // SUCCESS: Valid speech with fluency score
      setDebugInfo(prev => ({
        ...prev,
        backendStatus: 'success',
        backendError: null,
        valid: true,
        reason: null,
        rms: result.debug?.rms || null,
        peak: result.debug?.peak || null,
        voicedMs: result.debug?.voiced_ms || null,
        sampleRate: result.debug?.sample_rate || null,
        audioDurationMs: result.debug?.duration_ms || duration,
        transcript: result.transcript || null,
        fluencyScore: result.fluency || null,
        wordCount: result.debug?.word_count || null,
      }));

      setIsProcessing(false);

      // NOTE: Do NOT call handleNextStep() here!
      // The scores need to stay visible so user can see their feedback.
      // User taps "Continue" button to proceed to next phrase.

    } catch (err) {
      console.error('Failed to stop recording or analyze', err);
      setLastError(err instanceof Error ? err.message : 'Unknown error');
      setDebugInfo(prev => ({
        ...prev,
        backendStatus: 'error',
        backendError: err instanceof Error ? err.message : 'Unknown error',
      }));
      setIsProcessing(false);
    }
  };

  const getExpectedText = (): string => {
    if (currentStep === 'phrases') {
      return warmupContent.phrases[currentPhraseIndex]?.phrase || '';
    }
    if (currentStep === 'pronunciation') {
      const drill = warmupContent.pronunciationDrills[currentDrillIndex];
      return drill?.words?.join(' ') || '';
    }
    return '';
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
          // Reset debug for next phrase
          setDebugInfo(INITIAL_DEBUG);
        } else {
          setCurrentStep('pronunciation');
          setCurrentPhraseIndex(0);
          setDebugInfo(INITIAL_DEBUG);
        }
        break;
      case 'pronunciation':
        if (currentDrillIndex < warmupContent.pronunciationDrills.length - 1) {
          setCurrentDrillIndex(currentDrillIndex + 1);
          setDebugInfo(INITIAL_DEBUG);
        } else {
          setCurrentStep('quiz');
          setCurrentDrillIndex(0);
          setDebugInfo(INITIAL_DEBUG);
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

  const handleRetry = () => {
    setLastError(null);
    setDebugInfo(INITIAL_DEBUG);
  };

  // ========================================
  // CANONICAL DEBUG PANEL
  // ========================================
  const renderDebugPanel = () => {
    if (!showDebugPanel) return null;

    const statusColor = {
      idle: colors.text.tertiary,
      uploading: colors.warning[400],
      success: colors.success[400],
      error: colors.error[400],
      blocked: colors.error[500],
    }[debugInfo.backendStatus];

    const validColor = debugInfo.valid === true
      ? colors.success[400]
      : debugInfo.valid === false
        ? colors.error[400]
        : colors.text.tertiary;

    return (
      <View style={styles.debugPanel}>
        {/* BUILD MARKER */}
        <View style={[styles.debugHeader, { backgroundColor: colors.accent[900] }]}>
          <Bug size={14} color={colors.accent[400]} strokeWidth={2} />
          <Text style={[styles.debugTitle, { color: colors.accent[400] }]}>
            CANONICAL BUILD — {CANONICAL_BUILD_TIMESTAMP}
          </Text>
        </View>

        {/* GATE STATUS */}
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Gate Valid:</Text>
          <Text style={[styles.debugValue, { color: validColor, fontWeight: '700' }]}>
            {debugInfo.valid === null ? '—' : debugInfo.valid ? 'PASS' : 'BLOCKED'}
          </Text>
        </View>

        {debugInfo.reason && (
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Block Reason:</Text>
            <Text style={[styles.debugValue, styles.debugError]}>
              {debugInfo.reason}
            </Text>
          </View>
        )}

        {/* ACOUSTIC METRICS */}
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Duration:</Text>
          <Text style={styles.debugValue}>
            {debugInfo.audioDurationMs ? `${(debugInfo.audioDurationMs / 1000).toFixed(2)}s` : '—'}
          </Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>File Size:</Text>
          <Text style={styles.debugValue}>
            {debugInfo.audioSizeBytes ? `${debugInfo.audioSizeBytes.toLocaleString()} bytes` : '—'}
          </Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>RMS:</Text>
          <Text style={styles.debugValue}>
            {debugInfo.rms !== null ? debugInfo.rms.toFixed(1) : '—'}
          </Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Voiced Speech:</Text>
          <Text style={styles.debugValue}>
            {debugInfo.voicedMs !== null ? `${(debugInfo.voicedMs / 1000).toFixed(2)}s` : '—'}
          </Text>
        </View>

        {/* SCORING (only when valid) */}
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Transcript:</Text>
          <Text style={styles.debugValue} numberOfLines={2}>
            {debugInfo.transcript || '—'}
          </Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Word Count:</Text>
          <Text style={styles.debugValue}>
            {debugInfo.wordCount !== null ? debugInfo.wordCount : '—'}
          </Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Fluency:</Text>
          <Text style={[
            styles.debugValue,
            debugInfo.fluencyScore !== null && styles.debugScore,
            { fontWeight: '700' }
          ]}>
            {debugInfo.fluencyScore !== null ? `${debugInfo.fluencyScore}%` : 'N/A'}
          </Text>
        </View>

        {/* Backend Status */}
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Backend:</Text>
          <Text style={[styles.debugValue, { color: statusColor }]}>
            {debugInfo.backendStatus.toUpperCase()}
          </Text>
        </View>

        {debugInfo.backendError && debugInfo.backendStatus === 'error' && (
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Error:</Text>
            <Text style={[styles.debugValue, styles.debugError]}>
              {debugInfo.backendError}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ========================================
  // ERROR MODAL
  // ========================================
  const renderErrorModal = () => {
    if (!lastError) return null;

    return (
      <View style={styles.errorModal}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color={colors.error[400]} strokeWidth={2} />
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorMessage}>{lastError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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

        {renderDebugPanel()}

        <View style={styles.micContainer}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.processingText}>Analyzing speech...</Text>
            </View>
          ) : (
            <>
              <Pressable onPress={toggleRecording} disabled={isProcessing}>
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
            </>
          )}
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

        {renderDebugPanel()}

        <View style={styles.micContainer}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.processingText}>Analyzing speech...</Text>
            </View>
          ) : (
            <>
              <Pressable onPress={toggleRecording} disabled={isProcessing}>
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
            </>
          )}
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
    // Block during processing
    if (isProcessing) return false;

    // Block if there's an unresolved error
    if (lastError) return false;

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

      {/* Error Modal Overlay */}
      {renderErrorModal()}
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
    marginBottom: spacing[4],
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
  // Processing
  processingContainer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  processingText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing[3],
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
  // Debug Panel
  debugPanel: {
    backgroundColor: colors.neutral[900],
    borderRadius: layout.radius.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.accent[400] + '40',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  debugTitle: {
    ...textStyles.labelSmall,
    color: colors.accent[400],
    letterSpacing: 1,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing[1],
  },
  debugLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    flex: 1,
  },
  debugValue: {
    ...textStyles.caption,
    color: colors.text.secondary,
    flex: 2,
    textAlign: 'right',
  },
  debugError: {
    color: colors.error[400],
  },
  debugScore: {
    color: colors.success[400],
    fontWeight: '600',
  },
  // Error Modal
  errorModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.screenPadding,
  },
  errorContent: {
    backgroundColor: colors.background.card,
    borderRadius: layout.radius['2xl'],
    padding: spacing[8],
    alignItems: 'center',
    maxWidth: 320,
    ...shadows.lg,
  },
  errorTitle: {
    ...textStyles.titleLarge,
    color: colors.error[400],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  errorMessage: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: layout.radius.lg,
  },
  retryButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
});
