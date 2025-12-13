import { useMemo, useCallback } from 'react';
import { useLearning } from '../context/LearningContext';

export interface DifficultySettings {
  speechSpeed: number;
  vocabularyComplexity: string;
  sentenceComplexity: string;
  topicComplexity: string;
}

export interface PerformanceMetrics {
  pronunciation?: number;
  fluency?: number;
  grammar?: number;
  responseTime?: number;
}

export interface DifficultyTrend {
  trend: 'improving' | 'stable' | 'declining';
  averageScore: number;
  recentAverage: number;
}

export const useAdaptiveDifficulty = () => {
  const { state, recordPerformance, adjustDifficulty } = useLearning();

  const calculateAverage = useCallback((values: number[], weighted: boolean = false): number => {
    if (values.length === 0) return 0;

    if (!weighted) {
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    // Weight recent values more heavily (exponential decay)
    let weightedSum = 0;
    let totalWeight = 0;

    values.forEach((val, index) => {
      const weight = Math.pow(1.2, index); // More recent = higher weight
      weightedSum += val * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, []);

  const getOverallScore = useCallback((history: typeof state.performanceHistory): number => {
    const { pronunciationHistory, fluencyHistory, grammarHistory } = history;

    const allScores: number[] = [];
    const minLength = Math.min(
      pronunciationHistory.length,
      fluencyHistory.length,
      grammarHistory.length
    );

    for (let i = 0; i < minLength; i++) {
      const avgScore = (
        pronunciationHistory[i] +
        fluencyHistory[i] +
        grammarHistory[i]
      ) / 3;
      allScores.push(avgScore);
    }

    return calculateAverage(allScores, true);
  }, [calculateAverage]);

  const shouldAdjustDifficulty = useCallback((): { shouldAdjust: boolean; newLevel: number } => {
    const history = state.performanceHistory;
    const currentLevel = state.difficultyLevel;

    const overallScore = getOverallScore(history);

    // Need at least 3 data points for meaningful adjustment
    const minHistoryLength = Math.min(
      history.pronunciationHistory.length,
      history.fluencyHistory.length,
      history.grammarHistory.length
    );

    if (minHistoryLength < 3) {
      return { shouldAdjust: false, newLevel: currentLevel };
    }

    // Get recent average (last 3 sessions) vs overall average
    const recentScores = [];
    for (let i = Math.max(0, minHistoryLength - 3); i < minHistoryLength; i++) {
      const avgScore = (
        history.pronunciationHistory[i] +
        history.fluencyHistory[i] +
        history.grammarHistory[i]
      ) / 3;
      recentScores.push(avgScore);
    }
    const recentAverage = calculateAverage(recentScores, false);

    // Increase difficulty if performing well
    if (recentAverage > 85 && minHistoryLength >= 3) {
      return { shouldAdjust: true, newLevel: Math.min(10, currentLevel + 1) };
    }

    // Decrease difficulty if struggling
    if (recentAverage < 60 && minHistoryLength >= 2) {
      return { shouldAdjust: true, newLevel: Math.max(1, currentLevel - 1) };
    }

    return { shouldAdjust: false, newLevel: currentLevel };
  }, [state.performanceHistory, state.difficultyLevel, getOverallScore, calculateAverage]);

  const getDifficultyTrend = useCallback((): DifficultyTrend => {
    const history = state.performanceHistory;
    const overallScore = getOverallScore(history);

    const minHistoryLength = Math.min(
      history.pronunciationHistory.length,
      history.fluencyHistory.length,
      history.grammarHistory.length
    );

    if (minHistoryLength < 2) {
      return { trend: 'stable', averageScore: overallScore, recentAverage: overallScore };
    }

    // Get recent average (last 3 sessions)
    const recentScores = [];
    for (let i = Math.max(0, minHistoryLength - 3); i < minHistoryLength; i++) {
      const avgScore = (
        history.pronunciationHistory[i] +
        history.fluencyHistory[i] +
        history.grammarHistory[i]
      ) / 3;
      recentScores.push(avgScore);
    }
    const recentAverage = calculateAverage(recentScores, false);

    // Determine trend
    const difference = recentAverage - overallScore;
    let trend: 'improving' | 'stable' | 'declining';

    if (difference > 5) {
      trend = 'improving';
    } else if (difference < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return { trend, averageScore: overallScore, recentAverage };
  }, [state.performanceHistory, getOverallScore, calculateAverage]);

  const getDifficultySettings = useCallback((): DifficultySettings => {
    const level = state.difficultyLevel;

    // Speech speed: 0.7 (slow) to 1.0 (normal)
    const speechSpeed = 0.7 + (level - 1) * 0.033;

    // Vocabulary complexity
    let vocabularyComplexity: string;
    if (level <= 3) {
      vocabularyComplexity = 'basic';
    } else if (level <= 6) {
      vocabularyComplexity = 'intermediate';
    } else {
      vocabularyComplexity = 'advanced';
    }

    // Sentence complexity
    let sentenceComplexity: string;
    if (level <= 3) {
      sentenceComplexity = 'simple';
    } else if (level <= 6) {
      sentenceComplexity = 'moderate';
    } else {
      sentenceComplexity = 'complex';
    }

    // Topic complexity
    let topicComplexity: string;
    if (level <= 3) {
      topicComplexity = 'everyday';
    } else if (level <= 6) {
      topicComplexity = 'conversational';
    } else {
      topicComplexity = 'professional';
    }

    return {
      speechSpeed: Math.min(1.0, speechSpeed),
      vocabularyComplexity,
      sentenceComplexity,
      topicComplexity,
    };
  }, [state.difficultyLevel]);

  const recordPerformanceAndAdjust = useCallback((metrics: PerformanceMetrics) => {
    // Record the performance
    recordPerformance(metrics);

    // Check if we should adjust difficulty
    const { shouldAdjust, newLevel } = shouldAdjustDifficulty();

    if (shouldAdjust) {
      adjustDifficulty(newLevel);
    }
  }, [recordPerformance, shouldAdjustDifficulty, adjustDifficulty]);

  const currentSettings = useMemo(() => getDifficultySettings(), [getDifficultySettings]);
  const trend = useMemo(() => getDifficultyTrend(), [getDifficultyTrend]);

  return {
    difficultyLevel: state.difficultyLevel,
    difficultySettings: currentSettings,
    difficultyTrend: trend,
    recordPerformance: recordPerformanceAndAdjust,
    getDifficultySettings,
    adjustDifficulty,
  };
};
