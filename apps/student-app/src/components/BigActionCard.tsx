import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, iconSize, opacity, radius, shadows, sizes, spacing, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface BigActionCardProps {
  title: string;
  icon: FeatherName;
  onPress: () => void;
  /** Optional count shown as a small badge (e.g. unread notices). */
  badge?: number;
  testID?: string;
}

/** Large purple card with an icon, a title and a round arrow button. */
export function BigActionCard({ title, icon, onPress, badge, testID }: BigActionCardProps) {
  const label = badge ? `${title}, ${badge} new` : title;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadows.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Feather name={icon} size={iconSize.lg} color={colors.textOnPrimary} />
      </View>
      <View style={styles.footer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.arrow}>
          <Feather name="arrow-right" size={iconSize.md} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    backgroundColor: colors.primaryDark,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  pressed: { opacity: opacity.pressedCard },
  iconBox: {
    width: sizes.quickActionIcon,
    height: sizes.quickActionIcon,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  title: { ...typography.bodyStrong, color: colors.textOnPrimary, flexShrink: 1 },
  badge: {
    minWidth: sizes.checkBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.notificationDot,
    alignItems: 'center',
  },
  badgeText: { ...typography.captionStrong, color: colors.textOnPrimary },
  arrow: {
    width: sizes.bigCardArrow,
    height: sizes.bigCardArrow,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
