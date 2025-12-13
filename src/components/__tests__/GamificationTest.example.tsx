/**
 * Example test file for Gamification System
 *
 * This is a reference implementation showing how to test the gamification components.
 * Adapt these tests to your testing framework (Jest, React Native Testing Library, etc.)
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GamificationProvider, useGamification } from '../../context/GamificationContext';
import { XPBar } from '../XPBar';
import { StreakBadge } from '../StreakBadge';
import { AchievementToast } from '../AchievementToast';
import { ACHIEVEMENTS } from '../../data/achievements';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Helper component to test hooks
function TestComponent() {
  const {
    state,
    addXP,
    completeLesson,
    addPracticeTime,
    completeConversation,
  } = useGamification();

  return (
    <>
      <XPBar showXPNumbers={true} />
      <StreakBadge showDetails={true} />
      <button testID="add-xp" onPress={() => addXP(100, 'test')}>
        Add XP
      </button>
      <button testID="complete-lesson" onPress={completeLesson}>
        Complete Lesson
      </button>
      <button testID="add-practice" onPress={() => addPracticeTime(10)}>
        Add Practice
      </button>
      <button testID="complete-conversation" onPress={completeConversation}>
        Complete Conversation
      </button>
    </>
  );
}

describe('Gamification System', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('GamificationContext', () => {
    it('should initialize with default state', async () => {
      const { getByText } = render(
        <GamificationProvider>
          <TestComponent />
        </GamificationProvider>
      );

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });
    });

    it('should add XP correctly', async () => {
      const { getByTestId } = render(
        <GamificationProvider>
          <TestComponent />
        </GamificationProvider>
      );

      const addXPButton = getByTestId('add-xp');
      fireEvent.press(addXPButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should complete lesson and award XP', async () => {
      const { getByTestId } = render(
        <GamificationProvider>
          <TestComponent />
        </GamificationProvider>
      );

      const completeLessonButton = getByTestId('complete-lesson');
      fireEvent.press(completeLessonButton);

      await waitFor(() => {
        // Should save state to AsyncStorage
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should track practice time', async () => {
      const { getByTestId } = render(
        <GamificationProvider>
          <TestComponent />
        </GamificationProvider>
      );

      const addPracticeButton = getByTestId('add-practice');
      fireEvent.press(addPracticeButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should update streak after 5+ minutes practice', async () => {
      // Mock previous date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@vorex_gamification_last_date') {
          return Promise.resolve(yesterday.toDateString());
        }
        return Promise.resolve(null);
      });

      const { getByTestId } = render(
        <GamificationProvider>
          <TestComponent />
        </GamificationProvider>
      );

      // Add 10 minutes of practice (> 5 minutes required)
      const addPracticeButton = getByTestId('add-practice');
      fireEvent.press(addPracticeButton);

      await waitFor(() => {
        // Should update streak and save
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('XPBar Component', () => {
    it('should render without crashing', () => {
      const { getByText } = render(
        <GamificationProvider>
          <XPBar showXPNumbers={true} />
        </GamificationProvider>
      );

      expect(getByText(/Level/i)).toBeTruthy();
    });

    it('should display compact version', () => {
      const { queryByText } = render(
        <GamificationProvider>
          <XPBar compact={true} />
        </GamificationProvider>
      );

      // Compact version should not show "Level" text
      expect(queryByText(/Level/i)).toBeNull();
    });
  });

  describe('StreakBadge Component', () => {
    it('should render streak information', () => {
      const { getByText } = render(
        <GamificationProvider>
          <StreakBadge showDetails={true} />
        </GamificationProvider>
      );

      expect(getByText(/Longest Streak/i)).toBeTruthy();
    });

    it('should call onPress when tapped', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <GamificationProvider>
          <StreakBadge onPress={onPressMock} />
        </GamificationProvider>
      );

      fireEvent.press(getByTestId('streak-badge'));
      expect(onPressMock).toHaveBeenCalled();
    });
  });

  describe('AchievementToast Component', () => {
    const testAchievement = ACHIEVEMENTS[0];

    it('should render achievement details', () => {
      const { getByText } = render(
        <AchievementToast
          achievement={testAchievement}
          onDismiss={jest.fn()}
          visible={true}
        />
      );

      expect(getByText(testAchievement.title)).toBeTruthy();
      expect(getByText(testAchievement.description)).toBeTruthy();
    });

    it('should call onDismiss when tapped', () => {
      const onDismissMock = jest.fn();
      const { getByTestId } = render(
        <AchievementToast
          achievement={testAchievement}
          onDismiss={onDismissMock}
          visible={true}
        />
      );

      fireEvent.press(getByTestId('achievement-toast'));
      expect(onDismissMock).toHaveBeenCalled();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <AchievementToast
          achievement={testAchievement}
          onDismiss={jest.fn()}
          visible={false}
        />
      );

      expect(queryByText(testAchievement.title)).toBeNull();
    });
  });

  describe('Achievement Unlocking', () => {
    it('should unlock "First Lesson" achievement after completing first lesson', async () => {
      const TestAchievementComponent = () => {
        const { state, completeLesson } = useGamification();

        return (
          <>
            <button testID="complete-lesson" onPress={completeLesson}>
              Complete
            </button>
            <text testID="achievement-count">
              {state.unlockedAchievements.length}
            </text>
          </>
        );
      };

      const { getByTestId } = render(
        <GamificationProvider>
          <TestAchievementComponent />
        </GamificationProvider>
      );

      const completeLessonButton = getByTestId('complete-lesson');
      fireEvent.press(completeLessonButton);

      await waitFor(() => {
        const achievementCount = getByTestId('achievement-count');
        // Should have unlocked "First Lesson" achievement
        expect(achievementCount.props.children).toBeGreaterThan(0);
      });
    });

    it('should unlock streak achievement after maintaining 3-day streak', async () => {
      // This would require mocking dates and multiple practice sessions
      // Implementation depends on your test setup
    });
  });

  describe('Data Persistence', () => {
    it('should load saved state from AsyncStorage', async () => {
      const savedState = {
        xp: 500,
        level: 2,
        streak: {
          currentStreak: 5,
          longestStreak: 5,
          lastPracticeDate: new Date().toDateString(),
          freezeAvailable: true,
          lastFreezeUsed: null,
          todayPracticeMinutes: 10,
        },
        unlockedAchievements: [],
        stats: {
          totalWordsSpoken: 100,
          totalPracticeMinutes: 60,
          lessonsCompleted: 5,
          conversationsCompleted: 2,
          rolePlayScenariosCompleted: [],
          bestPronunciationScore: 85,
          perfectAnswers: 10,
        },
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedState));

      const TestLoadComponent = () => {
        const { state } = useGamification();
        return <text testID="xp-value">{state.xp}</text>;
      };

      const { getByTestId } = render(
        <GamificationProvider>
          <TestLoadComponent />
        </GamificationProvider>
      );

      await waitFor(() => {
        const xpValue = getByTestId('xp-value');
        expect(xpValue.props.children).toBe(500);
      });
    });

    it('should save state to AsyncStorage on updates', async () => {
      const { getByTestId } = render(
        <GamificationProvider>
          <TestComponent />
        </GamificationProvider>
      );

      const addXPButton = getByTestId('add-xp');
      fireEvent.press(addXPButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@vorex_gamification_data',
          expect.any(String)
        );
      });
    });
  });

  describe('Level Calculation', () => {
    it('should calculate level correctly from XP', async () => {
      const TestLevelComponent = () => {
        const { state, addXP } = useGamification();

        return (
          <>
            <button testID="add-level-xp" onPress={() => addXP(2500, 'test')}>
              Add XP
            </button>
            <text testID="level-value">{state.level}</text>
          </>
        );
      };

      const { getByTestId } = render(
        <GamificationProvider>
          <TestLevelComponent />
        </GamificationProvider>
      );

      const addXPButton = getByTestId('add-level-xp');
      fireEvent.press(addXPButton);

      await waitFor(() => {
        const levelValue = getByTestId('level-value');
        // 2500 XP should be level 5 (floor(sqrt(2500 / 100)) = 5)
        expect(levelValue.props.children).toBe(5);
      });
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full learning session with XP, streak, and achievements', async () => {
    const FullSessionComponent = () => {
      const {
        state,
        completeLesson,
        addPracticeTime,
        addWordsSpoken,
        updatePronunciationScore,
      } = useGamification();

      const completeSession = () => {
        completeLesson();
        addPracticeTime(15);
        addWordsSpoken(50);
        updatePronunciationScore(90);
      };

      return (
        <>
          <button testID="complete-session" onPress={completeSession}>
            Complete Session
          </button>
          <text testID="session-xp">{state.xp}</text>
          <text testID="session-practice">{state.stats.totalPracticeMinutes}</text>
          <text testID="session-words">{state.stats.totalWordsSpoken}</text>
        </>
      );
    };

    const { getByTestId } = render(
      <GamificationProvider>
        <FullSessionComponent />
      </GamificationProvider>
    );

    const completeButton = getByTestId('complete-session');
    fireEvent.press(completeButton);

    await waitFor(() => {
      const xpValue = getByTestId('session-xp');
      const practiceValue = getByTestId('session-practice');
      const wordsValue = getByTestId('session-words');

      expect(xpValue.props.children).toBeGreaterThan(0);
      expect(practiceValue.props.children).toBe(15);
      expect(wordsValue.props.children).toBe(50);
    });
  });
});
