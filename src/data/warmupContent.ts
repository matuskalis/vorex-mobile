/**
 * Warmup Content Data Structure
 * Stores session insights for next-day review
 */

export interface SessionInsight {
  sessionId: string;
  sessionDate: string;
  thingsDoneWell: string[];
  areasToImprove: string[];
  pronunciationWeakPoints: string[];
  keyPhrases: string[];
  quizQuestions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  explanation: string;
}

export interface WarmupContent {
  sessionId: string;
  generatedDate: string;
  phrases: PhraseToReview[];
  pronunciationDrills: PronunciationDrill[];
  quizQuestions: QuizQuestion[];
  motivationalMessage: string;
}

export interface PhraseToReview {
  id: string;
  phrase: string;
  translation?: string;
  context: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PronunciationDrill {
  id: string;
  phoneme: string;
  words: string[];
  description: string;
  tip: string;
}

/**
 * Generate warm-up content from session data
 */
export function generateWarmupFromSession(
  sessionData: {
    thingsDoneWell: string[];
    areasToImprove: string[];
    mispronuncedWords: string[];
    vocabularyLearned: string[];
    scenarioId?: string;
  }
): WarmupContent {
  const sessionId = `session_${Date.now()}`;
  const phrases = generatePhrasesToReview(sessionData);
  const drills = generatePronunciationDrills(sessionData.mispronuncedWords);
  const quiz = generateQuizQuestions(sessionData);
  const motivationalMessage = getMotivationalMessage(sessionData.thingsDoneWell.length);

  return {
    sessionId,
    generatedDate: new Date().toISOString(),
    phrases,
    pronunciationDrills: drills,
    quizQuestions: quiz,
    motivationalMessage,
  };
}

function generatePhrasesToReview(sessionData: any): PhraseToReview[] {
  const phrases: PhraseToReview[] = [];

  // Add vocabulary learned as phrases
  sessionData.vocabularyLearned?.forEach((word: string, index: number) => {
    phrases.push({
      id: `phrase_${index}`,
      phrase: word,
      context: sessionData.scenarioId || 'General conversation',
      difficulty: 'medium',
    });
  });

  // Add some common phrases based on areas to improve
  if (sessionData.areasToImprove.includes('Fluency')) {
    phrases.push({
      id: 'phrase_fluency_1',
      phrase: "Let me think about that for a moment",
      context: 'Use when you need time to formulate a response',
      difficulty: 'easy',
    });
  }

  return phrases.slice(0, 5); // Limit to 5 phrases
}

function generatePronunciationDrills(mispronuncedWords: string[]): PronunciationDrill[] {
  const drills: PronunciationDrill[] = [];

  // Group words by common phonemes
  const phonemeGroups: { [key: string]: string[] } = {};

  mispronuncedWords.forEach(word => {
    const lowerWord = word.toLowerCase();
    // Simple phoneme detection (can be enhanced)
    if (lowerWord.includes('th')) {
      if (!phonemeGroups['/θ/']) phonemeGroups['/θ/'] = [];
      phonemeGroups['/θ/'].push(word);
    }
    if (lowerWord.includes('r')) {
      if (!phonemeGroups['/r/']) phonemeGroups['/r/'] = [];
      phonemeGroups['/r/'].push(word);
    }
  });

  // Create drills from groups
  Object.entries(phonemeGroups).forEach(([phoneme, words], index) => {
    drills.push({
      id: `drill_${index}`,
      phoneme,
      words: words.slice(0, 3),
      description: `Practice the ${phoneme} sound`,
      tip: getTipForPhoneme(phoneme),
    });
  });

  return drills;
}

function getTipForPhoneme(phoneme: string): string {
  const tips: { [key: string]: string } = {
    '/θ/': 'Place your tongue between your teeth and blow air gently',
    '/ð/': 'Same as /θ/, but use your voice while blowing air',
    '/r/': 'Curl your tongue slightly back without touching the roof of your mouth',
    '/l/': 'Touch the tip of your tongue to the ridge behind your upper teeth',
  };
  return tips[phoneme] || 'Focus on clear pronunciation';
}

function generateQuizQuestions(sessionData: any): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Generate questions based on areas to improve
  if (sessionData.areasToImprove.includes('Grammar')) {
    questions.push({
      id: 'quiz_grammar_1',
      question: 'Which is correct?',
      correctAnswer: "I would like a coffee, please",
      incorrectAnswers: [
        "I want coffee, please",
        "I will like a coffee",
      ],
      explanation: 'Using "would like" is more polite in requests',
    });
  }

  if (sessionData.vocabularyLearned?.length > 0) {
    const word = sessionData.vocabularyLearned[0];
    questions.push({
      id: 'quiz_vocab_1',
      question: `What does "${word}" mean in this context?`,
      correctAnswer: `Definition of ${word}`,
      incorrectAnswers: [
        'Alternative meaning 1',
        'Alternative meaning 2',
      ],
      explanation: `${word} is commonly used in this scenario`,
    });
  }

  return questions;
}

function getMotivationalMessage(thingsDoneWellCount: number): string {
  const messages = [
    "Great job yesterday! Let's keep that momentum going!",
    "You're making excellent progress. Ready for today's practice?",
    "Yesterday's session was fantastic! Let's build on that success!",
    "Keep up the amazing work! Your dedication is paying off.",
    "You're on fire! Let's maintain that energy today!",
  ];

  return thingsDoneWellCount >= 3
    ? messages[Math.min(thingsDoneWellCount - 3, messages.length - 1)]
    : messages[0];
}

/**
 * Get sample warmup content for testing
 */
export function getSampleWarmupContent(): WarmupContent {
  return {
    sessionId: 'sample_session_123',
    generatedDate: new Date().toISOString(),
    phrases: [
      {
        id: 'phrase_1',
        phrase: "I'd like to order a latte, please",
        context: 'Coffee shop ordering',
        difficulty: 'easy',
      },
      {
        id: 'phrase_2',
        phrase: 'Can I have that with oat milk?',
        context: 'Customizing an order',
        difficulty: 'medium',
      },
      {
        id: 'phrase_3',
        phrase: 'What would you recommend?',
        context: 'Asking for suggestions',
        difficulty: 'easy',
      },
    ],
    pronunciationDrills: [
      {
        id: 'drill_1',
        phoneme: '/θ/',
        words: ['thought', 'through', 'think'],
        description: 'Practice the unvoiced "th" sound',
        tip: 'Place your tongue between your teeth and blow air gently',
      },
      {
        id: 'drill_2',
        phoneme: '/r/',
        words: ['order', 'recommend', 'regular'],
        description: 'Practice the American /r/ sound',
        tip: 'Curl your tongue slightly back without touching the roof of your mouth',
      },
    ],
    quizQuestions: [
      {
        id: 'quiz_1',
        question: 'Which phrase is most polite when ordering?',
        correctAnswer: "I'd like a coffee, please",
        incorrectAnswers: [
          'Give me a coffee',
          'I want coffee',
        ],
        explanation: 'Using "I\'d like" is more polite and natural in service situations',
      },
      {
        id: 'quiz_2',
        question: 'How do you ask for a recommendation?',
        correctAnswer: 'What would you recommend?',
        incorrectAnswers: [
          'What is good?',
          'Tell me the best one',
        ],
        explanation: '"What would you recommend?" is the most natural and polite way to ask',
      },
    ],
    motivationalMessage: "Great job yesterday! Let's keep that momentum going!",
  };
}
