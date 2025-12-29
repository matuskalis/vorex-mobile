import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'https://speaksharp-core-production.up.railway.app';

// Audio validation constants
const MIN_AUDIO_DURATION_SECONDS = 1.5;
const MIN_AUDIO_SIZE_BYTES = 5000; // ~5KB minimum for valid audio

/**
 * Validate audio file before upload.
 * Throws descriptive error if validation fails.
 */
async function validateAudioFile(audioUri: string): Promise<{ size: number }> {
  // Check file exists and get info
  const fileInfo = await FileSystem.getInfoAsync(audioUri);

  if (!fileInfo.exists) {
    throw new Error('Audio file does not exist');
  }

  if (!fileInfo.size || fileInfo.size < MIN_AUDIO_SIZE_BYTES) {
    throw new Error(`Audio file too small (${fileInfo.size || 0} bytes). Minimum: ${MIN_AUDIO_SIZE_BYTES} bytes. Please record for at least 1.5 seconds.`);
  }

  return { size: fileInfo.size };
}

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
      // Validate audio before upload
      await validateAudioFile(audioUri);

      const token = await this.getAuthToken();

      // Create FormData for multipart upload
      // Detect audio format from file extension
      // iOS expo-av records in CAF format, which OpenAI doesn't support
      const extension = audioUri.split('.').pop()?.toLowerCase() || 'wav';
      let mimeType = 'audio/wav';
      let fileName = 'recording.wav';
      if (extension === 'caf') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'm4a') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'mp3') {
        mimeType = 'audio/mpeg';
        fileName = 'recording.mp3';
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
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
      // Validate audio before upload
      await validateAudioFile(audioUri);

      const token = await this.getAuthToken();

      // Detect audio format from file extension
      // iOS expo-av records in CAF format, which OpenAI doesn't support
      const extension = audioUri.split('.').pop()?.toLowerCase() || 'wav';
      let mimeType = 'audio/wav';
      let fileName = 'recording.wav';
      if (extension === 'caf') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'm4a') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'mp3') {
        mimeType = 'audio/mpeg';
        fileName = 'recording.mp3';
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
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
   * CANONICAL WARMUP EVALUATION
   * Single source of truth for warm-up speech analysis.
   * Uses acoustic validity gate BEFORE ASR.
   *
   * Returns exactly one of two shapes:
   * A) Invalid: { valid: false, reason: string, debug: {...} }
   * B) Valid: { valid: true, transcript: string, fluency: number, debug: {...} }
   *
   * NO pronunciation score for warm-up (no target text).
   */
  async evaluateWarmup(audioUri: string): Promise<{
    valid: boolean;
    reason?: string;
    transcript?: string;
    fluency?: number;
    debug: {
      file_size: number;
      duration_ms: number;
      rms: number;
      peak: number;
      voiced_ms: number;
      sample_rate: number;
      transcript?: string;
      word_count?: number;
      error?: string;
    };
  }> {
    console.log('[CANONICAL] evaluateWarmup called');

    try {
      // Validate audio before upload
      await validateAudioFile(audioUri);

      const token = await this.getAuthToken();

      // Detect audio format from file extension
      const extension = audioUri.split('.').pop()?.toLowerCase() || 'wav';
      let mimeType = 'audio/wav';
      let fileName = 'recording.wav';
      if (extension === 'caf') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'm4a') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'mp3') {
        mimeType = 'audio/mpeg';
        fileName = 'recording.mp3';
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
      } as any);

      const apiResponse = await fetch(`${API_BASE_URL}/api/warmup/evaluate`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json().catch(() => ({ detail: 'Warmup evaluation failed' }));
        return {
          valid: false,
          reason: 'invalid_capture',
          debug: {
            file_size: 0,
            duration_ms: 0,
            rms: 0,
            peak: 0,
            voiced_ms: 0,
            sample_rate: 0,
            error: error.detail || `HTTP ${apiResponse.status}`,
          },
        };
      }

      const result = await apiResponse.json();
      console.log('[CANONICAL] Backend response:', result);
      return result;
    } catch (error) {
      console.error('[CANONICAL] evaluateWarmup error:', error);
      return {
        valid: false,
        reason: 'invalid_capture',
        debug: {
          file_size: 0,
          duration_ms: 0,
          rms: 0,
          peak: 0,
          voiced_ms: 0,
          sample_rate: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
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
      // Validate audio before upload
      await validateAudioFile(audioUri);

      const token = await this.getAuthToken();

      // Detect audio format from file extension
      // iOS expo-av records in CAF format, which OpenAI doesn't support
      const extension = audioUri.split('.').pop()?.toLowerCase() || 'wav';
      let mimeType = 'audio/wav';
      let fileName = 'recording.wav';
      if (extension === 'caf') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'm4a') {
        mimeType = 'audio/m4a';
        fileName = 'recording.m4a';
      } else if (extension === 'mp3') {
        mimeType = 'audio/mpeg';
        fileName = 'recording.mp3';
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
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

  // ============================================
  // SRS (Spaced Repetition System) Endpoints
  // ============================================

  /**
   * Get SRS cards due for review
   */
  async getSRSDueCards(limit: number = 20): Promise<{
    cards: SRSCard[];
    total_due: number;
  }> {
    return this.request<{
      cards: SRSCard[];
      total_due: number;
    }>(`/api/srs/due?limit=${limit}`);
  }

  /**
   * Submit a review for an SRS card
   */
  async submitSRSReview(
    cardId: string,
    quality: number,
    options?: {
      response_time_ms?: number;
      was_audio?: boolean;
    }
  ): Promise<{
    success: boolean;
    card: SRSCard;
    next_review: string;
    interval_days: number;
  }> {
    return this.request<{
      success: boolean;
      card: SRSCard;
      next_review: string;
      interval_days: number;
    }>('/api/srs/review', {
      method: 'POST',
      body: JSON.stringify({
        card_id: cardId,
        quality,
        ...options,
      }),
    });
  }

  /**
   * Create an SRS card from a grammar/pronunciation error
   */
  async createSRSCardFromError(errorId: string): Promise<{
    success: boolean;
    card: SRSCard;
  }> {
    return this.request<{
      success: boolean;
      card: SRSCard;
    }>(`/api/srs/from-error/${errorId}`, {
      method: 'POST',
    });
  }

  /**
   * Get SRS statistics
   */
  async getSRSStats(): Promise<{
    total_cards: number;
    cards_due_today: number;
    cards_learned: number;
    cards_learning: number;
    average_retention: number;
    streak_days: number;
  }> {
    return this.request('/api/srs/stats');
  }

  // ============================================
  // Session Endpoints
  // ============================================

  /**
   * Save a practice session result
   */
  async saveSessionResult(data: SessionSaveData): Promise<{
    success: boolean;
    session_id: string;
    xp_earned: number;
    streak_updated: boolean;
  }> {
    return this.request<{
      success: boolean;
      session_id: string;
      xp_earned: number;
      streak_updated: boolean;
    }>('/api/sessions/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get session history with optional filters
   */
  async getSessionHistory(options?: {
    limit?: number;
    offset?: number;
    scenario_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    sessions: SessionHistoryItem[];
    total: number;
    has_more: boolean;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.scenario_id) params.append('scenario_id', options.scenario_id);
    if (options?.date_from) params.append('date_from', options.date_from);
    if (options?.date_to) params.append('date_to', options.date_to);

    const queryString = params.toString();
    return this.request<{
      sessions: SessionHistoryItem[];
      total: number;
      has_more: boolean;
    }>(`/api/sessions/history${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get aggregated session statistics
   */
  async getSessionStats(period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<SessionStats> {
    return this.request<SessionStats>(`/api/sessions/stats?period=${period}`);
  }

  /**
   * Get daily breakdown for progress visualization
   */
  async getDailyBreakdown(days: number = 7): Promise<{
    days: DailyBreakdownItem[];
    totals: {
      sessions: number;
      minutes: number;
      xp: number;
    };
  }> {
    return this.request(`/api/sessions/daily-breakdown?days=${days}`);
  }

  // ============================================
  // Recommendation Endpoints
  // ============================================

  /**
   * Get AI-powered lesson recommendations
   */
  async getRecommendations(): Promise<{
    recommendations: LessonRecommendation[];
    reasoning: string;
    weak_skills?: Array<{
      skill_key: string;
      name: string;
      domain: string;
      level: string;
      p_learned: number;
    }>;
    srs_due_count?: number;
  }> {
    return this.request('/api/recommendations');
  }

  /**
   * Get scenarios with completion status
   */
  async getScenariosWithProgress(): Promise<{
    scenarios: ScenarioWithProgress[];
  }> {
    return this.request('/api/practice/scenarios');
  }

  // ============================================
  // Self-Assessment Practice Endpoints
  // ============================================

  /**
   * Record a practice attempt with self-assessment
   */
  async recordPracticeAttempt(data: {
    phrase_id: string;
    self_rating: 'good' | 'retry';
    attempt_count: number;
    problem_words: string[];
  }): Promise<{
    success: boolean;
    phrase_id: string;
    self_rating: string;
    problem_words_recorded: number;
  }> {
    return this.request('/api/practice/attempt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get user's problem words (most struggled with)
   */
  async getProblemWords(): Promise<{
    problem_words: Array<{
      word: string;
      occurrences: number;
      last_seen: string | null;
    }>;
  }> {
    return this.request('/api/practice/problem-words');
  }

  // ============================================
  // Streak & Progress Endpoints
  // ============================================

  /**
   * Record activity and update streak.
   * Call when user completes practice session.
   */
  async recordActivity(): Promise<{
    current_streak: number;
    longest_streak: number;
    last_active_date: string;
    total_days_active: number;
    freeze_days_available: number;
  }> {
    return this.request('/api/streaks/record-activity', {
      method: 'POST',
    });
  }

  /**
   * Update daily goal progress (study minutes, etc.)
   */
  async updateGoalProgress(progress: {
    study_minutes?: number;
    lessons?: number;
    reviews?: number;
    drills?: number;
  }): Promise<{
    goal: {
      user_id: string;
      date: string;
      study_minutes: { target: number; progress: number };
      lessons: { target: number; progress: number };
      reviews: { target: number; progress: number };
      drills: { target: number; progress: number };
    };
  }> {
    return this.request('/api/goals/today/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  /**
   * Get today's goal with actual progress
   */
  async getTodayGoal(): Promise<{
    goal_id: string;
    goal_date: string;
    target_study_minutes: number;
    target_lessons: number;
    target_reviews: number;
    target_drills: number;
    actual_study_minutes: number;
    actual_lessons: number;
    actual_reviews: number;
    actual_drills: number;
    completed: boolean;
    completion_percentage: number;
  }> {
    return this.request('/api/goals/today');
  }

  /**
   * Record XP earned from activity
   */
  async recordXP(data: {
    xp_earned: number;
    bonus_xp?: number;
    source: string;
    details?: string;
  }): Promise<{
    xp_added: number;
    total_xp: number;
    level: number;
    level_progress: number;
  }> {
    return this.request('/api/xp/record', {
      method: 'POST',
      body: JSON.stringify({
        xp_earned: data.xp_earned,
        bonus_xp: data.bonus_xp || 0,
        source: data.source,
        details: data.details || '',
      }),
    });
  }

  // ============================================
  // Skills Endpoints
  // ============================================

  /**
   * Get user's skill profile including XP, levels, and progress
   */
  async getSkillProfile(): Promise<SkillProfile> {
    return this.request('/api/skills/profile');
  }
}

// ============================================
// Type Definitions
// ============================================

export interface SRSCard {
  card_id: string;
  user_id: string;
  front: string;
  back: string;
  card_type: 'vocabulary' | 'grammar' | 'pronunciation';
  source_error_id?: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
  last_review?: string;
  created_at: string;
}

export interface SessionSaveData {
  scenario_id: string;
  duration_seconds: number;
  turns_count: number;
  pronunciation_score?: number;
  fluency_score?: number;
  grammar_errors: Array<{
    type: string;
    user_sentence: string;
    corrected_sentence: string;
    explanation: string;
  }>;
  pronunciation_errors?: string[];
  completed: boolean;
}

export interface SessionHistoryItem {
  session_id: string;
  scenario_id: string;
  scenario_title: string;
  started_at: string;
  duration_seconds: number;
  turns_count: number;
  pronunciation_score?: number;
  fluency_score?: number;
  grammar_error_count: number;
  xp_earned: number;
  completed: boolean;
}

export interface SessionStats {
  total_sessions: number;
  total_minutes: number;
  total_xp: number;
  average_pronunciation: number;
  average_fluency: number;
  most_practiced_scenario: string | null;
  sessions_by_day: Record<string, number>;
  pronunciation_trend: number[];
  grammar_improvement: number;
}

export interface DailyBreakdownItem {
  date: string;
  sessions: number;
  minutes: number;
  xp: number;
  pronunciation_avg?: number;
}

export interface LessonRecommendation {
  lesson_id?: string;
  scenario_id?: string;
  type: 'lesson' | 'practice' | 'review';
  title: string;
  description: string;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_minutes: number;
  priority: number;
}

export interface ScenarioWithProgress {
  scenario_id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  estimated_minutes: number;
  times_practiced: number;
  last_practiced?: string;
  best_pronunciation_score?: number;
  completed: boolean;
}

export interface SkillProfile {
  total_xp: number;
  overall_level: number;
  skills: Record<string, {
    level: number;
    xp: number;
    p_learned: number;
  }>;
  unlocked_content: string[];
  earned_achievements: string[];
}

export const apiClient = new ApiClient();
