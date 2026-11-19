import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@school-erp/ui';

/** The only visible tabs, in order. */
export const TABS = [
  { name: 'index', title: 'Home', icon: '🏠' },
  { name: 'academic', title: 'Academic', icon: '📚' },
  { name: 'messages', title: 'Messages', icon: '💬' },
  { name: 'profile', title: 'Profile', icon: '👤' },
] as const;

export default function TabsLayout() {
  const { colors, typography } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontWeight: '600',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>{tab.icon}</Text>,
          }}
        />
      ))}
      {/* Fees is out of V1 (V1.2): the file is kept but hidden from the tab bar. */}
      <Tabs.Screen name="fees" options={{ href: null }} />
    </Tabs>
  );
}
