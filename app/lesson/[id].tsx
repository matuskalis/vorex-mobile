import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProgressBar } from '../../src/components/ProgressBar';
import { QuestionCard } from '../../src/components/QuestionCard';
import { ChoiceButton } from '../../src/components/ChoiceButton';
import { WordBank } from '../../src/components/WordBank';
import { FeedbackModal } from '../../src/components/FeedbackModal';
import * as Haptics from 'expo-haptics';

// Types
interface Word {
  id: string;
  text: string;
}

interface MultipleChoiceQuestion {
  type: 'multiple-choice';
  question: string;
  subtitle?: string;
  imageUrl?: string;
  choices: string[];
  correctAnswer: number;
  explanation?: string;
}

interface WordBankQuestion {
  type: 'word-bank';
  question: string;
  subtitle?: string;
  words: string[];
  correctAnswer: string;
  explanation?: string;
}

type Question = MultipleChoiceQuestion | WordBankQuestion;

interface LessonData {
  id: string;
  title: string;
  questions: Question[];
  xpReward: number;
}

// Mock lesson data - replace with actual API call
// For demo purposes, map curriculum lesson IDs to mock lessons
const LESSON_ID_MAP: Record<string, string> = {
  'basics-1': '1',
  'basics-2': '1',
  'basics-3': '1',
  'greetings-1': '2',
  'greetings-2': '2',
  'greetings-3': '2',
  'food-1': '1',
  'food-2': '2',
  'food-3': '1',
  'food-4': '2',
  'numbers-1': '1',
  'numbers-2': '2',
  'numbers-3': '1',
  'family-1': '2',
  'family-2': '1',
  'family-3': '2',
};

const MOCK_LESSONS: Record<string, LessonData> = {
  '1': {
    id: '1',
    title: 'Introduction to React',
    xpReward: 50,
    questions: [
      {
        type: 'multiple-choice',
        subtitle: 'Choose the correct answer',
        question: 'What is React?',
        choices: [
          'A JavaScript library for building user interfaces',
          'A database management system',
          'A CSS framework',
          'A programming language',
        ],
        correctAnswer: 0,
        explanation: 'React is a JavaScript library developed by Facebook for building user interfaces, particularly for single-page applications.',
      },
      {
        type: 'word-bank',
        subtitle: 'Arrange the words',
        question: 'Complete the sentence about React components',
        words: ['Components', 'are', 'building', 'blocks', 'of', 'React', 'applications'],
        correctAnswer: 'Components are building blocks of React applications',
        explanation: 'In React, components are reusable pieces of code that represent parts of the user interface.',
      },
      {
        type: 'multiple-choice',
        subtitle: 'Select the best answer',
        question: 'Which hook is used for managing state in functional components?',
        choices: [
          'useEffect',
          'useState',
          'useContext',
          'useReducer',
        ],
        correctAnswer: 1,
        explanation: 'useState is the most common hook for adding state to functional components in React.',
      },
      {
        type: 'word-bank',
        subtitle: 'Build the sentence',
        question: 'How do you import React?',
        words: ['import', 'React', 'from', 'react'],
        correctAnswer: 'import React from react',
        explanation: 'This is the standard way to import React into your JavaScript files.',
      },
      {
        type: 'multiple-choice',
        subtitle: 'Test your knowledge',
        question: 'What does JSX stand for?',
        choices: [
          'JavaScript XML',
          'JavaScript Extension',
          'Java Syntax Extension',
          'JavaScript Execute',
        ],
        correctAnswer: 0,
        explanation: 'JSX stands for JavaScript XML. It allows you to write HTML-like code in JavaScript.',
      },
    ],
  },
  '2': {
    id: '2',
    title: 'JavaScript Basics',
    xpReward: 40,
    questions: [
      {
        type: 'multiple-choice',
        subtitle: 'Choose wisely',
        question: 'Which keyword is used to declare a constant?',
        choices: ['var', 'let', 'const', 'static'],
        correctAnswer: 2,
        explanation: 'The const keyword is used to declare constants that cannot be reassigned.',
      },
      {
        type: 'word-bank',
        subtitle: 'Complete the code',
        question: 'Create a function declaration',
        words: ['function', 'myFunction', 'return', 'value'],
        correctAnswer: 'function myFunction return value',
        explanation: 'This demonstrates the basic syntax of a function declaration in JavaScript.',
      },
    ],
  },
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    // Load lesson data
    // Check if it's a curriculum lesson ID that needs mapping
    const mappedId = id && LESSON_ID_MAP[id] ? LESSON_ID_MAP[id] : id;

    if (mappedId && MOCK_LESSONS[mappedId]) {
      setLesson(MOCK_LESSONS[mappedId]);
    }
  }, [id]);

  useEffect(() => {
    // Initialize word bank for word-bank questions
    if (lesson && currentQuestionIndex < lesson.questions.length) {
      const question = lesson.questions[currentQuestionIndex];
      if (question.type === 'word-bank') {
        const shuffledWords = [...question.words]
          .sort(() => Math.random() - 0.5)
          .map((text, index) => ({ id: `word-${index}`, text }));
        setAvailableWords(shuffledWords);
        setSelectedWords([]);
      }
    }
  }, [lesson, currentQuestionIndex]);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = lesson.questions[currentQuestionIndex];
  const totalQuestions = lesson.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleClose = () => {
    Alert.alert(
      'Exit Lesson?',
      'Your progress will be lost if you exit now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const checkAnswer = () => {
    if (hasAnswered) return;

    let correct = false;

    if (currentQuestion.type === 'multiple-choice') {
      correct = selectedChoice === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'word-bank') {
      const answer = selectedWords.map(w => w.text).join(' ');
      correct = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    }

    setIsCorrect(correct);
    setHasAnswered(true);

    if (correct) {
      setScore(score + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      setShowFeedback(true);
    }, 500);
  };

  const handleContinue = () => {
    setShowFeedback(false);

    if (isLastQuestion) {
      // Show completion screen
      setTimeout(() => {
        setShowCompletion(true);
      }, 300);
    } else {
      // Move to next question
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedChoice(null);
        setSelectedWords([]);
        setHasAnswered(false);
        setIsCorrect(false);
      }, 300);
    }
  };

  const handleWordSelect = (word: Word) => {
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter(w => w.id !== word.id));
  };

  const handleWordRemove = (word: Word) => {
    setSelectedWords(selectedWords.filter(w => w.id !== word.id));
    setAvailableWords([...availableWords, word]);
  };

  const canCheckAnswer = () => {
    if (currentQuestion.type === 'multiple-choice') {
      return selectedChoice !== null;
    } else if (currentQuestion.type === 'word-bank') {
      return selectedWords.length > 0;
    }
    return false;
  };

  const getCorrectAnswerText = () => {
    if (currentQuestion.type === 'multiple-choice') {
      return currentQuestion.choices[currentQuestion.correctAnswer];
    } else if (currentQuestion.type === 'word-bank') {
      return currentQuestion.correctAnswer;
    }
    return '';
  };

  if (showCompletion) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const earnedXP = Math.round((score / totalQuestions) * lesson.xpReward);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.completionContainer}>
          <View style={styles.completionContent}>
            <Text style={styles.completionTitle}>Lesson Complete!</Text>
            <Text style={styles.completionEmoji}>🎉</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}/{totalQuestions}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{percentage}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValueXP}>+{earnedXP}</Text>
                <Text style={styles.statLabel}>XP Earned</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.completionButton}
              onPress={() => router.back()}
            >
              <Text style={styles.completionButtonText}>FINISH</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <ProgressBar current={currentQuestionIndex + 1} total={totalQuestions} />
        </View>
        <View style={styles.closeButtonPlaceholder} />
      </View>

      {/* Question Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <QuestionCard
          question={currentQuestion.question}
          subtitle={currentQuestion.subtitle}
          imageUrl={currentQuestion.type === 'multiple-choice' ? currentQuestion.imageUrl : undefined}
        />

        <View style={styles.answerContainer}>
          {currentQuestion.type === 'multiple-choice' && (
            <View style={styles.choicesContainer}>
              {currentQuestion.choices.map((choice, index) => (
                <ChoiceButton
                  key={index}
                  text={choice}
                  onPress={() => !hasAnswered && setSelectedChoice(index)}
                  selected={selectedChoice === index}
                  correct={hasAnswered && isCorrect && selectedChoice === index}
                  incorrect={hasAnswered && !isCorrect && selectedChoice === index}
                  disabled={hasAnswered}
                />
              ))}
            </View>
          )}

          {currentQuestion.type === 'word-bank' && (
            <WordBank
              availableWords={availableWords}
              selectedWords={selectedWords}
              onWordSelect={handleWordSelect}
              onWordRemove={handleWordRemove}
              disabled={hasAnswered}
              showCorrect={hasAnswered && isCorrect}
              showIncorrect={hasAnswered && !isCorrect}
            />
          )}
        </View>
      </ScrollView>

      {/* Check Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.checkButton,
            !canCheckAnswer() && styles.checkButtonDisabled,
          ]}
          onPress={checkAnswer}
          disabled={!canCheckAnswer() || hasAnswered}
        >
          <Text style={styles.checkButtonText}>CHECK</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedback}
        correct={isCorrect}
        correctAnswer={!isCorrect ? getCorrectAnswerText() : undefined}
        explanation={currentQuestion.explanation}
        onContinue={handleContinue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#9ca3af',
    fontSize: 24,
    fontWeight: '600',
  },
  closeButtonPlaceholder: {
    width: 40,
  },
  progressContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  answerContainer: {
    marginTop: 32,
  },
  choicesContainer: {
    gap: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  checkButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  checkButtonDisabled: {
    backgroundColor: '#2a2a2a',
    borderColor: '#1a1a1a',
    opacity: 0.5,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionContent: {
    width: '100%',
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  statValueXP: {
    fontSize: 32,
    fontWeight: '800',
    color: '#22c55e',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  completionButton: {
    width: '100%',
    backgroundColor: '#22c55e',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  completionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
