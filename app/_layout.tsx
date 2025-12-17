import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/auth';
import { LearningProvider } from '../src/context/LearningContext';
import { VocabularyProvider } from '../src/context/VocabularyContext';
import { GamificationProvider } from '../src/context/GamificationContext';
import { RecommendationProvider, AccessibilityProvider, SRSProvider } from '../src/contexts';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AccessibilityProvider>
          <GamificationProvider>
            <RecommendationProvider>
              <SRSProvider>
                <LearningProvider>
                  <VocabularyProvider>
                    <StatusBar style="light" />
                    <Slot />
                  </VocabularyProvider>
                </LearningProvider>
              </SRSProvider>
            </RecommendationProvider>
          </GamificationProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
