/**
 * INTEGRATION EXAMPLE - Adaptive Difficulty System
 * This file shows how to integrate the adaptive difficulty system into a conversation screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAdaptiveDifficulty } from './src/hooks/useAdaptiveDifficulty';
import { DifficultyIndicator } from './src/components/DifficultyIndicator';
import { THEME } from './src/context/LearningContext';

// Example Conversation Screen Component
export const ConversationScreen = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Get adaptive difficulty hook
  const {
    difficultyLevel,
    difficultySettings,
    difficultyTrend,
    recordPerformance,
  } = useAdaptiveDifficulty();

  // Example: Generate AI system prompt based on difficulty settings
  const getSystemPrompt = () => {
    const { vocabularyComplexity, sentenceComplexity, topicComplexity } = difficultySettings;

    return `You are an AI English conversation partner for a language learning app.

Current learner level:
- Vocabulary: ${vocabularyComplexity}
- Sentence structure: ${sentenceComplexity}
- Topic complexity: ${topicComplexity}

Instructions:
1. Adjust your vocabulary to match the ${vocabularyComplexity} level
2. Use ${sentenceComplexity} sentence structures
3. Discuss ${topicComplexity} topics
4. Provide gentle corrections when needed
5. Encourage the learner and maintain a supportive tone

Remember: The difficulty automatically adjusts based on performance, so stay within the specified level.`;
  };

  // Example: Send message to AI with difficulty settings
  const sendMessageToAI = async (userMessage: string) => {
    try {
      const response = await fetch('https://your-api.railway.app/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: getSystemPrompt(),
          settings: {
            speechSpeed: difficultySettings.speechSpeed,
            vocabularyLevel: difficultySettings.vocabularyComplexity,
            sentenceLevel: difficultySettings.sentenceComplexity,
            topicLevel: difficultySettings.topicComplexity,
          },
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  // Example: Handle conversation turn completion
  const handleConversationTurn = async (userTranscript: string, startTime: number) => {
    // 1. Send message to AI
    const aiResponse = await sendMessageToAI(userTranscript);

    if (!aiResponse) return;

    // 2. Get performance analysis from AI
    // This would come from your backend analysis
    const performanceAnalysis = {
      pronunciationScore: aiResponse.analysis?.pronunciation || 75,
      fluencyScore: aiResponse.analysis?.fluency || 80,
      grammarScore: aiResponse.analysis?.grammar || 85,
      responseTime: Date.now() - startTime,
    };

    // 3. Record performance (this automatically adjusts difficulty if needed)
    recordPerformance({
      pronunciation: performanceAnalysis.pronunciationScore,
      fluency: performanceAnalysis.fluencyScore,
      grammar: performanceAnalysis.grammarScore,
      responseTime: performanceAnalysis.responseTime,
    });

    // 4. Add messages to conversation
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userTranscript },
      { role: 'assistant', content: aiResponse.message },
    ]);
  };

  // Example: Start recording
  const startRecording = () => {
    setIsRecording(true);
    // Your voice recording logic here
  };

  // Example: Stop recording and process
  const stopRecording = async () => {
    setIsRecording(false);
    const startTime = Date.now();

    // Your voice-to-text logic here
    const transcript = "Hello, how are you today?"; // Example transcript

    await handleConversationTurn(transcript, startTime);
  };

  return (
    <View style={styles.container}>
      {/* Header with Difficulty Indicator */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Conversation Practice</Text>
          <Text style={styles.levelBadge}>Level {difficultyLevel}</Text>
        </View>

        {/* Compact difficulty indicator */}
        <DifficultyIndicator compact showLabel={false} />

        {/* Show current settings (for debugging/transparency) */}
        <Text style={styles.settingsText}>
          {difficultySettings.vocabularyComplexity} vocabulary • {difficultySettings.topicComplexity} topics
        </Text>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.message,
              msg.role === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Recording Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop' : 'Start Speaking'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Optional: Show trend for user feedback */}
      {difficultyTrend.trend === 'improving' && (
        <View style={styles.trendNotification}>
          <Text style={styles.trendNotificationText}>
            Great progress! Your performance is improving.
          </Text>
        </View>
      )}
    </View>
  );
};

// Example Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    padding: 16,
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.accent,
    backgroundColor: `${THEME.accent}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settingsText: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: THEME.accent,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.card,
  },
  messageText: {
    color: THEME.text,
    fontSize: 15,
  },
  footer: {
    padding: 16,
    backgroundColor: THEME.card,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  recordButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: THEME.error,
  },
  recordButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
  trendNotification: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: THEME.success,
    padding: 12,
    borderRadius: 8,
  },
  trendNotificationText: {
    color: THEME.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});

/**
 * BACKEND INTEGRATION EXAMPLE (FastAPI)
 *
 * Here's how your FastAPI backend should handle the difficulty settings:
 */

/*
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai

app = FastAPI()

class ConversationRequest(BaseModel):
    message: str
    systemPrompt: str
    settings: dict

@app.post("/api/conversation")
async def conversation(request: ConversationRequest):
    try:
        # Use the system prompt that includes difficulty settings
        messages = [
            {"role": "system", "content": request.systemPrompt},
            {"role": "user", "content": request.message}
        ]

        # Call OpenAI API
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=messages,
            temperature=0.7,
        )

        ai_message = response.choices[0].message.content

        # Analyze user's message for performance metrics
        analysis = await analyze_language_performance(request.message)

        # Generate audio with adjusted speech speed
        audio = await generate_speech(
            ai_message,
            speed=request.settings['speechSpeed']
        )

        return {
            "message": ai_message,
            "audio": audio,
            "analysis": analysis
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def analyze_language_performance(text: str):
    # Use AI to analyze the user's performance
    # This is where you'd implement pronunciation, fluency, and grammar analysis
    # Could use additional AI models or services

    analysis_prompt = f'''Analyze this English learner's message and provide scores (0-100):

    Message: "{text}"

    Provide scores for:
    1. Pronunciation (based on word choice complexity)
    2. Fluency (based on sentence flow)
    3. Grammar (based on grammatical correctness)

    Return as JSON: {{"pronunciation": X, "fluency": Y, "grammar": Z}}
    '''

    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=[{"role": "user", "content": analysis_prompt}],
        response_format={"type": "json_object"}
    )

    return response.choices[0].message.content
*/

/**
 * USAGE IN EXISTING VOICE HOOK
 *
 * If you're using the existing useRealtimeVoice hook, you can integrate like this:
 */

/*
import { useRealtimeVoice } from './src/hooks/useRealtimeVoice';
import { useAdaptiveDifficulty } from './src/hooks/useAdaptiveDifficulty';

const YourScreen = () => {
  const { difficultySettings, recordPerformance } = useAdaptiveDifficulty();
  const { startRecording, stopRecording } = useRealtimeVoice({
    onTranscript: async (transcript, analysis) => {
      // Record performance after each turn
      if (analysis) {
        recordPerformance({
          pronunciation: analysis.pronunciation,
          fluency: analysis.fluency,
          grammar: analysis.grammar,
          responseTime: analysis.responseTime,
        });
      }
    },
    // Pass difficulty settings to voice config
    voiceConfig: {
      speechSpeed: difficultySettings.speechSpeed,
    },
  });

  // Rest of your component
};
*/
