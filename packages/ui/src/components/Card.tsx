import React from 'react';
import { View, TouchableOpacity, type ViewStyle, type StyleProp } from 'react-native';
import { StyleSheet } from '../theme/responsive.js';
import { useTheme } from '../theme/theme.context.js';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({ children, onPress, variant = 'elevated', style, testID }: CardProps) {
  const { colors, spacing, radii } = useTheme();

  const isClickable = Boolean(onPress);

  const elevationStyle: ViewStyle =
    variant === 'elevated'
      ? {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }
      : {};

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: colors.border,
    ...elevationStyle,
  };

  if (isClickable) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.base, containerStyle, style]}
        testID={testID}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, containerStyle, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    marginVertical: 6,
  },
});
