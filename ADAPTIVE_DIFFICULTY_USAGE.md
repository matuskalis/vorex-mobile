# Adaptive Difficulty System - Usage Guide

## Overview

The Adaptive Difficulty System automatically adjusts the learning experience based on user performance. It tracks pronunciation, fluency, grammar scores, and response times across sessions, then dynamically adjusts difficulty levels.

## Components

### 1. Extended LearningContext

**Location:** `/Users/matuskalis/vorex-mobile/src/context/LearningContext.tsx`

**New State Properties:**
```typescript
{
  difficultyLevel: number; // 1-10 scale
  performanceHistory: {
    pronunciationHistory: number[];    // Last 10 scores
    fluencyHistory: number[];          // Last 10 scores
    grammarHistory: number[];          // Last 10 scores
    responseTimeHistory: number[];     // Last 10 response times
  }
}
```

**New Methods:**
- `recordPerformance(metrics)` - Records performance metrics
- `adjustDifficulty(level)` - Manually adjusts difficulty level

### 2. useAdaptiveDifficulty Hook

**Location:** `/Users/matuskalis/vorex-mobile/src/hooks/useAdaptiveDifficulty.ts`

**Returns:**
```typescript
{
  difficultyLevel: number;           // Current level (1-10)
  difficultySettings: {
    speechSpeed: number;             // 0.7 to 1.0
    vocabularyComplexity: string;    // 'basic' | 'intermediate' | 'advanced'
    sentenceComplexity: string;      // 'simple' | 'moderate' | 'complex'
    topicComplexity: string;         // 'everyday' | 'conversational' | 'professional'
  };
  difficultyTrend: {
    trend: 'improving' | 'stable' | 'declining';
    averageScore: number;
    recentAverage: number;
  };
  recordPerformance: (metrics) => void;
  getDifficultySettings: () => DifficultySettings;
  adjustDifficulty: (level) => void;
}
```

### 3. DifficultyIndicator Component

**Location:** `/Users/matuskalis/vorex-mobile/src/components/DifficultyIndicator.tsx`

**Props:**
```typescript
{
  showLabel?: boolean;  // Show "Difficulty Level" label (default: true)
  compact?: boolean;    // Compact mode for headers (default: false)
}
```

## Integration Examples

### Example 1: Display Difficulty in Header

```typescript
import { DifficultyIndicator } from '../components/DifficultyIndicator';

const ConversationScreen = () => {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Conversation</Text>
        <DifficultyIndicator compact showLabel={false} />
      </View>
      {/* Rest of screen */}
    </View>
  );
};
```

### Example 2: Record Performance After Turn

```typescript
import { useAdaptiveDifficulty } from '../hooks/useAdaptiveDifficulty';

const ConversationScreen = () => {
  const { recordPerformance, difficultySettings } = useAdaptiveDifficulty();

  const handleTurnComplete = async (userResponse: string) => {
    // Get AI analysis
    const analysis = await analyzeResponse(userResponse);

    // Record performance (automatically adjusts difficulty if needed)
    recordPerformance({
      pronunciation: analysis.pronunciationScore,  // 0-100
      fluency: analysis.fluencyScore,             // 0-100
      grammar: analysis.grammarScore,             // 0-100
      responseTime: analysis.responseTime,        // milliseconds
    });
  };

  return (
    <View>
      {/* Conversation UI */}
    </View>
  );
};
```

### Example 3: Use Difficulty Settings for AI Prompts

```typescript
import { useAdaptiveDifficulty } from '../hooks/useAdaptiveDifficulty';

const ConversationScreen = () => {
  const { difficultySettings } = useAdaptiveDifficulty();

  const getSystemPrompt = () => {
    const { vocabularyComplexity, sentenceComplexity, topicComplexity } = difficultySettings;

    return `You are an English conversation partner.

    - Use ${vocabularyComplexity} vocabulary
    - Construct ${sentenceComplexity} sentences
    - Discuss ${topicComplexity} topics
    - Adapt your responses to the learner's level

    Current difficulty level reflects the user's performance.`;
  };

  const sendMessage = async (text: string) => {
    const response = await fetch('/api/conversation', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        systemPrompt: getSystemPrompt(),
        speechSpeed: difficultySettings.speechSpeed,
      }),
    });
    // Handle response
  };

  return (
    <View>
      {/* Conversation UI */}
    </View>
  );
};
```

### Example 4: Settings Screen with Manual Override

```typescript
import { useAdaptiveDifficulty } from '../hooks/useAdaptiveDifficulty';
import { DifficultyIndicator } from '../components/DifficultyIndicator';

const SettingsScreen = () => {
  const { difficultyLevel, adjustDifficulty, difficultyTrend } = useAdaptiveDifficulty();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Adaptive Difficulty</Text>

      <DifficultyIndicator />

      <Text style={styles.info}>
        Performance trend: {difficultyTrend.trend}
      </Text>

      {/* Manual adjustment slider */}
      <Slider
        value={difficultyLevel}
        minimumValue={1}
        maximumValue={10}
        step={1}
        onValueChange={adjustDifficulty}
      />
    </View>
  );
};
```

## Adjustment Logic

The system automatically adjusts difficulty based on:

### Increase Difficulty (Level +1)
- Average score > 85% for last 3+ sessions
- Maximum level: 10

### Decrease Difficulty (Level -1)
- Average score < 60% for last 2+ sessions
- Minimum level: 1

### Trend Calculation
- **Improving**: Recent average > overall average + 5 points
- **Declining**: Recent average < overall average - 5 points
- **Stable**: Within 5 points of overall average

### Weighting
- Recent sessions are weighted more heavily (exponential decay)
- Keeps last 10 scores for each metric
- Requires minimum 2-3 sessions for meaningful adjustments

## Difficulty Level Mappings

### Levels 1-3 (Beginner)
- Speech Speed: 0.7 - 0.77
- Vocabulary: Basic
- Sentences: Simple
- Topics: Everyday

### Levels 4-6 (Intermediate)
- Speech Speed: 0.77 - 0.87
- Vocabulary: Intermediate
- Sentences: Moderate
- Topics: Conversational

### Levels 7-10 (Advanced)
- Speech Speed: 0.87 - 1.0
- Vocabulary: Advanced
- Sentences: Complex
- Topics: Professional

## Backend Integration

### Sending Difficulty Settings to API

```typescript
const { difficultySettings } = useAdaptiveDifficulty();

const response = await fetch('https://your-api.railway.app/conversation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userInput,
    settings: {
      speechSpeed: difficultySettings.speechSpeed,
      vocabularyLevel: difficultySettings.vocabularyComplexity,
      sentenceLevel: difficultySettings.sentenceComplexity,
      topicLevel: difficultySettings.topicComplexity,
    },
  }),
});
```

### Backend Processing (FastAPI example)

```python
# Backend should adjust prompts based on difficulty settings
def get_system_prompt(settings):
    return f"""You are an English teacher.

    Vocabulary: Use {settings['vocabularyLevel']} words
    Sentences: Keep them {settings['sentenceLevel']}
    Topics: Focus on {settings['topicLevel']} subjects

    Adapt your language complexity to the learner's current level.
    """

# Adjust TTS speed
tts_config = {
    "speed": settings['speechSpeed'],  # 0.7 to 1.0
}
```

## Data Persistence

All difficulty data is automatically persisted to AsyncStorage via LearningContext:
- Difficulty level
- Performance history (last 10 scores for each metric)
- Automatically loaded on app startup
- Synced across sessions

## Best Practices

1. **Record Performance Consistently**: Call `recordPerformance()` after each conversation turn for accurate tracking

2. **Use Difficulty Settings**: Apply the settings to AI prompts and TTS configuration

3. **Show Indicator**: Display the DifficultyIndicator to give users feedback on their progress

4. **Don't Manually Adjust Too Often**: Let the automatic system work; only provide manual override in settings

5. **Minimum Data Requirements**: System needs at least 2-3 sessions of data for meaningful adjustments

6. **Handle Missing Metrics**: Not all metrics need to be provided each time - only provide what's available

## Testing

To test the system:

```typescript
// Simulate high performance
for (let i = 0; i < 5; i++) {
  recordPerformance({
    pronunciation: 90,
    fluency: 88,
    grammar: 92,
    responseTime: 3000,
  });
}
// Difficulty should increase

// Simulate low performance
for (let i = 0; i < 3; i++) {
  recordPerformance({
    pronunciation: 50,
    fluency: 55,
    grammar: 52,
    responseTime: 8000,
  });
}
// Difficulty should decrease
```
