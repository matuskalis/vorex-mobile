import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, SRSCard } from '../lib/api-client';

// ============================================
// Types
// ============================================

interface SRSStats {
  total_cards: number;
  cards_due_today: number;
  cards_learned: number;
  cards_learning: number;
  average_retention: number;
  streak_days: number;
}

interface ReviewResult {
  success: boolean;
  card: SRSCard;
  next_review: string;
  interval_days: number;
}

interface SRSContextValue {
  // State
  dueCards: SRSCard[];
  currentCard: SRSCard | null;
  stats: SRSStats | null;
  isLoading: boolean;
  isReviewing: boolean;
  error: string | null;

  // Review session state
  sessionProgress: {
    reviewed: number;
    correct: number;
    total: number;
  };

  // Actions
  fetchDueCards: (limit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  submitReview: (quality: number, responseTimeMs?: number) => Promise<ReviewResult | null>;
  nextCard: () => void;
  startSession: () => Promise<void>;
  endSession: () => void;
  createCardFromError: (errorId: string) => Promise<SRSCard | null>;
  refresh: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const SRSContext = createContext<SRSContextValue | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface SRSProviderProps {
  children: ReactNode;
}

export function SRSProvider({ children }: SRSProviderProps) {
  // State
  const [dueCards, setDueCards] = useState<SRSCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [stats, setStats] = useState<SRSStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session progress
  const [sessionProgress, setSessionProgress] = useState({
    reviewed: 0,
    correct: 0,
    total: 0,
  });

  // Current card
  const currentCard = dueCards.length > 0 && currentCardIndex < dueCards.length
    ? dueCards[currentCardIndex]
    : null;

  // Fetch due cards from backend
  const fetchDueCards = useCallback(async (limit: number = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSRSDueCards(limit);
      setDueCards(data.cards);
      setCurrentCardIndex(0);
      setSessionProgress(prev => ({
        ...prev,
        total: data.total_due,
      }));
    } catch (err) {
      console.error('Failed to fetch due cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch SRS stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.getSRSStats();
      setStats(data);
    } catch (err) {
      // Silently handle 404 - endpoint may not be deployed yet
      const isNotFound = err instanceof Error && err.message.includes('Not Found');
      if (!isNotFound) {
        console.error('Failed to fetch SRS stats:', err);
      }
      // Set default stats on error
      setStats({
        total_cards: 0,
        cards_due_today: 0,
        cards_learned: 0,
        cards_learning: 0,
        average_retention: 0,
        streak_days: 0,
      });
    }
  }, []);

  // Submit a review
  const submitReview = useCallback(async (
    quality: number,
    responseTimeMs?: number
  ): Promise<ReviewResult | null> => {
    if (!currentCard) return null;

    setIsReviewing(true);
    setError(null);

    try {
      const result = await apiClient.submitSRSReview(
        currentCard.card_id,
        quality,
        { response_time_ms: responseTimeMs }
      );

      // Update session progress
      setSessionProgress(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      }));

      // Update the card in the list
      setDueCards(prev => prev.map(card =>
        card.card_id === currentCard.card_id ? result.card : card
      ));

      return result;
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      return null;
    } finally {
      setIsReviewing(false);
    }
  }, [currentCard]);

  // Move to next card
  const nextCard = useCallback(() => {
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [currentCardIndex, dueCards.length]);

  // Start a review session
  const startSession = useCallback(async () => {
    setSessionProgress({ reviewed: 0, correct: 0, total: 0 });
    setCurrentCardIndex(0);
    await fetchDueCards();
  }, [fetchDueCards]);

  // End review session
  const endSession = useCallback(() => {
    setDueCards([]);
    setCurrentCardIndex(0);
    // Refresh stats after session
    fetchStats();
  }, [fetchStats]);

  // Create card from error
  const createCardFromError = useCallback(async (errorId: string): Promise<SRSCard | null> => {
    try {
      const result = await apiClient.createSRSCardFromError(errorId);
      if (result.success) {
        // Refresh stats to reflect new card
        fetchStats();
        return result.card;
      }
      return null;
    } catch (err) {
      console.error('Failed to create card from error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create card');
      return null;
    }
  }, [fetchStats]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchDueCards(), fetchStats()]);
  }, [fetchDueCards, fetchStats]);

  // Initial fetch of stats
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const value: SRSContextValue = {
    dueCards,
    currentCard,
    stats,
    isLoading,
    isReviewing,
    error,
    sessionProgress,
    fetchDueCards,
    fetchStats,
    submitReview,
    nextCard,
    startSession,
    endSession,
    createCardFromError,
    refresh,
  };

  return (
    <SRSContext.Provider value={value}>
      {children}
    </SRSContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================

export function useSRS(): SRSContextValue {
  const context = useContext(SRSContext);
  if (!context) {
    throw new Error('useSRS must be used within an SRSProvider');
  }
  return context;
}

// ============================================
// Utility Hooks
// ============================================

export function useSRSStats(): SRSStats | null {
  const { stats } = useSRS();
  return stats;
}

export function useSRSDueCount(): number {
  const { stats } = useSRS();
  return stats?.cards_due_today ?? 0;
}

export function useCurrentCard(): SRSCard | null {
  const { currentCard } = useSRS();
  return currentCard;
}

export function useSessionProgress() {
  const { sessionProgress } = useSRS();
  return sessionProgress;
}

export function useHasCardsToReview(): boolean {
  const { stats } = useSRS();
  return (stats?.cards_due_today ?? 0) > 0;
}
