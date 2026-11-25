import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen, Button, Input, useTheme, StyleSheet, Text } from '@school-erp/ui';
import { useAuthStore } from '@school-erp/mobile-core';
import { loginSchema, type LoginFormData } from '../schemas/auth.schema.js';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'sch0001s0001',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await MockStudentServices.login(data);
      await setSession(res);

      const onboardingDone = useAuthStore.getState().hasCompletedOnboarding;
      if (!onboardingDone) {
        router.replace('/(onboarding)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid student credentials';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={[styles.container, { padding: spacing.xl }]}>
      <View style={styles.headerArea}>
        <Text
          style={[
            styles.title,
            {
              color: colors.primary,
              fontSize: typography.fontSizes['3xl'],
              fontWeight: typography.fontWeights.bold,
            },
          ]}
        >
          Student Portal
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.base,
              marginTop: spacing.xs,
            },
          ]}
        >
          Sign in with your school-issued username
        </Text>
      </View>

      {errorMessage ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.errorBg,
              borderColor: colors.error,
              padding: spacing.md,
              marginBottom: spacing.base,
            },
          ]}
        >
          <Text style={{ color: colors.error, fontSize: typography.fontSizes.sm }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <Controller
        control={control}
        name="identifier"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="School Username"
            placeholder="e.g. sch0001s0001"
            autoCapitalize="none"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.identifier?.message}
            testID="login-username-input"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="Enter your password"
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
            testID="login-password-input"
          />
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/forgot-password-modal')}
        style={[styles.forgotButton, { marginTop: spacing.xs, marginBottom: spacing.lg }]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Forgot Password assistance"
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.medium,
            textAlign: 'right',
          }}
        >
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <Button
        label="Sign In"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        size="lg"
        testID="login-submit-button"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  headerArea: {
    marginBottom: 32,
  },
  title: {},
  subtitle: {},
  errorBanner: {
    borderRadius: 8,
    borderWidth: 1,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
  },
});
