export {
  AccessibilityProvider,
  useAccessibility,
  useScaledText,
  useReducedMotion,
  useHapticEnabled,
  useHighContrast,
} from './AccessibilityContext';
export type { AccessibilitySettings, TextSizeScale } from './AccessibilityContext';

export {
  RecommendationProvider,
  useRecommendations,
  useTopRecommendation,
  useSRSDueCount as useRecommendationSRSDueCount,
  useHasDueReviews,
} from './RecommendationContext';

export {
  SRSProvider,
  useSRS,
  useSRSStats,
  useSRSDueCount,
  useCurrentCard,
  useSessionProgress,
  useHasCardsToReview,
} from './SRSContext';
