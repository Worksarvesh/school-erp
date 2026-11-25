import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';

/** Fixed light palette for the auth screens (approved design: white, violet accent). */
export const AUTH = {
  background: '#FFFFFF',
  title: '#0B0B0F',
  subtitle: '#3F3F46',
  label: '#334155',
  fieldBg: '#F8F9FB',
  fieldBorder: '#E2E5EA',
  fieldText: '#111827',
  placeholder: '#9CA3AF',
  icon: '#8B5CF6',
  accent: '#4B18AA',
  accentDisabled: '#C9A8FA',
  error: '#DC2626',
  back: '#3F3F46',
} as const;

interface AuthShellProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
}

/** White auth screen: back arrow beside a left-aligned title and subtitle, then the form. */
export function AuthShell({ title, subtitle, onBack, children }: AuthShellProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            {onBack ? (
              <Pressable
                testID="auth-back"
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
                onPress={onBack}
                style={styles.back}
              >
                <ArrowLeft size={24} color={AUTH.back} />
              </Pressable>
            ) : null}
            <View style={styles.flex}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface AuthFieldProps extends TextInputProps {
  label: string;
  icon: ReactNode;
  error?: string;
  /** Hides the text and shows a show/hide eye on the right. */
  isPassword?: boolean;
  /** Shown instead of an icon, e.g. "+91". */
  testID?: string;
}

/** Labelled pill input with a violet leading icon. */
export function AuthField({ label, icon, error, isPassword, testID, ...input }: AuthFieldProps) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <View style={styles.fieldIcon}>{icon}</View>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          placeholderTextColor={AUTH.placeholder}
          secureTextEntry={isPassword && hidden}
          style={styles.input}
          {...input}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={10}
            onPress={() => setHidden((h) => !h)}
          >
            {hidden ? <EyeOff size={22} color="#6B7280" /> : <Eye size={22} color="#6B7280" />}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Violet text link with a trailing arrow, aligned right (e.g. "Forgot Password?"). */
export function AuthLink({
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
  return (
    <Pressable
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={a11yLabel ?? label}
      onPress={onPress}
      style={styles.link}
    >
      <Text style={styles.linkText}>{label}</Text>
      <ArrowRight size={16} color={AUTH.accent} />
    </Pressable>
  );
}

/** Full-width violet button. */
export function AuthButton({
  label,
  onPress,
  testID,
  loading = false,
  trailingArrow = false,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  loading?: boolean;
  trailingArrow?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={[styles.button, loading && styles.buttonDisabled]}
    >
      <Text style={styles.buttonLabel}>{loading ? 'Please wait...' : label}</Text>
      {trailingArrow ? <ArrowRight size={18} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: AUTH.background },
  content: { paddingHorizontal: 16, paddingTop: 72, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  back: { paddingTop: 6 },
  title: { color: AUTH.title, fontSize: 24, fontWeight: '700', lineHeight: 30 },
  subtitle: { color: AUTH.subtitle, fontSize: 13, lineHeight: 19, marginTop: 8 },
  form: { marginTop: 56 },
  fieldWrap: { marginBottom: 20 },
  label: { color: AUTH.label, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AUTH.fieldBorder,
    backgroundColor: AUTH.fieldBg,
    paddingHorizontal: 18,
  },
  fieldError: { borderColor: AUTH.error },
  fieldIcon: { width: 40, justifyContent: 'center' },
  input: {
    flex: 1,
    height: '100%',
    color: AUTH.fieldText,
    fontSize: 15,
    // Removes the browser focus outline so the pill keeps its shape on web.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  error: { color: AUTH.error, fontSize: 12, marginTop: 6 },
  link: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    marginBottom: 18,
  },
  linkText: { color: AUTH.accent, fontSize: 14, fontWeight: '600' },
  button: {
    height: 56,
    borderRadius: 12,
    backgroundColor: AUTH.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: { backgroundColor: AUTH.accentDisabled },
  buttonLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
