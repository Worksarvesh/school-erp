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
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminNameSchema } from '../schemas';

const BLUE = '#1D4ED8';
const ERROR = '#DC2626';

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

/**
 * SCHOOL-SETUP-ADD-ADMIN: the principal types the new Admin's name; the designation is fixed.
 * "Generate ID" opens the login details. MOCK: nothing is saved yet.
 */
export function AddAdminScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const result = adminNameSchema.safeParse(name);
  const error = touched && !result.success ? result.error.issues[0]?.message : undefined;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/add-staff'));

  const onGenerate = () => {
    setTouched(true);
    if (!result.success) return;
    router.push('/(auth)/admin-login-detail');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            testID="add-admin-back"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={back}
            style={styles.back}
          >
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            Add Admin
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Admin Name</Text>
          <TextInput
            testID="admin-name"
            accessibilityLabel="Admin Name"
            autoCapitalize="words"
            autoComplete="off"
            maxLength={80}
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched(true)}
            onSubmitEditing={onGenerate}
            style={[styles.input, error ? styles.inputError : null, NO_OUTLINE]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={[styles.label, styles.gap]}>Designation</Text>
          <View
            testID="admin-designation"
            accessibilityLabel="Designation, Admin"
            style={[styles.input, styles.fixed]}
          >
            <Text style={styles.fixedText}>Admin</Text>
          </View>

          <Pressable
            testID="generate-id"
            accessibilityRole="button"
            accessibilityLabel="Generate ID"
            onPress={onGenerate}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>Generate ID</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },
  header: { backgroundColor: BLUE, paddingBottom: 56 },
  headerRow: { marginTop: 14, height: 34, justifyContent: 'center' },
  back: { position: 'absolute', left: 19, zIndex: 1 },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  form: { paddingHorizontal: 19, paddingTop: 41, paddingBottom: 32 },
  label: { color: '#555555', fontSize: 15, lineHeight: 20, marginBottom: 8 },
  gap: { marginTop: 18 },
  input: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#CACACA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
  },
  inputError: { borderColor: ERROR },
  fixed: { justifyContent: 'center' },
  fixedText: { color: '#333333', fontSize: 16 },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, marginTop: 6 },
  button: {
    height: 58,
    marginTop: 25,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '500' },
});
