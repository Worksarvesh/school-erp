import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Input, Screen, useTheme } from '@school-erp/ui';
import { useAuthStore } from '@school-erp/mobile-core';
import { mockSignInResponse } from '@/mock/auth';
import { MOCK_UNREGISTERED_PARENT_MOBILE } from '@/mock/student';
import type { AppRole } from '@/state/session';
import { useSession } from '@/state/session';
import { fieldErrors, normalizeMobile, parentLoginSchema, studentLoginSchema } from '../validation';

/**
 * "Login To your Account" (V1.2), role-aware:
 * - Student: school-issued username + password. "Forgot Password?" goes to Contact School Admin
 *   (no self-service reset; ForgotPasswordModal is not used).
 * - Parent: registered mobile (+91) + "Send OTP", then the OTP screen. No password.
 * MOCK: no network. Any non-empty student credentials succeed. Parent mobile
 * MOCK_UNREGISTERED_PARENT_MOBILE (9000000000) has no account.
 *
 * After sign-in the root layout guard moves the user out of (auth) to the landing route.
 */
export function RoleAwareLoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const sessionRole = useSession((s) => s.role);
  const role: AppRole =
    params.role === 'parent' || (!params.role && sessionRole === 'parent') ? 'parent' : 'student';

  return role === 'parent' ? <ParentLogin /> : <StudentLogin />;
}

function LoginHeader({ subtitle }: { subtitle: string }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing['2xl'],
        marginBottom: spacing['2xl'],
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          color: colors.text,
          fontSize: typography.fontSizes['2xl'],
          fontWeight: typography.fontWeights.bold,
          textAlign: 'center',
        }}
      >
        Login To your Account
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSizes.sm,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function TextLink({
  label,
  onPress,
  testID,
  a11yLabel,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  a11yLabel?: string;
}) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={a11yLabel ?? label}
      onPress={onPress}
      style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end' }}
    >
      <Text
        style={{
          color: colors.primary,
          fontSize: typography.fontSizes.sm,
          fontWeight: typography.fontWeights.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ChangeRoleLink() {
  const router = useRouter();
  return (
    <TextLink
      testID="change-role"
      label="Not you? Change role"
      onPress={() => router.replace('/(auth)/role-select')}
    />
  );
}

function StudentLogin() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const result = studentLoginSchema.safeParse({ username, password });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const session = useSession.getState();
      await session.hydrate();
      await session.selectRole('student');
      await setSession(mockSignInResponse('student'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scrollable
      contentContainerStyle={{ padding: spacing.xl }}
      footer={
        <View style={{ padding: spacing.xl }}>
          <Button
            testID="sign-in"
            label="Sign in"
            size="lg"
            loading={loading}
            onPress={() => void onSubmit()}
          />
        </View>
      }
    >
      <LoginHeader subtitle="Login using the username and password given by your school. You can add your other details after logging in." />
      <Input
        testID="username"
        label="Username"
        placeholder="sch0001s0001"
        leftIcon={<User size={18} color={colors.textSecondary} />}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        returnKeyType="next"
        value={username}
        onChangeText={setUsername}
        error={errors.username}
      />
      <Input
        testID="password"
        label="Password"
        placeholder="Enter your password"
        isPassword
        textContentType="password"
        returnKeyType="done"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => void onSubmit()}
        error={errors.password}
      />
      <TextLink
        testID="forgot-password"
        label="Forgot Password?"
        a11yLabel="Forgot password? Contact your school admin"
        onPress={() => router.push('/(auth)/contact-admin')}
      />
      <ChangeRoleLink />
    </Screen>
  );
}

function ParentLogin() {
  const router = useRouter();
  const { colors, spacing, radii, typography } = useTheme();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [noAccount, setNoAccount] = useState(false);

  const onSendOtp = () => {
    const result = parentLoginSchema.safeParse({ mobile });
    if (!result.success) {
      setError(fieldErrors(result.error).mobile);
      setNoAccount(false);
      return;
    }
    setError(undefined);
    if (result.data.mobile === MOCK_UNREGISTERED_PARENT_MOBILE) {
      setNoAccount(true);
      return;
    }
    setNoAccount(false);
    void useSession.getState().selectRole('parent');
    router.push({ pathname: '/(auth)/otp', params: { mobile: result.data.mobile } });
  };

  return (
    <Screen
      scrollable
      contentContainerStyle={{ padding: spacing.xl }}
      footer={
        <View style={{ padding: spacing.xl }}>
          <Button
            testID="send-otp"
            label="Send OTP"
            size="lg"
            rightIcon={<ArrowRight size={18} color={colors.primaryForeground} />}
            onPress={onSendOtp}
          />
        </View>
      }
    >
      <LoginHeader subtitle="Enter the mobile number registered with your child's school. We will send you a one-time code." />
      <Input
        testID="mobile"
        label="Mobile number"
        placeholder="10-digit mobile number"
        leftIcon={
          <Text style={{ color: colors.text, fontSize: typography.fontSizes.base }}>+91</Text>
        }
        keyboardType="number-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={10}
        returnKeyType="done"
        value={mobile}
        onChangeText={(text) => {
          setMobile(normalizeMobile(text).replace(/\D/g, ''));
          setNoAccount(false);
        }}
        onSubmitEditing={onSendOtp}
        error={error}
      />

      {noAccount ? (
        <View
          testID="no-account"
          accessibilityLiveRegion="polite"
          style={{
            gap: spacing.md,
            padding: spacing.base,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.error,
            backgroundColor: colors.errorBg,
          }}
        >
          <Text style={{ color: colors.error, fontSize: typography.fontSizes.sm }}>
            No account found for this number. Please contact your school.
          </Text>
          <Button
            testID="contact-school"
            label="Contact School"
            variant="outline"
            onPress={() =>
              router.push({ pathname: '/(auth)/contact-admin', params: { reason: 'no-account' } })
            }
          />
        </View>
      ) : null}

      <ChangeRoleLink />
    </Screen>
  );
}
