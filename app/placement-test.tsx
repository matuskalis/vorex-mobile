import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useLearning, type CEFRLevel } from '../src/context/LearningContext';

const PLACEMENT_STEPS = [
  {
    type: 'welcome',
    title: 'Placement Test',
    description: 'We\'ll assess your speaking, vocabulary, and grammar to find the right level for you.',
  },
  {
    type: 'speaking',
    title: 'Speaking Task',
    prompt: 'Introduce yourself in 30 seconds. Tell us your name, where you\'re from, and what you do.',
  },
  {
    type: 'vocabulary',
    title: 'Vocabulary Check',
    question: 'What\'s another word for "happy"?',
    options: ['sad', 'joyful', 'angry', 'tired'],
    correct: 1,
  },
  {
    type: 'grammar',
    title: 'Grammar Check',
    question: 'Choose the correct sentence:',
    options: [
      'She go to work every day.',
      'She goes to work every day.',
      'She going to work every day.',
      'She gone to work every day.',
    ],
    correct: 1,
  },
  {
    type: 'result',
    title: 'Your Level',
  },
];

export default function PlacementTestScreen() {
  // Start at step 1 to skip welcome screen - users go directly into the test
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [assessedLevel, setAssessedLevel] = useState<CEFRLevel>('B1');
  const { completePlacementTest } = useLearning();

  const step = PLACEMENT_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < PLACEMENT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    }
  };

  const handleComplete = () => {
    completePlacementTest(assessedLevel);
    router.replace('/(tabs)');
  };

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      // Simulate processing
      setTimeout(() => handleNext(), 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { flex: (currentStep + 1) / PLACEMENT_STEPS.length },
            ]}
          />
        </View>
        <Text style={styles.stepCount}>
          {currentStep + 1}/{PLACEMENT_STEPS.length}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Welcome */}
        {step.type === 'welcome' && (
          <View style={styles.centerContent}>
            <Text style={styles.icon}>🎯</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Begin Test</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Speaking Task */}
        {step.type === 'speaking' && (
          <View style={styles.centerContent}>
            <Text style={styles.title}>{step.title}</Text>
            <View style={styles.promptCard}>
              <Text style={styles.promptText}>{step.prompt}</Text>
            </View>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonRecording]}
              onPress={handleRecordToggle}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎤'}</Text>
            </TouchableOpacity>
            <Text style={styles.micHint}>
              {isRecording ? 'Tap to stop' : 'Tap to start speaking'}
            </Text>
          </View>
        )}

        {/* Vocabulary / Grammar */}
        {(step.type === 'vocabulary' || step.type === 'grammar') && (
          <View style={styles.quizContent}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.question}>{step.question}</Text>
            <View style={styles.options}>
              {step.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    selectedOption === index && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedOption(index)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedOption === index && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, selectedOption === null && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={selectedOption === null}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Result */}
        {step.type === 'result' && (
          <View style={styles.centerContent}>
            <Text style={styles.icon}>🎉</Text>
            <Text style={styles.title}>{step.title}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{assessedLevel}</Text>
            </View>
            <Text style={styles.levelDescription}>
              {assessedLevel === 'A1' && 'Beginner - You can use simple phrases and expressions.'}
              {assessedLevel === 'A2' && 'Elementary - You can handle simple routine tasks.'}
              {assessedLevel === 'B1' && 'Intermediate - You can deal with most travel situations.'}
              {assessedLevel === 'B2' && 'Upper Intermediate - You can interact with fluency.'}
              {assessedLevel === 'C1' && 'Advanced - You can express yourself fluently.'}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
              <Text style={styles.primaryButtonText}>Start Learning</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    flexDirection: 'row',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  stepCount: {
    color: '#666',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizContent: {
    flex: 1,
    paddingTop: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  promptCard: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    marginBottom: 40,
    width: '100%',
  },
  promptText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  micButtonRecording: {
    backgroundColor: '#ef4444',
  },
  micIcon: {
    fontSize: 40,
  },
  micHint: {
    color: '#666',
    fontSize: 14,
  },
  question: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 32,
  },
  options: {
    gap: 12,
    marginBottom: 40,
  },
  option: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  optionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f120',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#6366f1',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 24,
  },
  levelText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  levelDescription: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
});
