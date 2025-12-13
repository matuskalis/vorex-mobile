import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { colors, spacing, layout, textStyles, shadows } from '../theme';
import { VocabItem } from '../utils/spacedRepetition';

interface VocabCardProps {
  item: VocabItem;
  showAnswer: boolean;
  onFlip: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing[5] * 2;

export function VocabCard({ item, showAnswer, onFlip }: VocabCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Animate flip when showAnswer changes
  React.useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: showAnswer ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [showAnswer]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 90.01, 180],
    outputRange: [1, 0, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 89.99, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    opacity: frontOpacity,
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    opacity: backOpacity,
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    try {
      await Speech.speak(item.word, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <Pressable onPress={onFlip} style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Front of Card */}
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Question</Text>
              </View>
              <Pressable
                onPress={handleSpeak}
                style={({ pressed }) => [
                  styles.speakButton,
                  pressed && styles.speakButtonPressed,
                ]}
              >
                <Volume2
                  size={20}
                  color={isSpeaking ? colors.accent[400] : colors.text.secondary}
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            <View style={styles.wordContainer}>
              <Text style={styles.word}>{item.word}</Text>
              {item.phonetic && (
                <Text style={styles.phonetic}>{item.phonetic}</Text>
              )}
            </View>

            {item.example && (
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleLabel}>Example:</Text>
                <Text style={styles.exampleText}>{item.example}</Text>
              </View>
            )}

            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to reveal translation</Text>
            </View>
          </View>
        </Animated.View>

        {/* Back of Card */}
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <View style={[styles.badge, styles.badgeAnswer]}>
                <Text style={styles.badgeText}>Answer</Text>
              </View>
              <Pressable
                onPress={handleSpeak}
                style={({ pressed }) => [
                  styles.speakButton,
                  pressed && styles.speakButtonPressed,
                ]}
              >
                <Volume2
                  size={20}
                  color={isSpeaking ? colors.accent[400] : colors.text.secondary}
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            <View style={styles.wordContainer}>
              <Text style={styles.word}>{item.word}</Text>
              {item.phonetic && (
                <Text style={styles.phonetic}>{item.phonetic}</Text>
              )}
            </View>

            <View style={styles.translationContainer}>
              <Text style={styles.translation}>{item.translation}</Text>
            </View>

            {item.example && (
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleLabel}>Example:</Text>
                <Text style={styles.exampleText}>{item.example}</Text>
              </View>
            )}

            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>How well did you remember?</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 400,
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    borderRadius: layout.radius['2xl'],
    ...shadows.xl,
  },
  cardFront: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  cardBack: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.success[500],
  },
  cardContent: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: layout.radius.md,
  },
  badgeAnswer: {
    backgroundColor: colors.success[500],
  },
  badgeText: {
    ...textStyles.labelSmall,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  speakButton: {
    width: 40,
    height: 40,
    borderRadius: layout.radius.lg,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  wordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  word: {
    ...textStyles.displayMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  phonetic: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  translationContainer: {
    backgroundColor: colors.success[500] + '15',
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.success[500] + '30',
    marginVertical: spacing[2],
  },
  translation: {
    ...textStyles.headlineSmall,
    color: colors.success[400],
    textAlign: 'center',
  },
  exampleContainer: {
    backgroundColor: colors.background.elevated,
    padding: spacing[4],
    borderRadius: layout.radius.lg,
  },
  exampleLabel: {
    ...textStyles.labelSmall,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  exampleText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  tapHint: {
    alignItems: 'center',
    paddingTop: spacing[3],
  },
  tapHintText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
