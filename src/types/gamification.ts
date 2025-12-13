/**
 * Gamification System Type Definitions
 */

export interface GamificationState {
  currentXP: number;
  totalXP: number;
  level: number;
  xpForNextLevel: number;
  dailyStreak: number;
  todayXP: number;
  dailyGoal: number;
  hearts: number;
  maxHearts: number;
  isLoading: boolean;
}

export interface GamificationActions {
  addXP: (amount: number) => Promise<void>;
  updateStreak: () => Promise<void>;
  loseHeart: () => void;
  resetHearts: () => void;
  setDailyGoal: (goal: number) => Promise<void>;
}

export type GamificationContextType = GamificationState & GamificationActions;

export interface XPGainProps {
  amount: number;
  onComplete?: () => void;
}

export interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export enum DailyGoalOption {
  EASY = 10,
  MEDIUM = 20,
  HARD = 30,
}

export interface LevelConfig {
  level: number;
  xpRequired: number;
  totalXPRequired: number;
}

export interface StorageKeys {
  TOTAL_XP: string;
  CURRENT_XP: string;
  LEVEL: string;
  STREAK: string;
  LAST_ACTIVITY: string;
  TODAY_XP: string;
  DAILY_GOAL: string;
  LAST_XP_RESET: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: number;
  type: 'xp' | 'streak' | 'level' | 'hearts';
}

export interface UserStats {
  totalXPEarned: number;
  currentLevel: number;
  longestStreak: number;
  currentStreak: number;
  lessonsCompleted: number;
  questionsAnswered: number;
  accuracy: number;
}
