import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Types
// ============================================

export type TextSizeScale = 'small' | 'medium' | 'large' | 'extraLarge';

export interface AccessibilitySettings {
  textSizeScale: TextSizeScale;
  highContrastMode: boolean;
  reduceMotion: boolean;
  hapticFeedback: boolean;
  screenReaderOptimized: boolean;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  getScaledFontSize: (baseSize: number) => number;
  isLoading: boolean;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'vorex_accessibility_settings';

const defaultSettings: AccessibilitySettings = {
  textSizeScale: 'medium',
  highContrastMode: false,
  reduceMotion: false,
  hapticFeedback: true,
  screenReaderOptimized: false,
};

const textScaleMultipliers: Record<TextSizeScale, number> = {
  small: 0.85,
  medium: 1,
  large: 1.15,
  extraLarge: 1.3,
};

// ============================================
// Context
// ============================================

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AccessibilitySettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  };

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  const getScaledFontSize = (baseSize: number): number => {
    const multiplier = textScaleMultipliers[settings.textSizeScale];
    return Math.round(baseSize * multiplier);
  };

  const value: AccessibilityContextValue = {
    settings,
    updateSettings,
    resetSettings,
    getScaledFontSize,
    isLoading,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// ============================================
// Utility Hooks
// ============================================

export function useScaledText(baseSize: number): number {
  const { getScaledFontSize } = useAccessibility();
  return getScaledFontSize(baseSize);
}

export function useReducedMotion(): boolean {
  const { settings } = useAccessibility();
  return settings.reduceMotion;
}

export function useHapticEnabled(): boolean {
  const { settings } = useAccessibility();
  return settings.hapticFeedback;
}

export function useHighContrast(): boolean {
  const { settings } = useAccessibility();
  return settings.highContrastMode;
}
