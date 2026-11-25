import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@school-erp/api-client';
import { Button, Header, Input, Screen, useTheme } from '@school-erp/ui';
import { authService } from '../api/auth.service';
import { staffLoginSchema, type StaffLoginForm } from '../schemas';
import { useCompleteSignIn } from '../useSignIn';

/** SCHOOL-AUTH-STAFF-LOGIN: username + password (OTP login is refused for username accounts). */
export function StaffLoginScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const completeSignIn = useCompleteSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffLoginForm>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ username, password }) => {
    setFormError(null);
    try {
      await completeSignIn(await authService.staffLogin(username, password));
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    }
  });

  return (
    <Screen
      scrollable
      header={<Header title="Staff sign in" showBack onBack={() => router.back()} />}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <Input
            label="Username"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="e.g. sch0001t0001"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.username?.message}
            testID="staff-username"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            label="Password"
            isPassword
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            testID="staff-password"
          />
        )}
      />
      {formError ? (
        <Text style={{ color: colors.error, marginBottom: spacing.md }}>{formError}</Text>
      ) : null}
      <Button label="Sign in" loading={isSubmitting} onPress={onSubmit} testID="staff-submit" />
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/(auth)/forgot-password')}
        style={{ marginTop: spacing.lg, alignSelf: 'center' }}
      >
        <Text style={{ color: colors.primary, fontWeight: '600' }}>Forgot password?</Text>
      </Pressable>
    </Screen>
  );
}
