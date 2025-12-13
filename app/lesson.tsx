import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { useLearning } from '../src/context/LearningContext';

const LESSON_STEPS = [
  {
    type: 'intro',
    title: "Today's Objectives",
    items: [
      'Practice ordering food vocabulary',
      'Focus on /θ/ and /ð/ pronunciation',
      'Complete a conversation scenario',
    ],
  },
  {
    type: 'warmup',
    title: 'Warm-up: Read Aloud',
    prompt: "The weather is nice today. I think I'll go to the coffee shop and get a latte with extra foam.",
  },
  {
    type: 'conversation',
    title: 'Conversation Practice',
    scenario: 'Coffee Shop Order',
  },
  {
    type: 'drills',
    title: 'Targeted Exercises',
    focus: 'Pronunciation drills based on your results',
  },
  {
    type: 'summary',
    title: 'Session Complete',
  },
];

type WarmupFeedback = {
  pronunciationScore: number;
  fluencyScore: number;
  wordsToImprove: string[];
  recordingDuration: number;
};

export default function LessonScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [warmupFeedback, setWarmupFeedback] = useState<WarmupFeedback | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    pronunciationScore: 0,
    fluencyScore: 0,
    grammarScore: 0,
    speakingMinutes: 0,
  });

  const { addSpeakingTime, updateScores } = useLearning();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  const step = LESSON_STEPS[currentStep];

  // Request audio permissions
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Please enable microphone access to record.');
      return;
    }

    try {
      setRecordingTime(0);
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Simulate speech analysis (in production, send to speech-to-text + analysis API)
      const mockFeedback: WarmupFeedback = {
        pronunciationScore: 70 + Math.floor(Math.random() * 25),
        fluencyScore: 65 + Math.floor(Math.random() * 30),
        wordsToImprove: ['weather', 'latte', 'foam'].slice(0, Math.floor(Math.random() * 3) + 1),
        recordingDuration: recordingTime,
      };

      setWarmupFeedback(mockFeedback);

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        pronunciationScore: mockFeedback.pronunciationScore,
        fluencyScore: mockFeedback.fluencyScore,
        speakingMinutes: prev.speakingMinutes + Math.ceil(recordingTime / 60),
      }));

    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      setWarmupFeedback(null);
      await startRecording();
    }
  };

  const handleNext = () => {
    if (currentStep < LESSON_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setWarmupFeedback(null);
      setRecordingTime(0);
    } else {
      // Update learning context with session stats
      const sessionMinutes = Math.ceil((Date.now() - sessionStartRef.current) / 60000);
      addSpeakingTime(sessionMinutes);
      if (sessionStats.pronunciationScore > 0) {
        updateScores({
          pronunciation: sessionStats.pronunciationScore,
          fluency: sessionStats.fluencyScore,
        });
      }
      router.back();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setWarmupFeedback(null);
    } else {
      router.back();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {LESSON_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro Step */}
        {step.type === 'intro' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <View style={styles.objectivesList}>
              {step.items?.map((item, index) => (
                <View key={index} style={styles.objectiveItem}>
                  <Text style={styles.objectiveBullet}>•</Text>
                  <Text style={styles.objectiveText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Warmup Step with Recording */}
        {step.type === 'warmup' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <View style={styles.promptCard}>
              <Text style={styles.promptText}>{step.prompt}</Text>
            </View>

            <View style={styles.micContainer}>
              <TouchableOpacity activeOpacity={0.8} onPress={toggleRecording}>
                <Animated.View
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonRecording,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎤'}</Text>
                </Animated.View>
              </TouchableOpacity>

              {isRecording && (
                <Text style={styles.recordingTimer}>{formatTime(recordingTime)}</Text>
              )}

              <Text style={styles.micHint}>
                {isRecording ? 'Recording... Tap to stop' : 'Tap to start reading'}
              </Text>

              {!permissionGranted && (
                <Text style={styles.permissionWarning}>Microphone permission required</Text>
              )}
            </View>

            {/* Warmup Feedback */}
            {warmupFeedback && (
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>Reading Feedback</Text>

                <View style={styles.scoresRow}>
                  <View style={styles.scoreItem}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(warmupFeedback.pronunciationScore) }]}>
                      {warmupFeedback.pronunciationScore}%
                    </Text>
                    <Text style={styles.scoreLabel}>Pronunciation</Text>
                  </View>
                  <View style={styles.scoreDivider} />
                  <View style={styles.scoreItem}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(warmupFeedback.fluencyScore) }]}>
                      {warmupFeedback.fluencyScore}%
                    </Text>
                    <Text style={styles.scoreLabel}>Fluency</Text>
                  </View>
                </View>

                {warmupFeedback.wordsToImprove.length > 0 && (
                  <View style={styles.wordsToImprove}>
                    <Text style={styles.wordsTitle}>Practice these words:</Text>
                    <View style={styles.wordTags}>
                      {warmupFeedback.wordsToImprove.map((word, index) => (
                        <View key={index} style={styles.wordTag}>
                          <Text style={styles.wordTagText}>{word}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.retryButton} onPress={toggleRecording}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Conversation Step */}
        {step.type === 'conversation' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.scenarioName}>{step.scenario}</Text>
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioIcon}>☕</Text>
              <Text style={styles.scenarioDescription}>
                Practice ordering drinks and food at a coffee shop. The AI barista will guide you through a realistic conversation.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.startConversationButton}
              onPress={() => router.push('/(tabs)/conversation')}
            >
              <Text style={styles.startConversationText}>Start Conversation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Drills Step */}
        {step.type === 'drills' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.drillDescription}>{step.focus}</Text>

            <View style={styles.drillCard}>
              <Text style={styles.drillPhoneme}>/θ/</Text>
              <Text style={styles.drillWord}>think, thought, through</Text>
              <TouchableOpacity style={styles.drillButton}>
                <Text style={styles.drillButtonText}>Practice</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drillCard}>
              <Text style={styles.drillPhoneme}>/ð/</Text>
              <Text style={styles.drillWord}>the, weather, this</Text>
              <TouchableOpacity style={styles.drillButton}>
                <Text style={styles.drillButtonText}>Practice</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Summary Step */}
        {step.type === 'summary' && (
          <View style={styles.stepContainer}>
            <Text style={styles.summaryIcon}>🎉</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.summaryText}>
              Great work! You practiced for {Math.ceil((Date.now() - sessionStartRef.current) / 60000)} minutes today.
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getScoreColor(sessionStats.pronunciationScore || 78) }]}>
                  {sessionStats.pronunciationScore || 78}%
                </Text>
                <Text style={styles.statLabel}>Pronunciation</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getScoreColor(sessionStats.fluencyScore || 85) }]}>
                  {sessionStats.fluencyScore || 85}%
                </Text>
                <Text style={styles.statLabel}>Fluency</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getScoreColor(72) }]}>
                  72%
                </Text>
                <Text style={styles.statLabel}>Grammar</Text>
              </View>
            </View>
            <View style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>🔥</Text>
              <Text style={styles.achievementText}>Keep your streak going!</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            step.type === 'warmup' && !warmupFeedback && styles.buttonSecondary
          ]}
          onPress={handleNext}
        >
          <Text style={[
            styles.nextButtonText,
            step.type === 'warmup' && !warmupFeedback && styles.buttonTextSecondary
          ]}>
            {currentStep === LESSON_STEPS.length - 1
              ? 'Finish'
              : step.type === 'warmup' && !warmupFeedback
                ? 'Skip'
                : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#6366f1',
    fontSize: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
  },
  dotActive: {
    backgroundColor: '#6366f1',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: '#6366f1',
  },
  closeText: {
    color: '#666',
    fontSize: 20,
    width: 60,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    paddingTop: 40,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  // Intro
  objectivesList: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
  },
  objectiveItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  objectiveBullet: {
    color: '#6366f1',
    fontSize: 18,
    marginRight: 12,
  },
  objectiveText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  // Warmup
  promptCard: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
  },
  promptText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.5,
  },
  micIcon: {
    fontSize: 40,
  },
  recordingTimer: {
    color: '#ef4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  micHint: {
    color: '#666',
    fontSize: 14,
  },
  permissionWarning: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
  // Feedback
  feedbackCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  feedbackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoresRow: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreLabel: {
    color: '#666',
    fontSize: 12,
  },
  wordsToImprove: {
    marginBottom: 16,
  },
  wordsTitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  wordTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordTag: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  wordTagText: {
    color: '#fbbf24',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Conversation
  scenarioName: {
    color: '#9ca3af',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  scenarioCard: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  scenarioIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  scenarioDescription: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  startConversationButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startConversationText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Drills
  drillDescription: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  drillCard: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  drillPhoneme: {
    color: '#fbbf24',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  drillWord: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 20,
  },
  drillButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  drillButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Summary
  summaryIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  achievementCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Footer
  footer: {
    padding: 24,
  },
  nextButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonSecondary: {
    backgroundColor: '#2a2a2a',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: '#9ca3af',
  },
});
