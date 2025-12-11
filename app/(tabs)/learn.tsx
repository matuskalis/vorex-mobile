import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockLessons = [
  { id: 1, title: 'Basic Greetings', level: 'A1', xp: 50, completed: true },
  { id: 2, title: 'Introduce Yourself', level: 'A1', xp: 75, completed: true },
  { id: 3, title: 'Numbers & Counting', level: 'A1', xp: 60, completed: false },
  { id: 4, title: 'Days & Time', level: 'A1', xp: 80, completed: false },
  { id: 5, title: 'Family Members', level: 'A2', xp: 100, completed: false },
];

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 3</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Daily Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
        <Text style={styles.progressText}>2/5 lessons completed</Text>
      </View>

      <ScrollView style={styles.lessonList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Continue Learning</Text>
        {mockLessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={[styles.lessonCard, lesson.completed && styles.lessonCompleted]}
          >
            <View style={styles.lessonLeft}>
              <View style={[styles.levelBadge, lesson.completed && styles.levelBadgeCompleted]}>
                <Text style={styles.levelText}>{lesson.level}</Text>
              </View>
              <View>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonXp}>+{lesson.xp} XP</Text>
              </View>
            </View>
            <View style={styles.lessonRight}>
              {lesson.completed ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.arrow}>→</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  lessonList: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lessonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonCompleted: {
    opacity: 0.6,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelBadgeCompleted: {
    backgroundColor: '#22c55e',
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  lessonTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonXp: {
    color: '#6366f1',
    fontSize: 14,
    marginTop: 2,
  },
  lessonRight: {},
  checkmark: {
    color: '#22c55e',
    fontSize: 20,
    fontWeight: 'bold',
  },
  arrow: {
    color: '#666',
    fontSize: 20,
  },
});
