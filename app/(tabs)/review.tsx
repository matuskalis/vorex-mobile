import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

type PracticeWord = {
  word: string;
  phonetic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  practiced: boolean;
};

type SessionReview = {
  date: string;
  scenario: string;
  duration: string;
  pronunciationScore: number;
  fluencyScore: number;
  wordsToReview: string[];
};

const MOCK_SESSIONS: SessionReview[] = [
  {
    date: 'Today',
    scenario: 'Coffee Shop Order',
    duration: '8 min',
    pronunciationScore: 82,
    fluencyScore: 75,
    wordsToReview: ['coffee', 'latte', 'cappuccino'],
  },
  {
    date: 'Yesterday',
    scenario: 'Restaurant Reservation',
    duration: '12 min',
    pronunciationScore: 78,
    fluencyScore: 80,
    wordsToReview: ['reservation', 'vegetarian', 'appetizer'],
  },
  {
    date: '2 days ago',
    scenario: 'Airport Check-in',
    duration: '10 min',
    pronunciationScore: 85,
    fluencyScore: 72,
    wordsToReview: ['luggage', 'boarding', 'departure'],
  },
];

const PRONUNCIATION_DRILLS: PracticeWord[] = [
  { word: 'through', phonetic: '/thru/', difficulty: 'hard', practiced: false },
  { word: 'thought', phonetic: '/thot/', difficulty: 'hard', practiced: false },
  { word: 'weather', phonetic: '/wether/', difficulty: 'medium', practiced: true },
  { word: 'comfortable', phonetic: '/kumf-ter-bul/', difficulty: 'medium', practiced: false },
  { word: 'schedule', phonetic: '/sked-yool/', difficulty: 'medium', practiced: true },
  { word: 'restaurant', phonetic: '/res-tuh-rahnt/', difficulty: 'easy', practiced: true },
];

export default function ReviewScreen() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'drills'>('sessions');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const playWordAudio = (word: string) => {
    setPlayingWord(word);
    setTimeout(() => setPlayingWord(null), 1000);
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review</Text>
        <Text style={styles.subtitle}>Practice what you've learned</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sessions' && styles.tabActive]}
          onPress={() => setActiveTab('sessions')}
        >
          <Text style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive]}>
            Sessions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'drills' && styles.tabActive]}
          onPress={() => setActiveTab('drills')}
        >
          <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>
            Pronunciation
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'sessions' ? (
          <>
            {MOCK_SESSIONS.map((session, index) => (
              <View key={index} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View>
                    <Text style={styles.sessionDate}>{session.date}</Text>
                    <Text style={styles.sessionScenario}>{session.scenario}</Text>
                  </View>
                  <Text style={styles.sessionDuration}>{session.duration}</Text>
                </View>

                <View style={styles.scoresRow}>
                  <View style={styles.scoreItem}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(session.pronunciationScore) }]}>
                      {session.pronunciationScore}%
                    </Text>
                    <Text style={styles.scoreLabel}>Pronunciation</Text>
                  </View>
                  <View style={styles.scoreDivider} />
                  <View style={styles.scoreItem}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(session.fluencyScore) }]}>
                      {session.fluencyScore}%
                    </Text>
                    <Text style={styles.scoreLabel}>Fluency</Text>
                  </View>
                </View>

                <View style={styles.wordsSection}>
                  <Text style={styles.wordsSectionTitle}>Words to practice:</Text>
                  <View style={styles.wordTags}>
                    {session.wordsToReview.map((word, wordIndex) => (
                      <TouchableOpacity
                        key={wordIndex}
                        style={styles.wordTag}
                        onPress={() => playWordAudio(word)}
                      >
                        <Text style={styles.wordTagText}>{word}</Text>
                        <Text style={styles.playIcon}>
                          {playingWord === word ? '🔊' : '▶️'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={styles.reviewButton}>
                  <Text style={styles.reviewButtonText}>Review Session</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <>
            <View style={styles.drillsHeader}>
              <Text style={styles.drillsTitle}>Focus Sounds</Text>
              <Text style={styles.drillsSubtitle}>
                Based on your speaking patterns, practice these sounds:
              </Text>
            </View>

            <View style={styles.focusSoundsRow}>
              <View style={styles.focusSound}>
                <Text style={styles.focusSoundPhoneme}>/th/</Text>
                <Text style={styles.focusSoundLabel}>th (thin)</Text>
              </View>
              <View style={styles.focusSound}>
                <Text style={styles.focusSoundPhoneme}>/th/</Text>
                <Text style={styles.focusSoundLabel}>th (this)</Text>
              </View>
              <View style={styles.focusSound}>
                <Text style={styles.focusSoundPhoneme}>/r/</Text>
                <Text style={styles.focusSoundLabel}>r sound</Text>
              </View>
            </View>

            <Text style={styles.practiceListTitle}>Practice Words</Text>

            {PRONUNCIATION_DRILLS.map((drill, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.drillCard, drill.practiced && styles.drillCardPracticed]}
                onPress={() => playWordAudio(drill.word)}
              >
                <View style={styles.drillLeft}>
                  <View style={[
                    styles.difficultyDot,
                    { backgroundColor: getDifficultyColor(drill.difficulty) }
                  ]} />
                  <View>
                    <Text style={styles.drillWord}>{drill.word}</Text>
                    <Text style={styles.drillPhonetic}>{drill.phonetic}</Text>
                  </View>
                </View>
                <View style={styles.drillRight}>
                  {drill.practiced && (
                    <Text style={styles.practicedBadge}>✓</Text>
                  )}
                  <TouchableOpacity style={styles.drillPlayButton}>
                    <Text style={styles.drillPlayIcon}>
                      {playingWord === drill.word ? '🔊' : '🎤'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.startDrillButton}>
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
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionDate: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  sessionScenario: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sessionDuration: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  scoresRow: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreLabel: {
    color: '#666',
    fontSize: 12,
  },
  wordsSection: {
    marginBottom: 16,
  },
  wordsSectionTitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  wordTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  wordTagText: {
    color: '#fff',
    fontSize: 14,
  },
  playIcon: {
    fontSize: 12,
  },
  reviewButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  drillsHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  drillsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  drillsSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  focusSoundsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  focusSound: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  focusSoundPhoneme: {
    color: '#fbbf24',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  focusSoundLabel: {
    color: '#666',
    fontSize: 12,
  },
  practiceListTitle: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  drillCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  drillCardPracticed: {
    opacity: 0.7,
  },
  drillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  drillWord: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  drillPhonetic: {
    color: '#666',
    fontSize: 14,
  },
  drillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  practicedBadge: {
    color: '#10b981',
    fontSize: 18,
  },
  drillPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillPlayIcon: {
    fontSize: 20,
  },
  startDrillButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  startDrillButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 24,
  },
});
