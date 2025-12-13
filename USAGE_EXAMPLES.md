# Learning Path Usage Examples

## Basic Usage

The learning path is already integrated into the Learn tab. When you navigate to the Learn screen, you'll see:

1. **Header** with XP and streak counters
2. **Progress card** showing completion status
3. **Scrollable learning path** with animated lesson nodes

## Customizing the Curriculum

### Example 1: Add a New Section

Edit `/Users/matuskalis/vorex-mobile/src/data/curriculum.ts`:

```typescript
export const curriculum: Section[] = [
  // ... existing sections
  {
    id: 'travel',
    title: 'Travel & Directions',
    lessons: [
      {
        id: 'travel-1',
        title: 'At the Airport',
        icon: '✈️',
        xpReward: 90,
        isCompleted: false,
        isLocked: true,
      },
      {
        id: 'travel-2',
        title: 'Asking Directions',
        icon: '🗺️',
        xpReward: 85,
        isCompleted: false,
        isLocked: true,
      },
    ],
  },
];
```

### Example 2: Update Lesson Progress

To mark a lesson as completed (you'll want to do this via state management):

```typescript
// Current: Static data
const curriculum = [...];

// Future: Dynamic state
const updateLessonProgress = (lessonId: string) => {
  const updatedCurriculum = curriculum.map(section => ({
    ...section,
    lessons: section.lessons.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, isCompleted: true }
        : lesson
    ),
  }));
};
```

### Example 3: Auto-Unlock Logic

Implement automatic unlocking after lesson completion:

```typescript
const unlockNextLesson = (completedLessonId: string) => {
  let foundCompleted = false;

  return curriculum.map(section => ({
    ...section,
    lessons: section.lessons.map(lesson => {
      if (foundCompleted && lesson.isLocked) {
        foundCompleted = false;
        return { ...lesson, isLocked: false, isCurrent: true };
      }
      if (lesson.id === completedLessonId) {
        foundCompleted = true;
        return { ...lesson, isCompleted: true, isCurrent: false };
      }
      return lesson;
    }),
  }));
};
```

## Customizing Animations

### Example 1: Faster Pulse

In `/Users/matuskalis/vorex-mobile/src/components/learning-path/LessonNode.tsx`:

```typescript
// Change from 1000ms to 500ms
Animated.timing(pulseAnim, {
  toValue: 1.1,
  duration: 500,  // Faster pulse
  useNativeDriver: true,
}),
```

### Example 2: Higher Bounce

```typescript
Animated.timing(bounceAnim, {
  toValue: -20,  // Bounce higher (was -10)
  duration: 100,
  useNativeDriver: true,
}),
```

### Example 3: More Shake Intensity

```typescript
Animated.timing(shakeAnim, {
  toValue: 15,  // Shake more (was 10)
  duration: 50,
  useNativeDriver: true,
}),
```

## Customizing Colors

### Example 1: Different Current Lesson Color

In `/Users/matuskalis/vorex-mobile/src/components/learning-path/LessonNode.tsx`:

```typescript
nodeCurrent: {
  backgroundColor: '#f59e0b',  // Orange instead of purple
  borderColor: '#d97706',
},
```

### Example 2: Completed Lesson with Different Crown

```typescript
crownContainer: {
  backgroundColor: '#8b5cf6',  // Purple crown background
  // ... rest
},
```

## Integrating with Navigation

### Example: Navigate to Lesson Screen

Update the `handleLessonPress` in LearningPath.tsx:

```typescript
import { useNavigation } from '@react-navigation/native';

export const LearningPath: React.FC<LearningPathProps> = ({ sections }) => {
  const navigation = useNavigation();

  const handleLessonPress = (lesson: Lesson) => {
    if (lesson.isLocked) {
      Alert.alert(
        'Lesson Locked',
        'Complete previous lessons to unlock this one!'
      );
    } else {
      // Navigate to lesson screen
      navigation.navigate('LessonScreen', {
        lessonId: lesson.id,
        lessonTitle: lesson.title
      });
    }
  };

  // ... rest
};
```

## Adding Sound Effects

### Example: Play Sound on Lesson Complete

```typescript
import { Audio } from 'expo-av';

const playSuccessSound = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('../../assets/sounds/success.mp3')
  );
  await sound.playAsync();
};

// Call in handleLessonPress when completing
if (lesson.isCompleted) {
  playSuccessSound();
}
```

## Adding Haptic Feedback

The project already has expo-haptics installed:

```typescript
import * as Haptics from 'expo-haptics';

const handlePress = () => {
  if (lesson.isLocked) {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    );
    // ... shake animation
  } else if (lesson.isCompleted) {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // ... bounce animation
  }
};
```

## Testing Different States

### Test 1: All Lessons Locked
```typescript
const testCurriculum: Section[] = [{
  id: 'test',
  title: 'Test Section',
  lessons: [
    { id: '1', title: 'Lesson 1', icon: '📚', xpReward: 50,
      isCompleted: false, isLocked: true },
    { id: '2', title: 'Lesson 2', icon: '📖', xpReward: 60,
      isCompleted: false, isLocked: true },
  ],
}];
```

### Test 2: All Lessons Completed
```typescript
const testCurriculum: Section[] = [{
  id: 'test',
  title: 'Test Section',
  lessons: [
    { id: '1', title: 'Lesson 1', icon: '📚', xpReward: 50,
      isCompleted: true, isLocked: false },
    { id: '2', title: 'Lesson 2', icon: '📖', xpReward: 60,
      isCompleted: true, isLocked: false },
  ],
}];
```

### Test 3: Mixed States (Production-like)
```typescript
const testCurriculum: Section[] = [{
  id: 'test',
  title: 'Test Section',
  lessons: [
    { id: '1', title: 'Lesson 1', icon: '📚', xpReward: 50,
      isCompleted: true, isLocked: false },
    { id: '2', title: 'Lesson 2', icon: '📖', xpReward: 60,
      isCompleted: false, isLocked: false, isCurrent: true },
    { id: '3', title: 'Lesson 3', icon: '📝', xpReward: 70,
      isCompleted: false, isLocked: true },
  ],
}];
```

## Performance Testing

### Test Long Paths (100+ Lessons)

Create a test curriculum with many lessons:

```typescript
const generateTestCurriculum = (numLessons: number): Section[] => {
  const lessons: Lesson[] = [];
  for (let i = 0; i < numLessons; i++) {
    lessons.push({
      id: `lesson-${i}`,
      title: `Lesson ${i + 1}`,
      icon: ['📚', '📖', '📝', '✏️', '📔'][i % 5],
      xpReward: 50 + (i * 5),
      isCompleted: i < 10,
      isLocked: i > 10,
      isCurrent: i === 10,
    });
  }

  return [{
    id: 'test-section',
    title: 'Test Section',
    lessons,
  }];
};

// Use in learn.tsx
<LearningPath sections={generateTestCurriculum(100)} />
```

## Debugging Tips

### 1. Check Lesson States
Add console.log to see lesson data:

```typescript
const handleLessonPress = (lesson: Lesson) => {
  console.log('Lesson pressed:', {
    id: lesson.id,
    title: lesson.title,
    isCompleted: lesson.isCompleted,
    isLocked: lesson.isLocked,
    isCurrent: lesson.isCurrent,
  });
  // ... rest
};
```

### 2. Visualize Offsets
Add borders to see node positioning:

```typescript
nodeContainer: {
  alignItems: 'center',
  borderWidth: 1,  // Add this
  borderColor: 'red',  // Add this
},
```

### 3. Test Animations Separately
Trigger animations manually:

```typescript
// Add a test button
<Button
  title="Test Pulse"
  onPress={() => {
    Animated.timing(pulseAnim, {
      toValue: 1.2,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }}
/>
```

## Common Issues & Solutions

### Issue 1: SVG Not Rendering
**Solution**: Make sure react-native-svg is installed
```bash
npx expo install react-native-svg
```

### Issue 2: Animations Laggy
**Solution**: Ensure `useNativeDriver: true` is set in all animations

### Issue 3: Path Not Zigzagging
**Solution**: Check offset values in `getNodeAlignment` function

### Issue 4: Icons Not Showing
**Solution**: Make sure emoji are properly encoded in curriculum.ts
