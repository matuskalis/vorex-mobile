# Learning Path - Quick Reference Card

## Files at a Glance

| File | Size | Purpose |
|------|------|---------|
| `/Users/matuskalis/vorex-mobile/app/(tabs)/learn.tsx` | 153 lines | Main screen |
| `/Users/matuskalis/vorex-mobile/src/components/learning-path/LessonNode.tsx` | 245 lines | Lesson circles |
| `/Users/matuskalis/vorex-mobile/src/components/learning-path/LearningPath.tsx` | 113 lines | Path layout |
| `/Users/matuskalis/vorex-mobile/src/components/learning-path/PathConnector.tsx` | 74 lines | SVG connectors |
| `/Users/matuskalis/vorex-mobile/src/components/learning-path/SectionHeader.tsx` | 55 lines | Section titles |
| `/Users/matuskalis/vorex-mobile/src/data/curriculum.ts` | 177 lines | Lesson data |

## Color Reference

```typescript
// Copy-paste these exact colors
const COLORS = {
  background: '#0a0a0a',     // Deep black
  card: '#1a1a1a',           // Dark gray
  completed: '#22c55e',       // Green
  current: '#6366f1',         // Purple
  available: '#3b82f6',       // Blue
  locked: '#4b5563',          // Gray
  gold: '#fbbf24',            // Yellow (crown)
  textPrimary: '#ffffff',     // White
  textSecondary: '#9ca3af',   // Gray-400
};
```

## State Reference

| State | Color | Icon | Animation |
|-------|-------|------|-----------|
| Completed | Green | Crown 👑 | None |
| Current | Purple | None | Pulse (1s loop) |
| Available | Blue | None | Bounce on tap |
| Locked | Gray | Lock 🔒 | Shake on tap |

## Import Statements

```typescript
// In your components
import { LearningPath } from '../../src/components/learning-path';
import { curriculum } from '../../src/data/curriculum';
import type { Lesson, Section } from '../../src/data/curriculum';
```

## Common Tasks

### 1. Add a New Lesson
**File**: `/Users/matuskalis/vorex-mobile/src/data/curriculum.ts`
```typescript
{
  id: 'unique-id',
  title: 'Lesson Name',
  icon: '🎯',
  xpReward: 75,
  isCompleted: false,
  isLocked: true,
}
```

### 2. Add a New Section
**File**: `/Users/matuskalis/vorex-mobile/src/data/curriculum.ts`
```typescript
{
  id: 'section-id',
  title: 'Section Name',
  lessons: [ /* array of lessons */ ],
}
```

### 3. Change Pulse Speed
**File**: `/Users/matuskalis/vorex-mobile/src/components/learning-path/LessonNode.tsx`
```typescript
Animated.timing(pulseAnim, {
  toValue: 1.1,
  duration: 500,  // Change this (default: 1000)
  useNativeDriver: true,
})
```

### 4. Change Node Colors
**File**: `/Users/matuskalis/vorex-mobile/src/components/learning-path/LessonNode.tsx`
```typescript
nodeCurrent: {
  backgroundColor: '#YOUR_COLOR',
  borderColor: '#YOUR_BORDER_COLOR',
},
```

### 5. Add Navigation
**File**: `/Users/matuskalis/vorex-mobile/src/components/learning-path/LearningPath.tsx`
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

const handleLessonPress = (lesson: Lesson) => {
  if (!lesson.isLocked && !lesson.isCompleted) {
    router.push(`/lesson/${lesson.id}`);
  }
};
```

## Animation Timings

```typescript
// All values in milliseconds
const ANIMATION_DURATIONS = {
  pulse: 1000,      // Current lesson pulse cycle
  bounce: 200,      // Available lesson bounce
  shake: 200,       // Locked lesson shake
};
```

## Node Dimensions

```typescript
const NODE_DIMENSIONS = {
  size: 80,           // Width & height
  radius: 40,         // Border radius
  offset: 60,         // Zigzag offset
  badgeSize: 24,      // Crown/lock badge
  iconSize: 36,       // Emoji size
};
```

## Data Structure Template

```typescript
interface Lesson {
  id: string;              // Unique identifier
  title: string;           // Display name
  icon: string;            // Emoji character
  xpReward: number;        // Points earned
  isCompleted: boolean;    // Green state
  isLocked: boolean;       // Gray state
  isCurrent?: boolean;     // Purple state (optional)
}

interface Section {
  id: string;              // Unique identifier
  title: string;           // Section name
  lessons: Lesson[];       // Array of lessons
}
```

## Component Props

```typescript
// LearningPath
interface LearningPathProps {
  sections: Section[];
}

// LessonNode
interface LessonNodeProps {
  lesson: Lesson;
  onPress: (lesson: Lesson) => void;
}

// PathConnector
interface PathConnectorProps {
  direction: 'left' | 'right' | 'straight';
  isCompleted?: boolean;
}

// SectionHeader
interface SectionHeaderProps {
  title: string;
}
```

## Testing Checklist

```bash
# Quick test commands
npm start                    # Start dev server
npx expo start --ios         # iOS simulator
npx expo start --android     # Android emulator
npx tsc --noEmit            # Check TypeScript
```

## Common Customizations

| What | Where | How |
|------|-------|-----|
| Add lesson | `curriculum.ts` | Add object to `lessons` array |
| Change color | `LessonNode.tsx` | Update `styles` object |
| Add section | `curriculum.ts` | Add object to `curriculum` array |
| Modify animation | `LessonNode.tsx` | Edit `Animated.timing` calls |
| Change spacing | `LearningPath.tsx` | Update `offset` calculation |
| Add navigation | `LearningPath.tsx` | Update `handleLessonPress` |

## Keyboard Shortcuts (VS Code)

```
Cmd+P → curriculum.ts       (Open curriculum)
Cmd+P → LessonNode.tsx      (Open node component)
Cmd+P → learn.tsx           (Open main screen)
Cmd+Shift+F → "isCompleted" (Find all completions)
```

## Dependencies

```json
{
  "react-native-svg": "15.12.1"  // Required for connectors
}
```

Install if missing:
```bash
npx expo install react-native-svg
```

## File Paths (Absolute)

```
Main Screen:
/Users/matuskalis/vorex-mobile/app/(tabs)/learn.tsx

Components:
/Users/matuskalis/vorex-mobile/src/components/learning-path/LessonNode.tsx
/Users/matuskalis/vorex-mobile/src/components/learning-path/LearningPath.tsx
/Users/matuskalis/vorex-mobile/src/components/learning-path/PathConnector.tsx
/Users/matuskalis/vorex-mobile/src/components/learning-path/SectionHeader.tsx
/Users/matuskalis/vorex-mobile/src/components/learning-path/index.ts

Data:
/Users/matuskalis/vorex-mobile/src/data/curriculum.ts

Docs:
/Users/matuskalis/vorex-mobile/LEARNING_PATH_SUMMARY.md
/Users/matuskalis/vorex-mobile/COMPONENT_ARCHITECTURE.md
/Users/matuskalis/vorex-mobile/USAGE_EXAMPLES.md
/Users/matuskalis/vorex-mobile/VISUAL_REFERENCE.md
```

## Debug Tips

```typescript
// Add to see lesson data
console.log('Lesson:', lesson);

// Add to see animation values
console.log('Pulse:', pulseAnim._value);

// Add to components to visualize layout
borderWidth: 1,
borderColor: 'red',
```

## Performance Notes

✅ **Good**: Using `useNativeDriver: true`
✅ **Good**: Animated.Value for smooth animations
✅ **Good**: Individual node memoization
⚠️ **Watch**: Long paths (100+ lessons) - consider FlatList
⚠️ **Watch**: Heavy images - use caching

## Next Steps Checklist

- [ ] Connect to backend API (Supabase)
- [ ] Add state management (Context/Redux)
- [ ] Implement navigation to lesson screens
- [ ] Add haptic feedback with expo-haptics
- [ ] Add sound effects
- [ ] Implement unlock logic
- [ ] Add achievements system
- [ ] Create practice mode
- [ ] Add daily goals
- [ ] Implement leaderboard

## Support

Questions? Check these docs:
1. `LEARNING_PATH_SUMMARY.md` - Complete overview
2. `COMPONENT_ARCHITECTURE.md` - Technical details
3. `USAGE_EXAMPLES.md` - Code examples
4. `VISUAL_REFERENCE.md` - Visual guide
