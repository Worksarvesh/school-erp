import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, iconSize, radius, shadows, spacing, touch, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Icon after the label (e.g. arrow-right, check). */
  trailingIcon?: FeatherName;
  /** Icon before the label (e.g. arrow-left). */
  leadingIcon?: FeatherName;
  accessibilityHint?: string;
  testID?: string;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  trailingIcon,
  leadingIcon,
  accessibilityHint,
  testID,
}: PrimaryButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        !disabled && shadows.button,
        disabled ? styles.disabled : pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.content}>
        {leadingIcon ? (
          <Feather name={leadingIcon} size={iconSize.sm} color={colors.textOnPrimary} />
        ) : null}
        <Text style={styles.label}>{label}</Text>
        {trailingIcon ? (
          <Feather name={trailingIcon} size={iconSize.sm} color={colors.textOnPrimary} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touch.buttonHeight,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pressed: { backgroundColor: colors.primaryPressed },
  disabled: { backgroundColor: colors.primaryDisabled },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: { ...typography.button, color: colors.textOnPrimary },
});
