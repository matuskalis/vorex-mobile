import { supabase } from './supabase';

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
}

export const apiClient = new ApiClient();
