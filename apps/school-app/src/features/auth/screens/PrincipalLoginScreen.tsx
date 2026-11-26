import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/state/session';
import { authService } from '../api/auth.service';
import { principalMobileSchema } from '../schemas';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles static images only through require().
const MASCOT = require('../../../../assets/onboarding/book-mascot.png');

const BUTTON = '#1D4ED8';
const ERROR = '#DC2626';

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

/**
 * SCHOOL-AUTH-PRINCIPAL-MOBILE-LOGIN. The answer is the same whether or not the number exists.
 * The mobile number is checked on the phone first (digits only, 10 digits, starts with 6-9).
 */
export function PrincipalLoginScreen() {
  const router = useRouter();
  const setPendingMobile = useSession((s) => s.setPendingMobile);
  const [mobile, setMobile] = useState('');
  // Errors show after the first blur or submit, then update as the person types.
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  const check = (value: string): string | undefined => {
    const result = principalMobileSchema.safeParse({ mobile: value });
    return result.success ? undefined : result.error.issues[0]?.message;
  };
  // A wrong first digit is flagged straight away; the length error waits for blur or submit.
  const wrongStart = mobile.length > 0 && !/^[6-9]/.test(mobile);
  const error = touched || wrongStart ? check(mobile) : undefined;

  const onSubmit = async () => {
    setTouched(true);
    if (check(mobile)) return;
    setSubmitting(true);
    try {
      await authService.requestPrincipalOtp(mobile);
      setPendingMobile(mobile);
      router.push('/(auth)/otp');
    } finally {
      setSubmitting(false);
    }
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
            School app
          </Text>
          <Text style={styles.subtitle}>
            Login using your phone number or Email ID. You can add your other details after logging
            in.
          </Text>

          <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            testID="principal-mobile"
            accessibilityLabel="Mobile Number"
            keyboardType="number-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={10}
            value={mobile}
            onChangeText={(t) => setMobile(t.replace(/\D/g, ''))}
            onBlur={() => setTouched(true)}
            onSubmitEditing={() => void onSubmit()}
            style={[styles.input, error ? styles.inputError : null, NO_OUTLINE]}
          />
          {error ? (
            <Text testID="principal-mobile-error" accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Pressable
            testID="principal-send-otp"
            accessibilityRole="button"
            accessibilityLabel="Send OTP"
            accessibilityState={{ disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={() => void onSubmit()}
            style={[styles.button, isSubmitting && styles.buttonBusy]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonLabel}>OTP</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  title: {
    color: '#000000',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },
  mascot: { alignSelf: 'center', width: 158, height: 147, marginTop: 14 },
  label: { color: '#666666', fontSize: 17, lineHeight: 22, marginTop: 14 },
  input: {
    height: 58,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#111111',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputError: { borderColor: ERROR, backgroundColor: '#FEF2F2' },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, marginTop: 6 },
  button: {
    height: 58,
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: { opacity: 0.8 },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '500' },
});
