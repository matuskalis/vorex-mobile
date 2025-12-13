import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '../context/auth';

export default function HomeScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vorex</Text>
      <Text style={styles.subtitle}>Learn English, Level Up</Text>

      <View style={styles.buttonContainer}>
        <Link href="/login" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Link>

        <Link href="/signup" style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 48,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
