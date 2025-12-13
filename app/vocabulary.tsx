import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  Filter,
  BookOpen,
  Calendar,
  TrendingUp,
  Volume2,
  Trash2,
  Plus,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useVocabulary } from '../src/context/VocabularyContext';
import {
  VocabItem,
  getMasteryLevel,
  getIntervalText,
  sortByMastery,
} from '../src/utils/spacedRepetition';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';

type FilterType = 'all' | 'new' | 'learning' | 'familiar' | 'mastered';

export default function VocabularyListScreen() {
  const { state, deleteWord, getStats } = useVocabulary();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  const stats = getStats();

  // Filter and search vocabulary
  const filteredItems = useMemo(() => {
    let items = [...state.items];

    // Apply mastery filter
    if (filterType !== 'all') {
      items = items.filter(item => {
        const mastery = getMasteryLevel(item);
        return mastery.level === filterType;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(
        item =>
          item.word.toLowerCase().includes(query) ||
          item.translation.toLowerCase().includes(query)
      );
    }

    // Sort by mastery
    return sortByMastery(items);
  }, [state.items, filterType, searchQuery]);

  const handleSpeak = async (word: string) => {
    try {
      await Speech.speak(word, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
      });
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const handleDelete = (itemId: string) => {
    deleteWord(itemId);
  };

  const renderVocabItem = (item: VocabItem) => {
    const mastery = getMasteryLevel(item);
    const nextReviewDate = new Date(item.nextReview);
    const isOverdue = nextReviewDate < new Date();
    const intervalText = getIntervalText(item.interval);

    return (
      <View key={item.id} style={styles.vocabCard}>
        {/* Header */}
        <View style={styles.vocabHeader}>
          <View style={styles.vocabHeaderLeft}>
            <View style={[styles.masteryBadge, { backgroundColor: mastery.color + '20' }]}>
              <View style={[styles.masteryDot, { backgroundColor: mastery.color }]} />
              <Text style={[styles.masteryText, { color: mastery.color }]}>
                {mastery.label}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleDelete(item.id)}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
          >
            <Trash2 size={16} color={colors.error[500]} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Word */}
        <View style={styles.vocabContent}>
          <View style={styles.wordRow}>
            <View style={styles.wordInfo}>
              <Text style={styles.vocabWord}>{item.word}</Text>
              {item.phonetic && (
                <Text style={styles.vocabPhonetic}>{item.phonetic}</Text>
              )}
            </View>
            <Pressable
              onPress={() => handleSpeak(item.word)}
              style={({ pressed }) => [
                styles.speakButton,
                pressed && styles.speakButtonPressed,
              ]}
            >
              <Volume2 size={18} color={colors.primary[500]} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={styles.vocabTranslation}>{item.translation}</Text>

          {item.example && (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleText} numberOfLines={2}>
                {item.example}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.vocabFooter}>
          <View style={styles.footerItem}>
            <Calendar size={14} color={colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.footerText}>
              {isOverdue ? 'Due now' : `Next: ${nextReviewDate.toLocaleDateString()}`}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <TrendingUp size={14} color={colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.footerText}>{intervalText}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Vocabulary</Text>
        <Pressable
          onPress={() => router.push('/vocabulary-review')}
          style={styles.reviewButton}
        >
          <BookOpen size={20} color={colors.neutral[0]} strokeWidth={2} />
          <Text style={styles.reviewButtonText}>Review</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContent}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Words</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.accent[400] }]}>
            {stats.dueToday}
          </Text>
          <Text style={styles.statLabel}>Due Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.success[400] }]}>
            {stats.byMastery.mastered}
          </Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.info[400] }]}>
            {stats.byMastery.familiar}
          </Text>
          <Text style={styles.statLabel}>Familiar</Text>
        </View>
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.text.tertiary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search words..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={({ pressed }) => [
            styles.filterButton,
            showFilters && styles.filterButtonActive,
            pressed && styles.filterButtonPressed,
          ]}
        >
          <Filter size={20} color={colors.text.primary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Filter Chips */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'new', 'learning', 'familiar', 'mastered'] as FilterType[]).map(
            filter => (
              <Pressable
                key={filter}
                onPress={() => setFilterType(filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  filterType === filter && styles.filterChipActive,
                  pressed && styles.filterChipPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>
      )}

      {/* Vocabulary List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <BookOpen size={48} color={colors.text.tertiary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? 'No words found'
                : 'No vocabulary yet'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start learning words from your conversations'}
            </Text>
          </View>
        ) : (
          filteredItems.map(renderVocabItem)
        )}
      </ScrollView>

      {/* Add Word Button */}
      <Pressable
        onPress={() => {
          // TODO: Add modal or screen to add custom words
          console.log('Add word functionality');
        }}
        style={({ pressed }) => [
          styles.fabButton,
          pressed && styles.fabButtonPressed,
        ]}
      >
        <Plus size={28} color={colors.neutral[0]} strokeWidth={2.5} />
      </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
  },
  title: {
    ...textStyles.headlineLarge,
    color: colors.text.primary,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[4],
    borderRadius: layout.radius.lg,
    ...shadows.md,
  },
  reviewButtonText: {
    ...textStyles.labelMedium,
    color: colors.neutral[0],
  },
  statsScroll: {
    marginBottom: spacing[4],
  },
  statsContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[3],
  },
  statCard: {
    backgroundColor: colors.background.card,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: layout.radius.xl,
    alignItems: 'center',
    minWidth: 100,
    ...shadows.sm,
  },
  statValue: {
    ...textStyles.headlineMedium,
    color: colors.primary[400],
    marginBottom: spacing[0.5],
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[3],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: layout.radius.lg,
  },
  searchInput: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: colors.text.primary,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: layout.radius.lg,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterButtonPressed: {
    opacity: 0.7,
  },
  filterScroll: {
    marginBottom: spacing[3],
  },
  filterContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
  },
  filterChip: {
    backgroundColor: colors.background.card,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterChipText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.neutral[0],
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[20],
  },
  vocabCard: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: layout.radius.xl,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  vocabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  vocabHeaderLeft: {
    flex: 1,
  },
  masteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2.5],
    borderRadius: layout.radius.md,
    alignSelf: 'flex-start',
  },
  masteryDot: {
    width: 6,
    height: 6,
    borderRadius: layout.radius.full,
  },
  masteryText: {
    ...textStyles.labelSmall,
    fontWeight: '600',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: layout.radius.md,
    backgroundColor: colors.error[500] + '15',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  vocabContent: {
    marginBottom: spacing[3],
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  wordInfo: {
    flex: 1,
  },
  vocabWord: {
    ...textStyles.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing[0.5],
  },
  vocabPhonetic: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  speakButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: layout.radius.md,
    backgroundColor: colors.primary[500] + '15',
  },
  speakButtonPressed: {
    opacity: 0.7,
  },
  vocabTranslation: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  exampleContainer: {
    backgroundColor: colors.background.elevated,
    padding: spacing[3],
    borderRadius: layout.radius.md,
  },
  exampleText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  vocabFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  footerText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: layout.radius.full,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  emptyTitle: {
    ...textStyles.headlineMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptyDescription: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: spacing[6],
    right: layout.screenPadding,
    width: 64,
    height: 64,
    borderRadius: layout.radius.full,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  fabButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});
