import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface Word {
  id: string;
  text: string;
}

interface WordBankProps {
  availableWords: Word[];
  selectedWords: Word[];
  onWordSelect: (word: Word) => void;
  onWordRemove: (word: Word) => void;
  disabled?: boolean;
  showCorrect?: boolean;
  showIncorrect?: boolean;
}

export const WordBank: React.FC<WordBankProps> = ({
  availableWords,
  selectedWords,
  onWordSelect,
  onWordRemove,
  disabled = false,
  showCorrect = false,
  showIncorrect = false,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showIncorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showIncorrect]);

  useEffect(() => {
    if (showCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [showCorrect]);

  const handleWordPress = (word: Word, isSelected: boolean) => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isSelected) {
      onWordRemove(word);
    } else {
      onWordSelect(word);
    }
  };

  const getAnswerAreaStyle = () => {
    if (showCorrect) {
      return [styles.answerArea, styles.answerAreaCorrect];
    }
    if (showIncorrect) {
      return [styles.answerArea, styles.answerAreaIncorrect];
    }
    return styles.answerArea;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          getAnswerAreaStyle(),
          {
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {selectedWords.length === 0 ? (
          <Text style={styles.placeholder}>Tap words to form your answer</Text>
        ) : (
          <View style={styles.selectedWordsContainer}>
            {selectedWords.map((word, index) => (
              <TouchableOpacity
                key={`${word.id}-${index}`}
                onPress={() => handleWordPress(word, true)}
                disabled={disabled}
                style={styles.selectedWordChip}
              >
                <Text style={styles.selectedWordText}>{word.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      <View style={styles.divider} />

      <View style={styles.availableWordsContainer}>
        {availableWords.map((word) => (
          <TouchableOpacity
            key={word.id}
            onPress={() => handleWordPress(word, false)}
            disabled={disabled}
            style={styles.wordChip}
          >
            <Text style={styles.wordText}>{word.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  answerArea: {
    minHeight: 80,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    padding: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  answerAreaCorrect: {
    backgroundColor: '#14532d',
    borderColor: '#22c55e',
  },
  answerAreaIncorrect: {
    backgroundColor: '#450a0a',
    borderColor: '#ef4444',
  },
  placeholder: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  selectedWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedWordChip: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedWordText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 20,
  },
  availableWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  wordChip: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  wordText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
