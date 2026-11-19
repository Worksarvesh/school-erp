import type { LucideIcon } from 'lucide-react-native';
import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type ThemeContextValue } from '@school-erp/ui';

interface SelectCardProps {
  title: string;
  description: string;
  /** Icon drawn inside the illustration placeholder until real artwork exists. */
  illustrationIcon: LucideIcon;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

/** Selectable option card: primary border and a check badge when selected. */
export function SelectCard({
  title,
  description,
  illustrationIcon: Icon,
  selected,
  onPress,
  testID,
}: SelectCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

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
          <Check size={14} color={colors.primaryForeground} />
        </View>
      ) : null}
      <View style={styles.illustration}>
        <Icon size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

function makeStyles({ colors, spacing, radii, typography }: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minHeight: 180,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.base,
      borderRadius: radii.xl,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceSubtle },
    badge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 22,
      height: 22,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustration: {
      width: 72,
      height: 72,
      marginTop: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.semibold,
      textAlign: 'center',
    },
    description: {
      color: colors.textSecondary,
      fontSize: typography.fontSizes.xs,
      lineHeight: typography.lineHeights.tight,
      textAlign: 'center',
    },
  });
}
