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
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerModal } from '@/components/DatePickerModal';
import { GENDERS, parseDob, registrationSchema, type RegistrationForm } from '../schemas';

const BLUE = '#1D4ED8';
const ERROR = '#DC2626';

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

type Field = keyof RegistrationForm;

/** A date as "DD/MM/YYYY". */
function formatDate(d: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** The calendar offers birth dates from 100 years ago up to 18 years ago. */
function dobLimits(today: Date = new Date()): { min: Date; max: Date } {
  const [y, m, d] = [today.getFullYear(), today.getMonth(), today.getDate()];
  return { min: new Date(y - 100, m, d), max: new Date(y - 18, m, d) };
}

/**
 * SCHOOL-AUTH-PRINCIPAL-REGISTRATION: a new principal gives name, date of birth and gender, then
 * waits for profile verification. MOCK: nothing is saved yet. (The label spelling "Principle" is
 * from the approved design.)
 */
export function RegistrationScreen() {
  const router = useRouter();
  const [values, setValues] = useState<RegistrationForm>({ name: '', dob: '', gender: '' });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [genderOpen, setGenderOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const limits = dobLimits();

  const result = registrationSchema.safeParse(values);
  const errors: Partial<Record<Field, string>> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as Field;
      if (!errors[key]) errors[key] = issue.message;
    }
  }
  const shown = (f: Field) => (touched[f] ? errors[f] : undefined);

  const set = (f: Field, v: string) => setValues((s) => ({ ...s, [f]: v }));
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  const onContinue = () => {
    setTouched({ name: true, dob: true, gender: true });
    if (!result.success) return;
    router.replace('/(auth)/select-school');
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
          <Text style={styles.label}>Principle Name</Text>
          <TextInput
            testID="reg-name"
            accessibilityLabel="Principle Name"
            autoCapitalize="words"
            autoComplete="name"
            maxLength={80}
            value={values.name}
            onChangeText={(t) => set('name', t)}
            onBlur={() => touch('name')}
            style={[styles.input, shown('name') ? styles.inputError : null, NO_OUTLINE]}
          />
          {shown('name') ? <Text style={styles.error}>{shown('name')}</Text> : null}

          <Text style={[styles.label, styles.gap]}>Date of Birth</Text>
          <Pressable
            testID="reg-dob"
            accessibilityRole="button"
            accessibilityLabel={`Date of Birth, ${values.dob || 'not selected'}`}
            onPress={() => {
              setGenderOpen(false);
              setCalendarOpen(true);
            }}
            style={[styles.input, styles.select, shown('dob') ? styles.inputError : null]}
          >
            <Text style={[styles.selectText, !values.dob && styles.placeholder]}>
              {values.dob || 'DD/MM/YYYY'}
            </Text>
            <CalendarDays size={20} color="#6B6B6B" />
          </Pressable>
          {shown('dob') ? <Text style={styles.error}>{shown('dob')}</Text> : null}

          <Text style={[styles.label, styles.gap]}>Gender</Text>
          <Pressable
            testID="reg-gender"
            accessibilityRole="button"
            accessibilityLabel={`Gender, ${values.gender || 'not selected'}`}
            accessibilityState={{ expanded: genderOpen }}
            onPress={() => setGenderOpen((v) => !v)}
            style={[styles.input, styles.select, shown('gender') ? styles.inputError : null]}
          >
            <Text style={[styles.selectText, !values.gender && styles.placeholder]}>
              {values.gender || 'Select gender'}
            </Text>
            {genderOpen ? (
              <ChevronUp size={22} color="#6B6B6B" />
            ) : (
              <ChevronDown size={22} color="#6B6B6B" />
            )}
          </Pressable>
          {genderOpen ? (
            <View style={styles.dropdown}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  testID={`gender-${g.toLowerCase()}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: values.gender === g }}
                  onPress={() => {
                    set('gender', g);
                    touch('gender');
                    setGenderOpen(false);
                  }}
                  style={[styles.option, values.gender === g && styles.optionActive]}
                >
                  <Text style={[styles.optionText, values.gender === g && styles.optionTextActive]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {shown('gender') ? <Text style={styles.error}>{shown('gender')}</Text> : null}

          <Pressable
            testID="reg-continue"
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={onContinue}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>Continue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={calendarOpen}
        title="Date of Birth"
        value={parseDob(values.dob)}
        minDate={limits.min}
        maxDate={limits.max}
        onSelect={(date) => {
          set('dob', formatDate(date));
          touch('dob');
          setCalendarOpen(false);
        }}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },
  header: { backgroundColor: BLUE, paddingBottom: 38 },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  // The design has 28 left and 12 right (not symmetric); kept as drawn.
  form: { paddingLeft: 28, paddingRight: 12, paddingTop: 40, paddingBottom: 32 },
  label: { color: '#555555', fontSize: 15, lineHeight: 20, marginBottom: 8 },
  gap: { marginTop: 24 },
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
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 16, color: '#111111' },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, marginTop: 6 },
  button: {
    height: 58,
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '500' },
  placeholder: { color: '#B5B5B5' },
  dropdown: {
    marginTop: 6,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#CACACA',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  option: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  optionActive: { backgroundColor: '#EEF2FF' },
  optionText: { color: '#333333', fontSize: 16 },
  optionTextActive: { color: BLUE, fontWeight: '700' },
});
