import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type ThemeContextValue } from '@school-erp/ui';

interface QuickActionTileProps {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  testID?: string;
}

/** Icon + label tile for the Home quick-action grid (4 per row). */
export function QuickActionTile({ label, icon: Icon, onPress, testID }: QuickActionTileProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Icon size={24} color={theme.colors.primary} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles({ colors, spacing, radii, typography }: ThemeContextValue) {
  return StyleSheet.create({
    tile: {
      width: '25%',
      minHeight: 44,
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    pressed: { opacity: 0.7 },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: colors.text,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fontWeights.medium,
      textAlign: 'center',
    },
  });
}
