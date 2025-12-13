import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../lib/api-client';
import { useGamification } from '../context/GamificationContext';
import { XPBar } from '../components/XPBar';
import { StreakBadge } from '../components/StreakBadge';
import { AchievementToast } from '../components/AchievementToast';

interface Unit {
  unit_id: string;
  unit_number: number;
  title: string;
  description: string;
  level: string;
  is_locked: boolean;
  lessons: Array<{
    lesson_id: string;
    lesson_number: number;
    title: string;
    is_locked: boolean;
    completed: boolean;
  }>;
}

export function LearnScreen({ navigation }: any) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bonusSummary, setBonusSummary] = useState<any>(null);
  const { state: gamificationState, clearPendingAchievements } = useGamification();
  const [currentToastIndex, setCurrentToastIndex] = useState(0);

  const fetchData = async () => {
    try {
      const [guidedData, bonusData] = await Promise.all([
        apiClient.getGuidedLearning(),
        apiClient.getBonusSummary(),
      ]);
      setUnits(guidedData.units || []);
      setBonusSummary(bonusData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleClaimLoginBonus = async () => {
    try {
      const result = await apiClient.claimLoginBonus();
      if (result.success) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to claim bonus:', error);
    }
  };

  const handleDismissAchievement = () => {
    if (currentToastIndex < gamificationState.pendingAchievements.length - 1) {
      setCurrentToastIndex(currentToastIndex + 1);
    } else {
      clearPendingAchievements();
      setCurrentToastIndex(0);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Achievement Toast */}
      {gamificationState.pendingAchievements.length > 0 && (
        <AchievementToast
          achievement={gamificationState.pendingAchievements[currentToastIndex]}
          onDismiss={handleDismissAchievement}
          visible={true}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Ready to learn?</Text>
          {bonusSummary?.current_multiplier > 1 && (
            <View style={styles.multiplierBadge}>
              <Text style={styles.multiplierText}>
                {bonusSummary.current_multiplier}x XP
              </Text>
            </View>
          )}
        </View>

        {/* XP Bar */}
        <View style={styles.gamificationSection}>
          <XPBar showXPNumbers={true} />
        </View>

        {/* Streak Badge */}
        <View style={styles.gamificationSection}>
          <StreakBadge
            showDetails={true}
            onPress={() => {
              // Could navigate to achievements screen
              console.log('Streak badge pressed');
            }}
          />
        </View>

        {/* Login Bonus Card */}
        {bonusSummary?.available_bonuses?.login_bonus?.available && (
          <TouchableOpacity style={styles.bonusCard} onPress={handleClaimLoginBonus}>
            <Text style={styles.bonusTitle}>Daily Login Bonus</Text>
            <Text style={styles.bonusXp}>+{bonusSummary.available_bonuses.login_bonus.xp} XP</Text>
            <Text style={styles.bonusCta}>Tap to claim!</Text>
          </TouchableOpacity>
        )}

        {/* Units */}
        <View style={styles.unitsContainer}>
          {units.map((unit) => (
            <View key={unit.unit_id} style={styles.unitCard}>
              <View style={styles.unitHeader}>
                <Text style={styles.unitNumber}>Unit {unit.unit_number}</Text>
                <Text style={styles.unitTitle}>{unit.title}</Text>
                <Text style={styles.unitLevel}>{unit.level}</Text>
              </View>

              <View style={styles.lessonsContainer}>
                {unit.lessons.map((lesson) => (
                  <TouchableOpacity
                    key={lesson.lesson_id}
                    style={[
                      styles.lessonItem,
                      lesson.completed && styles.lessonCompleted,
                      lesson.is_locked && styles.lessonLocked,
                    ]}
                    disabled={lesson.is_locked}
                    onPress={() => navigation.navigate('Lesson', { lessonId: lesson.lesson_id })}
                  >
                    <View style={styles.lessonNumber}>
                      <Text style={styles.lessonNumberText}>{lesson.lesson_number}</Text>
                    </View>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    {lesson.completed && <Text style={styles.checkmark}>✓</Text>}
                    {lesson.is_locked && <Text style={styles.lockIcon}>🔒</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  multiplierBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  multiplierText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bonusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6366f1',
    alignItems: 'center',
  },
  bonusTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bonusXp: {
    color: '#6366f1',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bonusCta: {
    color: '#666',
    marginTop: 8,
  },
  gamificationSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  unitsContainer: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 100,
  },
  unitCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  unitHeader: {
    padding: 16,
    backgroundColor: '#252525',
  },
  unitNumber: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  unitTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  unitLevel: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  lessonsContainer: {
    padding: 12,
    gap: 8,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#252525',
    borderRadius: 12,
    gap: 12,
  },
  lessonCompleted: {
    backgroundColor: '#1a2e1a',
  },
  lessonLocked: {
    opacity: 0.5,
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lessonTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  checkmark: {
    color: '#22c55e',
    fontSize: 18,
  },
  lockIcon: {
    fontSize: 16,
  },
});
