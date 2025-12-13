# Gamification System Documentation

## Overview

The Vorex gamification system provides XP tracking, daily streaks, and achievements to motivate users and enhance engagement with the language learning app.

## Architecture

### Core Components

1. **GamificationContext** (`/src/context/GamificationContext.tsx`)
   - Central state management for all gamification features
   - Persists data to AsyncStorage
   - Provides hooks for tracking user progress

2. **Achievement System** (`/src/data/achievements.ts`)
   - 25+ predefined achievements
   - Automatic unlock detection
   - XP rewards system

3. **UI Components**
   - `XPBar` - Display user level and XP progress
   - `StreakBadge` - Show current streak status
   - `AchievementToast` - Pop-up notifications for unlocked achievements
   - `AchievementsList` - Browse all achievements

## Features

### XP System

Users earn XP for various actions:

```typescript
XP_REWARDS = {
  LESSON_COMPLETE: 50,
  PRONUNCIATION_DRILL: 10,
  CONVERSATION_START: 25,
  CONVERSATION_COMPLETE: 100,
  DAILY_GOAL_MET: 50,
  PERFECT_ANSWER: 5,
  STREAK_BONUS: 10, // Per day of streak
}
```

**Level Calculation:**
```
Level = floor(sqrt(XP / 100))
```

This creates a balanced progression curve where:
- Level 1: 100 XP
- Level 5: 2,500 XP
- Level 10: 10,000 XP
- Level 25: 62,500 XP
- Level 50: 250,000 XP

### Streak System

**Requirements:**
- Minimum 5 minutes of practice per day to maintain streak
- Tracks consecutive days of practice
- Automatically resets if a day is missed

**Streak Freeze:**
- One freeze available per week
- Auto-applies if you miss exactly one day
- Renews weekly

**Milestone Rewards:**
- 3 days: 50 XP
- 7 days: 100 XP
- 30 days: 500 XP
- 100 days: 2000 XP

### Achievement Categories

1. **Milestone** - First-time accomplishments
   - First Conversation, First Lesson, Level milestones

2. **Streak** - Consecutive day achievements
   - 3, 7, 30, 100 day streaks

3. **Practice** - Volume-based achievements
   - Words spoken, practice time

4. **Mastery** - Skill-based achievements
   - Perfect pronunciation, role play completion

5. **Time** - Time-based achievements
   - Night Owl (practice after 10 PM)
   - Early Bird (practice before 7 AM)

## Usage

### Setup

1. Wrap your app with `GamificationProvider`:

```typescript
import { GamificationProvider } from './src/context/GamificationContext';

function App() {
  return (
    <GamificationProvider>
      {/* Your app content */}
    </GamificationProvider>
  );
}
```

### Using the Hook

```typescript
import { useGamification } from '../context/GamificationContext';

function MyComponent() {
  const {
    state,
    addXP,
    addPracticeTime,
    completeLesson,
    completeConversation,
    addWordsSpoken,
    updatePronunciationScore,
    checkAndUnlockAchievements,
  } = useGamification();

  // Award XP
  const handleActionComplete = () => {
    addXP(50, 'custom_action');
  };

  // Track practice time (in minutes)
  const handlePracticeEnd = () => {
    addPracticeTime(10); // 10 minutes
  };

  // Complete a lesson
  const handleLessonComplete = () => {
    completeLesson(); // Auto-awards XP and checks achievements
  };

  // Add words spoken
  const handleConversationEnd = (wordCount: number) => {
    addWordsSpoken(wordCount);
    completeConversation();
  };

  // Update pronunciation score
  const handlePronunciationScore = (score: number) => {
    updatePronunciationScore(score);
  };
}
```

### Displaying Components

#### XP Bar

```typescript
import { XPBar } from '../components/XPBar';

// Full version with XP numbers
<XPBar showXPNumbers={true} />

// Compact version for headers
<XPBar compact={true} />
```

#### Streak Badge

```typescript
import { StreakBadge } from '../components/StreakBadge';

// Full version with details
<StreakBadge
  showDetails={true}
  onPress={() => navigation.navigate('Achievements')}
/>

// Compact version
<StreakBadge compact={true} />
```

#### Achievement Toast

```typescript
import { AchievementToast } from '../components/AchievementToast';

const [currentToastIndex, setCurrentToastIndex] = useState(0);

const handleDismissAchievement = () => {
  if (currentToastIndex < gamificationState.pendingAchievements.length - 1) {
    setCurrentToastIndex(currentToastIndex + 1);
  } else {
    clearPendingAchievements();
    setCurrentToastIndex(0);
  }
};

// Show pending achievements
{gamificationState.pendingAchievements.length > 0 && (
  <AchievementToast
    achievement={gamificationState.pendingAchievements[currentToastIndex]}
    onDismiss={handleDismissAchievement}
    visible={true}
  />
)}
```

#### Achievements List

```typescript
import { AchievementsList } from '../components/AchievementsList';

// Show all achievements
<AchievementsList />

// Filter by category
<AchievementsList category="streak" />

// Compact view
<AchievementsList compact={true} />
```

## State Structure

```typescript
interface GamificationState {
  xp: number;
  level: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastPracticeDate: string | null;
    freezeAvailable: boolean;
    lastFreezeUsed: string | null;
    todayPracticeMinutes: number;
  };
  unlockedAchievements: Array<{
    achievementId: string;
    unlockedAt: string;
    xpEarned: number;
  }>;
  stats: {
    totalWordsSpoken: number;
    totalPracticeMinutes: number;
    lessonsCompleted: number;
    conversationsCompleted: number;
    rolePlayScenariosCompleted: string[];
    bestPronunciationScore: number;
    perfectAnswers: number;
  };
  pendingAchievements: Achievement[];
}
```

## Achievement Conditions

Each achievement has a condition that determines when it unlocks:

```typescript
interface AchievementCondition {
  type: 'first_conversation' | 'streak' | 'words_spoken' |
        'perfect_pronunciation' | 'practice_time' |
        'role_play_complete' | 'level' | 'lessons_completed' |
        'night_owl' | 'early_bird';
  value?: number; // Required value for numeric conditions
}
```

The system automatically checks and unlocks achievements when relevant actions occur.

## Customization

### Adding New Achievements

1. Add to `ACHIEVEMENTS` array in `/src/data/achievements.ts`:

```typescript
{
  id: 'unique_id',
  title: 'Achievement Title',
  description: 'What the user needs to do',
  category: 'milestone',
  icon: '🎯',
  xpReward: 100,
  condition: {
    type: 'lessons_completed',
    value: 20,
  },
}
```

2. Add condition handling in `checkAndUnlockAchievements()` if needed

### Modifying XP Rewards

Edit `XP_REWARDS` constant in `/src/data/achievements.ts`:

```typescript
export const XP_REWARDS = {
  LESSON_COMPLETE: 50,
  // ... other rewards
  YOUR_NEW_ACTION: 25,
} as const;
```

### Adjusting Level Curve

Modify the `calculateLevel` function in `/src/data/achievements.ts`:

```typescript
export function calculateLevel(xp: number): number {
  // Current: Level = floor(sqrt(XP / 100))
  return Math.floor(Math.sqrt(xp / 100));

  // Example linear: Level = floor(XP / 1000)
  // return Math.floor(xp / 1000);
}
```

## Data Persistence

All gamification data is automatically saved to AsyncStorage:
- Storage key: `@vorex_gamification_data`
- Date key: `@vorex_gamification_last_date`

Data is loaded on app start and saved on every state change.

## Integration Examples

### Lesson Completion

```typescript
const handleLessonComplete = () => {
  const { completeLesson, addPracticeTime } = useGamification();

  // Award lesson XP and increment counter
  completeLesson();

  // Track practice time
  addPracticeTime(lessonDurationMinutes);
};
```

### Conversation Session

```typescript
const handleConversationEnd = (sessionData) => {
  const {
    completeConversation,
    addWordsSpoken,
    addPracticeTime,
    updatePronunciationScore
  } = useGamification();

  completeConversation(); // +100 XP
  addWordsSpoken(sessionData.wordCount);
  addPracticeTime(sessionData.durationMinutes);
  updatePronunciationScore(sessionData.pronunciationScore);
};
```

### Daily Goal

```typescript
const checkDailyGoal = () => {
  const { state, addXP } = useGamification();

  if (state.streak.todayPracticeMinutes >= dailyGoalMinutes) {
    addXP(XP_REWARDS.DAILY_GOAL_MET, 'daily_goal');
  }
};
```

## Best Practices

1. **Call `checkAndUnlockAchievements()` sparingly** - It's automatically called by most action methods
2. **Use specific action methods** - Prefer `completeLesson()` over `addXP()` directly
3. **Track time in minutes** - All time-based functions expect minutes
4. **Clear pending achievements** - Always handle the toast dismissal to clear the queue
5. **Show XP gains** - Use animations to make XP gains visible and rewarding

## Troubleshooting

### Achievements not unlocking
- Ensure `checkAndUnlockAchievements()` is called after relevant actions
- Verify the condition logic in `GamificationContext.tsx`
- Check that stats are being updated correctly

### Streak not updating
- User must practice minimum 5 minutes for streak to count
- Check that `addPracticeTime()` is being called with correct values
- Verify date handling in `checkStreakStatus()`

### XP not saving
- Confirm `GamificationProvider` wraps your app
- Check AsyncStorage permissions
- Look for errors in console related to storage

## Future Enhancements

Potential additions to consider:

1. **Leaderboards** - Compare progress with other users
2. **Badges** - Visual badges for achievement categories
3. **Rewards Shop** - Spend XP on app themes, features
4. **Challenges** - Time-limited special achievements
5. **Social Sharing** - Share achievements on social media
6. **Analytics** - Track engagement metrics
7. **Push Notifications** - Remind users about streaks
8. **Seasonal Events** - Special achievements for holidays
