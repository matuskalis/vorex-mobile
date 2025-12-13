import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLearning } from '../../src/context/LearningContext';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKLY_MINUTES = [15, 20, 0, 25, 18, 30, 12];
const WEEKLY_SCORES = {
  pronunciation: [72, 75, 0, 78, 80, 82, 85],
  fluency: [65, 68, 0, 70, 72, 75, 78],
  grammar: [80, 82, 0, 81, 83, 85, 84],
};

const MONTHLY_STATS = {
  totalMinutes: 420,
  sessionsCompleted: 28,
  wordsLearned: 156,
  scenariosCompleted: 12,
};

export default function ProgressScreen() {
  const { state } = useLearning();
  const maxMinutes = Math.max(...WEEKLY_MINUTES, 1);

  const getBarHeight = (minutes: number) => {
    return (minutes / maxMinutes) * 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{state.cefrLevel || 'A1'}</Text>
          </View>
        </View>

        {/* Weekly Speaking Time Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week's Speaking Time</Text>
          <View style={styles.chartContainer}>
            {DAYS_OF_WEEK.map((day, index) => (
              <View key={day} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: getBarHeight(WEEKLY_MINUTES[index]) * 0.8,
                        backgroundColor: WEEKLY_MINUTES[index] > 0 ? '#6366f1' : '#2a2a2a',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day}</Text>
                <Text style={styles.barValue}>
                  {WEEKLY_MINUTES[index] > 0 ? `${WEEKLY_MINUTES[index]}m` : '-'}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total this week</Text>
            <Text style={styles.totalValue}>
              {WEEKLY_MINUTES.reduce((a, b) => a + b, 0)} minutes
            </Text>
          </View>
        </View>

        {/* Daily Goal Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Goal</Text>
          <View style={styles.goalContainer}>
            <View style={styles.goalCircle}>
              <Text style={styles.goalValue}>
                {state.todayStats.speakingMinutes}
              </Text>
              <Text style={styles.goalUnit}>min</Text>
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTarget}>
                Target: {state.dailyGoalMinutes} minutes
              </Text>
              <View style={styles.goalProgressBar}>
                <View
                  style={[
                    styles.goalProgressFill,
                    {
                      flex: state.dailyGoalMinutes > 0 ? Math.min(state.todayStats.speakingMinutes / state.dailyGoalMinutes, 1) : 0,
                    },
                  ]}
                />
              </View>
              <Text style={styles.goalRemaining}>
                {Math.max(state.dailyGoalMinutes - state.todayStats.speakingMinutes, 0)} minutes to go
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Trends */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Performance Trends</Text>
          <View style={styles.trendsGrid}>
            <View style={styles.trendItem}>
              <View style={styles.trendHeader}>
                <Text style={styles.trendLabel}>Pronunciation</Text>
                <Text style={[styles.trendChange, { color: '#10b981' }]}>+13%</Text>
              </View>
              <Text style={[styles.trendValue, { color: getScoreColor(state.weeklyStats.pronunciationScore) }]}>
                {state.weeklyStats.pronunciationScore}%
              </Text>
              <View style={styles.trendMiniChart}>
                {WEEKLY_SCORES.pronunciation.map((score, i) => (
                  <View
                    key={i}
                    style={[
                      styles.miniBar,
                      {
                        height: score > 0 ? score * 0.4 : 4,
                        backgroundColor: score > 0 ? '#6366f1' : '#2a2a2a',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.trendItem}>
              <View style={styles.trendHeader}>
                <Text style={styles.trendLabel}>Fluency</Text>
                <Text style={[styles.trendChange, { color: '#10b981' }]}>+8%</Text>
              </View>
              <Text style={[styles.trendValue, { color: getScoreColor(state.weeklyStats.fluencyScore) }]}>
                {state.weeklyStats.fluencyScore}%
              </Text>
              <View style={styles.trendMiniChart}>
                {WEEKLY_SCORES.fluency.map((score, i) => (
                  <View
                    key={i}
                    style={[
                      styles.miniBar,
                      {
                        height: score > 0 ? score * 0.4 : 4,
                        backgroundColor: score > 0 ? '#10b981' : '#2a2a2a',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.trendItem}>
              <View style={styles.trendHeader}>
                <Text style={styles.trendLabel}>Grammar</Text>
                <Text style={[styles.trendChange, { color: '#10b981' }]}>+4%</Text>
              </View>
              <Text style={[styles.trendValue, { color: getScoreColor(state.weeklyStats.grammarScore) }]}>
                {state.weeklyStats.grammarScore}%
              </Text>
              <View style={styles.trendMiniChart}>
                {WEEKLY_SCORES.grammar.map((score, i) => (
                  <View
                    key={i}
                    style={[
                      styles.miniBar,
                      {
                        height: score > 0 ? score * 0.4 : 4,
                        backgroundColor: score > 0 ? '#fbbf24' : '#2a2a2a',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month</Text>
          <View style={styles.monthlyGrid}>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyIcon}>⏱️</Text>
              <Text style={styles.monthlyValue}>
                {Math.floor(MONTHLY_STATS.totalMinutes / 60)}h {MONTHLY_STATS.totalMinutes % 60}m
              </Text>
              <Text style={styles.monthlyLabel}>Speaking Time</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyIcon}>🎯</Text>
              <Text style={styles.monthlyValue}>{MONTHLY_STATS.sessionsCompleted}</Text>
              <Text style={styles.monthlyLabel}>Sessions</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyIcon}>📚</Text>
              <Text style={styles.monthlyValue}>{MONTHLY_STATS.wordsLearned}</Text>
              <Text style={styles.monthlyLabel}>Words</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyIcon}>💬</Text>
              <Text style={styles.monthlyValue}>{MONTHLY_STATS.scenariosCompleted}</Text>
              <Text style={styles.monthlyLabel}>Scenarios</Text>
            </View>
          </View>
        </View>

        {/* CEFR Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Level Progress</Text>
          <View style={styles.cefrContainer}>
            <View style={styles.cefrLevels}>
              {['A1', 'A2', 'B1', 'B2', 'C1'].map((level, index) => {
                const currentIndex = ['A1', 'A2', 'B1', 'B2', 'C1'].indexOf(state.cefrLevel || 'A1');
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <View key={level} style={styles.cefrLevel}>
                    <View
                      style={[
                        styles.cefrDot,
                        isCompleted && styles.cefrDotCompleted,
                        isCurrent && styles.cefrDotCurrent,
                      ]}
                    >
                      {isCompleted && <Text style={styles.cefrCheck}>✓</Text>}
                    </View>
                    <Text
                      style={[
                        styles.cefrLabel,
                        (isCompleted || isCurrent) && styles.cefrLabelActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.cefrProgressLine}>
              <View style={[styles.cefrProgressFill, { flex: 0.65 }]} />
            </View>
            <Text style={styles.cefrHint}>
              65% progress to next level
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  levelBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 16,
  },
  cardTitle: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 16,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: 24,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 8,
  },
  barValue: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  totalLabel: {
    color: '#666',
    fontSize: 14,
  },
  totalValue: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  goalCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  goalUnit: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  goalInfo: {
    flex: 1,
  },
  goalTarget: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    flexDirection: 'row',
  },
  goalProgressFill: {
    height: 8,
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  goalRemaining: {
    color: '#666',
    fontSize: 12,
  },
  trendsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  trendItem: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendLabel: {
    color: '#666',
    fontSize: 11,
  },
  trendChange: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendMiniChart: {
    flexDirection: 'row',
    height: 40,
    gap: 2,
    alignItems: 'flex-end',
  },
  miniBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthlyItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  monthlyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  monthlyValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  monthlyLabel: {
    color: '#666',
    fontSize: 12,
  },
  cefrContainer: {
    alignItems: 'center',
  },
  cefrLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  cefrLevel: {
    alignItems: 'center',
  },
  cefrDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cefrDotCompleted: {
    backgroundColor: '#10b981',
  },
  cefrDotCurrent: {
    backgroundColor: '#6366f1',
    borderWidth: 3,
    borderColor: '#6366f140',
  },
  cefrCheck: {
    color: '#fff',
    fontSize: 16,
  },
  cefrLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  cefrLabelActive: {
    color: '#fff',
  },
  cefrProgressLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    marginBottom: 12,
    flexDirection: 'row',
  },
  cefrProgressFill: {
    height: 4,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  cefrHint: {
    color: '#666',
    fontSize: 12,
  },
  bottomSpacer: {
    height: 24,
  },
});
