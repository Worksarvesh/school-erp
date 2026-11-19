import { ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme, type ThemeContextValue } from '@school-erp/ui';
import { fonts } from '@/theme/fonts';

interface BigActionCardProps {
  title: string;
  /** 3D icon image shown at the top left. */
  image: ImageSourcePropType;
  onPress: () => void;
  /** Optional count shown as a small badge next to the title (e.g. unread notices). */
  badge?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Purple Home card: 3D icon on top, title at the bottom left, round white arrow at the right. */
export function BigActionCard({ title, image, onPress, badge, style, testID }: BigActionCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const label = badge ? `${title}, ${badge} new` : title;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <Image source={image} style={styles.image} resizeMode="contain" />
      <View style={styles.bottomRow}>
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
          <ArrowRight size={18} color={theme.colors.primary} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      minHeight: 84,
      borderRadius: radii.xl,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    pressed: { opacity: 0.85 },
    image: { width: 40, height: 40 },
    bottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
    titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: {
      flexShrink: 1,
      color: colors.primaryForeground,
      fontSize: 15,
      lineHeight: 19,
      fontFamily: fonts.semibold,
    },
    badge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: radii.full,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: fonts.bold },
    arrow: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
