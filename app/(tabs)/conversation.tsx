import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { router, Link } from 'expo-router';
import { apiClient } from '../../src/lib/api-client';
import { Mic, Square, Clock, ChevronUp, ChevronDown, X, Volume2, Zap } from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../../src/theme';

type Message = {
  id: number;
  type: 'ai' | 'user';
  text: string;
  timestamp: string;
  mispronounced?: string[];
  audioUri?: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    type: 'ai',
    text: 'Hello! Welcome to the coffee shop. What can I get for you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const SCENARIO_ID = 'coffee_shop';
const SCENARIO_NAME = 'Coffee Shop Order';

export default function ConversationScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [pronunciationScore, setPronunciationScore] = useState(0);
  const [fluencyScore, setFluencyScore] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [tutorSessionId, setTutorSessionId] = useState<string | null>(null);
  const [turnNumber, setTurnNumber] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();

    timerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speakMessage = async (text: string) => {
    if (!ttsEnabled) return;

    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsSpeaking(true);
      const result = await apiClient.synthesizeSpeech(text);

      if (!result.success || !result.audioUri) {
        console.error('TTS failed:', result.error);
        setIsSpeaking(false);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: result.audioUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('TTS playback error:', error);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Please enable microphone access to record.');
      return;
    }

    try {
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
      setIsProcessing(true);
      setLastError(null);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        setLastError('Failed to save recording');
        setIsProcessing(false);
        return;
      }

      const result = await apiClient.analyzeSpeech(uri);

      if (!result.success) {
        const errorMessage = result.error || 'Speech analysis failed';
        setLastError(errorMessage);

        const errorMessageObj: Message = {
          id: messages.length + 1,
          type: 'user',
          text: `[TRANSCRIPTION ERROR: ${errorMessage}]`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioUri: uri,
        };
        setMessages(prev => [...prev, errorMessageObj]);
        setIsProcessing(false);
        return;
      }

      const userText = result.transcript || '[No speech detected]';

      const newUserMessage: Message = {
        id: messages.length + 1,
        type: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioUri: uri,
        mispronounced: result.mispronounced_words.length > 0 ? result.mispronounced_words : undefined,
      };

      setMessages(prev => [...prev, newUserMessage]);
      setPronunciationScore(result.pronunciation_score);
      setFluencyScore(result.fluency_score);

      if (userText && userText !== '[No speech detected]') {
        setIsLoadingAI(true);
        try {
          const tutorResponse = await apiClient.getTutorResponse(
            userText,
            SCENARIO_ID,
            tutorSessionId || undefined,
            turnNumber
          );

          if (tutorResponse.success) {
            if (tutorResponse.session_id && !tutorSessionId) {
              setTutorSessionId(tutorResponse.session_id);
            }
            setTurnNumber(prev => prev + 1);

            const aiMessage: Message = {
              id: messages.length + 2,
              type: 'ai',
              text: tutorResponse.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, aiMessage]);
            speakMessage(tutorResponse.message);
          } else {
            const errorMessage: Message = {
              id: messages.length + 2,
              type: 'ai',
              text: `[Tutor unavailable: ${tutorResponse.error || 'Unknown error'}]`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        } catch (err) {
          console.error('Tutor API error:', err);
        } finally {
          setIsLoadingAI(false);
        }
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to process recording:', errorMsg);
      setLastError(errorMsg);
      Alert.alert('Recording Error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleEndConversation = () => {
    Alert.alert(
      'End Conversation?',
      'Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            // Calculate session stats
            const wordsSpoken = messages.filter(m => m.type === 'user').reduce((acc, m) => {
              return acc + m.text.split(' ').length;
            }, 0);

            const mispronuncedWords = messages
              .filter(m => m.type === 'user' && m.mispronounced)
              .flatMap(m => m.mispronounced || []);

            // Navigate to session summary with stats
            router.push({
              pathname: '/session-summary',
              params: {
                speakingMinutes: Math.ceil(sessionTime / 60),
                wordsSpoken: wordsSpoken.toString(),
                pronunciationScore: pronunciationScore.toString(),
                fluencyScore: fluencyScore.toString(),
                thingsDoneWell: JSON.stringify([
                  'Clear pronunciation',
                  'Natural conversation flow',
                  'Good vocabulary usage',
                ]),
                areasToImprove: JSON.stringify([
                  mispronuncedWords.length > 0 ? `Practice words: ${mispronuncedWords.slice(0, 3).join(', ')}` : 'Keep practicing pronunciation',
                  'Use more varied expressions',
                  'Work on sentence stress',
                ]),
                vocabularyLearned: JSON.stringify(['latte', 'espresso', 'foam']),
              },
            });
          },
        },
      ]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return colors.success[500];
    if (score >= 50) return colors.warning[500];
    return colors.error[500];
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={styles.messageText}>
            {message.text.split(' ').map((word, index) => {
              const cleanWord = word.replace(/[.,!?]/g, '');
              const isMispronounced = message.mispronounced?.includes(cleanWord);

              return (
                <Text
                  key={index}
                  style={isMispronounced ? styles.mispronounced : undefined}
                >
                  {word}{' '}
                </Text>
              );
            })}
          </Text>
          <Text style={styles.timestamp}>{message.timestamp}</Text>
        </View>
      </View>
    );
  };

  const renderGauge = (label: string, score: number) => {
    return (
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeHeader}>
          <Text style={styles.gaugeLabel}>{label}</Text>
          <Text style={[styles.gaugeScore, { color: getScoreColor(score) }]}>{score}%</Text>
        </View>
        <View style={styles.gaugeBar}>
          <View
            style={[
              styles.gaugeFill,
              {
                flex: score / 100,
                backgroundColor: getScoreColor(score),
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.scenarioName}>{SCENARIO_NAME}</Text>
          <View style={styles.timeContainer}>
            <Clock size={14} color={colors.primary[500]} strokeWidth={2} />
            <Text style={styles.timeText}>{formatTime(sessionTime)}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.endButton, pressed && styles.endButtonPressed]}
          onPress={handleEndConversation}
        >
          <X size={16} color={colors.error[500]} strokeWidth={2.5} />
          <Text style={styles.endButtonText}>End</Text>
        </Pressable>
      </View>

      {/* Try Realtime Banner */}
      <Link href="/realtime-conversation" asChild>
        <Pressable style={({ pressed }) => [styles.realtimeBanner, pressed && styles.realtimeBannerPressed]}>
          <View style={styles.realtimeBannerContent}>
            <View style={styles.realtimeBadge}>
              <Zap size={12} color={colors.neutral[0]} strokeWidth={2.5} />
              <Text style={styles.realtimeBadgeText}>NEW</Text>
            </View>
            <Text style={styles.realtimeBannerTitle}>Try Instant AI Voice Chat</Text>
            <Text style={styles.realtimeBannerDesc}>Ultra-low latency conversations</Text>
          </View>
        </Pressable>
      </Link>

      {/* Feedback Panel */}
      <View style={styles.feedbackPanel}>
        <Pressable
          style={styles.feedbackHeader}
          onPress={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
        >
          <Text style={styles.feedbackTitle}>Real-time Feedback</Text>
          {isFeedbackExpanded ? (
            <ChevronUp size={18} color={colors.text.secondary} strokeWidth={2} />
          ) : (
            <ChevronDown size={18} color={colors.text.secondary} strokeWidth={2} />
          )}
        </Pressable>

        {isFeedbackExpanded && (
          <View style={styles.feedbackContent}>
            {renderGauge('Pronunciation', pronunciationScore)}
            {renderGauge('Fluency', fluencyScore)}
          </View>
        )}
      </View>

      {/* Transcript Window */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.transcriptWindow}
        contentContainerStyle={styles.transcriptContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map(renderMessage)}
        {isLoadingAI && (
          <View style={[styles.messageContainer, styles.aiMessageContainer]}>
            <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Microphone Button Container */}
      <View style={styles.micContainer}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.processingText}>Analyzing speech...</Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={toggleRecording}
              disabled={isProcessing}
            >
              <Animated.View
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonRecording,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                {isRecording ? (
                  <Square size={32} color={colors.neutral[0]} fill={colors.neutral[0]} strokeWidth={0} />
                ) : (
                  <Mic size={32} color={colors.neutral[0]} strokeWidth={2} />
                )}
              </Animated.View>
            </Pressable>
            <Text style={styles.micHint}>
              {isRecording ? 'Recording... Tap to stop' : 'Tap to speak'}
            </Text>
            {isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Volume2 size={14} color={colors.primary[500]} strokeWidth={2} />
                <Text style={styles.speakingText}>Speaking...</Text>
              </View>
            )}
          </>
        )}
        {lastError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        )}
        {!permissionGranted && (
          <Text style={styles.permissionWarning}>Microphone permission required</Text>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerLeft: {
    flex: 1,
  },
  scenarioName: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  timeText: {
    ...textStyles.labelMedium,
    color: colors.primary[500],
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  endButtonPressed: {
    backgroundColor: colors.error[500] + '15',
  },
  endButtonText: {
    ...textStyles.labelMedium,
    color: colors.error[500],
  },
  feedbackPanel: {
    backgroundColor: colors.background.card,
    marginHorizontal: layout.screenPadding,
    marginVertical: spacing[3],
    borderRadius: layout.radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  feedbackTitle: {
    ...textStyles.titleMedium,
    color: colors.text.primary,
  },
  feedbackContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[4],
  },
  gaugeContainer: {
    gap: spacing[2],
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeLabel: {
    ...textStyles.labelSmall,
    color: colors.text.secondary,
  },
  gaugeBar: {
    height: 6,
    backgroundColor: colors.neutral[800],
    borderRadius: layout.radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  gaugeFill: {
    height: 6,
    borderRadius: layout.radius.full,
  },
  gaugeScore: {
    ...textStyles.labelMedium,
    fontWeight: '700',
  },
  transcriptWindow: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  transcriptContent: {
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  messageContainer: {
    marginVertical: spacing[1],
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing[3],
    borderRadius: layout.radius.xl,
  },
  userBubble: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: spacing[1],
  },
  aiBubble: {
    backgroundColor: colors.neutral[800],
    borderBottomLeftRadius: spacing[1],
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  loadingText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  messageText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
  },
  mispronounced: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.error[500],
    textDecorationStyle: 'solid',
    color: colors.error[300],
  },
  timestamp: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  micContainer: {
    alignItems: 'center',
    paddingVertical: spacing[5],
    paddingBottom: spacing[8],
    backgroundColor: colors.background.primary,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: layout.radius.full,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  micButtonRecording: {
    backgroundColor: colors.error[500],
  },
  micHint: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  speakingText: {
    ...textStyles.caption,
    color: colors.primary[500],
  },
  permissionWarning: {
    ...textStyles.caption,
    color: colors.error[500],
    marginTop: spacing[2],
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  processingText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  errorContainer: {
    backgroundColor: colors.error[500] + '15',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.md,
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error[500],
    textAlign: 'center',
  },
  // Realtime Banner
  realtimeBanner: {
    backgroundColor: colors.primary[500] + '15',
    marginHorizontal: layout.screenPadding,
    marginVertical: spacing[2],
    padding: spacing[3],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  realtimeBannerPressed: {
    backgroundColor: colors.primary[500] + '25',
  },
  realtimeBannerContent: {
    alignItems: 'center',
  },
  realtimeBadge: {
    backgroundColor: colors.accent[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: layout.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[1.5],
  },
  realtimeBadgeText: {
    ...textStyles.labelSmall,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  realtimeBannerTitle: {
    ...textStyles.labelLarge,
    color: colors.primary[400],
    marginBottom: spacing[0.5],
  },
  realtimeBannerDesc: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
});
