import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Header, Input, Screen, useTheme } from '@school-erp/ui';
import { useSession } from '@/state/session';
import { authService } from '../api/auth.service';
import { changePasswordSchema, type ChangePasswordForm } from '../schemas';

const FIELDS = [
  { name: 'currentPassword', label: 'Temporary password' },
  { name: 'newPassword', label: 'New password' },
  { name: 'confirmPassword', label: 'Confirm new password' },
] as const;

/** SCHOOL-AUTH-CHANGE-TEMP-PASSWORD: required before anything else after a temporary password. */
export function ChangePasswordScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const passwordChanged = useSession((s) => s.passwordChanged);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    await authService.changeTemporaryPassword(currentPassword, newPassword);
    passwordChanged();
    router.replace('/(tabs)');
  });

  return (
    <Screen
      scrollable
      header={<Header title="Set a new password" />}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
        Your school gave you a temporary password. Choose your own to continue.
      </Text>
      {FIELDS.map((f) => (
        <Controller
          key={f.name}
          control={control}
          name={f.name}
          render={({ field }) => (
            <Input
              label={f.label}
              isPassword
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors[f.name]?.message}
            />
          )}
        />
      ))}
      <Button label="Save password" loading={isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}
