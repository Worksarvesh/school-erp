import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@school-erp/api-client';
import { useSession } from '@/state/session';
import { authService } from '../api/auth.service';
import { OTP_LENGTH } from '../schemas';

const BUTTON = '#1D4ED8';
const ACCENT = '#7A00FF';
const ERROR = '#DC2626';
const RESEND_SECONDS = 30;

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

/**
 * SCHOOL-AUTH-PRINCIPAL-OTP. MOCK: any 4 digits work. Never log the code.
 * Four boxes: typing moves forward, Backspace moves back, a pasted code fills all boxes.
 */
export function OtpScreen() {
  const router = useRouter();
  const mobile = useSession((s) => s.pendingMobile);
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [focused, setFocused] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(0);
  const [resent, setResent] = useState(false);
  const refs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const code = digits.join('');

  const onChange = (index: number, text: string) => {
    const clean = text.replace(/\D/g, '');
    setError(null);
    if (clean.length === 0) {
      setDigits((d) => d.map((v, i) => (i === index ? '' : v)));
      return;
    }
    // Typing one digit, or pasting several: fill from this box onward.
    const next = [...digits];
    clean
      .slice(0, OTP_LENGTH - index)
      .split('')
      .forEach((ch, k) => {
        next[index + k] = ch;
      });
    setDigits(next);
    const target = Math.min(index + clean.length, OTP_LENGTH - 1);
    refs.current[target]?.focus();
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && digits[index] === '' && index > 0) {
      setDigits((d) => d.map((v, i) => (i === index - 1 ? '' : v)));
      refs.current[index - 1]?.focus();
    }
  };

  const verify = async () => {
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }
    if (!mobile) {
      router.replace('/(auth)/principal-login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.verifyPrincipalOtp(mobile, code);
      // MOCK: for now every principal sees "profile under verification" after the code. A verified
      // principal will go straight to the dashboard once the real status comes from the API.
      router.replace('/(auth)/profile-verification');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (wait > 0 || !mobile) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setError(null);
    setResent(true);
    setWait(RESEND_SECONDS);
    refs.current[0]?.focus();
    await authService.requestPrincipalOtp(mobile);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>
            Verify Phone
          </Text>
          <Text style={styles.subtitle}>
            Enter the {OTP_LENGTH} - digit code sent to{'\n'}your phone number
          </Text>

          <View style={styles.boxes}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                testID={`otp-box-${i}`}
                accessibilityLabel={`Digit ${i + 1} of ${OTP_LENGTH}`}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete={i === 0 ? 'sms-otp' : 'off'}
                autoFocus={i === 0}
                maxLength={i === 0 ? OTP_LENGTH : 1}
                value={d}
                onChangeText={(t) => onChange(i, t)}
                onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
                onFocus={() => setFocused(i)}
                selectTextOnFocus
                style={[
                  styles.box,
                  focused === i && styles.boxFocused,
                  error ? styles.boxError : null,
                  NO_OUTLINE,
                ]}
              />
            ))}
          </View>
          {error ? (
            <Text testID="otp-error" accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Pressable
            testID="otp-verify"
            accessibilityRole="button"
            accessibilityLabel="Verify"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={() => void verify()}
            style={[styles.button, loading && styles.buttonBusy]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonLabel}>Verify</Text>
            )}
          </Pressable>

          <Text style={styles.resendText}>
            Didn’t receive code?{' '}
            <Text
              testID="otp-resend"
              accessibilityRole="button"
              accessibilityState={{ disabled: wait > 0 }}
              onPress={wait > 0 ? undefined : () => void resend()}
              style={[styles.resendLink, wait > 0 && styles.resendDisabled]}
            >
              {wait > 0 ? `Resend in ${wait}s` : 'Resend Code'}
            </Text>
          </Text>
          {resent && wait > 0 ? <Text style={styles.sent}>A new code has been sent.</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 29, paddingTop: 52, paddingBottom: 32 },
  title: {
    color: '#000000',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  boxes: {
    marginTop: 118,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  box: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4CDE3',
    backgroundColor: '#F9F8FF',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#111111',
  },
  boxFocused: { borderColor: ACCENT },
  boxError: { borderColor: ERROR },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 10 },
  button: {
    height: 47,
    marginTop: 47,
    borderRadius: 12,
    backgroundColor: BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: { opacity: 0.8 },
  buttonLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  resendText: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 28,
  },
  resendLink: { color: ACCENT, fontSize: 16, lineHeight: 20, fontWeight: '700' },
  resendDisabled: { opacity: 0.55 },
  sent: { color: '#16A34A', fontSize: 13, textAlign: 'center', marginTop: 8 },
});
