import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenContainer, TextField } from '@/components';
import { landingRouteAfterSignIn, useSession } from '@/state/session';
import { colors, spacing, touch, typography } from '@/theme';
import type { OtpValues } from '../validation';
import { formatMobile, OTP_LENGTH, otpSchema } from '../validation';

/**
 * Parent one-time code. MOCK: no code is sent; any 6 digits sign in (the local backend uses the
 * fixed code 999999). The same generic message would be shown for every failure.
 */
export function OtpScreen() {
  const router = useRouter();
  const { mobile = '' } = useLocalSearchParams<{ mobile?: string }>();
  const signIn = useSession((s) => s.signIn);
  const { control, handleSubmit, formState } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(() => {
    signIn('parent');
    router.replace(landingRouteAfterSignIn(useSession.getState()));
  });

  return (
    <ScreenContainer
      footer={
        <PrimaryButton
          testID="verify-otp"
          label="Verify and continue"
          onPress={() => void onSubmit()}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Enter the code
        </Text>
        <Text style={styles.subtitle}>
          We sent a {OTP_LENGTH}-digit code to +91 {formatMobile(mobile)}.
        </Text>
      </View>
      <View style={styles.form}>
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <TextField
              testID="otp"
              label="One-time code"
              icon="shield"
              placeholder={'0'.repeat(OTP_LENGTH)}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={OTP_LENGTH}
              returnKeyType="done"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => void onSubmit()}
              error={formState.errors.code?.message}
            />
          )}
        />
        <Text style={styles.hint}>Demo build: any {OTP_LENGTH} digits work.</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Change mobile number"
          onPress={() => router.back()}
          style={styles.link}
        >
          <Text style={styles.linkText}>Change mobile number</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxxl },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.subtitle, color: colors.textSecondary, textAlign: 'center' },
  form: { gap: spacing.md, marginTop: spacing.xxxl },
  hint: { ...typography.caption, color: colors.textSecondary },
  link: { alignSelf: 'flex-end', minHeight: touch.minTarget, justifyContent: 'center' },
  linkText: { ...typography.label, color: colors.primary },
});
