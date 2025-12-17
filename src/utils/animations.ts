import {
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  WithTimingConfig,
  WithSpringConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ============================================
// Animation Timing Presets
// ============================================

export const timing = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

// ============================================
// Easing Presets
// ============================================

export const easings = {
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
} as const;

// ============================================
// Animation Config Presets
// ============================================

export const timingConfigs: Record<string, WithTimingConfig> = {
  fast: {
    duration: timing.fast,
    easing: easings.easeOut,
  },
  normal: {
    duration: timing.normal,
    easing: easings.easeOut,
  },
  slow: {
    duration: timing.slow,
    easing: easings.easeInOut,
  },
  fadeIn: {
    duration: timing.normal,
    easing: easings.easeIn,
  },
  fadeOut: {
    duration: timing.fast,
    easing: easings.easeOut,
  },
};

export const springConfigs: Record<string, WithSpringConfig> = {
  gentle: {
    damping: 15,
    stiffness: 100,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 0.8,
  },
  snappy: {
    damping: 20,
    stiffness: 250,
    mass: 0.5,
  },
  wobbly: {
    damping: 8,
    stiffness: 120,
    mass: 1,
  },
};

// ============================================
// Animation Builder Functions
// ============================================

export const animate = {
  fadeIn: (delay = 0) =>
    withDelay(delay, withTiming(1, timingConfigs.fadeIn)),

  fadeOut: (delay = 0) =>
    withDelay(delay, withTiming(0, timingConfigs.fadeOut)),

  slideInUp: (delay = 0) =>
    withDelay(delay, withSpring(0, springConfigs.gentle)),

  slideInDown: (delay = 0) =>
    withDelay(delay, withSpring(0, springConfigs.gentle)),

  scale: (toValue: number, config = springConfigs.bouncy) =>
    withSpring(toValue, config),

  scaleIn: (delay = 0) =>
    withDelay(delay, withSpring(1, springConfigs.bouncy)),

  scaleOut: (delay = 0) =>
    withDelay(delay, withTiming(0, timingConfigs.fast)),

  press: () =>
    withSequence(
      withTiming(0.95, { duration: 50 }),
      withSpring(1, springConfigs.snappy)
    ),

  pulse: () =>
    withSequence(
      withTiming(1.1, { duration: 150 }),
      withSpring(1, springConfigs.bouncy)
    ),

  shake: () =>
    withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 50 })
    ),

  progressFill: (toValue: number, duration = timing.slow) =>
    withTiming(toValue, {
      duration,
      easing: easings.easeInOut,
    }),
};

// ============================================
// Staggered Animation Helpers
// ============================================

export const stagger = {
  delay: (index: number, baseDelay = 50) => index * baseDelay,

  fadeIn: (index: number, baseDelay = 50) =>
    animate.fadeIn(index * baseDelay),

  slideIn: (index: number, baseDelay = 50) =>
    animate.slideInUp(index * baseDelay),

  scaleIn: (index: number, baseDelay = 50) =>
    animate.scaleIn(index * baseDelay),
};

// ============================================
// Haptic Feedback Helpers
// ============================================

export const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};

// ============================================
// Combined Animation + Haptic Helpers
// ============================================

export const feedback = {
  tap: async () => {
    await haptic.light();
    return animate.press();
  },

  success: async () => {
    await haptic.success();
    return animate.pulse();
  },

  error: async () => {
    await haptic.error();
    return animate.shake();
  },

  selection: async () => {
    await haptic.selection();
  },
};

// ============================================
// Progress Ring Animation Value Calculator
// ============================================

export const calculateProgressDashOffset = (
  progress: number,
  circumference: number
): number => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return circumference * (1 - clampedProgress);
};

// ============================================
// Entering/Exiting Animation Presets
// (For use with Animated.View entering/exiting props)
// ============================================

export const enteringAnimations = {
  fadeInUp: {
    opacity: { from: 0, to: 1 },
    transform: [{ translateY: { from: 20, to: 0 } }],
  },
  fadeInDown: {
    opacity: { from: 0, to: 1 },
    transform: [{ translateY: { from: -20, to: 0 } }],
  },
  fadeInLeft: {
    opacity: { from: 0, to: 1 },
    transform: [{ translateX: { from: -20, to: 0 } }],
  },
  fadeInRight: {
    opacity: { from: 0, to: 1 },
    transform: [{ translateX: { from: 20, to: 0 } }],
  },
  scaleIn: {
    opacity: { from: 0, to: 1 },
    transform: [{ scale: { from: 0.9, to: 1 } }],
  },
  zoomIn: {
    opacity: { from: 0, to: 1 },
    transform: [{ scale: { from: 0, to: 1 } }],
  },
};

export const exitingAnimations = {
  fadeOutUp: {
    opacity: { from: 1, to: 0 },
    transform: [{ translateY: { from: 0, to: -20 } }],
  },
  fadeOutDown: {
    opacity: { from: 1, to: 0 },
    transform: [{ translateY: { from: 0, to: 20 } }],
  },
  fadeOutLeft: {
    opacity: { from: 1, to: 0 },
    transform: [{ translateX: { from: 0, to: -20 } }],
  },
  fadeOutRight: {
    opacity: { from: 1, to: 0 },
    transform: [{ translateX: { from: 0, to: 20 } }],
  },
  scaleOut: {
    opacity: { from: 1, to: 0 },
    transform: [{ scale: { from: 1, to: 0.9 } }],
  },
  zoomOut: {
    opacity: { from: 1, to: 0 },
    transform: [{ scale: { from: 1, to: 0 } }],
  },
};
