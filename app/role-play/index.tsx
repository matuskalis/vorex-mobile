import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Briefcase,
  UtensilsCrossed,
  Plane,
  Stethoscope,
  ShoppingBag,
  Coffee,
  Hotel,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../../src/theme';
import {
  rolePlayScenarios,
  DifficultyLevel,
  getDifficultyColor,
  getDifficultyLabel,
  getScenariosByDifficulty,
} from '../../src/data/rolePlayScenarios';

// Map icon names to actual icon components
const iconMap: Record<string, any> = {
  Briefcase,
  UtensilsCrossed,
  Plane,
  Stethoscope,
  ShoppingBag,
  Coffee,
  Hotel,
};

export default function RolePlayIndexScreen() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');

  const filteredScenarios = selectedDifficulty === 'all'
    ? rolePlayScenarios
    : getScenariosByDifficulty(selectedDifficulty);

  const handleScenarioPress = (scenarioId: string) => {
    router.push(`/role-play/${scenarioId}`);
  };

  const renderDifficultyFilter = () => {
    const options: Array<{ value: DifficultyLevel | 'all'; label: string }> = [
      { value: 'all', label: 'All' },
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ];

    return (
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Filter size={16} color={colors.text.tertiary} strokeWidth={2} />
          <Text style={styles.filterLabel}>Difficulty</Text>
        </View>
        <View style={styles.filterOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                selectedDifficulty === option.value && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedDifficulty(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedDifficulty === option.value && styles.filterButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderScenarioCard = (scenario: typeof rolePlayScenarios[0]) => {
    const IconComponent = iconMap[scenario.icon];
    const difficultyColor = getDifficultyColor(scenario.difficulty);

    return (
      <Pressable
        key={scenario.id}
        style={({ pressed }) => [
          styles.scenarioCard,
          pressed && styles.scenarioCardPressed,
        ]}
        onPress={() => handleScenarioPress(scenario.id)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: difficultyColor + '20' }]}>
            {IconComponent && (
              <IconComponent size={28} color={difficultyColor} strokeWidth={2} />
            )}
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {getDifficultyLabel(scenario.difficulty)}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Clock size={12} color={colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.timeText}>{scenario.estimatedMinutes} min</Text>
            </View>
          </View>
        </View>

        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioDescription}>{scenario.description}</Text>

        <View style={styles.personaContainer}>
          <Text style={styles.personaLabel}>You'll practice with:</Text>
          <Text style={styles.personaName}>
            {scenario.persona.name} - {scenario.persona.role}
          </Text>
        </View>

        <View style={styles.objectivesContainer}>
          <Text style={styles.objectivesLabel}>Learning objectives:</Text>
          {scenario.learningObjectives.slice(0, 3).map((objective, index) => (
            <Text key={index} style={styles.objectiveItem}>
              {objective}
            </Text>
          ))}
          {scenario.learningObjectives.length > 3 && (
            <Text style={styles.objectiveMore}>
              +{scenario.learningObjectives.length - 3} more
            </Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.startButtonText}>Start Role Play</Text>
          <ChevronRight size={18} color={colors.primary[500]} strokeWidth={2.5} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Role Play Scenarios</Text>
          <Text style={styles.headerSubtitle}>
            Practice real conversations with AI personas
          </Text>
        </View>
      </View>

      {/* Difficulty Filter */}
      {renderDifficultyFilter()}

      {/* Scenarios List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredScenarios.length > 0 ? (
          filteredScenarios.map(renderScenarioCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No scenarios found for this difficulty level.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    marginRight: spacing[3],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.headlineMedium,
    color: colors.text.primary,
    marginBottom: spacing[0.5],
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  filterContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  filterLabel: {
    ...textStyles.labelMedium,
    color: colors.text.tertiary,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.lg,
    backgroundColor: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterButtonText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.neutral[0],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.screenPadding,
    gap: spacing[4],
  },
  scenarioCard: {
    backgroundColor: colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  scenarioCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  difficultyBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: layout.radius.md,
  },
  difficultyText: {
    ...textStyles.labelSmall,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  timeText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  scenarioTitle: {
    ...textStyles.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  scenarioDescription: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing[4],
    lineHeight: 22,
  },
  personaContainer: {
    backgroundColor: colors.primary[500] + '10',
    padding: spacing[3],
    borderRadius: layout.radius.md,
    marginBottom: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  personaLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  personaName: {
    ...textStyles.labelMedium,
    color: colors.primary[400],
  },
  objectivesContainer: {
    marginBottom: spacing[4],
  },
  objectivesLabel: {
    ...textStyles.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  objectiveItem: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    paddingLeft: spacing[3],
  },
  objectiveMore: {
    ...textStyles.caption,
    color: colors.accent[400],
    marginTop: spacing[1],
    paddingLeft: spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  startButtonText: {
    ...textStyles.labelLarge,
    color: colors.primary[500],
  },
  emptyState: {
    paddingVertical: spacing[10],
    alignItems: 'center',
  },
  emptyStateText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing[6],
  },
});
