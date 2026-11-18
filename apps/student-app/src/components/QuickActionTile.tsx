import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, iconSize, opacity, radius, sizes, spacing, touch, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface QuickActionTileProps {
  label: string;
  icon: FeatherName;
  onPress: () => void;
  testID?: string;
}

/** Icon + label tile for the Home quick-action grid (4 per row). */
export function QuickActionTile({ label, icon, onPress, testID }: QuickActionTileProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Feather name={icon} size={iconSize.lg} color={colors.primary} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '25%',
    minHeight: touch.minTarget,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
  pressed: { opacity: opacity.pressed },
  iconBox: {
    width: sizes.quickActionIcon,
    height: sizes.quickActionIcon,
    borderRadius: radius.input,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.caption, color: colors.textPrimary, textAlign: 'center' },
});
