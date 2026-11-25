import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Header, Input, Screen, useTheme } from '@school-erp/ui';
import { useSession } from '@/state/session';
import { authService } from '../api/auth.service';
import { principalMobileSchema, type PrincipalMobileForm } from '../schemas';

/** SCHOOL-AUTH-PRINCIPAL-MOBILE-LOGIN. The answer is the same whether or not the number exists. */
export function PrincipalLoginScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const setPendingMobile = useSession((s) => s.setPendingMobile);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PrincipalMobileForm>({
    resolver: zodResolver(principalMobileSchema),
    defaultValues: { mobile: '' },
  });

  const onSubmit = handleSubmit(async ({ mobile }) => {
    await authService.requestPrincipalOtp(mobile);
    setPendingMobile(mobile);
    router.push('/(auth)/otp');
  });

  return (
    <Screen
      scrollable
      header={<Header title="Principal sign in" showBack onBack={() => router.back()} />}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
        We will send a 6-digit code to your registered mobile number.
      </Text>
      <Controller
        control={control}
        name="mobile"
        render={({ field }) => (
          <Input
            label="Mobile number (+91)"
            keyboardType="number-pad"
            maxLength={10}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.mobile?.message}
            testID="principal-mobile"
          />
        )}
      />
      <Button
        label="Send OTP"
        loading={isSubmitting}
        onPress={onSubmit}
        testID="principal-send-otp"
      />
    </Screen>
  );
}
