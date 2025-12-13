import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAdaptiveDifficulty } from '../hooks/useAdaptiveDifficulty';
import { THEME } from '../context/LearningContext';

interface DifficultyIndicatorProps {
  showLabel?: boolean;
  compact?: boolean;
}

export const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({
  showLabel = true,
  compact = false,
}) => {
  const { difficultyLevel, difficultyTrend } = useAdaptiveDifficulty();

  const getTrendColor = () => {
    switch (difficultyTrend.trend) {
      case 'improving':
        return THEME.success;
      case 'declining':
        return THEME.error;
      case 'stable':
      default:
        return THEME.warning;
    }
  };

  const getTrendIcon = () => {
    switch (difficultyTrend.trend) {
      case 'improving':
        return '↗';
      case 'declining':
        return '↘';
      case 'stable':
      default:
        return '→';
    }
  };

  const trendColor = getTrendColor();
  const trendIcon = getTrendIcon();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {showLabel && (
        <Text style={styles.label}>Difficulty Level</Text>
      )}

      <View style={styles.barContainer}>
        {/* Difficulty Bar */}
        <View style={styles.barBackground}>
          {Array.from({ length: 10 }).map((_, index) => {
            const segmentLevel = index + 1;
            const isActive = segmentLevel <= difficultyLevel;

            return (
              <View
                key={index}
                style={[
                  styles.barSegment,
                  isActive && { backgroundColor: trendColor },
                  index < 9 && styles.barSegmentGap,
                ]}
              />
            );
          })}
        </View>

        {/* Level and Trend Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.levelText}>{difficultyLevel}/10</Text>
          <View style={styles.trendContainer}>
            <Text style={[styles.trendIcon, { color: trendColor }]}>
              {trendIcon}
            </Text>
            {!compact && (
              <Text style={[styles.trendText, { color: trendColor }]}>
                {difficultyTrend.trend}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  containerCompact: {
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barContainer: {
    gap: 8,
  },
  barBackground: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: THEME.card,
  },
  barSegment: {
    flex: 1,
    backgroundColor: '#2a2a2a',
  },
  barSegmentGap: {
    marginRight: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
