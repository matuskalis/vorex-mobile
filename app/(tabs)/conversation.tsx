import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { router, Link } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { apiClient } from '../../src/lib/api-client';
import {
  Mic,
  Square,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  Volume2,
  Zap,
  MessageCircle,
  BookOpen,
  Target,
  ChevronRight,
  Coffee,
  Plane,
  ShoppingCart,
  Utensils,
  Briefcase,
  Phone,
  Award,
  Search,
  Filter,
  Check,
} from 'lucide-react-native';
import { darkTheme, colors, spacing, layout, textStyles } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Practice exercise types
type ExerciseType = 'conversation' | 'vocabulary' | 'pronunciation';

type Exercise = {
  id: string;
  type: ExerciseType;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  color: string;
};

const PRACTICE_EXERCISES: Exercise[] = [
  {
    id: 'coffee_shop',
    type: 'conversation',
    title: 'Coffee Shop Order',
    description: 'Practice ordering drinks and snacks',
    icon: <Coffee size={24} color={colors.primary[400]} strokeWidth={2} />,
    difficulty: 'Easy',
    duration: '5-10 min',
    color: colors.primary[500],
  },
  {
    id: 'restaurant',
    type: 'conversation',
    title: 'Restaurant Reservation',
    description: 'Book a table and order food',
    icon: <Utensils size={24} color={colors.accent[400]} strokeWidth={2} />,
    difficulty: 'Medium',
    duration: '8-12 min',
    color: colors.accent[500],
  },
  {
    id: 'airport',
    type: 'conversation',
    title: 'Airport Check-in',
    description: 'Navigate boarding and luggage',
    icon: <Plane size={24} color={colors.info[400]} strokeWidth={2} />,
    difficulty: 'Medium',
    duration: '10-15 min',
    color: colors.info[500],
  },
  {
    id: 'shopping',
    type: 'conversation',
    title: 'Shopping Assistant',
    description: 'Ask for help, sizes, and prices',
    icon: <ShoppingCart size={24} color={colors.success[400]} strokeWidth={2} />,
    difficulty: 'Easy',
    duration: '5-8 min',
    color: colors.success[500],
  },
  {
    id: 'job_interview',
    type: 'conversation',
    title: 'Job Interview',
    description: 'Practice professional responses',
    icon: <Briefcase size={24} color={colors.warning[400]} strokeWidth={2} />,
    difficulty: 'Hard',
    duration: '15-20 min',
    color: colors.warning[500],
  },
  {
    id: 'phone_call',
    type: 'conversation',
    title: 'Phone Appointment',
    description: 'Schedule meetings over the phone',
    icon: <Phone size={24} color={colors.error[400]} strokeWidth={2} />,
    difficulty: 'Medium',
    duration: '5-10 min',
    color: colors.error[500],
  },
];

type Message = {
  id: number;
  type: 'ai' | 'user';
  text: string;
  timestamp: string;
  mispronounced?: string[];
  audioUri?: string;
};

// Audio waveform visualization component
function AudioWaveform({ isActive, color }: { isActive: boolean; color: string }) {
  const bars = 5;
  const animatedValues = useRef(
    Array(bars).fill(null).map(() => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isActive) {
      const animations = animatedValues.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 200 + i * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 200 + i * 50,
              useNativeDriver: true,
            }),
          ])
        )
      );
      Animated.parallel(animations).start();
    } else {
      animatedValues.forEach(anim => anim.setValue(0.3));
    }
  }, [isActive]);

  return (
    <View style={styles.waveformContainer}>
      {animatedValues.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              backgroundColor: color,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

// Score ring component
function ScoreRing({
  score,
  size = 44,
  strokeWidth = 4,
  color,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={darkTheme.colors.border.default}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[styles.scoreRingValue, { color }]}>{score}</Text>
    </View>
  );
}

// Difficulty filter options
type DifficultyFilter = 'All' | 'Easy' | 'Medium' | 'Hard';
const DIFFICULTY_FILTERS: DifficultyFilter[] = ['All', 'Easy', 'Medium', 'Hard'];

// Get count per difficulty
const getDifficultyCount = (difficulty: DifficultyFilter): number => {
  if (difficulty === 'All') return PRACTICE_EXERCISES.length;
  return PRACTICE_EXERCISES.filter(e => e.difficulty === difficulty).length;
};

export default function ConversationScreen() {
  const [mode, setMode] = useState<'select' | 'active'>('select');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
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

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return PRACTICE_EXERCISES.filter((exercise) => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Difficulty filter
      const matchesDifficulty = difficultyFilter === 'All' || exercise.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [searchQuery, difficultyFilter]);

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
  }, []);

  useEffect(() => {
    if (mode === 'active') {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

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

  const startExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setMessages([
      {
        id: 1,
        type: 'ai',
        text: getInitialMessage(exercise.id),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setSessionTime(0);
    setPronunciationScore(0);
    setFluencyScore(0);
    setMode('active');
  };

  const getInitialMessage = (scenarioId: string): string => {
    const messages: Record<string, string> = {
      coffee_shop: "Hello! Welcome to the coffee shop. What can I get for you today?",
      restaurant: "Good evening! Welcome to La Bella Italia. Do you have a reservation?",
      airport: "Next in line please. May I see your passport and boarding pass?",
      shopping: "Hi there! Welcome to the store. Are you looking for anything in particular?",
      job_interview: "Please, have a seat. Thank you for coming in today. Tell me about yourself.",
      phone_call: "Hello, thank you for calling. How may I help you today?",
    };
    return messages[scenarioId] || "Hello! How can I help you today?";
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
    if (!recording || !selectedExercise) return;

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
            selectedExercise.id,
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

  const saveSessionToBackend = async () => {
    if (!selectedExercise || turnNumber === 0) return;

    try {
      setIsSavingSession(true);
      await apiClient.saveSessionResult({
        session_type: 'conversation',
        scenario_id: selectedExercise.id,
        duration_seconds: sessionTime,
        turn_count: turnNumber,
        pronunciation_score: pronunciationScore,
        fluency_score: fluencyScore,
        average_score: Math.round((pronunciationScore + fluencyScore) / 2),
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsSavingSession(false);
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
          onPress: async () => {
            await saveSessionToBackend();
            setMode('select');
            setSelectedExercise(null);
            setMessages([]);
            setSessionTime(0);
            setTutorSessionId(null);
            setTurnNumber(0);
            setPronunciationScore(0);
            setFluencyScore(0);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return colors.success[500];
      case 'Medium':
        return colors.accent[500];
      case 'Hard':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  // Selection Mode
  if (mode === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.selectHeader}>
          <View>
            <Text style={styles.selectTitle}>Practice</Text>
            <Text style={styles.selectSubtitle}>Choose an exercise to start</Text>
          </View>
          <View style={styles.headerBadge}>
            <Award size={14} color={colors.accent[500]} strokeWidth={2.5} />
            <Text style={styles.headerBadgeText}>6 scenarios</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.neutral[500]} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search scenarios..."
              placeholderTextColor={colors.neutral[500]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.neutral[500]} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Difficulty Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsContainer}
          contentContainerStyle={styles.filterChipsContent}
        >
          {DIFFICULTY_FILTERS.map((difficulty) => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.filterChip,
                difficultyFilter === difficulty && styles.filterChipActive,
              ]}
              onPress={() => setDifficultyFilter(difficulty)}
              activeOpacity={0.7}
            >
              {difficultyFilter === difficulty && (
                <Check size={12} color={colors.neutral[0]} strokeWidth={3} />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  difficultyFilter === difficulty && styles.filterChipTextActive,
                ]}
              >
                {difficulty} ({getDifficultyCount(difficulty)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <Link href="/realtime-conversation" asChild>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[500] + '20' }]}>
                <Zap size={20} color={colors.primary[500]} strokeWidth={2.5} />
              </View>
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Instant Voice</Text>
                <Text style={styles.quickActionDesc}>Ultra-low latency AI</Text>
              </View>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Exercise Cards */}
        <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Conversation Scenarios</Text>
            <Text style={styles.sectionCount}>{filteredExercises.length} found</Text>
          </View>

          {filteredExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Search size={40} color={colors.neutral[600]} strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>No scenarios match your filters</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setDifficultyFilter('All');
                }}
              >
                <Text style={styles.emptyStateAction}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => startExercise(exercise)}
              activeOpacity={0.7}
            >
              <View style={[styles.exerciseIconWrap, { backgroundColor: exercise.color + '15' }]}>
                {exercise.icon}
              </View>

              <View style={styles.exerciseContent}>
                <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                <Text style={styles.exerciseDesc}>{exercise.description}</Text>

                <View style={styles.exerciseMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                    <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(exercise.difficulty) }]} />
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                      {exercise.difficulty}
                    </Text>
                  </View>
                  <View style={styles.durationBadge}>
                    <Clock size={12} color={darkTheme.colors.text.tertiary} strokeWidth={2} />
                    <Text style={styles.durationText}>{exercise.duration}</Text>
                  </View>
                </View>
              </View>

              <ChevronRight size={20} color={darkTheme.colors.text.tertiary} strokeWidth={2} />
            </TouchableOpacity>
          ))}

          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Active Conversation Mode
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.scenarioName}>{selectedExercise?.title}</Text>
          <View style={styles.timeContainer}>
            <Clock size={14} color={colors.primary[400]} strokeWidth={2.5} />
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

      {/* Real-time Feedback Panel */}
      <View style={styles.feedbackPanel}>
        <Pressable
          style={styles.feedbackHeader}
          onPress={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
        >
          <Text style={styles.feedbackTitle}>Real-time Feedback</Text>
          {isFeedbackExpanded ? (
            <ChevronUp size={18} color={darkTheme.colors.text.secondary} strokeWidth={2} />
          ) : (
            <ChevronDown size={18} color={darkTheme.colors.text.secondary} strokeWidth={2} />
          )}
        </Pressable>

        {isFeedbackExpanded && (
          <View style={styles.feedbackContent}>
            <View style={styles.feedbackScores}>
              <View style={styles.feedbackScoreItem}>
                <ScoreRing score={pronunciationScore} color={getScoreColor(pronunciationScore)} />
                <Text style={styles.feedbackScoreLabel}>Pronunciation</Text>
              </View>
              <View style={styles.feedbackScoreItem}>
                <ScoreRing score={fluencyScore} color={getScoreColor(fluencyScore)} />
                <Text style={styles.feedbackScoreLabel}>Fluency</Text>
              </View>
            </View>

            {/* Waveform indicator */}
            {(isRecording || isSpeaking) && (
              <View style={styles.waveformSection}>
                <AudioWaveform
                  isActive={isRecording || isSpeaking}
                  color={isRecording ? colors.error[500] : colors.primary[500]}
                />
                <Text style={styles.waveformLabel}>
                  {isRecording ? 'Listening...' : 'Speaking...'}
                </Text>
              </View>
            )}
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
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.type === 'user' ? styles.userMessageContainer : styles.aiMessageContainer,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.type === 'user' ? styles.userBubble : styles.aiBubble,
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
        ))}
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
            <Pressable onPress={toggleRecording} disabled={isProcessing}>
              <Animated.View
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonRecording,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                {isRecording ? (
                  <Square size={32} color={colors.neutral[50]} fill={colors.neutral[50]} strokeWidth={0} />
                ) : (
                  <Mic size={32} color={colors.neutral[50]} strokeWidth={2} />
                )}
              </Animated.View>
            </Pressable>
            <Text style={styles.micHint}>
              {isRecording ? 'Recording... Tap to stop' : 'Tap to speak'}
            </Text>
            {isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Volume2 size={14} color={colors.primary[500]} strokeWidth={2} />
                <Text style={styles.speakingText}>AI Speaking...</Text>
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
    backgroundColor: darkTheme.colors.background.primary,
  },

  // Selection Mode Styles
  selectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  selectTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.headlineLarge.fontSize,
    fontWeight: textStyles.headlineLarge.fontWeight as any,
  },
  selectSubtitle: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginTop: spacing[1],
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.accent[500] + '15',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: colors.accent[500] + '30',
  },
  headerBadgeText: {
    color: colors.accent[500],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '600',
  },

  // Quick Actions
  quickActionsRow: {
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing[4],
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    flex: 1,
    marginLeft: spacing[3],
  },
  quickActionTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },
  quickActionDesc: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginTop: spacing[0.5],
  },
  newBadge: {
    backgroundColor: colors.accent[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.sm,
  },
  newBadgeText: {
    color: colors.neutral[900],
    fontSize: 10,
    fontWeight: '700',
  },

  // Exercise List
  exerciseList: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing[4],
  },
  sectionLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  exerciseIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  exerciseTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },
  exerciseDesc: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginTop: spacing[0.5],
    marginBottom: spacing[2],
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.sm,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  durationText: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  searchInput: {
    flex: 1,
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    padding: 0,
  },

  // Filter Chips
  filterChipsContainer: {
    marginTop: spacing[3],
  },
  filterChipsContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: layout.radius.full,
    backgroundColor: darkTheme.colors.background.card,
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterChipText: {
    color: darkTheme.colors.text.secondary,
    fontSize: textStyles.caption.fontSize,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.neutral[0],
  },

  // Section Label Row
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionCount: {
    color: colors.primary[400],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyStateText: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.bodyMedium.fontSize,
    textAlign: 'center',
  },
  emptyStateAction: {
    color: colors.primary[400],
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },

  // Active Conversation Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border.default,
  },
  headerLeft: {
    flex: 1,
  },
  scenarioName: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.titleLarge.fontSize,
    fontWeight: textStyles.titleLarge.fontWeight as any,
    marginBottom: spacing[1],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  timeText: {
    color: colors.primary[400],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '600',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  endButtonPressed: {
    backgroundColor: colors.error[500] + '15',
  },
  endButtonText: {
    color: colors.error[500],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '600',
  },

  // Feedback Panel
  feedbackPanel: {
    backgroundColor: darkTheme.colors.background.card,
    marginHorizontal: layout.screenPadding,
    marginVertical: spacing[3],
    borderRadius: layout.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  feedbackTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },
  feedbackContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  feedbackScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feedbackScoreItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
  feedbackScoreLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },
  scoreRingValue: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
  },

  // Waveform
  waveformSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    gap: spacing[3],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 3,
  },
  waveformBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  waveformLabel: {
    color: darkTheme.colors.text.secondary,
    fontSize: textStyles.caption.fontSize,
  },

  // Transcript
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
    backgroundColor: darkTheme.colors.background.elevated,
    borderBottomLeftRadius: spacing[1],
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  loadingText: {
    color: darkTheme.colors.text.secondary,
    fontSize: textStyles.bodySmall.fontSize,
  },
  messageText: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
  },
  mispronounced: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.error[500],
    textDecorationStyle: 'solid',
    color: colors.error[300],
  },
  timestamp: {
    color: darkTheme.colors.text.tertiary,
    fontSize: 10,
    marginTop: spacing[1],
  },

  // Microphone
  micContainer: {
    alignItems: 'center',
    paddingVertical: spacing[5],
    paddingBottom: spacing[8],
    backgroundColor: darkTheme.colors.background.primary,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: colors.error[500],
    shadowColor: colors.error[500],
  },
  micHint: {
    color: darkTheme.colors.text.secondary,
    fontSize: textStyles.bodySmall.fontSize,
    marginTop: spacing[3],
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  speakingText: {
    color: colors.primary[500],
    fontSize: textStyles.caption.fontSize,
  },
  permissionWarning: {
    color: colors.error[500],
    fontSize: textStyles.caption.fontSize,
    marginTop: spacing[2],
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  processingText: {
    color: darkTheme.colors.text.secondary,
    fontSize: textStyles.bodySmall.fontSize,
    marginTop: spacing[3],
  },
  errorContainer: {
    backgroundColor: colors.error[500] + '15',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.lg,
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  errorText: {
    color: colors.error[500],
    fontSize: textStyles.caption.fontSize,
    textAlign: 'center',
  },
});
