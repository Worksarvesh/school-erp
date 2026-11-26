import React from 'react';
import { Tabs } from 'expo-router';
import { CircleUserRound, ClipboardCheck, GraduationCap, House } from 'lucide-react-native';
import { FloatingTabBar, type TabItem } from '@/features/dashboard/components/FloatingTabBar';
import { DASHBOARD_MOCK } from '@/mock/dashboard';
import { useSession } from '@/state/session';

/** Routes that exist in this group but are not on the bar (their modules are on Home). */
const HIDDEN = ['people', 'operations'] as const;

export default function TabsLayout() {
  const permissions = useSession((s) => s.activeMembership?.permissions);
  const canSeeApprovals = permissions?.includes('approvals.read') ?? false;

  /** The visible tabs, in order (approved design: floating bar with 4 tabs). */
  const tabs: readonly TabItem[] = [
    { name: 'index', title: 'Home', icon: House },
    ...(canSeeApprovals
      ? [
          {
            name: 'approvals',
            title: 'Approval',
            icon: ClipboardCheck,
            badge: DASHBOARD_MOCK.approvalBadge,
          },
        ]
      : []),
    { name: 'academics', title: 'Academic', icon: GraduationCap },
    { name: 'profile', title: 'Profile', icon: CircleUserRound },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} tabs={tabs} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="approvals" options={{ title: 'Approval' }} />
      <Tabs.Screen name="academics" options={{ title: 'Academic' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
