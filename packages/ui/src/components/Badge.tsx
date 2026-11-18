import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme.context.js';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const { colors, spacing, radii, typography } = useTheme();

  let bg = colors.neutralBg;
  let text = colors.neutral;

  if (variant === 'success') {
    bg = colors.successBg;
    text = colors.success;
  } else if (variant === 'warning') {
    bg = colors.warningBg;
    text = colors.warning;
  } else if (variant === 'error') {
    bg = colors.errorBg;
    text = colors.error;
  } else if (variant === 'info') {
    bg = colors.infoBg;
    text = colors.info;
  }

  const paddingVertical = size === 'sm' ? spacing.xxs : spacing.xs;
  const paddingHorizontal = size === 'sm' ? spacing.sm : spacing.md;
  const fontSize = size === 'sm' ? typography.fontSizes.xs : typography.fontSizes.sm;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: radii.full,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize,
            fontWeight: typography.fontWeights.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {},
});
