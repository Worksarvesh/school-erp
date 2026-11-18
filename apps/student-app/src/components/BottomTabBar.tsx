import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderWidth, colors, iconSize, spacing, touch, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

export interface TabItem {
  key: string;
  label: string;
  icon: FeatherName;
}

interface BottomTabBarProps {
  items: readonly TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/** App tab bar: active tab purple, others grey. Navigation-agnostic (the layout wires it up). */
export function BottomTabBar({ items, activeKey, onSelect }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        const tint = active ? colors.primary : colors.textMuted;
        return (
          <Pressable
            key={item.key}
            testID={`tab-${item.key}`}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.key)}
            style={styles.tab}
          >
            <Feather name={item.icon} size={iconSize.lg} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: borderWidth.thin,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  label: { ...typography.tab },
});
