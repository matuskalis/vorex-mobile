# Vocabulary Spaced Repetition System

This document describes the implementation of the Spaced Repetition System (SRS) for vocabulary learning in the Vorex mobile app.

## Overview

The vocabulary system uses the **SM-2 (SuperMemo 2) algorithm** to optimize vocabulary retention through spaced repetition. Words are scheduled for review at optimal intervals based on how well you remember them.

## Architecture

### Files Structure

```
/Users/matuskalis/vorex-mobile/
├── src/
│   ├── context/
│   │   └── VocabularyContext.tsx          # State management for vocabulary
│   ├── components/
│   │   └── VocabCard.tsx                  # Flashcard component with flip animation
│   └── utils/
│       ├── spacedRepetition.ts            # SM-2 algorithm implementation
│       └── sampleVocabulary.ts            # Sample data for testing
├── app/
│   ├── vocabulary.tsx                      # Vocabulary list screen
│   ├── vocabulary-review.tsx               # Review/flashcard screen
│   └── (tabs)/
│       └── index.tsx                       # Home screen (with vocab integration)
```

## Core Components

### 1. Spaced Repetition Algorithm (`spacedRepetition.ts`)

**SM-2 Algorithm Implementation:**
- **Ease Factor**: Starting at 2.5, adjusts based on recall quality
- **Interval**: Days until next review (1, 6, then exponential)
- **Repetitions**: Number of consecutive successful reviews

**Quality Ratings:**
- 0: Complete blackout (no recall)
- 1: Incorrect, but recognized after seeing answer
- 2: Incorrect, but seemed familiar
- 3: Correct, but required significant effort
- 4: Correct, after some hesitation
- 5: Perfect recall

**Mapped to Buttons:**
- Again: Quality 1 (interval resets to 1 day)
- Hard: Quality 3 (moderate interval increase)
- Good: Quality 4 (standard interval increase)
- Easy: Quality 5 (maximum interval increase)

### 2. Vocabulary Context (`VocabularyContext.tsx`)

**State Management:**
```typescript
interface VocabularyState {
  items: VocabItem[];
  isLoading: boolean;
  dailyReviewsCompleted: number;
  totalReviewsCompleted: number;
  currentStreak: number;
  lastReviewDate: string | null;
}
```

**Key Functions:**
- `addWord()`: Add new vocabulary item
- `reviewWord()`: Record review and update schedule
- `deleteWord()`: Remove vocabulary item
- `getDueWords()`: Get words due for review
- `getDueTodayWords()`: Get words due today
- `getStats()`: Get vocabulary statistics

**Persistence:**
- Uses AsyncStorage for offline storage
- Auto-saves on state changes
- Handles daily streak tracking

### 3. Flashcard Component (`VocabCard.tsx`)

**Features:**
- 3D flip animation
- Text-to-speech pronunciation
- Shows word, phonetic, translation, and example
- Responsive design

**Animation:**
- Spring-based flip animation
- Smooth opacity transitions
- Front/back card states

### 4. Review Screen (`vocabulary-review.tsx`)

**Features:**
- Flashcard-style interface
- Progress tracking (X/Y cards reviewed)
- Daily stats display (reviews today, streak, total words)
- Four quality buttons (Again, Hard, Good, Easy)
- Remaining cards counter

**User Flow:**
1. View front of card (word + example)
2. Tap to reveal translation
3. Rate recall quality
4. Move to next card
5. Complete session

### 5. Vocabulary List Screen (`vocabulary.tsx`)

**Features:**
- Search functionality
- Filter by mastery level (New, Learning, Familiar, Mastered)
- Sort by mastery
- Display next review date
- Delete words
- Add custom words (placeholder)

**Stats Display:**
- Total words
- Due today
- Mastered words
- Familiar words

**Mastery Levels:**
- **New** (0 repetitions): Gray
- **Learning** (1-2 reps): Orange
- **Familiar** (3-5 reps): Blue
- **Mastered** (6+ reps): Green

## Home Screen Integration

The home screen shows:

1. **Vocabulary Review Card** (if words are due):
   - Blue-themed card with brain icon
   - Badge showing "VOCABULARY"
   - Count of words due for review
   - Direct link to review screen

2. **Quick Actions Section**:
   - "My Vocabulary" card with brain icon
   - Shows total word count badge
   - Links to vocabulary list screen

## How to Use

### Adding Sample Vocabulary

For testing, use the sample vocabulary utility:

```typescript
import { useVocabulary } from '../src/context/VocabularyContext';
import { addSampleVocabulary } from '../src/utils/sampleVocabulary';

// In a component
const { addWord } = useVocabulary();

// Add 5 sample words
addSampleVocabulary(addWord, 5);
```

### Programmatically Adding Words

```typescript
const { addWord } = useVocabulary();

addWord(
  'Serendipity',
  'The occurrence of events by chance in a happy way',
  'Finding that book was pure serendipity.',
  '/ˌserənˈdɪpɪti/'
);
```

### Integration with Conversations

To add vocabulary from conversations, extract words and call `addWord()`:

```typescript
// After conversation analysis
const newWords = extractVocabularyFromConversation(transcript);

newWords.forEach(word => {
  addWord(
    word.word,
    word.translation,
    word.exampleSentence,
    word.phonetic
  );
});
```

## Algorithm Details

### Interval Calculation

```typescript
if (quality < 3) {
  // Failed recall
  repetitions = 0;
  interval = 1;
} else {
  // Successful recall
  if (repetitions === 0) {
    interval = 1;        // First success: 1 day
  } else if (repetitions === 1) {
    interval = 6;        // Second success: 6 days
  } else {
    interval = Math.round(interval * easeFactor); // Exponential growth
  }
  repetitions += 1;
}
```

### Ease Factor Update

```typescript
easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

// Minimum ease factor is 1.3
if (easeFactor < 1.3) {
  easeFactor = 1.3;
}
```

## Data Structure

### VocabItem

```typescript
interface VocabItem {
  id: string;           // Unique identifier
  word: string;         // The vocabulary word
  translation: string;  // Meaning/definition
  example: string;      // Example sentence
  phonetic: string;     // IPA pronunciation
  easeFactor: number;   // Difficulty factor (≥1.3)
  interval: number;     // Days until next review
  repetitions: number;  // Consecutive successes
  nextReview: Date;     // Scheduled review date
  lastReview: Date;     // Last reviewed date
  createdAt: Date;      // When word was added
}
```

## Storage

Data is persisted in AsyncStorage under these keys:
- `@vorex_vocabulary_data`: All vocabulary data
- `@vorex_vocab_last_date`: Last review date for streak tracking

## Future Enhancements

### Planned Features:
1. **Auto-extraction from conversations**: Automatically detect and add new words from speaking sessions
2. **Custom word addition modal**: UI for manually adding words
3. **Audio recordings**: Record and playback pronunciation
4. **Images**: Visual memory aids for words
5. **Categories/Tags**: Organize words by topic
6. **Export/Import**: Share vocabulary lists
7. **Notifications**: Daily review reminders
8. **Analytics**: Detailed learning statistics
9. **Difficulty adjustment**: Dynamic difficulty based on performance
10. **Multi-language support**: Support for multiple target languages

### Integration Points:
- Session Summary screen: Show new words learned
- Warm-up screen: Include vocabulary review
- Conversation screen: Highlight learned words
- Progress screen: Vocabulary learning graphs

## Testing

To test the vocabulary system:

1. Add sample words:
   ```typescript
   import { addSampleVocabulary } from '../src/utils/sampleVocabulary';
   const { addWord } = useVocabulary();
   addSampleVocabulary(addWord, 10);
   ```

2. Navigate to `/vocabulary` to see the list
3. Navigate to `/vocabulary-review` to review words
4. Check home screen for vocabulary card (appears when words are due)

## Best Practices

1. **Review regularly**: Daily reviews are most effective
2. **Honest ratings**: Rate based on actual recall, not wishful thinking
3. **Quality over quantity**: Better to learn 10 words well than 100 poorly
4. **Context matters**: Always include example sentences
5. **Pronunciation**: Use the audio feature to learn correct pronunciation

## Troubleshooting

**Words not appearing for review:**
- Check if words are actually due (use `getDueTodayWords()`)
- Verify nextReview date is in the past

**Data not persisting:**
- Check AsyncStorage permissions
- Verify context is properly wrapped in app layout

**Performance issues:**
- Limit vocabulary to reasonable size (1000-2000 words)
- Use pagination for large lists
- Optimize search with debouncing

## References

- [SuperMemo SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Spaced Repetition Research](https://en.wikipedia.org/wiki/Spaced_repetition)
- [Expo AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/)
