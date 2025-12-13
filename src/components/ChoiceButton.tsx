import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface ChoiceButtonProps {
  text: string;
  onPress: () => void;
  selected?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  disabled?: boolean;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  text,
  onPress,
  selected = false,
  correct = false,
  incorrect = false,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (incorrect) {
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
  }, [incorrect]);

  useEffect(() => {
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [correct]);

  const handlePress = () => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    if (correct) {
      return styles.correctButton;
    }
    if (incorrect) {
      return styles.incorrectButton;
    }
    if (selected) {
      return styles.selectedButton;
    }
    return styles.defaultButton;
  };

  const getBorderStyle = (): ViewStyle => {
    if (correct) {
      return styles.correctBorder;
    }
    if (incorrect) {
      return styles.incorrectBorder;
    }
    if (selected) {
      return styles.selectedBorder;
    }
    return styles.defaultBorder;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.button,
          getButtonStyle(),
          getBorderStyle(),
          {
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  button: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: '#1a1a1a',
  },
  defaultBorder: {
    borderColor: '#2a2a2a',
  },
  selectedButton: {
    backgroundColor: '#1e1b3d',
  },
  selectedBorder: {
    borderColor: '#6366f1',
  },
  correctButton: {
    backgroundColor: '#14532d',
  },
  correctBorder: {
    borderColor: '#22c55e',
  },
  incorrectButton: {
    backgroundColor: '#450a0a',
  },
  incorrectBorder: {
    borderColor: '#ef4444',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
