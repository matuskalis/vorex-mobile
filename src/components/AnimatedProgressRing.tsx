import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, darkTheme, textStyles } from '../theme';
import { timing, easings } from '../utils/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  label?: string;
  labelColor?: string;
  animationDuration?: number;
  children?: React.ReactNode;
}

export function AnimatedProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color = colors.primary[500],
  backgroundColor = darkTheme.colors.border.default,
  showValue = false,
  valueFormatter = (v) => `${Math.round(v)}%`,
  label,
  labelColor = darkTheme.colors.text.tertiary,
  animationDuration = timing.slow,
  children,
}: AnimatedProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: animationDuration,
      easing: easings.easeInOut,
    });
  }, [progress, animationDuration]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={styles.svg}
      >
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </G>
      </Svg>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {children ? (
          children
        ) : showValue ? (
          <>
            <Text style={[styles.valueText, { color }]}>
              {valueFormatter(progress * 100)}
            </Text>
            {label && (
              <Text style={[styles.labelText, { color: labelColor }]}>
                {label}
              </Text>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}

// Variant for smaller metric displays
interface MetricRingProps {
  value: number;
  label: string;
  color?: string;
  size?: number;
}

export function AnimatedMetricRing({
  value,
  label,
  color = colors.primary[500],
  size = 68,
}: MetricRingProps) {
  return (
    <View style={styles.metricContainer}>
      <AnimatedProgressRing
        progress={value / 100}
        size={size}
        strokeWidth={6}
        color={color}
        showValue
        valueFormatter={(v) => `${Math.round(v)}%`}
      />
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// Level ring variant with XP progress
interface LevelRingProps {
  level: number;
  xpProgress: number;
  size?: number;
}

export function AnimatedLevelRing({
  level,
  xpProgress,
  size = 100,
}: LevelRingProps) {
  return (
    <AnimatedProgressRing
      progress={xpProgress}
      size={size}
      strokeWidth={6}
      color={colors.primary[500]}
    >
      <View style={styles.levelContent}>
        <Text style={styles.levelNumber}>{level}</Text>
        <Text style={styles.levelLabel}>LVL</Text>
      </View>
    </AnimatedProgressRing>
  );
}

// Daily goal ring variant
interface GoalRingProps {
  current: number;
  goal: number;
  size?: number;
}

export function AnimatedGoalRing({
  current,
  goal,
  size = 80,
}: GoalRingProps) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const isComplete = current >= goal;

  return (
    <AnimatedProgressRing
      progress={progress}
      size={size}
      strokeWidth={6}
      color={isComplete ? colors.success[500] : colors.primary[500]}
    >
      <View style={styles.goalContent}>
        <Text style={[
          styles.goalValue,
          isComplete && { color: colors.success[500] }
        ]}>
          {current}
        </Text>
        <Text style={styles.goalUnit}>/{goal}m</Text>
      </View>
    </AnimatedProgressRing>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelText: {
    fontSize: textStyles.caption.fontSize,
    marginTop: 2,
  },
  metricContainer: {
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },
  levelContent: {
    alignItems: 'center',
  },
  levelNumber: {
    color: darkTheme.colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  levelLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  goalContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  goalValue: {
    color: darkTheme.colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  goalUnit: {
    color: darkTheme.colors.text.tertiary,
    fontSize: 12,
  },
});

export default AnimatedProgressRing;
