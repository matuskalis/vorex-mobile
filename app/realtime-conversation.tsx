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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mic, Square, Clock, X, Volume2, Wifi, WifiOff, Zap } from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';
import { useRealtimeVoice } from '../src/hooks';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

export default function RealtimeConversationScreen() {
  const [sessionTime, setSessionTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
  } = useRealtimeVoice({
    onMessage: (message) => {
      console.log('New message:', message);
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
    },
  });

  // Auto-connect on mount
  useEffect(() => {
    connect();

    timerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      disconnect();
    };
  }, []);

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
      // Interrupt AI if speaking
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
      'End Conversation?',
      'Your conversation will end.',
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.scenarioName}>AI Voice Chat</Text>
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
        <Pressable
          style={({ pressed }) => [styles.endButton, pressed && styles.endButtonPressed]}
          onPress={handleEndConversation}
        >
          <X size={16} color={colors.error[500]} strokeWidth={2.5} />
          <Text style={styles.endButtonText}>End</Text>
        </Pressable>
      </View>

      {/* Live Transcript (when listening) */}
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
        {messages.length === 0 && connectionState === 'connected' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Tap the microphone to start speaking.{'\n'}
              The AI will respond instantly.
            </Text>
          </View>
        )}

        {messages.map(renderMessage)}

        {isSpeaking && (
          <View style={[styles.messageContainer, styles.aiMessageContainer]}>
            <View style={[styles.messageBubble, styles.aiBubble, styles.speakingBubble]}>
              <Volume2 size={16} color={colors.primary[500]} strokeWidth={2} />
              <Text style={styles.speakingText}>Speaking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Microphone Button */}
      <View style={styles.micContainer}>
        {connectionState === 'connecting' ? (
          <View style={styles.connectingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.connectingText}>Connecting to AI...</Text>
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
  scenarioName: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
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
});
