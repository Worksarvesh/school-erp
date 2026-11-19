import type { LucideIcon } from 'lucide-react-native';
import { ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type ThemeContextValue } from '@school-erp/ui';

interface BigActionCardProps {
  title: string;
  icon: LucideIcon;
  onPress: () => void;
  /** Optional count shown as a small badge (e.g. unread notices). */
  badge?: number;
  /** Optional short single-line previews shown under the title (e.g. latest notice titles). */
  previews?: readonly string[];
  testID?: string;
}

/** Large primary-coloured card with an icon, a title and a round arrow button. */
export function BigActionCard({
  title,
  icon: Icon,
  onPress,
  badge,
  previews,
  testID,
}: BigActionCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const label = badge ? `${title}, ${badge} new` : title;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Icon size={24} color={colors.primaryForeground} />
      </View>
      <View style={styles.body}>
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
        {previews?.map((line) => (
          <Text key={line} style={styles.preview} numberOfLines={1} ellipsizeMode="tail">
            {line}
          </Text>
        ))}
      </View>
      <View style={styles.arrow}>
        <ArrowRight size={20} color={colors.primary} />
      </View>
    </Pressable>
  );
}

function makeStyles({ colors, spacing, radii, typography }: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      borderRadius: radii.xl,
      backgroundColor: colors.primary,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    pressed: { opacity: 0.85 },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: radii.lg,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1, gap: spacing.xs },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    preview: { color: colors.primaryForeground, fontSize: typography.fontSizes.xs },
    title: {
      flexShrink: 1,
      color: colors.primaryForeground,
      fontSize: typography.fontSizes.lg,
      fontWeight: typography.fontWeights.bold,
    },
    badge: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: colors.error,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fontWeights.bold,
    },
    arrow: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
