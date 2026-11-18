import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { useTheme } from '../theme/theme.context.js';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  testID?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  isPassword = false,
  testID,
  style,
  ...rest
}: InputProps) {
  const { colors, spacing, radii, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error);
  const borderColor = hasError ? colors.error : isFocused ? colors.borderFocus : colors.border;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: hasError ? colors.error : colors.text,
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.medium,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {leftIcon ? <View style={{ marginRight: spacing.sm }}>{leftIcon}</View> : null}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: typography.fontSizes.base,
            },
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          testID={testID}
          accessible={true}
          accessibilityLabel={label}
          accessibilityState={{ disabled: rest.editable === false }}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {hasError ? (
        <Text
          style={[
            styles.caption,
            {
              color: colors.error,
              fontSize: typography.fontSizes.xs,
              marginTop: spacing.xxs,
            },
          ]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            styles.caption,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.xs,
              marginTop: spacing.xxs,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  eyeButton: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: {},
});
