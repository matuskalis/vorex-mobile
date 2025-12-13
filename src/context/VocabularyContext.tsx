import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VocabItem,
  ReviewQuality,
  calculateNextReview,
  createVocabItem,
  getDueItems,
  getDueToday,
  getVocabStats,
} from '../utils/spacedRepetition';

// Types
export interface VocabularyState {
  items: VocabItem[];
  isLoading: boolean;
  dailyReviewsCompleted: number;
  totalReviewsCompleted: number;
  currentStreak: number;
  lastReviewDate: string | null;
}

// Action Types
type VocabularyAction =
  | { type: 'SET_STATE'; payload: Partial<VocabularyState> }
  | { type: 'ADD_WORD'; payload: { word: string; translation: string; example: string; phonetic: string } }
  | { type: 'REVIEW_WORD'; payload: { itemId: string; quality: ReviewQuality } }
  | { type: 'DELETE_WORD'; payload: string }
  | { type: 'RESET_DAILY_REVIEWS' }
  | { type: 'UPDATE_ITEM'; payload: VocabItem };

// Initial State
const initialState: VocabularyState = {
  items: [],
  isLoading: true,
  dailyReviewsCompleted: 0,
  totalReviewsCompleted: 0,
  currentStreak: 0,
  lastReviewDate: null,
};

// Reducer
function vocabularyReducer(
  state: VocabularyState,
  action: VocabularyAction
): VocabularyState {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };

    case 'ADD_WORD': {
      const { word, translation, example, phonetic } = action.payload;
      const newItem = createVocabItem(word, translation, example, phonetic);

      // Check if word already exists
      const existingIndex = state.items.findIndex(
        item => item.word.toLowerCase() === word.toLowerCase()
      );

      if (existingIndex >= 0) {
        // Update existing word
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          translation,
          example,
          phonetic,
        };
        return {
          ...state,
          items: updatedItems,
        };
      }

      // Add new word
      return {
        ...state,
        items: [...state.items, newItem],
      };
    }

    case 'REVIEW_WORD': {
      const { itemId, quality } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) return state;

      const item = state.items[itemIndex];
      const updatedItem = calculateNextReview(item, quality);

      const updatedItems = [...state.items];
      updatedItems[itemIndex] = updatedItem;

      const today = new Date().toDateString();
      const isNewDay = state.lastReviewDate !== today;

      return {
        ...state,
        items: updatedItems,
        dailyReviewsCompleted: isNewDay ? 1 : state.dailyReviewsCompleted + 1,
        totalReviewsCompleted: state.totalReviewsCompleted + 1,
        currentStreak: isNewDay ? state.currentStreak + 1 : state.currentStreak,
        lastReviewDate: today,
      };
    }

    case 'DELETE_WORD': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    }

    case 'RESET_DAILY_REVIEWS':
      return {
        ...state,
        dailyReviewsCompleted: 0,
      };

    case 'UPDATE_ITEM': {
      const itemIndex = state.items.findIndex(item => item.id === action.payload.id);
      if (itemIndex === -1) return state;

      const updatedItems = [...state.items];
      updatedItems[itemIndex] = action.payload;

      return {
        ...state,
        items: updatedItems,
      };
    }

    default:
      return state;
  }
}

// Context
interface VocabularyContextType {
  state: VocabularyState;
  addWord: (word: string, translation: string, example: string, phonetic: string) => void;
  reviewWord: (itemId: string, quality: ReviewQuality) => void;
  deleteWord: (itemId: string) => void;
  getDueWords: () => VocabItem[];
  getDueTodayWords: () => VocabItem[];
  getStats: () => ReturnType<typeof getVocabStats>;
  resetDailyReviews: () => void;
  updateItem: (item: VocabItem) => void;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEY = '@vorex_vocabulary_data';
const LAST_DATE_KEY = '@vorex_vocab_last_date';

// Provider Component
interface VocabularyProviderProps {
  children: ReactNode;
}

export const VocabularyProvider: React.FC<VocabularyProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(vocabularyReducer, initialState);

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

        // Convert date strings back to Date objects
        const items = savedState.items?.map((item: any) => ({
          ...item,
          nextReview: new Date(item.nextReview),
          lastReview: new Date(item.lastReview),
          createdAt: new Date(item.createdAt),
        })) || [];

        dispatch({
          type: 'SET_STATE',
          payload: {
            ...savedState,
            items,
          },
        });
      } else {
        dispatch({ type: 'SET_STATE', payload: {} });
      }
    } catch (error) {
      console.error('Error loading vocabulary data:', error);
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
      console.error('Error saving vocabulary data:', error);
    }
  };

  const checkAndResetDailyStats = async () => {
    try {
      const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
      const today = new Date().toDateString();

      if (lastDate && lastDate !== today) {
        // Check if streak should continue (reviewed yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastDate !== yesterdayStr && state.currentStreak > 0) {
          // Streak broken
          dispatch({
            type: 'SET_STATE',
            payload: {
              currentStreak: 0,
              dailyReviewsCompleted: 0,
            },
          });
        } else {
          // Just reset daily reviews
          dispatch({ type: 'RESET_DAILY_REVIEWS' });
        }
      }
    } catch (error) {
      console.error('Error checking date:', error);
    }
  };

  const addWord = (word: string, translation: string, example: string, phonetic: string) => {
    dispatch({
      type: 'ADD_WORD',
      payload: { word, translation, example, phonetic },
    });
  };

  const reviewWord = (itemId: string, quality: ReviewQuality) => {
    dispatch({
      type: 'REVIEW_WORD',
      payload: { itemId, quality },
    });
  };

  const deleteWord = (itemId: string) => {
    dispatch({ type: 'DELETE_WORD', payload: itemId });
  };

  const getDueWords = () => {
    return getDueItems(state.items);
  };

  const getDueTodayWords = () => {
    return getDueToday(state.items);
  };

  const getStats = () => {
    return getVocabStats(state.items);
  };

  const resetDailyReviews = () => {
    dispatch({ type: 'RESET_DAILY_REVIEWS' });
  };

  const updateItem = (item: VocabItem) => {
    dispatch({ type: 'UPDATE_ITEM', payload: item });
  };

  const value: VocabularyContextType = {
    state,
    addWord,
    reviewWord,
    deleteWord,
    getDueWords,
    getDueTodayWords,
    getStats,
    resetDailyReviews,
    updateItem,
  };

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  );
};

// Custom Hook
export const useVocabulary = (): VocabularyContextType => {
  const context = useContext(VocabularyContext);
  if (context === undefined) {
    throw new Error('useVocabulary must be used within a VocabularyProvider');
  }
  return context;
};
