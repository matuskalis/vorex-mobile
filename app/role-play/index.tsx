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
  Construction,
} from 'lucide-react-native';
import { colors, spacing, layout, textStyles, shadows } from '../../src/theme';

/**
 * TEMPORARILY DISABLED
 * Role-play scenarios are under maintenance.
 * This prevents crashes and ensures only verified features are accessible.
 */
export default function RolePlayIndexScreen() {
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
          <Text style={styles.headerTitle}>Role Play Scenarios</Text>
          <Text style={styles.headerSubtitle}>
            Practice real conversations with AI personas
          </Text>
        </View>
      </View>

      {/* Disabled Message */}
      <View style={styles.disabledContainer}>
        <View style={styles.iconContainer}>
          <Construction size={64} color={colors.accent[400]} strokeWidth={1.5} />
        </View>
        <Text style={styles.disabledTitle}>Coming Soon</Text>
        <Text style={styles.disabledMessage}>
          Role-play scenarios are currently being improved. Please use Pronunciation Drills for now.
        </Text>
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
    backgroundColor: colors.accent[400] + '15',
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
    maxWidth: 280,
  },
  backButtonLarge: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: layout.radius.lg,
    ...shadows.md,
  },
  backButtonText: {
    ...textStyles.labelLarge,
    color: colors.neutral[0],
  },
});
