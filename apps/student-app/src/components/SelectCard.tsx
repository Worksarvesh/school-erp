import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderWidth, colors, iconSize, radius, sizes, spacing, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface SelectCardProps {
  title: string;
  description: string;
  /** Icon drawn inside the illustration placeholder until real artwork exists. */
  illustrationIcon: FeatherName;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

/** Selectable option card: purple border and a check badge when selected. */
export function SelectCard({
  title,
  description,
  illustrationIcon,
  selected,
  onPress,
  testID,
}: SelectCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {selected ? (
        <View style={styles.badge}>
          <Feather name="check" size={iconSize.xs} color={colors.textOnPrimary} />
        </View>
      ) : null}
      <View style={styles.illustration}>
        <Feather name={illustrationIcon} size={iconSize.xl} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: borderWidth.selected,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  cardSelected: { borderColor: colors.primary },
  badge: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    width: sizes.checkBadge,
    height: sizes.checkBadge,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: sizes.illustration,
    height: sizes.illustration,
    borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  description: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
