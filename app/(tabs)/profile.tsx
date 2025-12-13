import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth';
import { useLearning } from '../../src/context/LearningContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { state } = useLearning();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const username = user?.email?.split('@')[0] || 'Learner';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>
              {username[0]?.toUpperCase() || 'L'}
            </Text>
          </View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{state.cefrLevel || 'A1'}</Text>
          </View>
        </View>

        {/* Speaking Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speaking Progress</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Speaking Time</Text>
              <Text style={styles.statValue}>
                {Math.floor(state.weeklyStats.speakingMinutes / 60)}h {state.weeklyStats.speakingMinutes % 60}m
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Daily Goal</Text>
              <Text style={styles.statValue}>{state.dailyGoalMinutes} min/day</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Current Level</Text>
              <Text style={styles.statValue}>{state.cefrLevel || 'A1'}</Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{state.weeklyStats.pronunciationScore}%</Text>
              <Text style={styles.performanceLabel}>Pronunciation</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{state.weeklyStats.fluencyScore}%</Text>
              <Text style={styles.performanceLabel}>Fluency</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{state.weeklyStats.grammarScore}%</Text>
              <Text style={styles.performanceLabel}>Grammar</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🎯</Text>
            <Text style={styles.menuText}>Daily Goal</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🎤</Text>
            <Text style={styles.menuText}>Audio Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>Help & Support</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.menuItem, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.menuIcon}>👋</Text>
            <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vorex v1.3.0</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 16,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 8,
  },
  performanceGrid: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    color: '#6366f1',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceLabel: {
    color: '#666',
    fontSize: 12,
  },
  menuItem: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  signOutButton: {
    backgroundColor: '#1a0a0a',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  signOutText: {
    color: '#ef4444',
  },
  menuArrow: {
    color: '#666',
    fontSize: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: '#555',
    fontSize: 12,
  },
});
