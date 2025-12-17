import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import Svg, { Circle } from 'react-native-svg';
import {
  Clock,
  Play,
  Volume2,
  Mic,
  Check,
  ChevronRight,
  Target,
  Zap,
  BookOpen,
  RotateCcw,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import { darkTheme, colors, spacing, layout, textStyles } from '../../src/theme';
import { useSRS, useSRSStats } from '../../src/contexts';
import { apiClient, SessionHistoryItem } from '../../src/lib/api-client';

type PracticeWord = {
  word: string;
  phonetic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  practiced: boolean;
};

// Static pronunciation drills (could be fetched from backend in the future)
const PRONUNCIATION_DRILLS: PracticeWord[] = [
  { word: 'through', phonetic: '/θruː/', difficulty: 'hard', practiced: false },
  { word: 'thought', phonetic: '/θɔːt/', difficulty: 'hard', practiced: false },
  { word: 'weather', phonetic: '/ˈweðər/', difficulty: 'medium', practiced: true },
  { word: 'comfortable', phonetic: '/ˈkʌmftəbəl/', difficulty: 'medium', practiced: false },
  { word: 'schedule', phonetic: '/ˈskedʒuːl/', difficulty: 'medium', practiced: true },
  { word: 'restaurant', phonetic: '/ˈrestərɒnt/', difficulty: 'easy', practiced: true },
];

// Mini circular progress ring for scores
function ScoreRing({
  score,
  size = 56,
  strokeWidth = 5,
  color
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={darkTheme.colors.border.default}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[styles.scoreRingValue, { color }]}>{score}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'drills'>('sessions');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  // Session history state
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // SRS context
  const { dueCards, fetchDueCards, isLoading: isLoadingSRS } = useSRS();
  const srsStats = useSRSStats();

  // Fetch session history
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsError(null);
      const data = await apiClient.getSessionHistory(10);
      setSessions(data.sessions || []);
    } catch (err) {
      // Silently handle 404 - table may not exist or have data yet
      const isNotFound = err instanceof Error && err.message.includes('Not Found');
      if (!isNotFound) {
        console.error('Failed to fetch session history:', err);
        setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions');
      }
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
    fetchDueCards(20);
  }, [fetchSessions, fetchDueCards]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchSessions(), fetchDueCards(20)]);
    setIsRefreshing(false);
  }, [fetchSessions, fetchDueCards]);

  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  };

  const playWordAudio = (word: string) => {
    setPlayingWord(word);
    setTimeout(() => setPlayingWord(null), 1000);
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return colors.success[500];
      case 'medium': return colors.accent[500];
      case 'hard': return colors.error[500];
    }
  };

  const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.accent[500];
    return colors.error[500];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Review</Text>
          <Text style={styles.subtitle}>Practice what you've learned</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <RotateCcw size={14} color={colors.primary[400]} strokeWidth={2.5} />
            <Text style={styles.headerStatValue}>{srsStats?.cards_due_today ?? 0}</Text>
            <Text style={styles.headerStatLabel}>to review</Text>
          </View>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sessions' && styles.tabActive]}
          onPress={() => setActiveTab('sessions')}
          activeOpacity={0.7}
        >
          <BookOpen
            size={16}
            color={activeTab === 'sessions' ? colors.neutral[900] : darkTheme.colors.text.tertiary}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive]}>
            Sessions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'drills' && styles.tabActive]}
          onPress={() => setActiveTab('drills')}
          activeOpacity={0.7}
        >
          <Mic
            size={16}
            color={activeTab === 'drills' ? colors.neutral[900] : darkTheme.colors.text.tertiary}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>
            Pronunciation
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[400]}
          />
        }
      >
        {activeTab === 'sessions' ? (
          <>
            {isLoadingSessions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Loading sessions...</Text>
              </View>
            ) : sessionsError ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={48} color={colors.error[500]} strokeWidth={1.5} />
                <Text style={styles.errorTitle}>Couldn't load sessions</Text>
                <Text style={styles.errorText}>{sessionsError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchSessions}>
                  <RefreshCw size={16} color={colors.neutral[900]} strokeWidth={2.5} />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : sessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <BookOpen size={48} color={darkTheme.colors.text.tertiary} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No sessions yet</Text>
                <Text style={styles.emptyText}>
                  Complete a conversation practice to see your session history here.
                </Text>
              </View>
            ) : (
              sessions.map((session) => (
                <View key={session.session_id} style={styles.sessionCard}>
                  {/* Session Header */}
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDate}>{formatRelativeDate(session.started_at)}</Text>
                      <Text style={styles.sessionScenario}>{session.scenario_name || 'Practice Session'}</Text>
                    </View>
                    <View style={styles.sessionDuration}>
                      <Clock size={12} color={colors.primary[400]} strokeWidth={2.5} />
                      <Text style={styles.sessionDurationText}>{formatDuration(session.duration_seconds)}</Text>
                    </View>
                  </View>

                  {/* Score Rings */}
                  <View style={styles.scoresContainer}>
                    <View style={styles.scoreItem}>
                      <ScoreRing score={session.pronunciation_score ?? 0} color={getScoreColor(session.pronunciation_score ?? 0)} />
                      <Text style={styles.scoreLabel}>Pronunciation</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <ScoreRing score={session.fluency_score ?? 0} color={getScoreColor(session.fluency_score ?? 0)} />
                      <Text style={styles.scoreLabel}>Fluency</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <ScoreRing score={session.grammar_score ?? 0} color={getScoreColor(session.grammar_score ?? 0)} />
                      <Text style={styles.scoreLabel}>Grammar</Text>
                    </View>
                  </View>

                  {/* Words to Review (if available) */}
                  {session.words_practiced && session.words_practiced.length > 0 && (
                    <View style={styles.wordsSection}>
                      <Text style={styles.wordsSectionTitle}>Words practiced</Text>
                      <View style={styles.wordChips}>
                        {session.words_practiced.slice(0, 5).map((word, wordIndex) => (
                          <TouchableOpacity
                            key={wordIndex}
                            style={[
                              styles.wordChip,
                              playingWord === word && styles.wordChipActive
                            ]}
                            onPress={() => playWordAudio(word)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.wordChipText}>{word}</Text>
                            {playingWord === word ? (
                              <Volume2 size={14} color={colors.primary[400]} strokeWidth={2.5} />
                            ) : (
                              <Play size={12} color={darkTheme.colors.text.tertiary} strokeWidth={2.5} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Review Button */}
                  <TouchableOpacity style={styles.reviewButton} activeOpacity={0.8}>
                    <Text style={styles.reviewButtonText}>Review Session</Text>
                    <ChevronRight size={18} color={colors.neutral[900]} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {/* Focus Sounds Hero */}
            <View style={styles.focusSoundsCard}>
              <View style={styles.focusSoundsHeader}>
                <Target size={18} color={colors.accent[500]} strokeWidth={2.5} />
                <Text style={styles.focusSoundsTitle}>Focus Sounds</Text>
              </View>
              <Text style={styles.focusSoundsSubtitle}>
                Based on your speaking patterns, practice these:
              </Text>

              <View style={styles.focusSoundsGrid}>
                <View style={styles.focusSoundPill}>
                  <Text style={styles.focusSoundPhoneme}>/θ/</Text>
                  <Text style={styles.focusSoundExample}>th (thin)</Text>
                </View>
                <View style={styles.focusSoundPill}>
                  <Text style={styles.focusSoundPhoneme}>/ð/</Text>
                  <Text style={styles.focusSoundExample}>th (this)</Text>
                </View>
                <View style={styles.focusSoundPill}>
                  <Text style={styles.focusSoundPhoneme}>/r/</Text>
                  <Text style={styles.focusSoundExample}>r sound</Text>
                </View>
              </View>
            </View>

            {/* Practice Words Section */}
            <View style={styles.drillsSection}>
              <Text style={styles.drillsSectionTitle}>Practice Words</Text>
              <Text style={styles.drillsSectionSubtitle}>
                {PRONUNCIATION_DRILLS.filter(d => d.practiced).length}/{PRONUNCIATION_DRILLS.length} completed
              </Text>
            </View>

            {PRONUNCIATION_DRILLS.map((drill, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.drillCard,
                  drill.practiced && styles.drillCardCompleted
                ]}
                onPress={() => playWordAudio(drill.word)}
                activeOpacity={0.7}
              >
                <View style={styles.drillLeft}>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(drill.difficulty) + '20' }
                  ]}>
                    <View style={[
                      styles.difficultyDot,
                      { backgroundColor: getDifficultyColor(drill.difficulty) }
                    ]} />
                    <Text style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(drill.difficulty) }
                    ]}>
                      {getDifficultyLabel(drill.difficulty)}
                    </Text>
                  </View>
                  <View style={styles.drillWordInfo}>
                    <Text style={styles.drillWord}>{drill.word}</Text>
                    <Text style={styles.drillPhonetic}>{drill.phonetic}</Text>
                  </View>
                </View>

                <View style={styles.drillRight}>
                  {drill.practiced && (
                    <View style={styles.completedBadge}>
                      <Check size={12} color={colors.success[500]} strokeWidth={3} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.drillPlayButton,
                      playingWord === drill.word && styles.drillPlayButtonActive
                    ]}
                    onPress={() => playWordAudio(drill.word)}
                  >
                    {playingWord === drill.word ? (
                      <Volume2 size={18} color={colors.primary[400]} strokeWidth={2.5} />
                    ) : (
                      <Mic size={18} color={darkTheme.colors.text.secondary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* Start Drill CTA */}
            <TouchableOpacity style={styles.startDrillButton} activeOpacity={0.8}>
              <Zap size={20} color={colors.neutral[900]} strokeWidth={2.5} />
              <Text style={styles.startDrillButtonText}>Start Pronunciation Drill</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.headlineLarge.fontSize,
    fontWeight: textStyles.headlineLarge.fontWeight as any,
  },
  subtitle: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginTop: spacing[1],
  },
  headerStats: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  headerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: darkTheme.colors.background.card,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  headerStatValue: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodySmall.fontSize,
    fontWeight: '600',
  },
  headerStatLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing[4],
    marginBottom: spacing[2],
    gap: spacing[3],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: layout.radius.lg,
    backgroundColor: darkTheme.colors.background.card,
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  tabActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tabText: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.bodySmall.fontSize,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.neutral[900],
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },

  // Session Cards
  sessionCard: {
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    marginTop: spacing[4],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginBottom: spacing[1],
  },
  sessionScenario: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.titleLarge.fontSize,
    fontWeight: textStyles.titleLarge.fontWeight as any,
  },
  sessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.primary[500] + '15',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.full,
  },
  sessionDurationText: {
    color: colors.primary[400],
    fontSize: textStyles.caption.fontSize,
    fontWeight: '600',
  },

  // Score Rings
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: darkTheme.colors.background.primary,
    borderRadius: layout.radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  scoreItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
  scoreRingValue: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
  },
  scoreLabel: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },

  // Word Chips
  wordsSection: {
    marginBottom: spacing[4],
  },
  wordsSectionTitle: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: darkTheme.colors.background.elevated,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: layout.radius.full,
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  wordChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '10',
  },
  wordChipText: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodySmall.fontSize,
    fontWeight: '500',
  },

  // Review Button
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    borderRadius: layout.radius.lg,
  },
  reviewButtonText: {
    color: colors.neutral[900],
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },

  // Focus Sounds Card
  focusSoundsCard: {
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.xl,
    padding: spacing[5],
    marginTop: spacing[4],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  focusSoundsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  focusSoundsTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.titleLarge.fontSize,
    fontWeight: textStyles.titleLarge.fontWeight as any,
  },
  focusSoundsSubtitle: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.bodySmall.fontSize,
    marginBottom: spacing[4],
  },
  focusSoundsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  focusSoundPill: {
    flex: 1,
    backgroundColor: darkTheme.colors.background.primary,
    borderRadius: layout.radius.lg,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  focusSoundPhoneme: {
    color: colors.accent[500],
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  focusSoundExample: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },

  // Drills Section
  drillsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  drillsSectionTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.titleLarge.fontSize,
    fontWeight: textStyles.titleLarge.fontWeight as any,
  },
  drillsSectionSubtitle: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },

  // Drill Cards
  drillCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background.card,
    borderRadius: layout.radius.lg,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  drillCardCompleted: {
    opacity: 0.7,
  },
  drillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: layout.radius.sm,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drillWordInfo: {
    gap: spacing[1],
  },
  drillWord: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },
  drillPhonetic: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.caption.fontSize,
  },
  drillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: darkTheme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border.default,
  },
  drillPlayButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '10',
  },

  // Start Drill Button
  startDrillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: layout.radius.lg,
    marginTop: spacing[4],
  },
  startDrillButtonText: {
    color: colors.neutral[900],
    fontSize: textStyles.bodyMedium.fontSize,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: spacing[6],
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    gap: spacing[4],
  },
  loadingText: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.bodyMedium.fontSize,
  },

  // Error state
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  errorTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.titleLarge.fontSize,
    fontWeight: textStyles.titleLarge.fontWeight as any,
  },
  errorText: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.bodySmall.fontSize,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: layout.radius.lg,
    marginTop: spacing[2],
  },
  retryButtonText: {
    color: colors.neutral[900],
    fontSize: textStyles.bodySmall.fontSize,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyTitle: {
    color: darkTheme.colors.text.primary,
    fontSize: textStyles.titleLarge.fontSize,
    fontWeight: textStyles.titleLarge.fontWeight as any,
  },
  emptyText: {
    color: darkTheme.colors.text.tertiary,
    fontSize: textStyles.bodySmall.fontSize,
    textAlign: 'center',
    lineHeight: 20,
  },
});
