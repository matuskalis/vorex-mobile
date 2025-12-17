import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, LessonRecommendation } from '../lib/api-client';

// ============================================
// Types
// ============================================

interface WeakSkill {
  skill_key: string;
  name: string;
  domain: string;
  level: string;
  p_learned: number;
}

interface RecommendationContextValue {
  recommendations: LessonRecommendation[];
  weakSkills: WeakSkill[];
  srsDueCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// ============================================
// Context
// ============================================

const RecommendationContext = createContext<RecommendationContextValue | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface RecommendationProviderProps {
  children: ReactNode;
}

export function RecommendationProvider({ children }: RecommendationProviderProps) {
  const [recommendations, setRecommendations] = useState<LessonRecommendation[]>([]);
  const [weakSkills, setWeakSkills] = useState<WeakSkill[]>([]);
  const [srsDueCount, setSrsDueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getRecommendations();
      setRecommendations(data.recommendations);
      setWeakSkills(data.weak_skills || []);
      setSrsDueCount(data.srs_due_count || 0);
      setLastUpdated(new Date());
    } catch (err) {
      // Silently handle 404 - endpoint may not be deployed yet
      const isNotFound = err instanceof Error && err.message.includes('Not Found');
      if (!isNotFound) {
        console.error('Failed to fetch recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      }
      // Set defaults on error
      setRecommendations([]);
      setWeakSkills([]);
      setSrsDueCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const value: RecommendationContextValue = {
    recommendations,
    weakSkills,
    srsDueCount,
    isLoading,
    error,
    refresh: fetchRecommendations,
    lastUpdated,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useRecommendations(): RecommendationContextValue {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendations must be used within a RecommendationProvider');
  }
  return context;
}

// ============================================
// Utility Hooks
// ============================================

export function useTopRecommendation(): LessonRecommendation | null {
  const { recommendations } = useRecommendations();
  return recommendations.length > 0 ? recommendations[0] : null;
}

export function useSRSDueCount(): number {
  const { srsDueCount } = useRecommendations();
  return srsDueCount;
}

export function useHasDueReviews(): boolean {
  const { srsDueCount } = useRecommendations();
  return srsDueCount > 0;
}
