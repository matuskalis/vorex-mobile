import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  current: number;
  total: number;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  height = 8
}) => {
  const progress = total > 0 ? Math.min(current / total, 1) : 0;

  return (
    <View style={[styles.container, { height }]}>
      <View
        style={[
          styles.fill,
          {
            flex: progress,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 100,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: {
    backgroundColor: '#22c55e',
    borderRadius: 100,
  },
});
