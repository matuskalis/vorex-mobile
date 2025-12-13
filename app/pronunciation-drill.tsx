import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import {
  Volume2,
  Mic,
  Square,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';
import { PRONUNCIATION_PHRASES, PronunciationPhrase } from '../src/data/pronunciation-phrases';
import { apiClient } from '../src/lib/api-client';

type PhonemeAnalysis = {
  phoneme: string;
  word: string;
  status: 'correct' | 'close' | 'incorrect';
  confidence: number;
};

type RecordingState = 'idle' | 'recording' | 'processing' | 'complete';

export default function PronunciationDrillScreen() {
  const [phrases] = useState<PronunciationPhrase[]>(PRONUNCIATION_PHRASES.slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [score, setScore] = useState<number | null>(null);
  const [phonemeResults, setPhonemeResults] = useState<PhonemeAnalysis[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const recording = useRef<Audio.Recording | null>(null);
  const sound = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentPhrase = phrases[currentIndex];
  const progress = ((currentIndex + 1) / phrases.length) * 100;

  // Request audio permissions on mount
  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();

    return () => {
      // Cleanup
      if (recording.current) {
        recording.current.stopAndUnloadAsync();
      }
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  // Pulse animation when recording
  useEffect(() => {
    if (recordingState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState]);

  const handlePlayCorrectPronunciation = async () => {
    try {
      setIsPlayingAudio(true);

      // Unload previous sound if exists
      if (sound.current) {
        await sound.current.unloadAsync();
      }

      // Get TTS audio from API
      const result = await apiClient.synthesizeSpeech(currentPhrase.text);

      if (!result.success || !result.audioUri) {
        Alert.alert('Error', result.error || 'Failed to generate audio');
        setIsPlayingAudio(false);
        return;
      }

      // Load and play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: result.audioUri },
        { shouldPlay: true }
      );

      sound.current = newSound;

      // Set status callback to detect when playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
      setIsPlayingAudio(false);
    }
  };

  const startRecording = async () => {
    try {
      setRecordingState('recording');
      setScore(null);
      setPhonemeResults([]);

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setRecordingState('idle');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording.current) return;

      setRecordingState('processing');
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      if (!uri) {
        Alert.alert('Error', 'Failed to save recording');
        setRecordingState('idle');
        return;
      }

      setRecordingUri(uri);
      await analyzeRecording(uri);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording');
      setRecordingState('idle');
    }
  };

  const analyzeRecording = async (uri: string) => {
    try {
      // TODO: Once backend implements phoneme-level analysis, update this
      // For now, we'll use the existing speech analysis endpoint
      const result = await apiClient.analyzeSpeech(uri, currentPhrase.text);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to analyze pronunciation');
        setRecordingState('idle');
        return;
      }

      // Calculate overall score
      const overallScore = Math.round((result.pronunciation_score + result.fluency_score) / 2);
      setScore(overallScore);

      // Mock phoneme-level analysis based on mispronounced words
      // TODO: Replace with real phoneme analysis from backend
      const mockPhonemeAnalysis = generateMockPhonemeAnalysis(
        currentPhrase.text,
        result.mispronounced_words,
        overallScore
      );
      setPhonemeResults(mockPhonemeAnalysis);

      setRecordingState('complete');
    } catch (error) {
      console.error('Error analyzing recording:', error);
      Alert.alert('Error', 'Failed to analyze pronunciation');
      setRecordingState('idle');
    }
  };

  // Mock function to generate phoneme-level feedback
  // TODO: Replace with actual backend phoneme analysis
  const generateMockPhonemeAnalysis = (
    text: string,
    mispronounced: string[],
    overallScore: number
  ): PhonemeAnalysis[] => {
    const words = text.toLowerCase().split(/\s+/);

    return words.map((word) => {
      const cleanWord = word.replace(/[.,!?]/g, '');
      const isMispronounced = mispronounced.some(
        (m) => m.toLowerCase() === cleanWord
      );

      let status: PhonemeAnalysis['status'];
      let confidence: number;

      if (isMispronounced) {
        status = 'incorrect';
        confidence = Math.random() * 0.4 + 0.3; // 30-70%
      } else if (overallScore < 70) {
        status = Math.random() > 0.7 ? 'close' : 'correct';
        confidence = Math.random() * 0.3 + 0.6; // 60-90%
      } else {
        status = 'correct';
        confidence = Math.random() * 0.2 + 0.8; // 80-100%
      }

      return {
        phoneme: cleanWord,
        word: cleanWord,
        status,
        confidence,
      };
    });
  };

  const handleRecordPress = () => {
    if (recordingState === 'recording') {
      stopRecording();
    } else if (recordingState === 'idle' || recordingState === 'complete') {
      startRecording();
    }
  };

  const handleNextPhrase = () => {
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRecordingState('idle');
      setScore(null);
      setPhonemeResults([]);
      setRecordingUri(null);
    } else {
      // Completed all phrases
      Alert.alert(
        'Congratulations!',
        'You\'ve completed all pronunciation drills!',
        [
          { text: 'Practice Again', onPress: resetDrill },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    }
  };

  const resetDrill = () => {
    setCurrentIndex(0);
    setRecordingState('idle');
    setScore(null);
    setPhonemeResults([]);
    setRecordingUri(null);
  };

  const handleClose = () => {
    Alert.alert(
      'Exit Drill?',
      'Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.accent[400];
    return colors.error[500];
  };

  const getPhonemeColor = (status: PhonemeAnalysis['status']) => {
    switch (status) {
      case 'correct':
        return colors.success[500];
      case 'close':
        return colors.accent[400];
      case 'incorrect':
        return colors.error[500];
    }
  };

  const getPhonemeBackground = (status: PhonemeAnalysis['status']) => {
    switch (status) {
      case 'correct':
        return colors.success[500] + '20';
      case 'close':
        return colors.accent[400] + '20';
      case 'incorrect':
        return colors.error[500] + '20';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Pronunciation Drill</Text>
          <Text style={styles.subtitle}>
            Phrase {currentIndex + 1} of {phrases.length}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={handleClose}
        >
          <X size={20} color={colors.text.secondary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Phrase Card */}
        <View style={styles.phraseCard}>
          <View style={styles.phraseHeader}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {currentPhrase.difficulty.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.focusText}>Focus: {currentPhrase.focus}</Text>
          </View>
          <Text style={styles.phraseText}>{currentPhrase.text}</Text>
          {currentPhrase.phonetic && (
            <Text style={styles.phoneticText}>[{currentPhrase.phonetic}]</Text>
          )}
        </View>

        {/* Listen Button */}
        <Pressable
          style={({ pressed }) => [
            styles.listenButton,
            pressed && styles.buttonPressed,
            isPlayingAudio && styles.listenButtonActive,
          ]}
          onPress={handlePlayCorrectPronunciation}
          disabled={isPlayingAudio}
        >
          <Volume2 size={24} color={colors.neutral[0]} strokeWidth={2} />
          <Text style={styles.listenButtonText}>
            {isPlayingAudio ? 'Playing...' : 'Listen to Correct Pronunciation'}
          </Text>
        </Pressable>

        {/* Recording Area */}
        <View style={styles.recordingArea}>
          <Text style={styles.recordingLabel}>Your Turn</Text>

          <Pressable
            onPress={handleRecordPress}
            disabled={recordingState === 'processing'}
          >
            <Animated.View
              style={[
                styles.recordButton,
                recordingState === 'recording' && styles.recordButtonActive,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {recordingState === 'recording' ? (
                <Square size={32} color={colors.neutral[0]} fill={colors.neutral[0]} strokeWidth={0} />
              ) : (
                <Mic size={32} color={colors.neutral[0]} strokeWidth={2} />
              )}
            </Animated.View>
          </Pressable>

          <Text style={styles.recordHint}>
            {recordingState === 'idle' && 'Tap to start recording'}
            {recordingState === 'recording' && 'Recording... Tap to stop'}
            {recordingState === 'processing' && 'Analyzing pronunciation...'}
            {recordingState === 'complete' && 'Tap to record again'}
          </Text>

          {recordingState === 'processing' && (
            <ActivityIndicator
              size="large"
              color={colors.primary[500]}
              style={styles.loader}
            />
          )}
        </View>

        {/* Results */}
        {recordingState === 'complete' && score !== null && (
          <View style={styles.resultsContainer}>
            {/* Overall Score */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                {score}%
              </Text>
              <View style={styles.scoreIconContainer}>
                {score >= 80 ? (
                  <CheckCircle2 size={32} color={colors.success[500]} strokeWidth={2} />
                ) : score >= 60 ? (
                  <AlertCircle size={32} color={colors.accent[400]} strokeWidth={2} />
                ) : (
                  <AlertCircle size={32} color={colors.error[500]} strokeWidth={2} />
                )}
              </View>
            </View>

            {/* Phoneme-level Feedback */}
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>Word-by-Word Analysis</Text>
              <Text style={styles.feedbackSubtitle}>
                Tap each word to hear correct pronunciation
              </Text>
              <View style={styles.phonemeContainer}>
                {phonemeResults.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.phonemeBadge,
                      { backgroundColor: getPhonemeBackground(result.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.phonemeText,
                        { color: getPhonemeColor(result.status) },
                      ]}
                    >
                      {result.word}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: colors.success[500] }]}
                  />
                  <Text style={styles.legendText}>Correct</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: colors.accent[400] }]}
                  />
                  <Text style={styles.legendText}>Close</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: colors.error[500] }]}
                  />
                  <Text style={styles.legendText}>Needs Work</Text>
                </View>
              </View>
            </View>

            {/* Next Button */}
            <Pressable
              style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed]}
              onPress={handleNextPhrase}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex < phrases.length - 1 ? 'Next Phrase' : 'Finish'}
              </Text>
              <ChevronRight size={20} color={colors.neutral[0]} strokeWidth={2.5} />
            </Pressable>
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
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[0.5],
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.neutral[800],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[800],
    borderRadius: layout.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: layout.radius.full,
  },
  progressText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    minWidth: 45,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
  },
  phraseCard: {
    backgroundColor: colors.background.card,
    padding: spacing[5],
    borderRadius: layout.radius.xl,
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
    marginBottom: spacing[5],
    ...shadows.md,
  },
  phraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  difficultyBadge: {
    backgroundColor: colors.accent[400] + '20',
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.md,
  },
  difficultyText: {
    ...textStyles.labelSmall,
    color: colors.accent[400],
    fontWeight: '600',
  },
  focusText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  phraseText: {
    ...textStyles.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing[2],
    lineHeight: 28,
  },
  phoneticText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.info[500],
    paddingVertical: spacing[3.5],
    paddingHorizontal: spacing[5],
    borderRadius: layout.radius.lg,
    marginBottom: spacing[6],
    ...shadows.md,
  },
  listenButtonActive: {
    backgroundColor: colors.info[600],
  },
  listenButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  recordingArea: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  recordingLabel: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: layout.radius.full,
    backgroundColor: colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  recordButtonActive: {
    backgroundColor: colors.error[600],
  },
  recordHint: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing[4],
  },
  resultsContainer: {
    marginTop: spacing[4],
  },
  scoreCard: {
    backgroundColor: colors.background.card,
    padding: spacing[6],
    borderRadius: layout.radius.xl,
    alignItems: 'center',
    marginBottom: spacing[4],
    ...shadows.md,
  },
  scoreLabel: {
    ...textStyles.labelMedium,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  },
  scoreValue: {
    ...textStyles.displayMedium,
    marginBottom: spacing[3],
  },
  scoreIconContainer: {
    marginTop: spacing[2],
  },
  feedbackCard: {
    backgroundColor: colors.background.card,
    padding: spacing[5],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  feedbackTitle: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  feedbackSubtitle: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[4],
  },
  phonemeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  phonemeBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.md,
  },
  phonemeText: {
    ...textStyles.bodyMedium,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: layout.radius.full,
  },
  legendText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: layout.radius.lg,
    ...shadows.md,
  },
  nextButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
