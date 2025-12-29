import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface WeeklyStats {
  speakingMinutes: number;
  fluencyScore: number;
  pronunciationScore: number;
  grammarScore: number;
}

export interface TodayStats {
  speakingMinutes: number;
  lessonsCompleted: number;
}

export interface PerformanceHistory {
  pronunciationHistory: number[];
  fluencyHistory: number[];
  grammarHistory: number[];
  responseTimeHistory: number[];
}

export interface SessionResult {
  sessionId: string;
  date: string;
  speakingMinutes: number;
  wordsSpoken: number;
  pronunciationScore: number | null;
  fluencyScore: number | null;
  thingsDoneWell: string[];
  areasToImprove: string[];
  vocabularyLearned: string[];
  mispronuncedWords: string[];
  scenarioId?: string;
}

export interface LearningState {
  cefrLevel: CEFRLevel | null;
  hasCompletedPlacement: boolean;
  weeklyStats: WeeklyStats;
  todayStats: TodayStats;
  currentScenario: string | null;
  dailyGoalMinutes: number;
  isLoading: boolean;
  difficultyLevel: number;
  performanceHistory: PerformanceHistory;
  lastSessionResult: SessionResult | null;
  hasWarmupAvailable: boolean;
  sessionHistory: SessionResult[];
}

// Action Types
type LearningAction =
  | { type: 'SET_STATE'; payload: Partial<LearningState> }
  | { type: 'UPDATE_LEVEL'; payload: CEFRLevel }
  | { type: 'COMPLETE_PLACEMENT'; payload: CEFRLevel }
  | { type: 'ADD_SPEAKING_TIME'; payload: number }
  | { type: 'UPDATE_SCORES'; payload: { fluency?: number; pronunciation?: number; grammar?: number } }
  | { type: 'SET_CURRENT_SCENARIO'; payload: string | null }
  | { type: 'SET_DAILY_GOAL'; payload: number }
  | { type: 'RESET_TODAY_STATS' }
  | { type: 'RECORD_PERFORMANCE'; payload: { pronunciation?: number; fluency?: number; grammar?: number; responseTime?: number } }
  | { type: 'ADJUST_DIFFICULTY'; payload: number }
  | { type: 'SAVE_SESSION_RESULT'; payload: SessionResult }
  | { type: 'CLEAR_WARMUP' };

// Initial State
const initialState: LearningState = {
  cefrLevel: null,
  hasCompletedPlacement: false,
  weeklyStats: {
    speakingMinutes: 0,
    fluencyScore: 0,
    pronunciationScore: 0,
    grammarScore: 0,
  },
  todayStats: {
    speakingMinutes: 0,
    lessonsCompleted: 0,
  },
  currentScenario: null,
  dailyGoalMinutes: 15,
  isLoading: true,
  difficultyLevel: 5,
  performanceHistory: {
    pronunciationHistory: [],
    fluencyHistory: [],
    grammarHistory: [],
    responseTimeHistory: [],
  },
  lastSessionResult: null,
  hasWarmupAvailable: false,
  sessionHistory: [],
};

// Reducer
function learningReducer(state: LearningState, action: LearningAction): LearningState {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };

    case 'UPDATE_LEVEL':
      return {
        ...state,
        cefrLevel: action.payload,
      };

    case 'COMPLETE_PLACEMENT':
      return {
        ...state,
        cefrLevel: action.payload,
        hasCompletedPlacement: true,
      };

    case 'ADD_SPEAKING_TIME':
      return {
        ...state,
        todayStats: {
          ...state.todayStats,
          speakingMinutes: state.todayStats.speakingMinutes + action.payload,
        },
        weeklyStats: {
          ...state.weeklyStats,
          speakingMinutes: state.weeklyStats.speakingMinutes + action.payload,
        },
      };

    case 'UPDATE_SCORES': {
      const { fluency, pronunciation, grammar } = action.payload;
      return {
        ...state,
        weeklyStats: {
          ...state.weeklyStats,
          ...(fluency !== undefined && { fluencyScore: fluency }),
          ...(pronunciation !== undefined && { pronunciationScore: pronunciation }),
          ...(grammar !== undefined && { grammarScore: grammar }),
        },
      };
    }

    case 'SET_CURRENT_SCENARIO':
      return {
        ...state,
        currentScenario: action.payload,
      };

    case 'SET_DAILY_GOAL':
      return {
        ...state,
        dailyGoalMinutes: action.payload,
      };

    case 'RESET_TODAY_STATS':
      return {
        ...state,
        todayStats: {
          speakingMinutes: 0,
          lessonsCompleted: 0,
        },
      };

    case 'RECORD_PERFORMANCE': {
      const { pronunciation, fluency, grammar, responseTime } = action.payload;
      const maxHistoryLength = 10;

      const updateHistory = (history: number[], newValue?: number): number[] => {
        if (newValue === undefined) return history;
        const updated = [...history, newValue];
        return updated.slice(-maxHistoryLength);
      };

      return {
        ...state,
        performanceHistory: {
          pronunciationHistory: updateHistory(state.performanceHistory.pronunciationHistory, pronunciation),
          fluencyHistory: updateHistory(state.performanceHistory.fluencyHistory, fluency),
          grammarHistory: updateHistory(state.performanceHistory.grammarHistory, grammar),
          responseTimeHistory: updateHistory(state.performanceHistory.responseTimeHistory, responseTime),
        },
      };
    }

    case 'ADJUST_DIFFICULTY':
      return {
        ...state,
        difficultyLevel: Math.max(1, Math.min(10, action.payload)),
      };

    case 'SAVE_SESSION_RESULT': {
      const maxHistoryLength = 30;
      const updatedHistory = [...state.sessionHistory, action.payload].slice(-maxHistoryLength);

      return {
        ...state,
        lastSessionResult: action.payload,
        hasWarmupAvailable: true,
        sessionHistory: updatedHistory,
      };
    }

    case 'CLEAR_WARMUP':
      return {
        ...state,
        hasWarmupAvailable: false,
      };

    default:
      return state;
  }
}

// Context
interface LearningContextType {
  state: LearningState;
  updateLevel: (level: CEFRLevel) => void;
  completePlacementTest: (level: CEFRLevel) => void;
  addSpeakingTime: (minutes: number) => void;
  updateScores: (scores: { fluency?: number; pronunciation?: number; grammar?: number }) => void;
  setCurrentScenario: (scenario: string | null) => void;
  setDailyGoal: (minutes: number) => void;
  resetTodayStats: () => void;
  recordPerformance: (performance: { pronunciation?: number; fluency?: number; grammar?: number; responseTime?: number }) => void;
  adjustDifficulty: (level: number) => void;
  saveSessionResult: (session: SessionResult) => void;
  clearWarmup: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEY = '@vorex_learning_data';
const LAST_DATE_KEY = '@vorex_last_date';

// Provider Component
interface LearningProviderProps {
  children: ReactNode;
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(learningReducer, initialState);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage whenever state changes (except loading state)
  useEffect(() => {
    if (!state.isLoading) {
      saveData();
    }
  }, [state]);

  // Check if we need to reset daily stats
  useEffect(() => {
    checkAndResetDailyStats();
  }, []);

  const loadData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        const savedState = JSON.parse(jsonValue);
        dispatch({ type: 'SET_STATE', payload: savedState });
      } else {
        dispatch({ type: 'SET_STATE', payload: {} });
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
      dispatch({ type: 'SET_STATE', payload: {} });
    }
  };

  const saveData = async () => {
    try {
      const { isLoading, ...dataToSave } = state;
      const jsonValue = JSON.stringify(dataToSave);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);

      // Save current date
      const today = new Date().toDateString();
      await AsyncStorage.setItem(LAST_DATE_KEY, today);
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  };

  const checkAndResetDailyStats = async () => {
    try {
      const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
      const today = new Date().toDateString();

      if (lastDate && lastDate !== today) {
        // It's a new day, reset today's stats
        dispatch({ type: 'RESET_TODAY_STATS' });
      }
    } catch (error) {
      console.error('Error checking date:', error);
    }
  };

  const updateLevel = (level: CEFRLevel) => {
    dispatch({ type: 'UPDATE_LEVEL', payload: level });
  };

  const completePlacementTest = (level: CEFRLevel) => {
    dispatch({ type: 'COMPLETE_PLACEMENT', payload: level });
  };

  const addSpeakingTime = (minutes: number) => {
    dispatch({ type: 'ADD_SPEAKING_TIME', payload: minutes });
  };

  const updateScores = (scores: { fluency?: number; pronunciation?: number; grammar?: number }) => {
    dispatch({ type: 'UPDATE_SCORES', payload: scores });
  };

  const setCurrentScenario = (scenario: string | null) => {
    dispatch({ type: 'SET_CURRENT_SCENARIO', payload: scenario });
  };

  const setDailyGoal = (minutes: number) => {
    dispatch({ type: 'SET_DAILY_GOAL', payload: minutes });
  };

  const resetTodayStats = () => {
    dispatch({ type: 'RESET_TODAY_STATS' });
  };

  const recordPerformance = (performance: { pronunciation?: number; fluency?: number; grammar?: number; responseTime?: number }) => {
    dispatch({ type: 'RECORD_PERFORMANCE', payload: performance });
  };

  const adjustDifficulty = (level: number) => {
    dispatch({ type: 'ADJUST_DIFFICULTY', payload: level });
  };

  const saveSessionResult = (session: SessionResult) => {
    dispatch({ type: 'SAVE_SESSION_RESULT', payload: session });
  };

  const clearWarmup = () => {
    dispatch({ type: 'CLEAR_WARMUP' });
  };

  const value: LearningContextType = {
    state,
    updateLevel,
    completePlacementTest,
    addSpeakingTime,
    updateScores,
    setCurrentScenario,
    setDailyGoal,
    resetTodayStats,
    recordPerformance,
    adjustDifficulty,
    saveSessionResult,
    clearWarmup,
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
};

// Custom Hook
export const useLearning = (): LearningContextType => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

// Theme Colors Export (for consistency across the app)
export const THEME = {
  background: '#0a0a0a',
  card: '#1a1a1a',
  accent: '#6366f1',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};
