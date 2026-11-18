import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { TextInputRef } from '@/components';
import { PasswordField, PrimaryButton, ScreenContainer, TextField } from '@/components';
import type { Role } from '@/state/session';
import { landingRouteAfterSignIn, useSession } from '@/state/session';
import { colors, iconSize, spacing, touch, typography } from '@/theme';
import type { ParentLoginValues, StudentLoginValues } from '../validation';
import { normalizeMobile, parentLoginSchema, studentLoginSchema } from '../validation';

/**
 * "Login To your Account". Approved V1 sign-in methods:
 * - Student: school-issued username + password ("Forgot Password?" goes to Contact Admin).
 * - Parent: registered mobile number, then a one-time code (next screen).
 * MOCK: no network; any non-empty student credentials succeed.
 */
export function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const sessionRole = useSession((s) => s.role);
  const role: Role =
    params.role === 'parent' || (!params.role && sessionRole === 'parent') ? 'parent' : 'student';

  return role === 'parent' ? <ParentLogin /> : <StudentLogin />;
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        Login To your Account
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function StudentLogin() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const passwordRef = useRef<TextInputRef>(null);
  const { control, handleSubmit, formState } = useForm<StudentLoginValues>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(() => {
    signIn('student');
    router.replace(landingRouteAfterSignIn(useSession.getState()));
  });

  return (
    <ScreenContainer
      footer={<PrimaryButton testID="sign-in" label="Sign in" onPress={() => void onSubmit()} />}
    >
      <Header subtitle="Login using the username and password given by your school. You can add your other details after logging in." />
      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <TextField
              testID="username"
              label="Username"
              icon="user"
              placeholder="sch0001s0001"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={formState.errors.username?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordField
              ref={passwordRef}
              testID="password"
              label="Password"
              placeholder="Enter your password"
              returnKeyType="done"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => void onSubmit()}
              error={formState.errors.password?.message}
            />
          )}
        />
        <Pressable
          testID="forgot-password"
          accessibilityRole="link"
          accessibilityLabel="Forgot password? Contact your school admin"
          onPress={() => router.push('/contact-admin')}
          style={styles.link}
        >
          <Text style={styles.linkText}>Forgot Password?</Text>
          <Feather name="arrow-right" size={iconSize.sm} color={colors.primary} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function ParentLogin() {
  const router = useRouter();
  const { control, handleSubmit, formState } = useForm<ParentLoginValues>({
    resolver: zodResolver(parentLoginSchema),
    defaultValues: { mobile: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit((values) => {
    router.push({ pathname: '/otp', params: { mobile: normalizeMobile(values.mobile) } });
  });

  return (
    <ScreenContainer
      footer={
        <PrimaryButton
          testID="send-otp"
          label="Send code"
          trailingIcon="arrow-right"
          onPress={() => void onSubmit()}
        />
      }
    >
      <Header subtitle="Enter the mobile number registered with your child's school. We will send you a one-time code." />
      <View style={styles.form}>
        <Controller
          control={control}
          name="mobile"
          render={({ field }) => (
            <TextField
              testID="mobile"
              label="Mobile number"
              icon="phone"
              prefix="+91"
              placeholder="98765 43210"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              maxLength={11}
              returnKeyType="done"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => void onSubmit()}
              error={formState.errors.mobile?.message}
            />
          )}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxxl },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.subtitle, color: colors.textSecondary, textAlign: 'center' },
  form: { gap: spacing.xl, marginTop: spacing.xxxl },
  link: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touch.minTarget,
  },
  linkText: { ...typography.label, color: colors.primary },
});
