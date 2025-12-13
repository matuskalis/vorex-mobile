# Adaptive Difficulty - Quick Start Guide

## 5-Minute Integration

### Step 1: Import (in your conversation screen)

```typescript
import { useAdaptiveDifficulty } from '../hooks/useAdaptiveDifficulty';
import { DifficultyIndicator } from '../components/DifficultyIndicator';
```

### Step 2: Add to your component

```typescript
const YourConversationScreen = () => {
  const { difficultySettings, recordPerformance } = useAdaptiveDifficulty();

  // Your existing code...
}
```

### Step 3: Show the indicator

Add this to your screen header:

```typescript
<DifficultyIndicator compact showLabel={false} />
```

### Step 4: Record performance after each turn

```typescript
// After receiving AI analysis of user's speech
recordPerformance({
  pronunciation: 85,  // 0-100 score
  fluency: 78,        // 0-100 score
  grammar: 90,        // 0-100 score
  responseTime: 5000  // milliseconds (optional)
});
```

### Step 5: Use settings in AI prompts

```typescript
const systemPrompt = `You are an English teacher.

Difficulty settings:
- Vocabulary: ${difficultySettings.vocabularyComplexity}
- Sentences: ${difficultySettings.sentenceComplexity}
- Topics: ${difficultySettings.topicComplexity}

Adjust your language complexity accordingly.`;

// Also use for speech speed
const ttsConfig = {
  speed: difficultySettings.speechSpeed  // 0.7 to 1.0
};
```

## That's it!

The system will:
- Automatically track performance history
- Adjust difficulty when appropriate
- Show visual feedback to users
- Persist data across sessions

## What Happens Automatically

- Difficulty increases when user scores > 85% for 3+ sessions
- Difficulty decreases when user scores < 60% for 2+ sessions
- Recent performance weighted more heavily
- All data persisted to AsyncStorage
- Visual feedback updates in real-time

## Visual Feedback

The DifficultyIndicator shows:
- Current level (1-10)
- 10-segment bar (filled = active level)
- Trend arrow and color:
  - Green ↗ = Improving
  - Yellow → = Stable
  - Red ↘ = Declining

## Backend Integration

Your backend should receive and use the difficulty settings:

```python
@app.post("/api/conversation")
async def conversation(
    message: str,
    settings: dict
):
    # Use settings.vocabularyComplexity, sentenceComplexity, topicComplexity
    # for AI prompt customization

    # Use settings.speechSpeed for TTS configuration

    # Return performance scores for the mobile app to record
    return {
        "response": "...",
        "audio": "...",
        "analysis": {
            "pronunciation": 85,
            "fluency": 78,
            "grammar": 90
        }
    }
```

## Full Example

```typescript
import React from 'react';
import { View } from 'react-native';
import { useAdaptiveDifficulty } from '../hooks/useAdaptiveDifficulty';
import { DifficultyIndicator } from '../components/DifficultyIndicator';

export const ConversationScreen = () => {
  const { difficultySettings, recordPerformance } = useAdaptiveDifficulty();

  const handleUserMessage = async (transcript: string) => {
    // Send to backend with difficulty settings
    const response = await fetch('/api/conversation', {
      method: 'POST',
      body: JSON.stringify({
        message: transcript,
        settings: {
          vocabularyLevel: difficultySettings.vocabularyComplexity,
          sentenceLevel: difficultySettings.sentenceComplexity,
          topicLevel: difficultySettings.topicComplexity,
          speechSpeed: difficultySettings.speechSpeed,
        }
      })
    });

    const data = await response.json();

    // Record performance (automatically adjusts difficulty)
    recordPerformance({
      pronunciation: data.analysis.pronunciation,
      fluency: data.analysis.fluency,
      grammar: data.analysis.grammar,
    });

    // Play AI response audio, etc...
  };

  return (
    <View>
      {/* Header */}
      <View style={{ padding: 16 }}>
        <DifficultyIndicator compact showLabel={false} />
      </View>

      {/* Rest of your UI */}
    </View>
  );
};
```

## Optional: Manual Difficulty Control

If you want to let users manually adjust:

```typescript
const { difficultyLevel, adjustDifficulty } = useAdaptiveDifficulty();

// In your settings screen
<Slider
  value={difficultyLevel}
  minimumValue={1}
  maximumValue={10}
  step={1}
  onValueChange={adjustDifficulty}
/>
```

## Need Help?

See full documentation:
- `ADAPTIVE_DIFFICULTY_USAGE.md` - Complete usage guide
- `INTEGRATION_EXAMPLE.tsx` - Full screen example
- `ADAPTIVE_DIFFICULTY_SUMMARY.md` - Technical details

## Files Affected

Created:
- `/Users/matuskalis/vorex-mobile/src/hooks/useAdaptiveDifficulty.ts`
- `/Users/matuskalis/vorex-mobile/src/components/DifficultyIndicator.tsx`

Modified:
- `/Users/matuskalis/vorex-mobile/src/context/LearningContext.tsx`
- `/Users/matuskalis/vorex-mobile/src/hooks/index.ts`
