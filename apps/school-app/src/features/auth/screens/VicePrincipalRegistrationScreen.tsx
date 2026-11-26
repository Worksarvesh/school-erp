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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { staffLoginSchema, type StaffLoginForm } from '../schemas';

const BLUE = '#1D4ED8';
const ERROR = '#DC2626';
const PLACEHOLDER = '#64748B';

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

type Field = keyof StaffLoginForm;

/**
 * SCHOOL-AUTH-VICE-PRINCIPAL-REGISTRATION: username + password, then the login page. MOCK: nothing
 * is saved or checked against an account yet.
 */
export function VicePrincipalRegistrationScreen() {
  const router = useRouter();
  const [values, setValues] = useState<StaffLoginForm>({ username: '', password: '' });
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const result = staffLoginSchema.safeParse(values);
  const errorFor = (field: Field) =>
    submitted ? result.error?.issues.find((i) => i.path[0] === field)?.message : undefined;

  const set = (field: Field, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const onRegister = () => {
    setSubmitted(true);
    if (!result.success) return;
    router.push('/(auth)/vice-principal-login');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Registration
        </Text>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Username</Text>
          <TextInput
            testID="vp-username"
            accessibilityLabel="Username"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            maxLength={60}
            placeholder="sch0001e0001"
            placeholderTextColor={PLACEHOLDER}
            value={values.username}
            onChangeText={(t) => set('username', t)}
            style={[styles.input, errorFor('username') ? styles.inputError : null, NO_OUTLINE]}
          />
          {errorFor('username') ? <Text style={styles.error}>{errorFor('username')}</Text> : null}

          <Text style={[styles.label, styles.gap]}>Password</Text>
          <TextInput
            testID="vp-password"
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            secureTextEntry={!showPassword}
            maxLength={128}
            placeholder="Enter password"
            placeholderTextColor={PLACEHOLDER}
            value={values.password}
            onChangeText={(t) => set('password', t)}
            onSubmitEditing={onRegister}
            style={[styles.input, errorFor('password') ? styles.inputError : null, NO_OUTLINE]}
          />
          {errorFor('password') ? <Text style={styles.error}>{errorFor('password')}</Text> : null}

          <View style={styles.links}>
            <Pressable
              testID="vp-show-password"
              accessibilityRole="button"
              accessibilityState={{ selected: showPassword }}
              hitSlop={10}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Text style={styles.show}>{showPassword ? 'Hide password' : 'Show password'}</Text>
            </Pressable>
            <Pressable
              testID="vp-forgot"
              accessibilityRole="link"
              hitSlop={10}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>
          </View>

          <Pressable
            testID="vp-register"
            accessibilityRole="button"
            accessibilityLabel="Register"
            onPress={onRegister}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>Register</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },
  header: { backgroundColor: BLUE, paddingBottom: 28 },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  // The design has 29 left and 12 right (not symmetric); kept as drawn.
  form: { paddingLeft: 29, paddingRight: 12, paddingTop: 42, paddingBottom: 32 },
  label: { color: '#555555', fontSize: 14.5, lineHeight: 20, marginBottom: 4 },
  gap: { marginTop: 20 },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#757575',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: '#111111',
  },
  inputError: { borderColor: ERROR },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, marginTop: 6 },
  links: {
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  show: { color: '#555555', fontSize: 14.5, lineHeight: 20 },
  forgot: { color: BLUE, fontSize: 14.5, lineHeight: 20, fontWeight: '600' },
  button: {
    height: 60,
    marginTop: 22,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
});
