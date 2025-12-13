import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/auth';
import { LearningProvider } from '../src/context/LearningContext';
import { VocabularyProvider } from '../src/context/VocabularyContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LearningProvider>
          <VocabularyProvider>
            <StatusBar style="light" />
            <Slot />
          </VocabularyProvider>
        </LearningProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
