# Quick Start Guide - Lesson Flow Testing

## Start the App

```bash
cd /Users/matuskalis/vorex-mobile
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code for physical device

## Test the Lesson Flow (2 minutes)

### Option 1: From Learning Path (Recommended)
1. Open the app
2. Navigate to the **Learn** tab (bottom navigation)
3. Scroll to "Basic Questions" (has purple glow - it's the current lesson)
4. Tap the lesson node
5. Tap **Start** in the confirmation dialog
6. Answer the questions:
   - Tap an answer for multiple choice
   - Tap words to arrange them for word bank
7. Tap **CHECK** after each answer
8. See the feedback modal slide up
9. Tap **CONTINUE**
10. Complete all 5 questions
11. See your score and XP earned
12. Tap **FINISH** to return

### Option 2: Direct Navigation (For Testing)
Add this code to any screen temporarily:

```typescript
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

function TestButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/lesson/1')}
      style={{ padding: 20, backgroundColor: '#6366f1', borderRadius: 10 }}
    >
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
        Test Lesson Flow
      </Text>
    </TouchableOpacity>
  );
}
```

## What to Look For

### Animations
- ✅ Progress bar animates smoothly
- ✅ Buttons scale when tapped
- ✅ Incorrect answers shake
- ✅ Feedback modal slides up from bottom
- ✅ All transitions are smooth (60fps)

### Haptics (Physical Device Only)
- ✅ Light tap when selecting
- ✅ Success vibration when correct
- ✅ Error vibration when incorrect

### Visual States
- ✅ Selected answers show purple border
- ✅ Correct answers show green background
- ✅ Incorrect answers show red background
- ✅ Word chips change color when selected

### Functionality
- ✅ Can select/deselect answers
- ✅ Check button only enables with answer
- ✅ Can't change answer after checking
- ✅ Progress bar updates each question
- ✅ Score calculated correctly
- ✅ XP shown at end
- ✅ Close button asks for confirmation

## Demo Lesson Content

### Lesson 1 (5 questions)
1. Multiple choice: "What is React?"
2. Word bank: "Components are building blocks..."
3. Multiple choice: "Which hook for state?"
4. Word bank: "import React from react"
5. Multiple choice: "What does JSX stand for?"

### Lesson 2 (2 questions)
1. Multiple choice: "Declare a constant"
2. Word bank: "function myFunction..."

## Files to Check

All files created:
```bash
# Main screen
ls -lh app/lesson/[id].tsx

# Components
ls -lh src/components/ProgressBar.tsx
ls -lh src/components/QuestionCard.tsx
ls -lh src/components/ChoiceButton.tsx
ls -lh src/components/WordBank.tsx
ls -lh src/components/FeedbackModal.tsx

# Documentation
ls -lh LESSON_DEMO.md
ls -lh LESSON_FLOW_README.md
ls -lh IMPLEMENTATION_SUMMARY.md
```

## Common Issues & Solutions

### Issue: Haptics don't work
**Solution:** Haptics only work on physical devices, not simulators

### Issue: Lesson doesn't load
**Solution:** Check that you're using a valid lesson ID ('1', '2', or curriculum IDs like 'basics-3')

### Issue: Navigation doesn't work
**Solution:** Make sure expo-router is properly configured in app.json

### Issue: Animations are choppy
**Solution:** Animations may be slower in debug mode; try release build

## Next Actions

1. **Test thoroughly** - Go through both demo lessons
2. **Check documentation** - Read LESSON_FLOW_README.md for full details
3. **Plan backend** - Think about lesson data structure
4. **Customize** - Adjust colors, animations, question types
5. **Extend** - Add new features like timers, sounds, etc.

## Quick Code Reference

### Navigate to lesson:
```typescript
router.push('/lesson/1');
```

### Import components:
```typescript
import {
  ProgressBar,
  QuestionCard,
  ChoiceButton,
  WordBank,
  FeedbackModal
} from '@/src/components';
```

### Create a lesson:
```typescript
const myLesson = {
  id: '3',
  title: 'My Custom Lesson',
  xpReward: 100,
  questions: [
    {
      type: 'multiple-choice',
      question: 'Your question?',
      choices: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Why A is correct'
    }
  ]
};
```

## Need Help?

1. Check **LESSON_DEMO.md** for component API
2. Check **LESSON_FLOW_README.md** for implementation details
3. Check **IMPLEMENTATION_SUMMARY.md** for file locations
4. Review the code comments in each file

## Success!

If you can:
- ✅ Navigate to a lesson
- ✅ Answer questions
- ✅ See smooth animations
- ✅ Complete the lesson
- ✅ See your score and XP

**Then everything is working perfectly!** 🎉

Enjoy your Duolingo-style lesson flow!
