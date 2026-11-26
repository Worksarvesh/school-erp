import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@school-erp/api-client';
import { authService } from '../api/auth.service';
import { staffLoginSchema, type StaffLoginForm } from '../schemas';
import { useCompleteSignIn } from '../useSignIn';

const BLUE = '#1D4ED8';
const ERROR = '#DC2626';

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

type Field = keyof StaffLoginForm;

/** SCHOOL-AUTH-VICE-PRINCIPAL-LOGIN: username + password. MOCK: no network. */
export function VicePrincipalLoginScreen() {
  const completeSignIn = useCompleteSignIn();
  const [values, setValues] = useState<StaffLoginForm>({ username: '', password: '' });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const result = staffLoginSchema.safeParse(values);
  const errorFor = (field: Field) =>
    submitted ? result.error?.issues.find((i) => i.path[0] === field)?.message : undefined;

  const set = (field: Field, value: string) => {
    setFormError(null);
    setValues((v) => ({ ...v, [field]: value }));
  };

  const onSignIn = async () => {
    setSubmitted(true);
    if (!result.success || busy) return;
    setBusy(true);
    try {
      const { username, password } = result.data;
      await completeSignIn(await authService.staffLogin(username, password, 'vice_principal'));
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
      setBusy(false);
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
            Login To your Account
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>User Name</Text>
            <TextInput
              testID="vp-login-username"
              accessibilityLabel="User Name"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              maxLength={60}
              placeholder="SchoolAd00001"
              placeholderTextColor="#B5B5B5"
              value={values.username}
              onChangeText={(t) => set('username', t)}
              style={[styles.input, errorFor('username') ? styles.inputError : null, NO_OUTLINE]}
            />
            {errorFor('username') ? <Text style={styles.error}>{errorFor('username')}</Text> : null}

            <Text style={[styles.label, styles.gap]}>Password</Text>
            <TextInput
              testID="vp-login-password"
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              secureTextEntry
              maxLength={128}
              value={values.password}
              onChangeText={(t) => set('password', t)}
              onSubmitEditing={() => void onSignIn()}
              style={[styles.input, errorFor('password') ? styles.inputError : null, NO_OUTLINE]}
            />
            {errorFor('password') ? <Text style={styles.error}>{errorFor('password')}</Text> : null}

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Pressable
              testID="vp-sign-in"
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={() => void onSignIn()}
              style={[styles.button, busy && styles.buttonBusy]}
            >
              <Text style={styles.buttonLabel}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 19, paddingTop: 100, paddingBottom: 32 },
  title: {
    color: '#000000',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: { marginTop: 94 },
  label: { color: '#555555', fontSize: 14.5, lineHeight: 20, marginBottom: 4 },
  gap: { marginTop: 20 },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CACACA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: '#333333',
  },
  inputError: { borderColor: ERROR },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, marginTop: 6 },
  button: {
    height: 60,
    marginTop: 28,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: { opacity: 0.7 },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
});
