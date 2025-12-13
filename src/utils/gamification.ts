/**
 * Gamification Utility Functions
 */

/**
 * Calculate XP required for a specific level
 * Formula: 100 * 1.5^(level - 1)
 */
export const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

/**
 * Calculate total XP required from level 1 to target level
 */
export const calculateTotalXPForLevel = (targetLevel: number): number => {
  let totalXP = 0;
  for (let level = 2; level <= targetLevel; level++) {
    totalXP += calculateXPForLevel(level);
  }
  return totalXP;
};

/**
 * Get level from total XP
 */
export const getLevelFromTotalXP = (totalXP: number): number => {
  let level = 1;
  let xpNeeded = 0;

  while (xpNeeded <= totalXP) {
    level++;
    xpNeeded += calculateXPForLevel(level);
  }

  return level - 1;
};

/**
 * Get current XP for level from total XP
 */
export const getCurrentXPFromTotal = (totalXP: number): number => {
  const level = getLevelFromTotalXP(totalXP);
  const totalXPForPreviousLevels = calculateTotalXPForLevel(level);
  return totalXP - totalXPForPreviousLevels;
};

/**
 * Calculate XP percentage for current level
 */
export const calculateXPPercentage = (currentXP: number, xpForNextLevel: number): number => {
  return Math.min((currentXP / xpForNextLevel) * 100, 100);
};

/**
 * Check if two dates are consecutive days
 */
export const areConsecutiveDays = (date1: Date, date2: Date): boolean => {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get XP reward based on difficulty
 */
export const getXPReward = (difficulty: 'easy' | 'medium' | 'hard' | 'expert'): number => {
  const rewards = {
    easy: 5,
    medium: 10,
    hard: 20,
    expert: 50,
  };
  return rewards[difficulty];
};

/**
 * Get bonus XP for streaks
 */
export const getStreakBonus = (streak: number): number => {
  if (streak >= 30) return 50;
  if (streak >= 14) return 30;
  if (streak >= 7) return 20;
  if (streak >= 3) return 10;
  return 0;
};

/**
 * Format XP number with abbreviations (1000 -> 1k)
 */
export const formatXP = (xp: number): string => {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
};

/**
 * Get level tier name
 */
export const getLevelTier = (level: number): string => {
  if (level >= 50) return 'Grandmaster';
  if (level >= 40) return 'Master';
  if (level >= 30) return 'Expert';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Intermediate';
  return 'Beginner';
};

/**
 * Get level tier color
 */
export const getLevelTierColor = (level: number): string => {
  if (level >= 50) return '#ef4444'; // Red
  if (level >= 40) return '#f97316'; // Orange
  if (level >= 30) return '#fbbf24'; // Gold
  if (level >= 20) return '#6366f1'; // Purple
  if (level >= 10) return '#3b82f6'; // Blue
  return '#9ca3af'; // Gray
};

/**
 * Calculate time until streak reset (midnight)
 */
export const timeUntilStreakReset = (): { hours: number; minutes: number } => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
};

/**
 * Generate level progression table
 */
export const generateLevelTable = (maxLevel: number = 20): Array<{
  level: number;
  xpRequired: number;
  totalXP: number;
}> => {
  const table = [];
  let totalXP = 0;

  for (let level = 1; level <= maxLevel; level++) {
    const xpRequired = calculateXPForLevel(level);
    table.push({
      level,
      xpRequired,
      totalXP,
    });
    totalXP += xpRequired;
  }

  return table;
};

/**
 * Validate XP amount
 */
export const isValidXPAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000 && Number.isInteger(amount);
};

/**
 * Validate daily goal
 */
export const isValidDailyGoal = (goal: number): boolean => {
  const validGoals = [10, 20, 30, 50, 100];
  return validGoals.includes(goal);
};

/**
 * Calculate daily goal progress percentage
 */
export const calculateDailyGoalProgress = (todayXP: number, dailyGoal: number): number => {
  return Math.min((todayXP / dailyGoal) * 100, 100);
};

/**
 * Check if daily goal is completed
 */
export const isDailyGoalCompleted = (todayXP: number, dailyGoal: number): boolean => {
  return todayXP >= dailyGoal;
};

/**
 * Get motivational message based on progress
 */
export const getMotivationalMessage = (percentage: number): string => {
  if (percentage >= 100) return "Goal crushed! You're unstoppable!";
  if (percentage >= 75) return "Almost there! Keep it up!";
  if (percentage >= 50) return "You're halfway there!";
  if (percentage >= 25) return "Great start! Keep going!";
  return "Let's get started!";
};

/**
 * Get streak message
 */
export const getStreakMessage = (streak: number): string => {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Great start! Come back tomorrow!";
  if (streak >= 30) return "Legendary streak! You're on fire!";
  if (streak >= 14) return "Two weeks strong! Amazing!";
  if (streak >= 7) return "One week streak! Keep it going!";
  return `${streak} day streak! Don't break it!`;
};
