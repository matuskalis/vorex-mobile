# Gamification System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your React Native App                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ wraps
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GamificationProvider                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Gamification State                        │ │
│  │  • XP & Level                                              │ │
│  │  • Streak Data                                             │ │
│  │  • Unlocked Achievements                                   │ │
│  │  • Statistics                                              │ │
│  │  • Pending Achievement Notifications                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Core Functions                           │ │
│  │  • addXP(amount, source)                                   │ │
│  │  • completeLesson()                                        │ │
│  │  • completeConversation()                                  │ │
│  │  • addPracticeTime(minutes)                                │ │
│  │  • updateStreak()                                          │ │
│  │  • checkAndUnlockAchievements()                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  AsyncStorage Persistence                   │ │
│  │  • Auto-save on state changes                              │ │
│  │  • Auto-load on app start                                  │ │
│  │  • Daily date tracking                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                    │
                    │                    │
        ┌───────────┴──────────┬─────────┴──────────┐
        │                      │                     │
        ▼                      ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│  UI          │      │  Tracking    │     │ Achievement  │
│  Components  │      │  in Screens  │     │  System      │
└──────────────┘      └──────────────┘     └──────────────┘
```

## Data Flow

### 1. User Action Flow

```
User Action (e.g., completes lesson)
    │
    ▼
Screen calls: completeLesson()
    │
    ▼
GamificationContext:
  - Increments lessonsCompleted stat
  - Awards 50 XP
  - Calls checkAndUnlockAchievements()
    │
    ▼
Achievement Check:
  - Loops through all achievements
  - Checks if conditions are met
  - Unlocks matching achievements
  - Adds to pendingAchievements queue
    │
    ▼
State Update:
  - XP increased
  - Level recalculated
  - Stats updated
  - Achievements unlocked
    │
    ▼
AsyncStorage:
  - State saved to persistent storage
    │
    ▼
UI Updates:
  - XPBar shows new progress
  - AchievementToast appears (if achievements unlocked)
  - StreakBadge updates (if applicable)
```

### 2. Streak Update Flow

```
User practices (addPracticeTime called with minutes)
    │
    ▼
Practice time added to todayPracticeMinutes
    │
    ▼
Check: todayPracticeMinutes >= 5?
    │
    ├─── No ──► No streak update
    │
    └─── Yes ──► updateStreak() called
                     │
                     ▼
                 Check last practice date
                     │
                     ├─── Same day ──► No change
                     │
                     ├─── Yesterday ──► Increment streak
                     │                    Award bonus XP
                     │
                     └─── 2+ days ago ──► Check freeze available
                                              │
                                              ├─── Yes ──► Use freeze
                                              │              Keep streak
                                              │
                                              └─── No ───► Reset streak to 0
```

### 3. Achievement Unlock Flow

```
checkAndUnlockAchievements() called
    │
    ▼
For each achievement:
    │
    ▼
Already unlocked?
    │
    ├─── Yes ──► Skip
    │
    └─── No ──► Check condition
                    │
                    ▼
                Condition met?
                    │
                    ├─── No ──► Skip
                    │
                    └─── Yes ──► Unlock Achievement
                                     │
                                     ▼
                                 • Add to unlockedAchievements
                                 • Add to pendingAchievements (for toast)
                                 • Award XP reward
                                     │
                                     ▼
                                 Update state & save
```

## Component Architecture

### Core Components Hierarchy

```
App
 └─ GamificationProvider
     ├─ LearnScreen (or any screen)
     │   ├─ XPBar
     │   │   └─ Shows level & XP progress
     │   │
     │   ├─ StreakBadge
     │   │   └─ Shows current streak
     │   │
     │   └─ AchievementToast
     │       └─ Pops up for new achievements
     │
     └─ AchievementsScreen
         └─ AchievementsList
             └─ Shows all achievements
```

### Component Responsibilities

#### GamificationContext
- **State Management**: Central source of truth
- **Business Logic**: XP calculation, streak tracking, achievement checking
- **Persistence**: AsyncStorage integration
- **Hook Provider**: useGamification hook

#### XPBar
- **Display**: Current level and XP progress
- **Visualization**: Animated progress bar
- **Variants**: Full and compact modes

#### StreakBadge
- **Display**: Current streak count
- **Information**: Practice minutes, freeze status
- **Interaction**: Clickable to view details

#### AchievementToast
- **Notification**: Pop-up for new achievements
- **Animation**: Smooth entrance/exit
- **Auto-dismiss**: 5-second timer

#### AchievementsList
- **Browse**: All achievements
- **Filter**: By category
- **Status**: Locked/unlocked visualization

## State Management

### State Structure

```typescript
GamificationState {
  xp: number
  level: number (calculated from XP)

  streak: {
    currentStreak: number
    longestStreak: number
    lastPracticeDate: string | null
    freezeAvailable: boolean
    lastFreezeUsed: string | null
    todayPracticeMinutes: number
  }

  unlockedAchievements: [
    {
      achievementId: string
      unlockedAt: string (ISO date)
      xpEarned: number
    }
  ]

  stats: {
    totalWordsSpoken: number
    totalPracticeMinutes: number
    lessonsCompleted: number
    conversationsCompleted: number
    rolePlayScenariosCompleted: string[]
    bestPronunciationScore: number
    perfectAnswers: number
  }

  pendingAchievements: Achievement[]
  isLoading: boolean
}
```

### Reducer Actions

```typescript
Actions:
  - SET_STATE (load from storage)
  - ADD_XP (add experience points)
  - UPDATE_STREAK (update consecutive days)
  - USE_STREAK_FREEZE (consume freeze)
  - UNLOCK_ACHIEVEMENT (unlock new achievement)
  - CLEAR_PENDING_ACHIEVEMENTS (clear notification queue)
  - UPDATE_STATS (update statistics)
  - ADD_PRACTICE_TIME (add practice minutes)
  - COMPLETE_LESSON (lesson completed)
  - COMPLETE_CONVERSATION (conversation completed)
  - ADD_WORDS_SPOKEN (add word count)
  - UPDATE_PRONUNCIATION_SCORE (update best score)
  - COMPLETE_ROLE_PLAY (role play completed)
  - ADD_PERFECT_ANSWER (perfect answer given)
```

## Achievement System

### Achievement Categories

```
Milestones
├─ First Conversation (50 XP)
├─ First Lesson (25 XP)
├─ Quick Learner - 10 lessons (100 XP)
├─ Lesson Legend - 50 lessons (500 XP)
└─ Levels: 5, 10, 25, 50 (100-5000 XP)

Streaks
├─ 3-Day Streak (50 XP)
├─ Week Warrior - 7 days (100 XP)
├─ Monthly Master - 30 days (500 XP)
└─ Century Club - 100 days (2000 XP)

Practice
├─ Words Spoken: 100, 500, 1000, 5000 (50-1000 XP)
└─ Practice Time: 1h, 10h, 50h (75-2000 XP)

Mastery
├─ Perfect Pronunciation - 95+ score (200 XP)
└─ Role Play Master - All scenarios (500 XP)

Time-based
├─ Night Owl - After 10 PM (25 XP)
└─ Early Bird - Before 7 AM (25 XP)
```

### Achievement Condition Types

```typescript
Condition Types:
  - first_conversation: Complete first conversation
  - streak: Reach X consecutive days
  - words_spoken: Speak X total words
  - perfect_pronunciation: Score X on pronunciation
  - practice_time: Practice X total minutes
  - role_play_complete: Complete all role plays
  - level: Reach level X
  - lessons_completed: Complete X lessons
  - night_owl: Practice after 10 PM
  - early_bird: Practice before 7 AM
```

## Level System

### Formula

```
Level = floor(sqrt(XP / 100))

Examples:
  100 XP   → Level 1
  400 XP   → Level 2
  900 XP   → Level 3
  2,500 XP → Level 5
  10,000 XP → Level 10
  62,500 XP → Level 25
```

### XP Required per Level

```
Level 1:   100 XP (0 → 100)
Level 2:   300 XP (100 → 400)
Level 3:   500 XP (400 → 900)
Level 4:   700 XP (900 → 1,600)
Level 5:   900 XP (1,600 → 2,500)
...
Level 10:  1,900 XP (8,100 → 10,000)
...
Level 25:  4,900 XP (57,600 → 62,500)
...
Level 50:  9,900 XP (240,100 → 250,000)
```

## Integration Points

### Where to Track Actions

```
Lesson Screen
└─ completeLesson() on lesson completion
   └─ Awards 50 XP
   └─ Increments lessonsCompleted
   └─ Checks for achievements

Conversation Screen
└─ completeConversation() on conversation end
   └─ Awards 100 XP
   └─ Increments conversationsCompleted
   └─ addWordsSpoken(count)
   └─ updatePronunciationScore(score)
   └─ addPracticeTime(minutes)

Practice Screen
└─ addPracticeTime(minutes) during practice
   └─ Updates todayPracticeMinutes
   └─ Triggers streak update if >= 5 min

Role Play Screen
└─ completeRolePlay(scenarioId)
   └─ Adds to rolePlayScenariosCompleted
   └─ Checks for Role Play Master achievement

Any Screen
└─ addPerfectAnswer() on perfect answer
   └─ Awards 5 XP
   └─ Increments perfectAnswers
```

## Storage Schema

### AsyncStorage Keys

```
@vorex_gamification_data
├─ Full state object (JSON)
└─ Excludes: isLoading, pendingAchievements

@vorex_gamification_last_date
└─ Last activity date string
```

### Storage Operations

```
On App Start:
  1. Load @vorex_gamification_data
  2. Load @vorex_gamification_last_date
  3. Parse and restore state
  4. Check for date change (daily reset)
  5. Update streak status

On State Change:
  1. Remove isLoading & pendingAchievements
  2. Stringify remaining state
  3. Save to @vorex_gamification_data
  4. Save current date to @vorex_gamification_last_date

Daily:
  1. Compare current date with last date
  2. Reset todayPracticeMinutes if new day
  3. Check streak status
  4. Apply freeze if needed or reset streak
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use React.memo for expensive components
2. **Native Animations**: All animations use `useNativeDriver: true`
3. **Debounced Saves**: State saves debounced by React's batching
4. **Selective Checks**: Achievement checks only on relevant actions
5. **Lazy Loading**: Components load data only when needed

### Animation Performance

```
XPBar Animation
└─ Uses Animated.spring with native driver
   └─ Smooth 60fps progress updates

StreakBadge Animation
└─ Static display, no continuous animations

AchievementToast Animation
└─ Entrance: parallel spring animations
└─ Exit: timed fade + slide
└─ All using native driver
```

## Error Handling

### Failure Scenarios

```
AsyncStorage Failure
├─ Gracefully degraded state
├─ Log error to console
└─ Continue with default state

Achievement Check Error
├─ Skip problematic achievement
├─ Continue checking others
└─ Log error details

Date Parsing Error
├─ Reset to current date
└─ Continue with fresh state

Level Calculation Error
├─ Default to level 0
└─ Recalculate on next XP gain
```

## Testing Strategy

### Unit Tests
- Achievement condition checking
- XP calculation
- Level progression
- Streak logic

### Integration Tests
- Full user session flow
- State persistence
- Achievement unlocking
- UI component rendering

### E2E Tests
- Complete lesson flow
- Multi-day streak maintenance
- Achievement notification flow

See `/src/components/__tests__/GamificationTest.example.tsx` for test examples.
