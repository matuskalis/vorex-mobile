import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/auth';
import { LearningProvider } from '../src/context/LearningContext';
import { VocabularyProvider } from '../src/context/VocabularyContext';
import { GamificationProvider } from '../src/context/GamificationContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GamificationProvider>
          <LearningProvider>
            <VocabularyProvider>
              <StatusBar style="light" />
              <Slot />
            </VocabularyProvider>
          </LearningProvider>
        </GamificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
