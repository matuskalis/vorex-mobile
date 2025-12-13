# Session Wrap-up & Next-Day Warm-up Feature

## Overview
This feature provides users with a comprehensive session summary after completing a conversation or lesson, and offers a personalized warm-up experience when they return the next day.

## Feature Components

### 1. Session Summary Screen (`/app/session-summary.tsx`)
Displays comprehensive feedback after completing a session:
- **Session Metrics:**
  - Total speaking time
  - Words spoken count
  - Pronunciation score with visual gauge
  - Fluency score with visual gauge

- **Detailed Feedback:**
  - Top 3 things done well (with success icons)
  - Top 3 areas to improve (with improvement indicators)
  - New vocabulary learned (displayed as chips)

- **Visual Elements:**
  - Animated celebration for good sessions (score >= 70%)
  - Color-coded score indicators (green/yellow/red)
  - Smooth fade-in and slide animations

- **Preview:**
  - Notification about tomorrow's warm-up availability

### 2. Warm-up Content Structure (`/src/data/warmupContent.ts`)
Manages the generation and storage of warm-up content:
- **Data Structures:**
  - `SessionResult`: Stores complete session data
  - `WarmupContent`: Generated review content based on session
  - `PhraseToReview`: Phrases from previous session
  - `PronunciationDrill`: Targeted pronunciation exercises
  - `QuizQuestion`: Knowledge check questions

- **Key Functions:**
  - `generateWarmupFromSession()`: Creates personalized warm-up
  - `getSampleWarmupContent()`: Provides demo content for testing

### 3. Warm-up Screen (`/app/warm-up.tsx`)
Interactive 2-3 minute review session:
- **Step-by-step Flow:**
  1. **Intro:** Motivational message and session overview
  2. **Phrases:** Practice key phrases from yesterday
  3. **Pronunciation:** Targeted drills for weak phonemes
  4. **Quiz:** Quick knowledge check
  5. **Complete:** Summary and congratulations

- **Features:**
  - Audio recording for phrase practice
  - Interactive quiz with immediate feedback
  - Progress indicator
  - Skip option for busy users

### 4. Learning Context Updates (`/src/context/LearningContext.tsx`)
Extended state management for session tracking:
- **New State Fields:**
  - `lastSessionResult`: Most recent session data
  - `hasWarmupAvailable`: Flag for warm-up availability
  - `sessionHistory`: Array of past sessions (max 30)

- **New Actions:**
  - `SAVE_SESSION_RESULT`: Store session data
  - `CLEAR_WARMUP`: Mark warm-up as completed

- **New Context Methods:**
  - `saveSessionResult(session)`: Save session for warm-up
  - `clearWarmup()`: Remove warm-up flag after completion

### 5. Home Screen Integration (`/app/(tabs)/index.tsx`)
Displays warm-up card when available:
- **Warm-up Card:**
  - Prominent accent-colored card
  - "WARM-UP" badge with sun icon
  - "Yesterday's Review" title
  - Quick 2-minute estimate
  - Positioned before daily lesson card

### 6. Conversation Screen Updates (`/app/(tabs)/conversation.tsx`)
Navigates to session summary on completion:
- Calculates session statistics
- Extracts mispronounced words
- Passes data to session summary via router params

## User Flow

### After a Conversation Session:
1. User clicks "End" in conversation screen
2. Alert confirms they want to end the session
3. Session statistics are calculated:
   - Words spoken from user messages
   - Mispronounced words from analysis
   - Time spent in conversation
4. User is navigated to Session Summary screen
5. Session Summary displays all metrics and feedback
6. User clicks "Save & Continue"
7. Session is saved to learning context
8. `hasWarmupAvailable` flag is set to `true`
9. User returns to home screen

### Next Day Experience:
1. User opens app the next day
2. Home screen shows "Yesterday's Review" warm-up card
3. User clicks the warm-up card
4. Warm-up screen starts with motivational intro
5. User practices 3-5 phrases from yesterday
6. User completes pronunciation drills
7. User answers quiz questions
8. Completion summary is shown
9. `clearWarmup()` is called
10. User returns to home (warm-up card disappears)

## Testing the Feature

### Manual Testing:

1. **Trigger Warm-up State (for testing):**
   You can manually set the warm-up state by adding this to your app:
   ```typescript
   // In any screen, add this button for testing:
   const { saveSessionResult } = useLearning();

   <Button onPress={() => {
     saveSessionResult({
       sessionId: 'test_session',
       date: new Date().toISOString(),
       speakingMinutes: 5,
       wordsSpoken: 150,
       pronunciationScore: 78,
       fluencyScore: 82,
       thingsDoneWell: ['Clear pronunciation', 'Natural pacing'],
       areasToImprove: ['Practice "th" sounds'],
       vocabularyLearned: ['latte', 'espresso'],
       mispronuncedWords: ['thought', 'through'],
       scenarioId: 'coffee_shop',
     });
   }}>
     Enable Warm-up (Test)
   </Button>
   ```

2. **Complete a Conversation:**
   - Navigate to conversation screen
   - Have a brief conversation
   - Click "End" button
   - Verify session summary appears
   - Click "Save & Continue"
   - Return to home screen
   - Verify warm-up card appears

3. **Complete Warm-up:**
   - Click on warm-up card
   - Go through all steps
   - Click "Finish" at the end
   - Return to home screen
   - Verify warm-up card disappears

## Data Persistence

All session data is automatically saved to AsyncStorage via the LearningContext:
- Session results persist across app restarts
- Warm-up availability flag persists
- Session history is maintained (last 30 sessions)

## Customization Points

### Adjusting Session Analysis:
Modify `/src/data/warmupContent.ts`:
- `generatePhrasesToReview()`: Change phrase selection logic
- `generatePronunciationDrills()`: Adjust phoneme detection
- `generateQuizQuestions()`: Customize quiz generation

### Styling:
All components use the centralized theme system:
- Colors: `/src/theme/colors.ts`
- Spacing: `/src/theme/spacing.ts`
- Typography: `/src/theme/typography.ts`

### Warm-up Duration:
Adjust in `/app/warm-up.tsx`:
- Modify number of phrases: `phrases.slice(0, 5)`
- Modify number of drills: `drills.length`
- Add/remove quiz questions

## Future Enhancements

Potential improvements:
1. Generate warm-up content from actual AI analysis
2. Track warm-up completion rate
3. Adaptive difficulty based on performance
4. Streak system for consecutive warm-ups
5. Share progress with friends
6. Weekly summary of all sessions
7. Export session history as PDF

## File Structure
```
/Users/matuskalis/vorex-mobile/
├── app/
│   ├── session-summary.tsx          # Session summary screen
│   ├── warm-up.tsx                   # Warm-up review screen
│   └── (tabs)/
│       ├── index.tsx                 # Home screen (updated)
│       └── conversation.tsx          # Conversation (updated)
├── src/
│   ├── context/
│   │   └── LearningContext.tsx       # Extended with session storage
│   └── data/
│       └── warmupContent.ts          # Warm-up data structures
└── WARMUP_FEATURE_README.md         # This file
```
