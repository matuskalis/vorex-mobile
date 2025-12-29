import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import { colors, spacing, layout } from '../theme';

interface BusinessModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function BusinessModeToggle({ enabled, onToggle }: BusinessModeToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Briefcase size={20} color={enabled ? colors.primary[400] : colors.text.secondary} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Business Mode</Text>
          <Text style={styles.description}>
            {enabled ? 'Sales & professional phrases' : 'General everyday English'}
          </Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{
          false: colors.neutral[700],
          true: colors.primary[500] + '80',
        }}
        thumbColor={enabled ? colors.primary[400] : colors.neutral[400]}
        ios_backgroundColor={colors.neutral[700]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: spacing[0.5],
  },
});
