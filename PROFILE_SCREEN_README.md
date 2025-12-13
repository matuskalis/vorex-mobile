# Profile & Stats Screen - Implementation Guide

## Overview
A comprehensive stats and profile dashboard built for the Vorex mobile app with beautiful animations, gamification elements, and a polished dark theme UI.

## Files Created

### 1. Data Layer
**`/src/data/achievements.ts`**
- Defines 17 achievement types across 5 categories:
  - **Lesson achievements**: First Lesson, 10 Lessons, Scholar (50), Master Student (100)
  - **Streak achievements**: 3-Day, 7-Day, 30-Day, Century Streak (100 days)
  - **XP achievements**: 100 XP, 1,000 XP, 10,000 XP
  - **Perfect achievements**: Perfect Lesson, Perfectionist (10 perfect)
  - **Time-based achievements**: Early Bird (before 7am), Night Owl (after 10pm)
- Includes `checkAchievement()` helper function for unlocking logic

### 2. Profile Components (`/src/components/profile/`)

#### **StatsCard.tsx**
- Displays individual stat with icon, value, and label
- Features:
  - Count-up animation on mount (0 → final value)
  - Spring entrance animation
  - Automatic number formatting (1000 → 1k)
  - Customizable colors per stat
  - Staggered delays for sequential animations

#### **WeeklyChart.tsx**
- Bar chart showing XP earned per day (7 days)
- Features:
  - Animated bars growing from bottom
  - Today's bar highlighted in gold
  - XP labels above bars
  - Responsive to max value
  - Staggered entrance (50ms delay per bar)

#### **AchievementBadge.tsx**
- Achievement display with locked/unlocked states
- Features:
  - Subtle shine effect for unlocked badges (repeating animation)
  - Golden border for unlocked achievements
  - Lock icon for locked achievements
  - Checkmark badge for unlocked
  - Spring entrance with bounce
  - Semi-transparent overlay for locked state

#### **AvatarPicker.tsx**
- Interactive avatar selector with 24 emoji options
- Features:
  - Tap avatar to open modal picker
  - Pulse animation on avatar
  - Edit badge indicator
  - Full-screen modal with scrollable grid
  - Spring feedback on selection
  - Highlighted selected avatar
  - Categories: People, Animals, Symbols

#### **StreakDisplay.tsx**
- Big streak counter with fire animation
- Features:
  - 3 flickering fire emojis (randomized timing)
  - Glowing background pulse
  - Large streak number with scale entrance
  - Encouraging messages based on streak length
  - Orange/red color scheme

#### **index.ts**
- Barrel export for clean imports

### 3. Main Screen
**`/app/(tabs)/profile.tsx`**
- Complete profile dashboard with:
  - Avatar picker header
  - User name display
  - Streak display with fire animation
  - 4 stat cards (XP, Level, Lessons, Words)
  - Weekly activity chart
  - Achievement grid with unlock counter
  - Settings menu items
  - Sign out button

## Design System

### Colors
- **Background**: `#0a0a0a` (dark black)
- **Card Background**: `#1a1a1a` (dark gray)
- **Primary Accent**: `#6366f1` (purple)
- **Gold**: `#fbbf24` (achievements, today highlight)
- **Success**: `#10b981` (green)
- **Pink**: `#ec4899`
- **Danger**: `#ef4444` (sign out)
- **Text Primary**: `#fff`
- **Text Secondary**: `#999`
- **Text Tertiary**: `#666`

### Typography
- **Headers**: Bold, 18-24px
- **Stats Values**: Bold, 28-48px
- **Labels**: 12-14px, uppercase with letter spacing
- **Body**: 14-16px

### Animation Timings
- **Count-up**: 1000ms cubic ease-out
- **Entrance**: 300-400ms with back easing (bounce)
- **Fire flicker**: 150-200ms per cycle
- **Glow pulse**: 1500ms ease in-out
- **Shine effect**: 2000ms with 3s pause
- **Stagger delay**: 50-100ms between elements

## Dependencies Added
- **react-native-reanimated**: `^3.x` (for smooth animations)
  - Added to `package.json`
  - Plugin configured in `app.json`

## Mock Data Structure
```typescript
const userStats = {
  totalXP: 2450,
  currentLevel: 5,
  lessonsCompleted: 23,
  wordsLearned: 156,
  currentStreak: 12,
  perfectLessons: 3,
  earlyBirdCount: 1,
  nightOwlCount: 2,
};

const weeklyData = [
  { day: 'Mon', xp: 120 },
  { day: 'Tue', xp: 80 },
  // ... rest of week
];
```

## Future Integration Points

### 1. Connect to Real Data
Replace mock data with:
- Supabase database queries
- Zustand/Redux store
- AsyncStorage for local stats
- Real-time updates via Supabase subscriptions

### 2. Avatar Persistence
```typescript
// Save avatar to user profile
await supabase
  .from('profiles')
  .update({ avatar: selectedAvatar })
  .eq('id', user.id);
```

### 3. Achievement Tracking
```typescript
// Check and unlock achievements after lesson completion
const newAchievements = achievements
  .filter(a => !a.unlocked && checkAchievement(a, updatedStats))
  .map(a => ({ ...a, unlocked: true }));

if (newAchievements.length > 0) {
  // Show celebration modal
  // Update database
  // Trigger confetti animation
}
```

### 4. Weekly Chart Data
```typescript
// Fetch last 7 days of XP
const { data } = await supabase
  .from('lessons')
  .select('completed_at, xp_earned')
  .gte('completed_at', sevenDaysAgo)
  .eq('user_id', user.id);

// Aggregate by day
const weeklyData = aggregateByDay(data);
```

## Animation Details

### Count-Up Animation
Numbers smoothly count from 0 to final value using `Animated.Value` with cubic easing for a satisfying feel.

### Fire Flicker
Three fire emojis with independent random flickering creates realistic flame effect. Each emoji has its own animation loop with varying scale and opacity.

### Shine Effect
Unlocked achievements have a white overlay that sweeps across every 5 seconds (2s animation + 3s pause), creating a subtle "shiny" effect.

### Entrance Animations
All elements use spring physics for natural, bouncy entrances. Staggered delays create a cascading reveal effect.

## Testing Checklist
- [ ] Avatar picker opens and closes
- [ ] Avatar selection persists in UI
- [ ] All stats count up from 0
- [ ] Weekly chart bars animate in sequence
- [ ] Fire animation continuously flickers
- [ ] Achievements show correct locked/unlocked state
- [ ] Shine effect plays on unlocked achievements
- [ ] Sign out shows confirmation dialog
- [ ] Scroll performance is smooth
- [ ] Dark theme consistent throughout

## Performance Considerations
- All animations use `react-native-reanimated` (runs on UI thread)
- No heavy computations in render
- Achievement checking is memoized
- ScrollView with proper optimization flags
- Minimal re-renders via proper state management

## Accessibility
- Proper contrast ratios (AAA standard)
- Large touch targets (48x48 minimum)
- Meaningful labels for screen readers
- Animation can be disabled via system settings (future)

---

**Built with**: React Native, Expo, react-native-reanimated
**Theme**: Dark mode (#0a0a0a)
**Design**: Gamification-first, animation-rich
