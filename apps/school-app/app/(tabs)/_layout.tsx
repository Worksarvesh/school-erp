import React from 'react';
import { Tabs } from 'expo-router';
import {
  BookOpen,
  ClipboardList,
  House,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@school-erp/ui';

/** The visible tabs, in order. Each non-Home tab lists permission-filtered modules. */
export const TABS: readonly { name: string; title: string; icon: LucideIcon }[] = [
  { name: 'index', title: 'Home', icon: House },
  { name: 'academics', title: 'Academics', icon: BookOpen },
  { name: 'people', title: 'People', icon: Users },
  { name: 'operations', title: 'Operations', icon: ClipboardList },
  { name: 'profile', title: 'Profile', icon: UserRound },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      {TABS.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarButtonTestID: `tab-${name}`,
            tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
