import React from 'react';
import { TouchableOpacity, ActivityIndicator, type ViewStyle, type StyleProp } from 'react-native';
import { StyleSheet } from '../theme/responsive.js';
import { Text } from './Text.js';
import { useTheme } from '../theme/theme.context.js';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps) {
  const { colors, spacing, radii, typography } = useTheme();

  const isInteractive = !disabled && !loading;

  // Sizing definitions
  const paddingVertical = size === 'sm' ? spacing.xs : size === 'lg' ? spacing.md : spacing.sm + 2;
  const paddingHorizontal = size === 'sm' ? spacing.md : size === 'lg' ? spacing.xl : spacing.base;
  const minHeight = size === 'sm' ? 36 : size === 'lg' ? 52 : 44; // Touch target minimum 44pt for md/lg

  // Colors per variant
  let bg = colors.primary;
  let text = colors.primaryForeground;
  let border = 'transparent';

  if (variant === 'secondary') {
    bg = colors.surfaceSubtle;
    text = colors.text;
    border = colors.border;
  } else if (variant === 'outline') {
    bg = 'transparent';
    text = colors.primary;
    border = colors.primary;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    text = colors.text;
  } else if (variant === 'destructive') {
    bg = colors.error;
    text = '#FFFFFF';
  }

  if (disabled) {
    bg = colors.surfaceSubtle;
    text = colors.textMuted;
    border = colors.border;
  }

  return (
    <TouchableOpacity
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radii.md,
          paddingVertical,
          paddingHorizontal,
          minHeight,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={accessibilityLabel || label}
      testID={testID}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : (
        <>
          {leftIcon ? <>{leftIcon}</> : null}
          <Text
            style={[
              styles.text,
              {
                color: text,
                fontSize:
                  size === 'sm'
                    ? typography.fontSizes.sm
                    : size === 'lg'
                      ? typography.fontSizes.lg
                      : typography.fontSizes.base,
                fontWeight: typography.fontWeights.medium,
                marginHorizontal: leftIcon || rightIcon ? spacing.xs : 0,
              },
            ]}
          >
            {label}
          </Text>
          {rightIcon ? <>{rightIcon}</> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    textAlign: 'center',
  },
});
