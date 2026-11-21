import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Phone, User } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAuthStore } from '@school-erp/mobile-core';
import { mockSignInResponse } from '@/mock/auth';
import { MOCK_UNREGISTERED_PARENT_MOBILE } from '@/mock/student';
import type { AppRole } from '@/state/session';
import { useSession } from '@/state/session';
import { AUTH, AuthButton, AuthField, AuthLink, AuthShell } from '../components/AuthKit';
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

function StudentLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  /** Validates one field when the user leaves it, so errors show before pressing Sign in. */
  const validateField = (field: 'username' | 'password', value: string) => {
    const result = studentLoginSchema.safeParse({ username, password, [field]: value });
    const message = result.success ? undefined : fieldErrors(result.error)[field];
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const clearError = (field: 'username' | 'password') =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

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
    <AuthShell
      title="Login To your Account"
      subtitle={
        'Login using the username given by your school.\nYou can add your other details after logging in.'
      }
      onBack={() => router.replace('/(auth)/role-select')}
    >
      <AuthField
        testID="username"
        label="Username"
        placeholder="Enter your username"
        icon={<User size={22} color={AUTH.icon} />}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        returnKeyType="next"
        value={username}
        onChangeText={(t) => {
          setUsername(t.toLowerCase());
          clearError('username');
        }}
        onBlur={() => validateField('username', username)}
        error={errors.username}
      />
      <AuthField
        testID="password"
        label="Password"
        placeholder="Enter your password"
        icon={<Lock size={22} color={AUTH.icon} />}
        isPassword
        textContentType="password"
        returnKeyType="done"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError('password');
        }}
        onBlur={() => validateField('password', password)}
        onSubmitEditing={() => void onSubmit()}
        error={errors.password}
      />
      <AuthLink
        testID="forgot-password"
        label="Forgot Password?"
        a11yLabel="Forgot password? Contact your school admin"
        onPress={() => router.push('/(auth)/contact-admin')}
      />
      <AuthButton
        testID="sign-in"
        label="Sign in"
        loading={loading}
        onPress={() => void onSubmit()}
      />
    </AuthShell>
  );
}

function ParentLogin() {
  const router = useRouter();
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
    <AuthShell
      title="Login To your Account"
      subtitle={
        "Enter the mobile number registered with your child's school.\nWe will send you a one-time code."
      }
      onBack={() => router.replace('/(auth)/role-select')}
    >
      <AuthField
        testID="mobile"
        label="Mobile number"
        placeholder="10-digit mobile number"
        icon={<Phone size={22} color={AUTH.icon} />}
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
        <View testID="no-account" accessibilityLiveRegion="polite" style={{ marginBottom: 18 }}>
          <Text style={{ color: AUTH.error, fontSize: 13, marginBottom: 6 }}>
            No account found for this number. Please contact your school.
          </Text>
          <AuthLink
            testID="contact-school"
            label="Contact School"
            onPress={() =>
              router.push({ pathname: '/(auth)/contact-admin', params: { reason: 'no-account' } })
            }
          />
        </View>
      ) : null}

      <AuthButton testID="send-otp" label="Send OTP" trailingArrow onPress={onSendOtp} />
    </AuthShell>
  );
}
