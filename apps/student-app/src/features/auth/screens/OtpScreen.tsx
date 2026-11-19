import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { TextInputInstance, TextInputKeyPressEvent } from 'react-native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Screen, useTheme } from '@school-erp/ui';
import { useAuthStore } from '@school-erp/mobile-core';
import { mockSignInResponse } from '@/mock/auth';
import { useSession } from '@/state/session';
import { formatMobile, isCompleteOtp, OTP_LENGTH, OTP_RESEND_SECONDS } from '../validation';

const emptyDigits = () => Array.from({ length: OTP_LENGTH }, () => '');

/**
 * Parent one-time code: 6 boxes with auto-advance, a 30 s resend timer, and Verify enabled once
 * all 6 digits are entered. MOCK: no code is sent and any 6 digits sign in.
 * After sign-in the root layout guard moves the parent to Home (parents never see profile completion).
 */
export function OtpScreen() {
  const router = useRouter();
  const { colors, spacing, radii, typography } = useTheme();
  const { mobile = '' } = useLocalSearchParams<{ mobile?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const [digits, setDigits] = useState<string[]>(emptyDigits);
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_SECONDS);
  const [focused, setFocused] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInputInstance | null)[]>([]);

  const code = digits.join('');
  const complete = isCompleteOtp(code);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const focusBox = (index: number) => inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();

  const onChangeBox = (index: number, text: string) => {
    const clean = text.replace(/\D/g, '');
    setDigits((prev) => {
      const next = [...prev];
      if (clean.length <= 1) {
        next[index] = clean;
      } else {
        // Pasted or autofilled code: spread it across the boxes from this one.
        clean
          .slice(0, OTP_LENGTH - index)
          .split('')
          .forEach((d, i) => {
            next[index + i] = d;
          });
      }
      return next;
    });
    if (clean.length === 1 && index < OTP_LENGTH - 1) focusBox(index + 1);
    if (clean.length > 1) focusBox(index + clean.length);
  };

  const onKeyPress = (index: number, e: TextInputKeyPressEvent) => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '' && index > 0) {
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      focusBox(index - 1);
    }
  };

  const onResend = () => {
    if (secondsLeft > 0) return;
    setDigits(emptyDigits());
    setSecondsLeft(OTP_RESEND_SECONDS);
    focusBox(0);
  };

  const onVerify = async () => {
    if (!complete) return;
    setLoading(true);
    try {
      const session = useSession.getState();
      await session.hydrate();
      await session.selectRole('parent');
      await setSession(mockSignInResponse('parent'));
    } finally {
      setLoading(false);
    }
  };

  const timerLabel = `0:${String(secondsLeft).padStart(2, '0')}`;

  return (
    <Screen
      scrollable
      contentContainerStyle={{ padding: spacing.xl }}
      footer={
        <View style={{ padding: spacing.xl }}>
          <Button
            testID="verify-otp"
            label="Verify"
            size="lg"
            disabled={!complete}
            loading={loading}
            onPress={() => void onVerify()}
          />
        </View>
      }
    >
      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing['2xl'] }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: typography.fontSizes['2xl'],
            fontWeight: typography.fontWeights.bold,
            textAlign: 'center',
          }}
        >
          Enter the code
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.sm, textAlign: 'center' }}>
          We sent a {OTP_LENGTH}-digit code to +91 {formatMobile(mobile)}.
        </Text>
      </View>

      <View
        accessibilityLabel={`One-time code, ${OTP_LENGTH} digits`}
        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing['2xl'] }}
      >
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            testID={`otp-${index}`}
            accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
            value={digit}
            onChangeText={(t) => onChangeBox(index, t)}
            onKeyPress={(e) => onKeyPress(index, e)}
            onFocus={() => setFocused(index)}
            keyboardType="number-pad"
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={index === 0 ? 'sms-otp' : 'off'}
            autoFocus={index === 0}
            maxLength={index === 0 ? OTP_LENGTH : 1}
            selectTextOnFocus
            style={{
              flex: 1,
              height: 52,
              borderWidth: 1.5,
              borderRadius: radii.md,
              borderColor: focused === index ? colors.borderFocus : colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: typography.fontSizes.xl,
              fontWeight: typography.fontWeights.semibold,
              textAlign: 'center',
            }}
          />
        ))}
      </View>

      <Text style={{ marginTop: spacing.md, color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
        Demo build: any {OTP_LENGTH} digits work.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.base }}>
        <Pressable
          testID="resend-otp"
          accessibilityRole="button"
          accessibilityState={{ disabled: secondsLeft > 0 }}
          accessibilityLabel={secondsLeft > 0 ? `Resend code in ${secondsLeft} seconds` : 'Resend code'}
          disabled={secondsLeft > 0}
          onPress={onResend}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text
            style={{
              color: secondsLeft > 0 ? colors.textMuted : colors.primary,
              fontSize: typography.fontSizes.sm,
              fontWeight: typography.fontWeights.medium,
            }}
          >
            {secondsLeft > 0 ? `Resend code in ${timerLabel}` : 'Resend code'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Change mobile number"
          onPress={() => router.back()}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.primary, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium }}>
            Change number
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
