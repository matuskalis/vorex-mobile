import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Phrase, getRandomPhrases } from '../data/phrases';
import { apiClient } from '../lib/api-client';

// Types
export interface ProblemWord {
  word: string;
  occurrences: number;
  lastSeen: Date;
}

export interface PracticeAttempt {
  phraseId: string;
  phraseText: string;
  selfRating: 'good' | 'retry';
  attemptCount: number;
  problemWords: string[];
  completedAt: Date;
}

export interface PracticeSession {
  id: string;
  mode: 'general' | 'business';
  startedAt: Date;
  completedAt?: Date;
  attempts: PracticeAttempt[];
}

export interface PracticeState {
  // Current session
  currentSession: PracticeSession | null;
  currentPhrases: Phrase[];
  currentPhraseIndex: number;

  // Settings
  businessModeEnabled: boolean;

  // Problem words tracking
  problemWords: ProblemWord[];

  // History
  sessionHistory: PracticeSession[];

  // Loading state
  isLoading: boolean;
}

// Action Types
type PracticeAction =
  | { type: 'SET_STATE'; payload: Partial<PracticeState> }
  | { type: 'START_SESSION'; payload: { mode: 'general' | 'business'; phrases: Phrase[] } }
  | { type: 'RECORD_ATTEMPT'; payload: { phraseId: string; phraseText: string; selfRating: 'good' | 'retry'; problemWords: string[] } }
  | { type: 'NEXT_PHRASE' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'MARK_PROBLEM_WORD'; payload: string }
  | { type: 'TOGGLE_BUSINESS_MODE' }
  | { type: 'RESET_SESSION' };

// Initial State
const initialState: PracticeState = {
  currentSession: null,
  currentPhrases: [],
  currentPhraseIndex: 0,
  businessModeEnabled: false,
  problemWords: [],
  sessionHistory: [],
  isLoading: true,
};

// Storage key
const STORAGE_KEY = '@practice_state';

// Reducer
function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload, isLoading: false };

    case 'START_SESSION': {
      const newSession: PracticeSession = {
        id: `session_${Date.now()}`,
        mode: action.payload.mode,
        startedAt: new Date(),
        attempts: [],
      };
      return {
        ...state,
        currentSession: newSession,
        currentPhrases: action.payload.phrases,
        currentPhraseIndex: 0,
      };
    }

    case 'RECORD_ATTEMPT': {
      if (!state.currentSession) return state;

      const existingAttempt = state.currentSession.attempts.find(
        a => a.phraseId === action.payload.phraseId
      );

      const attempt: PracticeAttempt = {
        phraseId: action.payload.phraseId,
        phraseText: action.payload.phraseText,
        selfRating: action.payload.selfRating,
        attemptCount: existingAttempt ? existingAttempt.attemptCount + 1 : 1,
        problemWords: action.payload.problemWords,
        completedAt: new Date(),
      };

      const updatedAttempts = existingAttempt
        ? state.currentSession.attempts.map(a =>
            a.phraseId === action.payload.phraseId ? attempt : a
          )
        : [...state.currentSession.attempts, attempt];

      // Update problem words
      const updatedProblemWords = [...state.problemWords];
      action.payload.problemWords.forEach(word => {
        const existing = updatedProblemWords.find(pw => pw.word.toLowerCase() === word.toLowerCase());
        if (existing) {
          existing.occurrences += 1;
          existing.lastSeen = new Date();
        } else {
          updatedProblemWords.push({
            word: word.toLowerCase(),
            occurrences: 1,
            lastSeen: new Date(),
          });
        }
      });

      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          attempts: updatedAttempts,
        },
        problemWords: updatedProblemWords,
      };
    }

    case 'NEXT_PHRASE': {
      // Always increment - isSessionComplete() will handle the completion check
      return {
        ...state,
        currentPhraseIndex: state.currentPhraseIndex + 1,
      };
    }

    case 'COMPLETE_SESSION': {
      if (!state.currentSession) return state;

      const completedSession: PracticeSession = {
        ...state.currentSession,
        completedAt: new Date(),
      };

      return {
        ...state,
        currentSession: null,
        currentPhrases: [],
        currentPhraseIndex: 0,
        sessionHistory: [completedSession, ...state.sessionHistory].slice(0, 50), // Keep last 50
      };
    }

    case 'MARK_PROBLEM_WORD': {
      const word = action.payload.toLowerCase();
      const existing = state.problemWords.find(pw => pw.word === word);

      if (existing) {
        return {
          ...state,
          problemWords: state.problemWords.map(pw =>
            pw.word === word
              ? { ...pw, occurrences: pw.occurrences + 1, lastSeen: new Date() }
              : pw
          ),
        };
      }

      return {
        ...state,
        problemWords: [
          ...state.problemWords,
          { word, occurrences: 1, lastSeen: new Date() },
        ],
      };
    }

    case 'TOGGLE_BUSINESS_MODE':
      return {
        ...state,
        businessModeEnabled: !state.businessModeEnabled,
      };

    case 'RESET_SESSION':
      return {
        ...state,
        currentSession: null,
        currentPhrases: [],
        currentPhraseIndex: 0,
      };

    default:
      return state;
  }
}

// Context
interface PracticeContextValue {
  state: PracticeState;

  // Session actions
  startSession: (phraseCount?: number) => void;
  recordAttempt: (phraseId: string, phraseText: string, selfRating: 'good' | 'retry', problemWords: string[]) => void;
  nextPhrase: () => void;
  completeSession: () => void;
  resetSession: () => void;

  // Settings
  toggleBusinessMode: () => void;

  // Problem words
  markProblemWord: (word: string) => void;
  getTopProblemWords: (count?: number) => ProblemWord[];

  // Helpers
  getCurrentPhrase: () => Phrase | null;
  isSessionComplete: () => boolean;
  getSessionProgress: () => { current: number; total: number };
}

const PracticeContext = createContext<PracticeContextValue | undefined>(undefined);

// Provider
export function PracticeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(practiceReducer, initialState);

  // Load from storage
  useEffect(() => {
    loadState();
  }, []);

  // Save to storage on changes
  useEffect(() => {
    if (!state.isLoading) {
      saveState();
    }
  }, [state.businessModeEnabled, state.problemWords, state.sessionHistory]);

  async function loadState() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({
          type: 'SET_STATE',
          payload: {
            businessModeEnabled: parsed.businessModeEnabled ?? false,
            problemWords: parsed.problemWords ?? [],
            sessionHistory: parsed.sessionHistory ?? [],
          },
        });
      } else {
        dispatch({ type: 'SET_STATE', payload: {} });
      }
    } catch (error) {
      console.error('Failed to load practice state:', error);
      dispatch({ type: 'SET_STATE', payload: {} });
    }
  }

  async function saveState() {
    try {
      const toSave = {
        businessModeEnabled: state.businessModeEnabled,
        problemWords: state.problemWords,
        sessionHistory: state.sessionHistory,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save practice state:', error);
    }
  }

  // Actions
  function startSession(phraseCount: number = 5) {
    const mode = state.businessModeEnabled ? 'business' : 'general';
    const phrases = getRandomPhrases(mode, phraseCount);
    dispatch({ type: 'START_SESSION', payload: { mode, phrases } });
  }

  function recordAttempt(phraseId: string, phraseText: string, selfRating: 'good' | 'retry', problemWords: string[]) {
    // Update local state
    dispatch({ type: 'RECORD_ATTEMPT', payload: { phraseId, phraseText, selfRating, problemWords } });

    // Sync to backend (fire and forget - don't block UI)
    const existingAttempt = state.currentSession?.attempts.find(a => a.phraseId === phraseId);
    apiClient.recordPracticeAttempt({
      phrase_id: phraseId,
      self_rating: selfRating,
      attempt_count: existingAttempt ? existingAttempt.attemptCount + 1 : 1,
      problem_words: problemWords,
    }).catch(err => {
      console.log('Failed to sync practice attempt:', err);
      // Don't throw - tracking is optional
    });
  }

  function nextPhrase() {
    dispatch({ type: 'NEXT_PHRASE' });
  }

  async function completeSession() {
    // Get session stats before completing
    const session = state.currentSession;
    const phrasesCompleted = session?.attempts.length || 0;
    const goodAttempts = session?.attempts.filter(a => a.selfRating === 'good').length || 0;

    // Complete locally first
    dispatch({ type: 'COMPLETE_SESSION' });

    // Calculate XP and study time
    const baseXP = phrasesCompleted * 10;
    const bonusXP = goodAttempts * 5; // 5 bonus XP per "good" rating
    const studyMinutes = Math.max(1, Math.round(phrasesCompleted * 0.5));

    // Sync to backend using Promise.allSettled for better error handling
    const results = await Promise.allSettled([
      // 1. Record activity to update streak
      apiClient.recordActivity(),
      // 2. Award XP
      apiClient.recordXP({
        xp_earned: baseXP,
        bonus_xp: bonusXP,
        source: 'practice_session',
        details: `Completed ${phrasesCompleted} phrases`,
      }),
      // 3. Update daily goal progress
      apiClient.updateGoalProgress({
        study_minutes: studyMinutes,
        drills: phrasesCompleted,
      }),
    ]);

    // Log any failures for debugging
    const apiNames = ['recordActivity', 'recordXP', 'updateGoalProgress'];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`Failed to ${apiNames[index]}:`, result.reason);
      }
    });

    // Count successes for potential future retry queue
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.log(`Session sync: ${results.length - failures.length}/${results.length} API calls succeeded`);
    }
  }

  function resetSession() {
    dispatch({ type: 'RESET_SESSION' });
  }

  function toggleBusinessMode() {
    dispatch({ type: 'TOGGLE_BUSINESS_MODE' });
  }

  function markProblemWord(word: string) {
    dispatch({ type: 'MARK_PROBLEM_WORD', payload: word });
  }

  function getTopProblemWords(count: number = 5): ProblemWord[] {
    return [...state.problemWords]
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, count);
  }

  function getCurrentPhrase(): Phrase | null {
    if (state.currentPhraseIndex >= state.currentPhrases.length) return null;
    return state.currentPhrases[state.currentPhraseIndex];
  }

  function isSessionComplete(): boolean {
    return state.currentPhraseIndex >= state.currentPhrases.length;
  }

  function getSessionProgress(): { current: number; total: number } {
    return {
      current: state.currentPhraseIndex + 1,
      total: state.currentPhrases.length,
    };
  }

  const value: PracticeContextValue = {
    state,
    startSession,
    recordAttempt,
    nextPhrase,
    completeSession,
    resetSession,
    toggleBusinessMode,
    markProblemWord,
    getTopProblemWords,
    getCurrentPhrase,
    isSessionComplete,
    getSessionProgress,
  };

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
}

// Hook
export function usePractice() {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
}
