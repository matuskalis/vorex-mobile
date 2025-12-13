import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Home, MessageCircle, BookOpen, BarChart3, User } from 'lucide-react-native';
import { colors, layout } from '../../src/theme';

const ICON_SIZE = 24;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="conversation"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => <MessageCircle size={ICON_SIZE} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarIcon: ({ color }) => <BookOpen size={ICON_SIZE} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <BarChart3 size={ICON_SIZE} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={ICON_SIZE} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.card,
    borderTopColor: colors.border.default,
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingTop: 10,
    height: layout.tabBarHeight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIcon: {
    marginBottom: 2,
  },
});
