import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Volume2, Mic, Square, Play } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { apiClient } from '../lib/api-client';
import { colors, spacing, layout, shadows, textStyles as themeTextStyles } from '../theme';
import { ProblemWordChip } from './ProblemWordChip';
import { SelfAssessmentButtons } from './SelfAssessmentButtons';
import { Phrase } from '../data/phrases';

interface SwipeablePhraseCardProps {
  phrase: Phrase;
  onSelfAssess: (rating: 'good' | 'retry', problemWords: string[]) => void;
  onComplete: () => void;
}

type CardState = 'initial' | 'recording' | 'recorded' | 'assessed';

export function SwipeablePhraseCard({ phrase, onSelfAssess, onComplete }: SwipeablePhraseCardProps) {
  const [cardState, setCardState] = useState<CardState>('initial');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [markedWords, setMarkedWords] = useState<string[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [ttsSound, setTtsSound] = useState<Audio.Sound | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cleanup audio resources on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup TTS sound
      if (ttsSound) {
        ttsSound.unloadAsync().catch(() => {});
      }
      // Cleanup recording playback sound
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
      // Stop and cleanup any active recording
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [ttsSound, sound, recording]);

  // Start pulse animation for recording
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  // Listen to phrase via OpenAI TTS (better voice)
  const handleListen = async () => {
    if (isPlaying && ttsSound) {
      await ttsSound.stopAsync();
      setIsPlaying(false);
      return;
    }

    setIsLoadingTTS(true);
    try {
      // Use OpenAI TTS via backend for better voice
      const result = await apiClient.synthesizeSpeech(phrase.text);

      if (result.success && result.audioUri) {
        // Clean up previous sound
        if (ttsSound) {
          await ttsSound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: result.audioUri },
          { shouldPlay: true }
        );
        setTtsSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else {
        console.error('TTS failed:', result.error);
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsLoadingTTS(false);
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setCardState('recording');
      startPulse();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!recording) return;

    stopPulse();
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingUri(uri);
    setRecording(null);
    setCardState('recorded');

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  };

  // Playback user recording
  const handlePlayback = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  // Toggle word marking
  const toggleWordMark = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (markedWords.includes(cleanWord)) {
      setMarkedWords(markedWords.filter(w => w !== cleanWord));
    } else {
      setMarkedWords([...markedWords, cleanWord]);
    }
  };

  // Handle self-assessment
  const handleAssessment = (rating: 'good' | 'retry') => {
    onSelfAssess(rating, markedWords);

    if (rating === 'good') {
      setCardState('assessed');
      setTimeout(() => {
        onComplete();
      }, 500);
    } else {
      // Reset for another try
      setCardState('initial');
      setRecordingUri(null);
      setMarkedWords([]); // Clear marked words on retry
    }
  };

  // Split phrase into words
  const words = phrase.text.split(/\s+/);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Phrase Display */}
      <View style={styles.phraseCard}>
        <Text style={styles.phraseText}>{phrase.text}</Text>
        <Text style={styles.categoryText}>
          {phrase.subcategory.replace(/_/g, ' ')}
        </Text>
      </View>

      {/* Listen Button */}
      <Pressable
        onPress={handleListen}
        disabled={isLoadingTTS}
        style={({ pressed }) => [
          styles.listenButton,
          pressed && styles.buttonPressed,
          isLoadingTTS && styles.buttonDisabled,
        ]}
      >
        {isLoadingTTS ? (
          <ActivityIndicator size="small" color={colors.primary[400]} />
        ) : (
          <Volume2 size={24} color={isPlaying ? colors.primary[400] : colors.text.primary} />
        )}
        <Text style={styles.listenText}>
          {isLoadingTTS ? 'Loading...' : isPlaying ? 'Playing...' : 'Listen'}
        </Text>
      </Pressable>

      {/* Record Button */}
      <Animated.View style={[
        styles.recordButtonContainer,
        cardState === 'recording' && { transform: [{ scale: pulseAnim }] },
      ]}>
        <Pressable
          onPress={cardState === 'recording' ? handleStopRecording : handleStartRecording}
          style={[
            styles.recordButton,
            cardState === 'recording' && styles.recordButtonActive,
          ]}
        >
          {cardState === 'recording' ? (
            <Square size={32} color={colors.neutral[0]} fill={colors.neutral[0]} />
          ) : (
            <Mic size={32} color={colors.neutral[0]} />
          )}
        </Pressable>
        <Text style={styles.recordText}>
          {cardState === 'recording' ? 'Tap to stop' : 'Tap to record'}
        </Text>
      </Animated.View>

      {/* Playback Button - shows after recording */}
      {cardState === 'recorded' && (
        <Pressable
          onPress={handlePlayback}
          style={({ pressed }) => [
            styles.playbackButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Play size={24} color={colors.primary[400]} />
          <Text style={styles.playbackText}>Play my recording</Text>
        </Pressable>
      )}

      {/* Self-Assessment Buttons - shows after recording */}
      {cardState === 'recorded' && (
        <View style={styles.assessmentSection}>
          <Text style={styles.assessmentLabel}>How did that sound?</Text>
          <SelfAssessmentButtons
            onGood={() => handleAssessment('good')}
            onRetry={() => handleAssessment('retry')}
          />
        </View>
      )}

      {/* Problem Words - shows after recording */}
      {cardState === 'recorded' && (
        <View style={styles.problemWordsSection}>
          <Text style={styles.problemWordsLabel}>
            Struggled with a word? Tap it:
          </Text>
          <View style={styles.wordsContainer}>
            {words.map((word, index) => (
              <ProblemWordChip
                key={`${word}-${index}`}
                word={word}
                isMarked={markedWords.includes(word.toLowerCase().replace(/[^a-z]/g, ''))}
                onPress={() => toggleWordMark(word)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Success state */}
      {cardState === 'assessed' && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Nice!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: 180, // Extra padding for tab bar + safe area
  },
  phraseCard: {
    backgroundColor: colors.background.card,
    borderRadius: layout.radius['2xl'],
    padding: spacing[6],
    marginTop: spacing[6],
    marginBottom: spacing[5],
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.md,
  },
  phraseText: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
  },
  categoryText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: spacing[3],
    textTransform: 'capitalize',
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: layout.radius.lg,
    backgroundColor: colors.neutral[800],
    marginBottom: spacing[6],
  },
  listenText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  recordButtonContainer: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  recordButtonActive: {
    backgroundColor: colors.error[500],
  },
  recordText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: spacing[2],
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: layout.radius.lg,
    backgroundColor: colors.primary[500] + '20',
    borderWidth: 1,
    borderColor: colors.primary[500],
    marginBottom: spacing[5],
  },
  playbackText: {
    color: colors.primary[400],
    fontSize: 16,
    fontWeight: '500',
  },
  assessmentSection: {
    width: '100%',
    marginBottom: spacing[5],
  },
  assessmentLabel: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  problemWordsSection: {
    width: '100%',
    marginTop: spacing[2],
  },
  problemWordsLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: spacing[3],
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  successText: {
    color: colors.success[400],
    fontSize: 28,
    fontWeight: '700',
  },
});
