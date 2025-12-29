import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Shield,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../src/theme';

/**
 * TEMPORARILY DISABLED FOR STABILIZATION
 * Pronunciation Drills are disabled during truth-enforcement mode.
 * Use Warm-up exercise instead - it's the only verified exercise path.
 */
export default function PronunciationDrillScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pronunciation Drills</Text>
          <Text style={styles.headerSubtitle}>
            Practice specific sounds and words
          </Text>
        </View>
      </View>

      {/* Disabled Message */}
      <View style={styles.disabledContainer}>
        <View style={styles.iconContainer}>
          <Shield size={64} color={colors.warning[400]} strokeWidth={1.5} />
        </View>
        <Text style={styles.disabledTitle}>Stabilization Mode</Text>
        <Text style={styles.disabledMessage}>
          Pronunciation Drills are temporarily disabled while we ensure scoring accuracy.
          Please use the Warm-up exercise instead.
        </Text>
        <TouchableOpacity
          style={styles.warmupButton}
          onPress={() => router.replace('/warm-up')}
          activeOpacity={0.7}
        >
          <Text style={styles.warmupButtonText}>Go to Warm-up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButtonLarge}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    marginRight: spacing[3],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.headlineMedium,
    color: colors.text.primary,
    marginBottom: spacing[0.5],
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[10],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: layout.radius.full,
    backgroundColor: colors.warning[400] + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  disabledTitle: {
    ...textStyles.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  disabledMessage: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
    maxWidth: 300,
  },
  warmupButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: layout.radius.lg,
    marginBottom: spacing[3],
    ...shadows.md,
  },
  warmupButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
  backButtonLarge: {
    backgroundColor: colors.neutral[700],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: layout.radius.lg,
  },
  backButtonText: {
    ...textStyles.labelMedium,
    color: colors.text.secondary,
  },
});
