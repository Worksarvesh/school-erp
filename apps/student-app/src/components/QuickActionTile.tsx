import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useTheme, type ThemeContextValue } from '@school-erp/ui';
import { fonts } from '@/theme/fonts';

interface QuickActionTileProps {
  label: string;
  /** 3D icon image shown in the lavender box. */
  image: ImageSourcePropType;
  onPress: () => void;
  testID?: string;
}

/** 3D icon + label tile for the Home quick-action grid (4 per row). */
export function QuickActionTile({ label, image, onPress, testID }: QuickActionTileProps) {
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
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  return StyleSheet.create({
    tile: {
      width: '25%',
      minHeight: 44,
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pressed: { opacity: 0.7 },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: { width: 38, height: 38 },
    label: {
      color: colors.text,
      fontSize: 12,
      fontFamily: fonts.medium,
      textAlign: 'center',
    },
  });
}
