import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';

export interface TabItem {
  name: string;
  title: string;
  icon: LucideIcon;
  /** Small red count on the icon. */
  badge?: number;
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const ACTIVE = '#4F46E5';
const INACTIVE = '#444444';
/** Space the floating bar covers; screens add it as bottom padding so nothing stays hidden. */
export const TAB_BAR_SPACE = 100;

/** Rounded bar floating above the bottom edge. Only the routes listed in `tabs` are shown. */
export function FloatingTabBar({
  state,
  navigateToTab,
  insets,
  tabs,
}: TabBarProps & { tabs: readonly TabItem[] }) {
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 12 }]}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const index = state.routes.findIndex((r) => r.name === tab.name);
          const route = state.routes[index];
          if (!route) return null;
          const focused = state.index === index;
          const color = focused ? ACTIVE : INACTIVE;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.name}
              testID={`tab-${tab.name}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.badge ? `${tab.title}, ${tab.badge} pending` : tab.title}
              onPress={() => {
                if (!focused) navigateToTab(route.key);
              }}
              style={styles.item}
            >
              <View>
                <Icon size={24} color={color} strokeWidth={focused ? 2.6 : 2} />
                {tab.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, { color }]}>{tab.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20 },
  bar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 31,
    borderWidth: 1,
    borderColor: '#B5B5B5',
    backgroundColor: '#F8F9FC',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, lineHeight: 14, fontWeight: '700' },
});
