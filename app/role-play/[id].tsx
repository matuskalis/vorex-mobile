import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Mic,
  Square,
  Clock,
  X,
  Volume2,
  Wifi,
  WifiOff,
  Zap,
  User,
  Info,
  RotateCcw,
  Lightbulb,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../../src/theme';
import { useRealtimeVoice, useRolePlayMemory } from '../../src/hooks';
import { getScenarioById } from '../../src/data/rolePlayScenarios';
import { FEATURES } from '../../src/config/features';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

export default function RolePlayConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scenario = getScenarioById(id);

  const [sessionTime, setSessionTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showScenarioInfo, setShowScenarioInfo] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use role play memory hook
  const memory = useRolePlayMemory(id);

  if (!scenario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Scenario not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Feature flag: Realtime voice AI is temporarily disabled
  if (!FEATURES.REALTIME_VOICE_AI) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <WifiOff size={48} color={colors.text.secondary} strokeWidth={1.5} />
          <Text style={[styles.errorText, { marginTop: spacing[4] }]}>
            Role-Play Temporarily Unavailable
          </Text>
          <Text style={styles.disabledMessage}>
            Real-time voice conversations are being improved.{'\n'}
            Please use Pronunciation Drill for now.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {
    connectionState,
    isListening,
    isSpeaking,
    messages,
    lastLatency,
    connect,
    disconnect,
    startListening,
    stopListening,
    interrupt,
    sendSessionUpdate,
  } = useRealtimeVoice({
    onMessage: (message) => {
      memory.addMessage(message);
    },
    onTranscript: (text, isFinal) => {
      if (!isFinal) {
        setCurrentTranscript(prev => prev + text);
      } else {
        setCurrentTranscript('');
      }
    },
    onError: (error) => {
      console.error('Realtime error:', error);
      Alert.alert('Error', error);
    },
    onConnectionChange: (state) => {
      console.log('Connection state:', state);

      // Configure session when connected
      if (state === 'connected') {
        configureSessionWithPersona();
      }
    },
  });

  // Configure the session with persona
  const configureSessionWithPersona = useCallback(() => {
    console.log('Configuring session with persona:', scenario.persona.name);

    // Send session.update with the role-play persona system prompt
    const success = sendSessionUpdate({
      instructions: scenario.systemPrompt,
      voice: 'alloy', // Use consistent voice for personas
    });

    if (success) {
      console.log('Persona configured successfully');
    } else {
      console.warn('Failed to configure persona - WebSocket not ready');
    }
  }, [scenario, sendSessionUpdate]);

  // Auto-connect on mount
  useEffect(() => {
    if (!memory.isLoadingHistory) {
      connect();

      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      disconnect();
    };
  }, [memory.isLoadingHistory]);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
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
  }, [isListening]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicPress = useCallback(async () => {
    if (connectionState !== 'connected') {
      Alert.alert('Not Connected', 'Waiting for connection...');
      return;
    }

    if (isSpeaking) {
      interrupt();
      return;
    }

    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [connectionState, isListening, isSpeaking, startListening, stopListening, interrupt]);

  const handleEndConversation = () => {
    Alert.alert(
      'End Role Play?',
      'Your progress will be saved and you can resume later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            disconnect();
            router.back();
          },
        },
      ]
    );
  };

  const handleResetConversation = () => {
    Alert.alert(
      'Reset Conversation?',
      'This will clear all conversation history for this scenario. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await memory.clearConversationHistory();
            disconnect();
            setTimeout(() => connect(), 500);
          },
        },
      ]
    );
  };

  const getConnectionIcon = () => {
    if (connectionState === 'connected') {
      return <Wifi size={14} color={colors.success[500]} strokeWidth={2} />;
    }
    return <WifiOff size={14} color={colors.error[500]} strokeWidth={2} />;
  };

  const getConnectionText = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const timeStr = message.timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

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
          <Text style={styles.messageText}>{message.text}</Text>
          <Text style={styles.timestamp}>{timeStr}</Text>
        </View>
      </View>
    );
  };

  const getMicButtonStyle = () => {
    if (isSpeaking) {
      return styles.micButtonSpeaking;
    }
    if (isListening) {
      return styles.micButtonRecording;
    }
    return null;
  };

  const getMicHintText = () => {
    if (connectionState !== 'connected') {
      return 'Connecting...';
    }
    if (isSpeaking) {
      return 'Tap to interrupt';
    }
    if (isListening) {
      return 'Recording... Tap to send';
    }
    return 'Tap to speak';
  };

  const allMessages = [...memory.conversationHistory, ...messages];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.scenarioName}>{scenario.title}</Text>
          <View style={styles.statusRow}>
            <View style={styles.timeContainer}>
              <Clock size={14} color={colors.primary[500]} strokeWidth={2} />
              <Text style={styles.timeText}>{formatTime(sessionTime)}</Text>
            </View>
            <View style={styles.connectionContainer}>
              {getConnectionIcon()}
              <Text style={[
                styles.connectionText,
                connectionState === 'connected' && styles.connectionTextConnected,
                connectionState === 'error' && styles.connectionTextError,
              ]}>
                {getConnectionText()}
              </Text>
            </View>
            {lastLatency && (
              <View style={styles.latencyContainer}>
                <Zap size={12} color={colors.accent[500]} strokeWidth={2} />
                <Text style={styles.latencyText}>{lastLatency.speechEndToFirstAudio}ms</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowScenarioInfo(!showScenarioInfo)}
          >
            <Info size={20} color={colors.text.secondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowTips(!showTips)}
          >
            <Lightbulb size={20} color={colors.accent[500]} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleResetConversation}
          >
            <RotateCcw size={20} color={colors.text.secondary} strokeWidth={2} />
          </TouchableOpacity>
          <Pressable
            style={({ pressed }) => [styles.endButton, pressed && styles.endButtonPressed]}
            onPress={handleEndConversation}
          >
            <X size={16} color={colors.error[500]} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Scenario Info Panel */}
      {showScenarioInfo && (
        <View style={styles.infoPanel}>
          <View style={styles.infoPanelHeader}>
            <User size={16} color={colors.primary[500]} strokeWidth={2} />
            <Text style={styles.infoPanelTitle}>
              {scenario.persona.name} - {scenario.persona.role}
            </Text>
          </View>
          <Text style={styles.infoPanelText}>{scenario.persona.backgroundStory}</Text>
          <Text style={styles.infoPanelLabel}>Personality:</Text>
          {scenario.persona.personality.map((trait, index) => (
            <Text key={index} style={styles.infoPanelListItem}>• {trait}</Text>
          ))}
        </View>
      )}

      {/* Tips Panel */}
      {showTips && scenario.tips.length > 0 && (
        <View style={[styles.infoPanel, styles.tipsPanel]}>
          <View style={styles.infoPanelHeader}>
            <Lightbulb size={16} color={colors.accent[500]} strokeWidth={2} />
            <Text style={styles.infoPanelTitle}>Tips for Success</Text>
          </View>
          {scenario.tips.map((tip, index) => (
            <Text key={index} style={styles.infoPanelListItem}>• {tip}</Text>
          ))}
        </View>
      )}

      {/* Live Transcript */}
      {(isListening || currentTranscript) && (
        <View style={styles.liveTranscriptContainer}>
          <Text style={styles.liveTranscriptLabel}>Listening...</Text>
          <Text style={styles.liveTranscriptText}>
            {currentTranscript || '...'}
          </Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.transcriptWindow}
        contentContainerStyle={styles.transcriptContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {allMessages.length === 0 && connectionState === 'connected' && !memory.isLoadingHistory && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {scenario.persona.name} will greet you shortly.{'\n'}
              Tap the microphone when ready to respond.
            </Text>
          </View>
        )}

        {memory.isLoadingHistory && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading conversation history...</Text>
          </View>
        )}

        {allMessages.map(renderMessage)}

        {isSpeaking && (
          <View style={[styles.messageContainer, styles.aiMessageContainer]}>
            <View style={[styles.messageBubble, styles.aiBubble, styles.speakingBubble]}>
              <Volume2 size={16} color={colors.primary[500]} strokeWidth={2} />
              <Text style={styles.speakingText}>{scenario.persona.name} is speaking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Microphone Button */}
      <View style={styles.micContainer}>
        {connectionState === 'connecting' || memory.isLoadingHistory ? (
          <View style={styles.connectingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.connectingText}>
              {memory.isLoadingHistory ? 'Loading session...' : 'Connecting to AI...'}
            </Text>
          </View>
        ) : (
          <>
            <Pressable onPress={handleMicPress} disabled={connectionState !== 'connected'}>
              <Animated.View
                style={[
                  styles.micButton,
                  getMicButtonStyle(),
                  { transform: [{ scale: pulseAnim }] },
                  connectionState !== 'connected' && styles.micButtonDisabled,
                ]}
              >
                {isListening ? (
                  <Square size={32} color={colors.neutral[0]} fill={colors.neutral[0]} strokeWidth={0} />
                ) : isSpeaking ? (
                  <Volume2 size={32} color={colors.neutral[0]} strokeWidth={2} />
                ) : (
                  <Mic size={32} color={colors.neutral[0]} strokeWidth={2} />
                )}
              </Animated.View>
            </Pressable>
            <Text style={styles.micHint}>{getMicHintText()}</Text>
          </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    padding: spacing[2],
  },
  scenarioName: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
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
  connectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  connectionText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  connectionTextConnected: {
    color: colors.success[500],
  },
  connectionTextError: {
    color: colors.error[500],
  },
  latencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  latencyText: {
    ...textStyles.caption,
    color: colors.accent[500],
    fontWeight: '600',
  },
  endButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  endButtonPressed: {
    backgroundColor: colors.error[500] + '15',
  },
  infoPanel: {
    backgroundColor: colors.primary[500] + '10',
    marginHorizontal: layout.screenPadding,
    marginTop: spacing[3],
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  tipsPanel: {
    backgroundColor: colors.accent[500] + '10',
    borderLeftColor: colors.accent[500],
  },
  infoPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  infoPanelTitle: {
    ...textStyles.labelLarge,
    color: colors.text.primary,
  },
  infoPanelText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  infoPanelLabel: {
    ...textStyles.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  infoPanelListItem: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    paddingLeft: spacing[2],
  },
  liveTranscriptContainer: {
    backgroundColor: colors.primary[500] + '15',
    marginHorizontal: layout.screenPadding,
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  liveTranscriptLabel: {
    ...textStyles.caption,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  liveTranscriptText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
  },
  transcriptWindow: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  transcriptContent: {
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyStateText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  loadingText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
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
  speakingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  speakingText: {
    ...textStyles.bodySmall,
    color: colors.primary[500],
  },
  messageText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
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
  micButtonSpeaking: {
    backgroundColor: colors.success[500],
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  micHint: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  connectingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  connectingText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.screenPadding,
  },
  errorText: {
    ...textStyles.headlineMedium,
    color: colors.error[500],
    marginBottom: spacing[6],
  },
  backButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: layout.radius.lg,
  },
  backButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
  disabledMessage: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[6],
    lineHeight: 22,
    paddingHorizontal: spacing[4],
  },
});
