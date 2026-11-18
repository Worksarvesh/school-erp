import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ComponentRef, ReactNode } from 'react';
import { forwardRef, useState } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { borderWidth, colors, iconSize, radius, spacing, touch, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: FeatherName;
  /** Fixed text shown before the input (e.g. +91). */
  prefix?: string;
  /** Element after the input (e.g. eye toggle, check mark). */
  trailing?: ReactNode;
  error?: string;
  testID?: string;
}

/** Labelled input with optional leading icon, prefix, trailing element and inline error text. */
export type TextInputRef = ComponentRef<typeof TextInput>;

export const TextField = forwardRef<TextInputRef, TextFieldProps>(function TextField(
  { label, icon, prefix, trailing, error, testID, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const errorId = testID ? `${testID}-error` : undefined;
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}
      >
        {icon ? <Feather name={icon} size={iconSize.md} color={colors.primary} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? (
        <Text testID={errorId} style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textPrimary },
  field: {
    minHeight: touch.inputHeight,
    borderRadius: radius.input,
    backgroundColor: colors.inputFill,
    borderWidth: borderWidth.thin,
    borderColor: colors.inputFill,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fieldFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
  fieldError: { borderColor: colors.error },
  prefix: { ...typography.body, color: colors.textSecondary },
  // minWidth 0 lets the input shrink so trailing elements (eye toggle) stay inside the field.
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: touch.minTarget,
    ...typography.body,
    color: colors.textPrimary,
  },
  error: { ...typography.caption, color: colors.error },
});
