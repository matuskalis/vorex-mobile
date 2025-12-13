# Duolingo-Style Learning Path Implementation

## Overview
A complete Duolingo-inspired learning path system for the Vorex mobile app, featuring an interactive skill tree with animated lesson nodes, curved connectors, and progress tracking.

## Files Created

### 1. Main Screen
- **`/Users/matuskalis/vorex-mobile/app/(tabs)/learn.tsx`**
  - Updated main learning screen
  - Displays header with XP and streak badges
  - Shows progress card with completion percentage
  - Renders the scrollable learning path

### 2. Components (`/Users/matuskalis/vorex-mobile/src/components/learning-path/`)

#### **LessonNode.tsx**
Individual lesson circle component with:
- 4 states: completed (green), current (purple with glow), available (blue), locked (gray)
- Gold crown badge on completed lessons
- Lock icon on locked lessons
- Animations:
  - Pulse effect on current lesson (continuous)
  - Bounce animation when tapping available lessons
  - Shake animation when tapping locked lessons
- Displays lesson icon, title, and XP reward

#### **PathConnector.tsx**
Curved line connector using react-native-svg:
- 3 direction types: left, right, straight
- Color-coded: green for completed paths, gray for upcoming
- Creates the signature Duolingo zigzag pattern

#### **SectionHeader.tsx**
Decorative section title component:
- Centered title with uppercase text
- Horizontal divider lines on both sides
- Styled with dark theme borders

#### **LearningPath.tsx**
Main orchestrator component:
- Arranges nodes in zigzag pattern (offset left/right)
- Manages section rendering
- Handles lesson press events with alerts
- Creates dynamic path connections between nodes

#### **index.ts**
Barrel export file for clean imports

### 3. Data Structure
- **`/Users/matuskalis/vorex-mobile/src/data/curriculum.ts`**
  - TypeScript interfaces: `Lesson`, `Section`
  - Sample curriculum with 5 sections:
    1. Basics (3 lessons)
    2. Greetings & Phrases (3 lessons)
    3. Food & Drinks (4 lessons)
    4. Numbers & Time (3 lessons)
    5. Family & Friends (3 lessons)
  - Pre-configured lesson states for demo

## Features Implemented

### Visual Design
- **Dark Theme**: Background #0a0a0a
- **Color Palette**:
  - Completed: #22c55e (green)
  - Current: #6366f1 (purple with glow)
  - Available: #3b82f6 (blue)
  - Locked: #4b5563 (gray)
- **Gold Crown**: On completed lessons
- **Lock Icon**: On locked lessons

### Animations
1. **Pulse Animation**: Current lesson continuously pulses (scale 1 → 1.1)
2. **Bounce Animation**: Available lessons bounce when tapped
3. **Shake Animation**: Locked lessons shake when tapped

### Interaction States
- **Completed Lessons**: Show alert to practice again
- **Current/Available Lessons**: Show start lesson alert
- **Locked Lessons**: Show "complete previous lessons" alert

### Layout Pattern
The path creates a Duolingo-style zigzag:
```
    Node 1 (center-left)
       |
    Node 2 (center-right)
       |
    Node 3 (center-right)
       |
    Node 4 (center-left)
```

### Progress Tracking
- Displays total XP earned
- Shows completion percentage
- Counts completed vs total lessons
- 3-day streak indicator

## Dependencies Added
- `react-native-svg`: For curved path connectors

## Usage

The learning path automatically renders from the curriculum data:

```typescript
import { LearningPath } from '../../src/components/learning-path';
import { curriculum } from '../../src/data/curriculum';

<LearningPath sections={curriculum} />
```

## Customization

### Adding New Lessons
Edit `/Users/matuskalis/vorex-mobile/src/data/curriculum.ts`:

```typescript
{
  id: 'new-lesson',
  title: 'Your Lesson',
  icon: '🎯',
  xpReward: 100,
  isCompleted: false,
  isLocked: true,
}
```

### Changing Colors
Update styles in individual components:
- LessonNode.tsx: Node colors
- PathConnector.tsx: Connector colors
- SectionHeader.tsx: Section header styling

### Modifying Animations
Adjust timing/values in LessonNode.tsx:
- `pulseAnim`: Current lesson pulse
- `bounceAnim`: Tap bounce effect
- `shakeAnim`: Lock shake effect

## Next Steps

To make this fully functional:

1. **Navigation**: Connect lesson press to actual lesson screens
2. **State Management**: Add Redux/Context for progress tracking
3. **Backend Integration**: Sync completion status with API
4. **Unlock Logic**: Implement automatic unlocking after lesson completion
5. **Sound Effects**: Add audio feedback for interactions
6. **Haptic Feedback**: Use expo-haptics for tactile responses

## File Structure
```
vorex-mobile/
├── app/
│   └── (tabs)/
│       └── learn.tsx (Updated)
└── src/
    ├── components/
    │   └── learning-path/
    │       ├── index.ts
    │       ├── LearningPath.tsx
    │       ├── LessonNode.tsx
    │       ├── PathConnector.tsx
    │       └── SectionHeader.tsx
    └── data/
        └── curriculum.ts
```
