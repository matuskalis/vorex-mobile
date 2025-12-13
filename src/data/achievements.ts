/**
 * Achievement Definitions for Vorex Gamification System
 */

export type AchievementCategory = 'milestone' | 'streak' | 'practice' | 'mastery' | 'time';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xpReward: number;
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type: 'first_conversation' | 'streak' | 'words_spoken' | 'perfect_pronunciation' |
        'practice_time' | 'role_play_complete' | 'level' | 'lessons_completed' | 'night_owl' | 'early_bird';
  value?: number; // Required value for the condition
}

export const ACHIEVEMENTS: Achievement[] = [
  // First Steps
  {
    id: 'first_conversation',
    title: 'First Conversation',
    description: 'Complete your first conversation',
    category: 'milestone',
    icon: '🎉',
    xpReward: 50,
    condition: {
      type: 'first_conversation',
    },
  },
  {
    id: 'first_lesson',
    title: 'First Lesson',
    description: 'Complete your first lesson',
    category: 'milestone',
    icon: '📚',
    xpReward: 25,
    condition: {
      type: 'lessons_completed',
      value: 1,
    },
  },

  // Streak Achievements
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Practice for 3 consecutive days',
    category: 'streak',
    icon: '🔥',
    xpReward: 50,
    condition: {
      type: 'streak',
      value: 3,
    },
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Practice for 7 consecutive days',
    category: 'streak',
    icon: '⚡',
    xpReward: 100,
    condition: {
      type: 'streak',
      value: 7,
    },
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Practice for 30 consecutive days',
    category: 'streak',
    icon: '💎',
    xpReward: 500,
    condition: {
      type: 'streak',
      value: 30,
    },
  },
  {
    id: 'streak_100',
    title: 'Century Club',
    description: 'Practice for 100 consecutive days',
    category: 'streak',
    icon: '👑',
    xpReward: 2000,
    condition: {
      type: 'streak',
      value: 100,
    },
  },

  // Practice Volume
  {
    id: 'words_100',
    title: 'Chatty Starter',
    description: 'Speak 100 words total',
    category: 'practice',
    icon: '💬',
    xpReward: 50,
    condition: {
      type: 'words_spoken',
      value: 100,
    },
  },
  {
    id: 'words_500',
    title: 'Conversationalist',
    description: 'Speak 500 words total',
    category: 'practice',
    icon: '🗣️',
    xpReward: 150,
    condition: {
      type: 'words_spoken',
      value: 500,
    },
  },
  {
    id: 'words_1000',
    title: 'Word Master',
    description: 'Speak 1,000 words total',
    category: 'practice',
    icon: '🎤',
    xpReward: 300,
    condition: {
      type: 'words_spoken',
      value: 1000,
    },
  },
  {
    id: 'words_5000',
    title: 'Language Expert',
    description: 'Speak 5,000 words total',
    category: 'practice',
    icon: '🌟',
    xpReward: 1000,
    condition: {
      type: 'words_spoken',
      value: 5000,
    },
  },

  // Practice Time
  {
    id: 'practice_1h',
    title: 'First Hour',
    description: 'Practice for 1 hour total',
    category: 'practice',
    icon: '⏰',
    xpReward: 75,
    condition: {
      type: 'practice_time',
      value: 60,
    },
  },
  {
    id: 'practice_10h',
    title: 'Dedicated Learner',
    description: 'Practice for 10 hours total',
    category: 'practice',
    icon: '📖',
    xpReward: 500,
    condition: {
      type: 'practice_time',
      value: 600,
    },
  },
  {
    id: 'practice_50h',
    title: 'Language Enthusiast',
    description: 'Practice for 50 hours total',
    category: 'practice',
    icon: '🎓',
    xpReward: 2000,
    condition: {
      type: 'practice_time',
      value: 3000,
    },
  },

  // Mastery
  {
    id: 'perfect_pronunciation',
    title: 'Perfect Pronunciation',
    description: 'Score 95+ on pronunciation',
    category: 'mastery',
    icon: '🎯',
    xpReward: 200,
    condition: {
      type: 'perfect_pronunciation',
      value: 95,
    },
  },
  {
    id: 'role_play_master',
    title: 'Role Play Master',
    description: 'Complete all role play scenarios',
    category: 'mastery',
    icon: '🎭',
    xpReward: 500,
    condition: {
      type: 'role_play_complete',
    },
  },
  {
    id: 'lessons_10',
    title: 'Quick Learner',
    description: 'Complete 10 lessons',
    category: 'milestone',
    icon: '📝',
    xpReward: 100,
    condition: {
      type: 'lessons_completed',
      value: 10,
    },
  },
  {
    id: 'lessons_50',
    title: 'Lesson Legend',
    description: 'Complete 50 lessons',
    category: 'milestone',
    icon: '🏆',
    xpReward: 500,
    condition: {
      type: 'lessons_completed',
      value: 50,
    },
  },

  // Time-based
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Practice after 10 PM',
    category: 'time',
    icon: '🦉',
    xpReward: 25,
    condition: {
      type: 'night_owl',
    },
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Practice before 7 AM',
    category: 'time',
    icon: '🐦',
    xpReward: 25,
    condition: {
      type: 'early_bird',
    },
  },

  // Level Achievements
  {
    id: 'level_5',
    title: 'Level 5',
    description: 'Reach Level 5',
    category: 'milestone',
    icon: '⭐',
    xpReward: 100,
    condition: {
      type: 'level',
      value: 5,
    },
  },
  {
    id: 'level_10',
    title: 'Level 10',
    description: 'Reach Level 10',
    category: 'milestone',
    icon: '🌟',
    xpReward: 250,
    condition: {
      type: 'level',
      value: 10,
    },
  },
  {
    id: 'level_25',
    title: 'Level 25',
    description: 'Reach Level 25',
    category: 'milestone',
    icon: '💫',
    xpReward: 1000,
    condition: {
      type: 'level',
      value: 25,
    },
  },
  {
    id: 'level_50',
    title: 'Level 50',
    description: 'Reach Level 50',
    category: 'milestone',
    icon: '✨',
    xpReward: 5000,
    condition: {
      type: 'level',
      value: 50,
    },
  },
];

// XP rewards for various actions
export const XP_REWARDS = {
  LESSON_COMPLETE: 50,
  PRONUNCIATION_DRILL: 10,
  CONVERSATION_START: 25,
  CONVERSATION_COMPLETE: 100,
  DAILY_GOAL_MET: 50,
  PERFECT_ANSWER: 5,
  STREAK_BONUS: 10, // Per day of streak
} as const;

// Helper function to calculate level from XP
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

// Helper function to calculate XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  return (currentLevel + 1) ** 2 * 100;
}

// Helper function to get XP progress in current level
export function getLevelProgress(xp: number): { currentLevel: number; currentLevelXP: number; nextLevelXP: number; progress: number } {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = currentLevel ** 2 * 100;
  const nextLevelXP = xpForNextLevel(currentLevel);
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progress = xpInCurrentLevel / xpNeededForLevel;

  return {
    currentLevel,
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForLevel,
    progress,
  };
}
