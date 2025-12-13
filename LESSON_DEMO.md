# Lesson Flow - Demo & Usage Guide

## Overview
A complete Duolingo-style lesson/quiz flow with engaging interactions, haptic feedback, and smooth animations.

## Features
- Progress bar showing question X of Y
- Close button with exit confirmation
- Two question types:
  - Multiple choice (tap to select)
  - Word bank (arrange words to form sentence)
- Check button at bottom
- Correct/incorrect feedback with animations
- XP earned display at lesson completion
- Haptic feedback on all interactions
- Premium dark theme design

## How to Navigate to a Lesson

### From a Screen Component:
```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();

  const startLesson = (lessonId: string) => {
    router.push(`/lesson/${lessonId}`);
  };

  return (
    <TouchableOpacity onPress={() => startLesson('1')}>
      <Text>Start Lesson 1</Text>
    </TouchableOpacity>
  );
}
```

### Available Demo Lessons:
- Lesson ID `1`: Introduction to React (5 questions, 50 XP)
- Lesson ID `2`: JavaScript Basics (2 questions, 40 XP)

## File Structure

```
/Users/matuskalis/vorex-mobile/
├── app/
│   └── lesson/
│       └── [id].tsx              # Main lesson screen with dynamic routing
└── src/
    └── components/
        ├── ProgressBar.tsx       # Animated progress indicator
        ├── QuestionCard.tsx      # Displays question text and images
        ├── ChoiceButton.tsx      # Tappable answer option with states
        ├── WordBank.tsx          # Draggable/tappable word chips
        ├── FeedbackModal.tsx     # Correct/incorrect feedback modal
        └── index.ts              # Component exports
```

## Component API

### ProgressBar
```typescript
<ProgressBar
  current={1}      // Current question number
  total={5}        // Total questions
  height={8}       // Optional: Progress bar height
/>
```

### QuestionCard
```typescript
<QuestionCard
  question="What is React?"
  subtitle="Choose the correct answer"  // Optional
  imageUrl="https://..."                // Optional
/>
```

### ChoiceButton
```typescript
<ChoiceButton
  text="Answer text"
  onPress={() => handleSelect()}
  selected={false}      // Optional: Show selected state
  correct={false}       // Optional: Show correct state
  incorrect={false}     // Optional: Show incorrect state
  disabled={false}      // Optional: Disable interaction
/>
```

### WordBank
```typescript
<WordBank
  availableWords={[{ id: '1', text: 'Hello' }, ...]}
  selectedWords={[{ id: '2', text: 'World' }]}
  onWordSelect={(word) => handleSelect(word)}
  onWordRemove={(word) => handleRemove(word)}
  disabled={false}          // Optional
  showCorrect={false}       // Optional: Show correct state
  showIncorrect={false}     // Optional: Show incorrect state
/>
```

### FeedbackModal
```typescript
<FeedbackModal
  visible={true}
  correct={true}
  correctAnswer="The right answer"  // Optional: Show when incorrect
  explanation="Why this is correct" // Optional
  onContinue={() => handleNext()}
/>
```

## Creating Custom Lessons

### Lesson Data Structure:
```typescript
interface LessonData {
  id: string;
  title: string;
  xpReward: number;
  questions: Question[];
}

// Multiple Choice Question
interface MultipleChoiceQuestion {
  type: 'multiple-choice';
  question: string;
  subtitle?: string;
  imageUrl?: string;
  choices: string[];
  correctAnswer: number;  // Index of correct choice
  explanation?: string;
}

// Word Bank Question
interface WordBankQuestion {
  type: 'word-bank';
  question: string;
  subtitle?: string;
  words: string[];         // Words to arrange
  correctAnswer: string;   // Correct sentence
  explanation?: string;
}
```

### Example Custom Lesson:
```typescript
const customLesson: LessonData = {
  id: '3',
  title: 'TypeScript Fundamentals',
  xpReward: 60,
  questions: [
    {
      type: 'multiple-choice',
      subtitle: 'Select the correct type',
      question: 'What is the type of true in TypeScript?',
      choices: ['string', 'number', 'boolean', 'any'],
      correctAnswer: 2,
      explanation: 'In TypeScript, true and false are of type boolean.',
    },
    {
      type: 'word-bank',
      subtitle: 'Complete the type annotation',
      question: 'Declare a variable with a number type',
      words: ['let', 'count', 'number', '=', '0'],
      correctAnswer: 'let count number = 0',
      explanation: 'TypeScript uses : to annotate types.',
    },
  ],
};
```

## Theme Colors

```typescript
const colors = {
  background: '#0a0a0a',      // Dark background
  surface: '#1a1a1a',         // Card/component background
  border: '#2a2a2a',          // Subtle borders

  primary: '#6366f1',         // Purple accent
  primaryDark: '#4f46e5',     // Darker purple

  success: '#22c55e',         // Green for correct
  successDark: '#16a34a',     // Darker green
  successBg: '#14532d',       // Success background

  error: '#ef4444',           // Red for incorrect
  errorDark: '#dc2626',       // Darker red
  errorBg: '#450a0a',         // Error background

  text: '#ffffff',            // Primary text
  textSecondary: '#9ca3af',   // Secondary text
  textMuted: '#6b7280',       // Muted text
};
```

## Haptic Feedback

The app provides haptic feedback for:
- **Light impact**: Word/choice selection
- **Success notification**: Correct answer
- **Error notification**: Incorrect answer
- **Warning notification**: Exit confirmation

## Animation Details

### Progress Bar
- Spring animation with tension: 50, friction: 7
- Smooth width transitions

### Choice Button
- Scale animation on press (0.95x → 1.0x)
- Shake animation on incorrect (±10px, 200ms total)

### Feedback Modal
- Slides up from bottom with spring animation
- Fade-in overlay (200ms)
- Slides down on dismiss (250ms)

### Word Bank
- Shake animation on incorrect answer
- Smooth word movement between areas

## Testing the Lesson Flow

1. Start the app:
```bash
npm start
```

2. Navigate to a lesson by adding this code to any screen:
```typescript
import { useRouter } from 'expo-router';

// Inside component
const router = useRouter();

// To start lesson 1
router.push('/lesson/1');

// To start lesson 2
router.push('/lesson/2');
```

3. Try the interactions:
   - Select answers
   - Feel the haptic feedback
   - Complete the lesson
   - See your XP earned

## Next Steps

To integrate with your backend:

1. Replace `MOCK_LESSONS` in `/app/lesson/[id].tsx` with an API call
2. Fetch lesson data from your Supabase backend
3. Save progress and XP to user profile
4. Add streak tracking
5. Implement lesson unlocking logic
6. Add achievements and badges

## Customization Tips

1. **Add more question types**: Create new components following the same pattern
2. **Change animations**: Adjust timing values in Animated API calls
3. **Modify colors**: Update the styles in each component
4. **Add sounds**: Use `expo-av` for audio feedback
5. **Track analytics**: Add event tracking for question answers
6. **Add timer**: Implement a countdown for timed challenges

## Accessibility

Consider adding:
- Screen reader labels with `accessibilityLabel`
- Reduced motion support checking `AccessibilityInfo.isReduceMotionEnabled()`
- Larger touch targets for buttons (minimum 44x44)
- High contrast mode support

Enjoy your Duolingo-style lesson flow! 🎉
