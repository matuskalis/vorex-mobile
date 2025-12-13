import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AchievementsList } from '../components/AchievementsList';

export function AchievementsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AchievementsList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
