# Gamification System Integration Guide

## Quick Start

The gamification system has been successfully implemented for Vorex mobile app. Here's how to integrate it into your app.

## Files Created

### Core System
- `/src/context/GamificationContext.tsx` - State management and logic
- `/src/data/achievements.ts` - Achievement definitions and XP system

### UI Components
- `/src/components/XPBar.tsx` - Level and XP progress display
- `/src/components/StreakBadge.tsx` - Streak tracking display
- `/src/components/AchievementToast.tsx` - Achievement unlock notifications
- `/src/components/AchievementsList.tsx` - Browse all achievements

### Screens
- `/src/screens/AchievementsScreen.tsx` - Full achievements view
- `/src/screens/LearnScreen.tsx` - Updated with gamification components

### Documentation
- `/src/context/GAMIFICATION_README.md` - Complete system documentation

## Integration Steps

### Step 1: Wrap App with GamificationProvider

In your `App.tsx` or main app file, wrap your app with the GamificationProvider:

```typescript
import { GamificationProvider } from './src/context/GamificationContext';
import { LearningProvider } from './src/context/LearningContext';

export default function App() {
  return (
    <GamificationProvider>
      <LearningProvider>
        {/* Your app navigation and screens */}
      </LearningProvider>
    </GamificationProvider>
  );
}
```

### Step 2: Add Achievements Screen to Navigation

If you're using React Navigation, add the AchievementsScreen to your navigator:

```typescript
import { AchievementsScreen } from './src/screens/AchievementsScreen';

// In your navigator
<Stack.Screen
  name="Achievements"
  component={AchievementsScreen}
  options={{ title: 'Achievements' }}
/>
```

### Step 3: Track User Actions

Import and use the gamification hook wherever users perform actions:

```typescript
import { useGamification } from './src/context/GamificationContext';

function YourComponent() {
  const { completeLesson, addPracticeTime } = useGamification();

  const handleLessonComplete = () => {
    completeLesson(); // Automatically awards 50 XP
  };

  const handlePracticeEnd = (minutes: number) => {
    addPracticeTime(minutes);
  };
}
```

## Example Integrations

### Lesson Completion

```typescript
// In your lesson screen
const { completeLesson, addPracticeTime } = useGamification();

const finishLesson = () => {
  // Your existing logic
  saveLessonProgress();

  // Add gamification
  completeLesson();
  addPracticeTime(lessonDuration);
};
```

### Conversation/Speaking Practice

```typescript
const { completeConversation, addWordsSpoken, addPracticeTime } = useGamification();

const endConversation = (sessionData) => {
  // Your existing logic
  saveConversationResult(sessionData);

  // Add gamification
  completeConversation();
  addWordsSpoken(sessionData.wordCount);
  addPracticeTime(sessionData.durationMinutes);
};
```

### Pronunciation Scoring

```typescript
const { updatePronunciationScore, addPerfectAnswer } = useGamification();

const handlePronunciationResult = (score) => {
  // Your existing logic
  displayScore(score);

  // Add gamification
  updatePronunciationScore(score);

  if (score >= 95) {
    addPerfectAnswer();
  }
};
```

### Role Play Scenarios

```typescript
const { completeRolePlay } = useGamification();

const finishRolePlay = (scenarioId) => {
  // Your existing logic
  saveRolePlayResult(scenarioId);

  // Add gamification
  completeRolePlay(scenarioId);
};
```

## Display Components

### Home/Dashboard Screen

```typescript
import { XPBar } from './src/components/XPBar';
import { StreakBadge } from './src/components/StreakBadge';

function HomeScreen() {
  return (
    <View>
      {/* XP Progress */}
      <XPBar showXPNumbers={true} />

      {/* Streak Status */}
      <StreakBadge
        showDetails={true}
        onPress={() => navigation.navigate('Achievements')}
      />

      {/* Rest of your content */}
    </View>
  );
}
```

### Header/Top Bar (Compact Version)

```typescript
function AppHeader() {
  return (
    <View style={styles.header}>
      <Text>Vorex</Text>

      {/* Compact XP and Streak */}
      <View style={styles.stats}>
        <XPBar compact={true} />
        <StreakBadge compact={true} />
      </View>
    </View>
  );
}
```

### Achievement Notifications

The LearnScreen already has this integrated, but here's how to add it to any screen:

```typescript
import { AchievementToast } from './src/components/AchievementToast';
import { useGamification } from './src/context/GamificationContext';

function YourScreen() {
  const { state, clearPendingAchievements } = useGamification();
  const [currentToastIndex, setCurrentToastIndex] = useState(0);

  const handleDismissAchievement = () => {
    if (currentToastIndex < state.pendingAchievements.length - 1) {
      setCurrentToastIndex(currentToastIndex + 1);
    } else {
      clearPendingAchievements();
      setCurrentToastIndex(0);
    }
  };

  return (
    <View>
      {/* Achievement Toast Overlay */}
      {state.pendingAchievements.length > 0 && (
        <AchievementToast
          achievement={state.pendingAchievements[currentToastIndex]}
          onDismiss={handleDismissAchievement}
          visible={true}
        />
      )}

      {/* Your screen content */}
    </View>
  );
}
```

## XP Rewards Reference

```typescript
LESSON_COMPLETE: 50 XP
PRONUNCIATION_DRILL: 10 XP
CONVERSATION_START: 25 XP
CONVERSATION_COMPLETE: 100 XP
DAILY_GOAL_MET: 50 XP
PERFECT_ANSWER: 5 XP
STREAK_BONUS: 10 XP per day (e.g., 7-day streak = 70 XP bonus)
```

## Achievement Categories

### Milestones (6 achievements)
- First Conversation (50 XP)
- First Lesson (25 XP)
- Quick Learner - 10 lessons (100 XP)
- Lesson Legend - 50 lessons (500 XP)
- Level 5, 10, 25, 50 (100-5000 XP)

### Streaks (4 achievements)
- 3-Day Streak (50 XP)
- Week Warrior - 7 days (100 XP)
- Monthly Master - 30 days (500 XP)
- Century Club - 100 days (2000 XP)

### Practice (7 achievements)
- Based on words spoken (100, 500, 1000, 5000 words)
- Based on practice time (1h, 10h, 50h)

### Mastery (3 achievements)
- Perfect Pronunciation - 95+ score (200 XP)
- Role Play Master - Complete all scenarios (500 XP)

### Time-based (2 achievements)
- Night Owl - Practice after 10 PM (25 XP)
- Early Bird - Practice before 7 AM (25 XP)

## Testing the System

### Award Test XP

```typescript
const { addXP } = useGamification();

// Add custom XP for testing
addXP(1000, 'test');
```

### Check Current State

```typescript
const { state } = useGamification();

console.log('XP:', state.xp);
console.log('Level:', state.level);
console.log('Streak:', state.streak.currentStreak);
console.log('Achievements:', state.unlockedAchievements.length);
console.log('Stats:', state.stats);
```

### Unlock Specific Achievement

Achievement unlocking is automatic, but you can trigger the conditions:

```typescript
const { completeLesson } = useGamification();

// Complete 10 lessons to unlock "Quick Learner"
for (let i = 0; i < 10; i++) {
  completeLesson();
}
```

### Test Streak System

```typescript
const { addPracticeTime } = useGamification();

// Practice 5+ minutes to activate streak
addPracticeTime(10);

// Streak will update if it's a new day
```

## Customization

### Adjust XP Values

Edit `/src/data/achievements.ts`:

```typescript
export const XP_REWARDS = {
  LESSON_COMPLETE: 50,  // Change this value
  // ... other rewards
};
```

### Add New Achievements

Add to ACHIEVEMENTS array in `/src/data/achievements.ts`:

```typescript
{
  id: 'my_new_achievement',
  title: 'My Achievement',
  description: 'Do something awesome',
  category: 'milestone',
  icon: '🎯',
  xpReward: 100,
  condition: {
    type: 'lessons_completed',
    value: 20,
  },
}
```

### Modify Level Curve

Edit the `calculateLevel` function in `/src/data/achievements.ts`.

Current formula: `Level = floor(sqrt(XP / 100))`

## Troubleshooting

### Issue: Achievements not appearing
**Solution:** Ensure GamificationProvider is wrapping your app and the context is being used correctly.

### Issue: Streak not updating
**Solution:** User must practice minimum 5 minutes. Call `addPracticeTime()` with the practice duration.

### Issue: XP not persisting
**Solution:** Check that AsyncStorage has proper permissions and the GamificationProvider is set up correctly.

### Issue: Level not updating
**Solution:** Levels are calculated automatically from XP. Check that XP is being added correctly.

## Performance Notes

- Data is persisted to AsyncStorage on every state change (debounced by React)
- Achievement checking is only triggered on relevant actions
- All animations use native driver for 60fps performance
- Toast notifications auto-dismiss after 5 seconds

## Next Steps

1. **Add GamificationProvider** to your App.tsx
2. **Integrate tracking** in your lesson and conversation screens
3. **Add UI components** to your home screen
4. **Test thoroughly** with real user flows
5. **Customize** XP values and achievements to match your app's balance

For detailed documentation, see `/src/context/GAMIFICATION_README.md`.
