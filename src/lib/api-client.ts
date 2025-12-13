import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'https://speaksharp-core-production.up.railway.app';

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // User endpoints
  async getMe() {
    return this.request<{
      user_id: string;
      email: string;
      username: string;
      display_name: string | null;
      current_level: string;
      total_xp: number;
      avatar_url: string | null;
    }>('/api/users/me');
  }

  async getProgressSummary() {
    return this.request<{
      current_level: string;
      total_xp: number;
      streak_days: number;
      lessons_completed: number;
      weekly_progress: number[];
    }>('/api/progress/summary');
  }

  // Learning endpoints
  async getGuidedLearning() {
    return this.request<{
      units: Array<{
        unit_id: string;
        unit_number: number;
        title: string;
        description: string;
        level: string;
        is_locked: boolean;
        lessons: Array<{
          lesson_id: string;
          lesson_number: number;
          title: string;
          is_locked: boolean;
          completed: boolean;
        }>;
      }>;
    }>('/api/learn/guided');
  }

  async getLessonContent(lessonId: string) {
    return this.request<{
      lesson_id: string;
      title: string;
      exercises: Array<{
        id: string;
        type: string;
        content: any;
      }>;
    }>(`/api/learn/lesson/${lessonId}`);
  }

  async submitLessonResult(lessonId: string, data: {
    score: number;
    time_spent_seconds: number;
    mistakes_count: number;
  }) {
    return this.request('/api/learn/lesson/complete', {
      method: 'POST',
      body: JSON.stringify({ lesson_id: lessonId, ...data }),
    });
  }

  // Bonus endpoints
  async getBonusSummary() {
    return this.request<{
      total_bonus_xp_today: number;
      bonuses_claimed: Array<{ type: string; xp: number; multiplier: number }>;
      available_bonuses: {
        login_bonus: { available: boolean; xp: number };
        streak_bonus: { active: boolean; multiplier: number; streak_days: number };
        weekend_bonus: { active: boolean; multiplier: number };
        event_bonus: { active: boolean; name: string | null; multiplier: number };
      };
      current_multiplier: number;
    }>('/api/bonuses/summary');
  }

  async claimLoginBonus() {
    return this.request<{
      success: boolean;
      xp_earned: number;
      message: string;
    }>('/api/bonuses/claim-login', { method: 'POST' });
  }

  // Daily challenges
  async getTodayChallenge() {
    return this.request<{
      challenge_type: string;
      progress: number;
      goal: number;
      completed: boolean;
      xp_reward: number;
    }>('/api/challenges/today');
  }

  // Speech transcription - sends audio to backend for processing
  async transcribeAudio(audioUri: string): Promise<{
    success: boolean;
    transcript: string;
    error?: string;
  }> {
    try {
      const token = await this.getAuthToken();

      // Read the audio file and convert to base64
      const response = await fetch(audioUri);
      const blob = await response.blob();

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const apiResponse = await fetch(`${API_BASE_URL}/api/speech/transcribe`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json().catch(() => ({ detail: 'Transcription failed' }));
        return {
          success: false,
          transcript: '',
          error: error.detail || `HTTP ${apiResponse.status}`,
        };
      }

      const result = await apiResponse.json();
      return {
        success: true,
        transcript: result.transcript || '',
      };
    } catch (error) {
      return {
        success: false,
        transcript: '',
        error: error instanceof Error ? error.message : 'Unknown transcription error',
      };
    }
  }

  // Get tutor response for conversation
  async getTutorResponse(text: string, scenarioId?: string, sessionId?: string, turnNumber?: number): Promise<{
    success: boolean;
    message: string;
    errors: Array<{
      type: string;
      user_sentence: string;
      corrected_sentence: string;
      explanation: string;
    }>;
    session_id: string;
    error?: string;
  }> {
    try {
      const response = await this.request<{
        message: string;
        errors: Array<{
          type: string;
          user_sentence: string;
          corrected_sentence: string;
          explanation: string;
        }>;
        session_id: string;
      }>('/api/tutor/text', {
        method: 'POST',
        body: JSON.stringify({
          text,
          scenario_id: scenarioId,
          session_id: sessionId,
          turn_number: turnNumber,
          context: scenarioId ? `You are roleplaying in a ${scenarioId} scenario. Stay in character and respond naturally to what the user says.` : undefined,
        }),
      });

      return {
        success: true,
        message: response.message,
        errors: response.errors || [],
        session_id: response.session_id,
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        errors: [],
        session_id: '',
        error: error instanceof Error ? error.message : 'Failed to get tutor response',
      };
    }
  }

  // Synthesize text to speech using OpenAI TTS (human-like voice)
  async synthesizeSpeech(text: string): Promise<{
    success: boolean;
    audioUri: string | null;
    error?: string;
  }> {
    try {
      const token = await this.getAuthToken();

      // Fetch audio from API
      const response = await fetch(`${API_BASE_URL}/api/speech/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'TTS failed' }));
        return {
          success: false,
          audioUri: null,
          error: errorData.detail || `HTTP ${response.status}`,
        };
      }

      // Get audio as blob and convert to base64
      const blob = await response.blob();
      const reader = new FileReader();

      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix (data:audio/mpeg;base64,)
          const base64Only = base64.split(',')[1];
          resolve(base64Only);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Write to cache file
      const filename = `tts_${Date.now()}.mp3`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        success: true,
        audioUri: fileUri,
      };
    } catch (error) {
      return {
        success: false,
        audioUri: null,
        error: error instanceof Error ? error.message : 'TTS synthesis failed',
      };
    }
  }

  // Analyze speech for pronunciation and fluency
  async analyzeSpeech(audioUri: string, expectedText?: string): Promise<{
    success: boolean;
    transcript: string;
    pronunciation_score: number;
    fluency_score: number;
    mispronounced_words: string[];
    feedback: string;
    error?: string;
  }> {
    try {
      const token = await this.getAuthToken();

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      if (expectedText) {
        formData.append('expected_text', expectedText);
      }

      const apiResponse = await fetch(`${API_BASE_URL}/api/speech/analyze`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json().catch(() => ({ detail: 'Speech analysis failed' }));
        return {
          success: false,
          transcript: '',
          pronunciation_score: 0,
          fluency_score: 0,
          mispronounced_words: [],
          feedback: '',
          error: error.detail || `HTTP ${apiResponse.status}`,
        };
      }

      const result = await apiResponse.json();
      return {
        success: true,
        transcript: result.transcript || '',
        pronunciation_score: result.pronunciation_score || 0,
        fluency_score: result.fluency_score || 0,
        mispronounced_words: result.mispronounced_words || [],
        feedback: result.feedback || '',
      };
    } catch (error) {
      return {
        success: false,
        transcript: '',
        pronunciation_score: 0,
        fluency_score: 0,
        mispronounced_words: [],
        feedback: '',
        error: error instanceof Error ? error.message : 'Unknown analysis error',
      };
    }
  }

  /**
   * Analyze pronunciation with phoneme-level feedback
   * TODO: Backend endpoint needs to be implemented at /api/speech/analyze-pronunciation
   * For now, this will fall back to the standard speech analysis
   */
  async analyzePronunciation(audioUri: string, expectedText: string): Promise<{
    success: boolean;
    transcript: string;
    overall_score: number;
    pronunciation_score: number;
    fluency_score: number;
    phoneme_analysis?: Array<{
      phoneme: string;
      word: string;
      status: 'correct' | 'close' | 'incorrect';
      confidence: number;
      expected_ipa?: string;
      actual_ipa?: string;
    }>;
    word_scores?: Array<{
      word: string;
      score: number;
      issues?: string[];
    }>;
    feedback: string;
    error?: string;
  }> {
    try {
      const token = await this.getAuthToken();

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('expected_text', expectedText);

      // TODO: Update endpoint when backend implements phoneme-level analysis
      // For now, using the existing /api/speech/analyze endpoint
      const apiResponse = await fetch(`${API_BASE_URL}/api/speech/analyze-pronunciation`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        // Fallback to standard analysis if phoneme endpoint doesn't exist yet
        if (apiResponse.status === 404) {
          const standardResult = await this.analyzeSpeech(audioUri, expectedText);
          if (standardResult.success) {
            return {
              success: true,
              transcript: standardResult.transcript,
              overall_score: Math.round(
                (standardResult.pronunciation_score + standardResult.fluency_score) / 2
              ),
              pronunciation_score: standardResult.pronunciation_score,
              fluency_score: standardResult.fluency_score,
              feedback: standardResult.feedback,
              // Note: phoneme_analysis will be undefined, handled by client
            };
          }
        }

        const error = await apiResponse.json().catch(() => ({ detail: 'Pronunciation analysis failed' }));
        return {
          success: false,
          transcript: '',
          overall_score: 0,
          pronunciation_score: 0,
          fluency_score: 0,
          feedback: '',
          error: error.detail || `HTTP ${apiResponse.status}`,
        };
      }

      const result = await apiResponse.json();
      return {
        success: true,
        transcript: result.transcript || '',
        overall_score: result.overall_score || 0,
        pronunciation_score: result.pronunciation_score || 0,
        fluency_score: result.fluency_score || 0,
        phoneme_analysis: result.phoneme_analysis,
        word_scores: result.word_scores,
        feedback: result.feedback || '',
      };
    } catch (error) {
      // Final fallback to standard analysis
      try {
        const standardResult = await this.analyzeSpeech(audioUri, expectedText);
        if (standardResult.success) {
          return {
            success: true,
            transcript: standardResult.transcript,
            overall_score: Math.round(
              (standardResult.pronunciation_score + standardResult.fluency_score) / 2
            ),
            pronunciation_score: standardResult.pronunciation_score,
            fluency_score: standardResult.fluency_score,
            feedback: standardResult.feedback,
          };
        }
      } catch (fallbackError) {
        // Continue to error return below
      }

      return {
        success: false,
        transcript: '',
        overall_score: 0,
        pronunciation_score: 0,
        fluency_score: 0,
        feedback: '',
        error: error instanceof Error ? error.message : 'Unknown pronunciation analysis error',
      };
    }
  }
}

export const apiClient = new ApiClient();
