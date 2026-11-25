import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '@school-erp/api-client';
import { Button, Header, Input, Screen, useTheme } from '@school-erp/ui';
import { useSession } from '@/state/session';
import { authService } from '../api/auth.service';
import { useCompleteSignIn } from '../useSignIn';

/**
 * SCHOOL-AUTH-PRINCIPAL-OTP. MOCK: any 6 digits work. Against the local API the fixed provider
 * code is OTP_FIXED_CODE (default 999999). Never log the code.
 */
export function OtpScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const mobile = useSession((s) => s.pendingMobile);
  const completeSignIn = useCompleteSignIn();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!mobile) return router.replace('/(auth)/principal-login');
    setLoading(true);
    setError(null);
    try {
      await completeSignIn(await authService.verifyPrincipalOtp(mobile, code));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scrollable
      header={<Header title="Enter code" showBack onBack={() => router.back()} />}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
        Code sent to +91 {mobile ? `******${mobile.slice(-4)}` : ''}
      </Text>
      <Input
        label="6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
        error={error ?? undefined}
        testID="otp-code"
      />
      <Button
        label="Verify"
        disabled={code.length !== 6}
        loading={loading}
        onPress={verify}
        testID="otp-verify"
      />
    </Screen>
  );
}
