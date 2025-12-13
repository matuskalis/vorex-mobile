/**
 * Spaced Repetition System using SM-2 Algorithm
 *
 * The SM-2 algorithm calculates optimal review intervals based on how well
 * you remember a piece of information. It uses three main factors:
 * - Ease Factor: How easy/hard the item is (starts at 2.5)
 * - Interval: Days until next review
 * - Repetitions: Number of successful reviews in a row
 */

export interface VocabItem {
  id: string;
  word: string;
  translation: string;
  example: string;
  phonetic: string;
  easeFactor: number;  // Starts at 2.5, adjusts based on performance
  interval: number;    // Days until next review
  repetitions: number; // Number of consecutive successful reviews
  nextReview: Date;    // When to review next
  lastReview: Date;    // Last review date
  createdAt: Date;     // When word was added
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

// Review quality definitions:
// 0 - Complete blackout (no recall)
// 1 - Incorrect, but recognized after seeing answer
// 2 - Incorrect, but seemed familiar
// 3 - Correct, but required significant effort
// 4 - Correct, after some hesitation
// 5 - Perfect recall

/**
 * Calculate the next review schedule based on SM-2 algorithm
 * @param item - The vocabulary item being reviewed
 * @param quality - Quality of recall (0-5)
 * @returns Updated vocabulary item with new schedule
 */
export function calculateNextReview(
  item: VocabItem,
  quality: ReviewQuality
): VocabItem {
  let { easeFactor, interval, repetitions } = item;

  // If quality < 3, reset repetitions and interval
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // Update repetitions
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    repetitions += 1;
  }

  // Update ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor should never be less than 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...item,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReview: new Date(),
  };
}

/**
 * Create a new vocabulary item
 */
export function createVocabItem(
  word: string,
  translation: string,
  example: string,
  phonetic: string
): VocabItem {
  const now = new Date();

  return {
    id: `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    word,
    translation,
    example,
    phonetic,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: now,
    lastReview: now,
    createdAt: now,
  };
}

/**
 * Get items that are due for review
 */
export function getDueItems(items: VocabItem[]): VocabItem[] {
  const now = new Date();
  return items.filter(item => new Date(item.nextReview) <= now);
}

/**
 * Get items due today
 */
export function getDueToday(items: VocabItem[]): VocabItem[] {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return items.filter(item => {
    const reviewDate = new Date(item.nextReview);
    return reviewDate <= endOfDay;
  });
}

/**
 * Sort items by mastery level (repetitions and ease factor)
 */
export function sortByMastery(items: VocabItem[]): VocabItem[] {
  return [...items].sort((a, b) => {
    // First sort by repetitions
    if (a.repetitions !== b.repetitions) {
      return b.repetitions - a.repetitions;
    }
    // Then by ease factor
    return b.easeFactor - a.easeFactor;
  });
}

/**
 * Get mastery level for display (Beginner, Learning, Familiar, Mastered)
 */
export function getMasteryLevel(item: VocabItem): {
  level: 'new' | 'learning' | 'familiar' | 'mastered';
  label: string;
  color: string;
} {
  if (item.repetitions === 0) {
    return { level: 'new', label: 'New', color: '#737373' };
  } else if (item.repetitions < 3) {
    return { level: 'learning', label: 'Learning', color: '#f59e0b' };
  } else if (item.repetitions < 6) {
    return { level: 'familiar', label: 'Familiar', color: '#3b82f6' };
  } else {
    return { level: 'mastered', label: 'Mastered', color: '#22c55e' };
  }
}

/**
 * Get statistics about vocabulary items
 */
export function getVocabStats(items: VocabItem[]) {
  const dueToday = getDueToday(items);
  const overdue = items.filter(item => new Date(item.nextReview) < new Date());

  const byMastery = {
    new: items.filter(item => item.repetitions === 0).length,
    learning: items.filter(item => item.repetitions > 0 && item.repetitions < 3).length,
    familiar: items.filter(item => item.repetitions >= 3 && item.repetitions < 6).length,
    mastered: items.filter(item => item.repetitions >= 6).length,
  };

  return {
    total: items.length,
    dueToday: dueToday.length,
    overdue: overdue.length,
    byMastery,
  };
}

/**
 * Map button quality to review quality number
 */
export function mapButtonToQuality(button: 'again' | 'hard' | 'good' | 'easy'): ReviewQuality {
  switch (button) {
    case 'again':
      return 1;
    case 'hard':
      return 3;
    case 'good':
      return 4;
    case 'easy':
      return 5;
  }
}

/**
 * Get next review interval text for display
 */
export function getIntervalText(interval: number): string {
  if (interval === 0) {
    return 'New';
  } else if (interval < 1) {
    return 'Less than a day';
  } else if (interval === 1) {
    return '1 day';
  } else if (interval < 7) {
    return `${interval} days`;
  } else if (interval < 30) {
    const weeks = Math.floor(interval / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  } else if (interval < 365) {
    const months = Math.floor(interval / 30);
    return months === 1 ? '1 month' : `${months} months`;
  } else {
    const years = Math.floor(interval / 365);
    return years === 1 ? '1 year' : `${years} years`;
  }
}
