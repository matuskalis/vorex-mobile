import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedbackModalProps {
  visible: boolean;
  correct: boolean;
  correctAnswer?: string;
  explanation?: string;
  onContinue: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  correct,
  correctAnswer,
  explanation,
  onContinue,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: opacityAnim },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          correct ? styles.correctContainer : styles.incorrectContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {correct ? '🎉 Correct!' : '❌ Incorrect'}
            </Text>
          </View>

          {!correct && correctAnswer && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Correct answer:</Text>
              <Text style={styles.answerText}>{correctAnswer}</Text>
            </View>
          )}

          {explanation && (
            <View style={styles.explanationSection}>
              <Text style={styles.explanationText}>{explanation}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              correct ? styles.correctButton : styles.incorrectButton,
            ]}
            onPress={onContinue}
          >
            <Text style={styles.buttonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  correctContainer: {
    backgroundColor: '#14532d',
  },
  incorrectContainer: {
    backgroundColor: '#450a0a',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  answerSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  explanationSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  explanationText: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  correctButton: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  incorrectButton: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
