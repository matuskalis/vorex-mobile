# Learning Path Component Architecture

## Component Hierarchy

```
learn.tsx (Main Screen)
│
├── Header
│   ├── Title: "Learn"
│   ├── XP Badge: ⚡ {totalXP}
│   └── Streak Badge: 🔥 3
│
├── Progress Card
│   ├── Title: "Your Progress"
│   ├── Progress Bar (dynamic width)
│   └── Text: "{completed}/{total} lessons completed"
│
└── ScrollView
    └── LearningPath
        │
        ├── Section 1: "Basics"
        │   ├── SectionHeader (decorative title)
        │   ├── LessonNode (lesson 1) ✅ Completed + 👑
        │   ├── PathConnector (curved line)
        │   ├── LessonNode (lesson 2) ✅ Completed + 👑
        │   ├── PathConnector
        │   └── LessonNode (lesson 3) 🟣 Current (pulsing)
        │
        ├── Section 2: "Greetings & Phrases"
        │   ├── SectionHeader
        │   ├── LessonNode 🔒 Locked
        │   ├── PathConnector
        │   └── ...
        │
        └── Section N...
```

## Data Flow

### 1. Curriculum Data
```typescript
curriculum.ts exports:
├── Section[] array
│   └── Each Section contains:
│       ├── id: string
│       ├── title: string
│       └── lessons: Lesson[]
│           └── Each Lesson contains:
│               ├── id, title, icon
│               ├── xpReward: number
│               ├── isCompleted: boolean
│               ├── isLocked: boolean
│               └── isCurrent?: boolean
```

### 2. Learn Screen (learn.tsx)
```
Input: curriculum data
Process:
  1. Calculate totalLessons
  2. Calculate completedLessons
  3. Calculate totalXP earned
  4. Calculate progressPercentage
Render:
  - Header with stats
  - Progress card
  - LearningPath component
```

### 3. LearningPath Component
```
Input: sections (Section[])
Process:
  1. Loop through each section
  2. Render SectionHeader
  3. Loop through lessons in section
  4. Calculate node offset (zigzag pattern)
  5. Determine connector direction
Render:
  - SectionHeader for each section
  - LessonNode for each lesson
  - PathConnector between nodes
```

### 4. LessonNode Component
```
Input:
  - lesson: Lesson
  - onPress: (lesson) => void

State:
  - pulseAnim (for current lessons)
  - bounceAnim (for available lessons)
  - shakeAnim (for locked lessons)

Effects:
  - Start pulse loop if isCurrent

Render:
  - Animated wrapper with transforms
  - Glow effect (if current)
  - Colored circle (based on state)
  - Icon emoji
  - Crown badge (if completed)
  - Lock icon (if locked)
  - Title text
  - XP text
```

### 5. PathConnector Component
```
Input:
  - direction: 'left' | 'right' | 'straight'
  - isCompleted: boolean

Render:
  - SVG with Path element
  - Curved or straight line
  - Color based on completion status
```

### 6. SectionHeader Component
```
Input: title: string

Render:
  - Left decorator line
  - Title badge (centered)
  - Right decorator line
```

## State Management

### Current Implementation (Local State)
```
curriculum.ts
    ↓ (static data)
learn.tsx
    ↓ (props)
LearningPath
    ↓ (props)
LessonNode (animations via hooks)
```

### Future Enhancement (Recommended)
```
Backend API / Supabase
    ↓
Redux Store / Context
    ↓
learn.tsx (reads state)
    ↓
LearningPath
    ↓
LessonNode (dispatches actions)
```

## Animation Timeline

### Current Lesson (Continuous)
```
Scale: 1.0 → 1.1 → 1.0 → 1.1 (loop)
Duration: 1s per cycle
Effect: Gentle pulsing glow
```

### Available Lesson (On Press)
```
TranslateY: 0 → -10 → 0
Duration: 200ms total
Effect: Bounces up then back
Then: Calls onPress handler
```

### Locked Lesson (On Press)
```
TranslateX: 0 → 10 → -10 → 10 → 0
Duration: 200ms total (50ms per step)
Effect: Rapid horizontal shake
```

## Styling System

### Color Tokens
```typescript
Background:    #0a0a0a  (deep black)
Card:          #1a1a1a  (dark gray)
Border:        #1f2937  (gray-800)
Text Primary:  #ffffff  (white)
Text Secondary:#9ca3af  (gray-400)
Text Muted:    #6b7280  (gray-500)

Completed:     #22c55e  (green-500)
Current:       #6366f1  (indigo-500)
Available:     #3b82f6  (blue-500)
Locked:        #4b5563  (gray-600)
Gold:          #fbbf24  (yellow-400)
```

### Layout Values
```typescript
Node Size:     80x80 (circular)
Node Offset:   ±60px (for zigzag)
Connector:     80-100px height
Section Gap:   32px vertical
Lesson Gap:    16px vertical
Border Radius: 40px (nodes), 16px (cards)
```

## Performance Considerations

### Optimizations Implemented
1. **Animated.Value**: Uses native driver for smooth 60fps
2. **Component Memoization**: Each LessonNode is independent
3. **SVG Paths**: Hardware-accelerated rendering
4. **Conditional Rendering**: Only renders visible animations

### Future Optimizations
1. **FlatList**: Replace ScrollView for long paths (100+ lessons)
2. **Virtualization**: Only render visible nodes
3. **Image Caching**: If replacing emoji with images
4. **Gesture Handler**: For more complex interactions
