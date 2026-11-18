import { Tabs } from 'expo-router';
import type { TabItem } from '@/components';
import { BottomTabBar } from '@/components';

/** Approved V1 Student App tabs (Fees is out of V1; no Focus tab). */
const TABS: readonly TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'academic', label: 'Academic', icon: 'book-open' },
  { key: 'messages', label: 'Messages', icon: 'message-circle' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab }) => (
        <BottomTabBar
          items={TABS}
          activeKey={state.routes[state.index]?.name ?? 'home'}
          onSelect={(name) => {
            const route = state.routes.find((r) => r.name === name);
            if (route) navigateToTab(route.key);
          }}
        />
      )}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.key} name={t.key} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}
