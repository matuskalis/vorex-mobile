import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS, XP_REWARDS, calculateLevel, Achievement } from '../data/achievements';

// Types
export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  xpEarned: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  freezeAvailable: boolean;
  lastFreezeUsed: string | null;
  todayPracticeMinutes: number;
}

export interface GamificationStats {
  totalWordsSpoken: number;
  totalPracticeMinutes: number;
  lessonsCompleted: number;
  conversationsCompleted: number;
  rolePlayScenariosCompleted: string[];
  bestPronunciationScore: number;
  perfectAnswers: number;
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: StreakData;
  unlockedAchievements: UnlockedAchievement[];
  stats: GamificationStats;
  isLoading: boolean;
  pendingAchievements: Achievement[]; // Achievements earned but not yet shown
}

// Action Types
type GamificationAction =
  | { type: 'SET_STATE'; payload: Partial<GamificationState> }
  | { type: 'ADD_XP'; payload: { amount: number; source: string } }
  | { type: 'UPDATE_STREAK'; payload: number }
  | { type: 'USE_STREAK_FREEZE' }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'CLEAR_PENDING_ACHIEVEMENTS' }
  | { type: 'UPDATE_STATS'; payload: Partial<GamificationStats> }
  | { type: 'ADD_PRACTICE_TIME'; payload: number }
  | { type: 'COMPLETE_LESSON' }
  | { type: 'COMPLETE_CONVERSATION' }
  | { type: 'ADD_WORDS_SPOKEN'; payload: number }
  | { type: 'UPDATE_PRONUNCIATION_SCORE'; payload: number }
  | { type: 'COMPLETE_ROLE_PLAY'; payload: string }
  | { type: 'ADD_PERFECT_ANSWER' };

// Initial State
const initialState: GamificationState = {
  xp: 0,
  level: 0,
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    freezeAvailable: true,
    lastFreezeUsed: null,
    todayPracticeMinutes: 0,
  },
  unlockedAchievements: [],
  stats: {
    totalWordsSpoken: 0,
    totalPracticeMinutes: 0,
    lessonsCompleted: 0,
    conversationsCompleted: 0,
    rolePlayScenariosCompleted: [],
    bestPronunciationScore: 0,
    perfectAnswers: 0,
  },
  isLoading: true,
  pendingAchievements: [],
};

// Reducer
function gamificationReducer(state: GamificationState, action: GamificationAction): GamificationState {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };

    case 'ADD_XP': {
      const newXp = state.xp + action.payload.amount;
      const newLevel = calculateLevel(newXp);
      const leveledUp = newLevel > state.level;

      return {
        ...state,
        xp: newXp,
        level: newLevel,
      };
    }

    case 'UPDATE_STREAK':
      return {
        ...state,
        streak: {
          ...state.streak,
          currentStreak: action.payload,
          longestStreak: Math.max(state.streak.longestStreak, action.payload),
        },
      };

    case 'USE_STREAK_FREEZE': {
      const now = new Date().toISOString();
      return {
        ...state,
        streak: {
          ...state.streak,
          freezeAvailable: false,
          lastFreezeUsed: now,
        },
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const isAlreadyUnlocked = state.unlockedAchievements.some(
        a => a.achievementId === action.payload.id
      );

      if (isAlreadyUnlocked) {
        return state;
      }

      const unlockedAchievement: UnlockedAchievement = {
        achievementId: action.payload.id,
        unlockedAt: new Date().toISOString(),
        xpEarned: action.payload.xpReward,
      };

      return {
        ...state,
        xp: state.xp + action.payload.xpReward,
        level: calculateLevel(state.xp + action.payload.xpReward),
        unlockedAchievements: [...state.unlockedAchievements, unlockedAchievement],
        pendingAchievements: [...state.pendingAchievements, action.payload],
      };
    }

    case 'CLEAR_PENDING_ACHIEVEMENTS':
      return {
        ...state,
        pendingAchievements: [],
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload,
        },
      };

    case 'ADD_PRACTICE_TIME': {
      const newTotal = state.stats.totalPracticeMinutes + action.payload;
      return {
        ...state,
        stats: {
          ...state.stats,
          totalPracticeMinutes: newTotal,
        },
        streak: {
          ...state.streak,
          todayPracticeMinutes: state.streak.todayPracticeMinutes + action.payload,
        },
      };
    }

    case 'COMPLETE_LESSON':
      return {
        ...state,
        stats: {
          ...state.stats,
          lessonsCompleted: state.stats.lessonsCompleted + 1,
        },
      };

    case 'COMPLETE_CONVERSATION':
      return {
        ...state,
        stats: {
          ...state.stats,
          conversationsCompleted: state.stats.conversationsCompleted + 1,
        },
      };

    case 'ADD_WORDS_SPOKEN':
      return {
        ...state,
        stats: {
          ...state.stats,
          totalWordsSpoken: state.stats.totalWordsSpoken + action.payload,
        },
      };

    case 'UPDATE_PRONUNCIATION_SCORE':
      return {
        ...state,
        stats: {
          ...state.stats,
          bestPronunciationScore: Math.max(state.stats.bestPronunciationScore, action.payload),
        },
      };

    case 'COMPLETE_ROLE_PLAY': {
      const scenarioId = action.payload;
      if (state.stats.rolePlayScenariosCompleted.includes(scenarioId)) {
        return state;
      }
      return {
        ...state,
        stats: {
          ...state.stats,
          rolePlayScenariosCompleted: [...state.stats.rolePlayScenariosCompleted, scenarioId],
        },
      };
    }

    case 'ADD_PERFECT_ANSWER':
      return {
        ...state,
        stats: {
          ...state.stats,
          perfectAnswers: state.stats.perfectAnswers + 1,
        },
      };

    default:
      return state;
  }
}

// Context
interface GamificationContextType {
  state: GamificationState;
  addXP: (amount: number, source: string) => void;
  updateStreak: () => void;
  useStreakFreeze: () => void;
  checkAndUnlockAchievements: () => void;
  clearPendingAchievements: () => void;
  addPracticeTime: (minutes: number) => void;
  completeLesson: () => void;
  completeConversation: () => void;
  addWordsSpoken: (count: number) => void;
  updatePronunciationScore: (score: number) => void;
  completeRolePlay: (scenarioId: string) => void;
  addPerfectAnswer: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEY = '@vorex_gamification_data';
const LAST_DATE_KEY = '@vorex_gamification_last_date';

// Provider Component
interface GamificationProviderProps {
  children: ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gamificationReducer, initialState);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage whenever state changes
  useEffect(() => {
    if (!state.isLoading) {
      saveData();
    }
  }, [state]);

  // Check streak on mount and daily
  useEffect(() => {
    checkStreakStatus();
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
      console.error('Error loading gamification data:', error);
      dispatch({ type: 'SET_STATE', payload: {} });
    }
  };

  const saveData = async () => {
    try {
      const { isLoading, pendingAchievements, ...dataToSave } = state;
      const jsonValue = JSON.stringify(dataToSave);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);

      const today = new Date().toDateString();
      await AsyncStorage.setItem(LAST_DATE_KEY, today);
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  };

  const checkStreakStatus = async () => {
    try {
      const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
      const today = new Date();
      const todayStr = today.toDateString();

      if (!lastDate) {
        // First time user
        return;
      }

      const lastPracticeDate = new Date(lastDate);
      const daysDifference = Math.floor(
        (today.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference > 1) {
        // Streak broken - check if freeze is available
        if (state.streak.freezeAvailable && daysDifference === 2) {
          // Auto-use freeze if available and only missed one day
          dispatch({ type: 'USE_STREAK_FREEZE' });
        } else {
          // Reset streak
          dispatch({ type: 'UPDATE_STREAK', payload: 0 });
          dispatch({
            type: 'SET_STATE',
            payload: {
              streak: {
                ...state.streak,
                currentStreak: 0,
                todayPracticeMinutes: 0,
              },
            },
          });
        }
      } else if (daysDifference === 1) {
        // Reset today's practice minutes for new day
        dispatch({
          type: 'SET_STATE',
          payload: {
            streak: {
              ...state.streak,
              todayPracticeMinutes: 0,
            },
          },
        });
      }

      // Check if freeze should be renewed (weekly)
      if (state.streak.lastFreezeUsed) {
        const lastFreezeDate = new Date(state.streak.lastFreezeUsed);
        const weeksSinceFreeze = Math.floor(
          (today.getTime() - lastFreezeDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        if (weeksSinceFreeze >= 1) {
          dispatch({
            type: 'SET_STATE',
            payload: {
              streak: {
                ...state.streak,
                freezeAvailable: true,
              },
            },
          });
        }
      }
    } catch (error) {
      console.error('Error checking streak status:', error);
    }
  };

  const addXP = (amount: number, source: string) => {
    dispatch({ type: 'ADD_XP', payload: { amount, source } });
  };

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    const lastPractice = state.streak.lastPracticeDate;

    // Need minimum 5 minutes to count
    if (state.streak.todayPracticeMinutes < 5) {
      return;
    }

    // Already practiced today
    if (lastPractice === today) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = 1;
    if (lastPractice === yesterdayStr) {
      // Continuing streak
      newStreak = state.streak.currentStreak + 1;
    }

    dispatch({ type: 'UPDATE_STREAK', payload: newStreak });
    dispatch({
      type: 'SET_STATE',
      payload: {
        streak: {
          ...state.streak,
          lastPracticeDate: today,
        },
      },
    });

    // Award streak bonus XP
    addXP(XP_REWARDS.STREAK_BONUS * newStreak, 'streak_bonus');

    // Check for streak achievements
    checkAndUnlockAchievements();
  }, [state.streak]);

  const useStreakFreeze = () => {
    if (state.streak.freezeAvailable) {
      dispatch({ type: 'USE_STREAK_FREEZE' });
    }
  };

  const checkAndUnlockAchievements = useCallback(() => {
    ACHIEVEMENTS.forEach(achievement => {
      // Skip if already unlocked
      const isUnlocked = state.unlockedAchievements.some(
        a => a.achievementId === achievement.id
      );
      if (isUnlocked) return;

      let shouldUnlock = false;

      switch (achievement.condition.type) {
        case 'first_conversation':
          shouldUnlock = state.stats.conversationsCompleted >= 1;
          break;

        case 'streak':
          shouldUnlock = state.streak.currentStreak >= (achievement.condition.value || 0);
          break;

        case 'words_spoken':
          shouldUnlock = state.stats.totalWordsSpoken >= (achievement.condition.value || 0);
          break;

        case 'perfect_pronunciation':
          shouldUnlock = state.stats.bestPronunciationScore >= (achievement.condition.value || 0);
          break;

        case 'practice_time':
          shouldUnlock = state.stats.totalPracticeMinutes >= (achievement.condition.value || 0);
          break;

        case 'role_play_complete':
          // This would need to be updated with actual number of scenarios
          shouldUnlock = state.stats.rolePlayScenariosCompleted.length >= 10;
          break;

        case 'level':
          shouldUnlock = state.level >= (achievement.condition.value || 0);
          break;

        case 'lessons_completed':
          shouldUnlock = state.stats.lessonsCompleted >= (achievement.condition.value || 0);
          break;

        case 'night_owl': {
          const hour = new Date().getHours();
          shouldUnlock = hour >= 22 && state.streak.todayPracticeMinutes > 0;
          break;
        }

        case 'early_bird': {
          const hour = new Date().getHours();
          shouldUnlock = hour < 7 && state.streak.todayPracticeMinutes > 0;
          break;
        }
      }

      if (shouldUnlock) {
        dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: achievement });
      }
    });
  }, [state]);

  const clearPendingAchievements = () => {
    dispatch({ type: 'CLEAR_PENDING_ACHIEVEMENTS' });
  };

  const addPracticeTime = (minutes: number) => {
    dispatch({ type: 'ADD_PRACTICE_TIME', payload: minutes });

    // Check if we should update streak
    if (state.streak.todayPracticeMinutes + minutes >= 5) {
      updateStreak();
    }

    checkAndUnlockAchievements();
  };

  const completeLesson = () => {
    dispatch({ type: 'COMPLETE_LESSON' });
    addXP(XP_REWARDS.LESSON_COMPLETE, 'lesson_complete');
    checkAndUnlockAchievements();
  };

  const completeConversation = () => {
    dispatch({ type: 'COMPLETE_CONVERSATION' });
    addXP(XP_REWARDS.CONVERSATION_COMPLETE, 'conversation_complete');
    checkAndUnlockAchievements();
  };

  const addWordsSpoken = (count: number) => {
    dispatch({ type: 'ADD_WORDS_SPOKEN', payload: count });
    checkAndUnlockAchievements();
  };

  const updatePronunciationScore = (score: number) => {
    dispatch({ type: 'UPDATE_PRONUNCIATION_SCORE', payload: score });
    checkAndUnlockAchievements();
  };

  const completeRolePlay = (scenarioId: string) => {
    dispatch({ type: 'COMPLETE_ROLE_PLAY', payload: scenarioId });
    checkAndUnlockAchievements();
  };

  const addPerfectAnswer = () => {
    dispatch({ type: 'ADD_PERFECT_ANSWER' });
    addXP(XP_REWARDS.PERFECT_ANSWER, 'perfect_answer');
  };

  const value: GamificationContextType = {
    state,
    addXP,
    updateStreak,
    useStreakFreeze,
    checkAndUnlockAchievements,
    clearPendingAchievements,
    addPracticeTime,
    completeLesson,
    completeConversation,
    addWordsSpoken,
    updatePronunciationScore,
    completeRolePlay,
    addPerfectAnswer,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

// Custom Hook
export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
