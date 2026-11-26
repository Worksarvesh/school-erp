import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import {
  Building2,
  ChevronDown,
  GraduationCap,
  House,
  Map as MapIcon,
  MapPin,
  Plus,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cityOptions, districtOptions, schoolOptions, stateOptions } from '@/mock/schools';
import { otherSchoolSchema } from '../schemas';

const BLUE = '#1D4ED8';
const PURPLE = '#4B2FBF';
const ERROR = '#DC2626';
const TEXT = '#1A1A2E';
const MUTED = '#555566';

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

type PickKey = 'state' | 'city' | 'district' | 'school';
type OtherKey = 'name' | 'address' | 'pincode';

const EMPTY_PICK: Record<PickKey, string> = { state: '', city: '', district: '', school: '' };
const EMPTY_OTHER: Record<OtherKey, string> = { name: '', address: '', pincode: '' };

const PICK_META: Record<
  PickKey,
  { label: string; placeholder: string; error: string; Icon: LucideIcon }
> = {
  state: { label: 'State', placeholder: 'Select state', error: 'Select your state', Icon: MapPin },
  city: { label: 'City', placeholder: 'Select city', error: 'Select your city', Icon: Building2 },
  district: {
    label: 'District',
    placeholder: 'Select district',
    error: 'Select your district',
    Icon: MapIcon,
  },
  school: {
    label: 'School Name',
    placeholder: 'Select school',
    error: 'Select your school',
    Icon: GraduationCap,
  },
};

/**
 * SCHOOL-AUTH-SELECT-SCHOOL: pick the school from State, City, District and School Name, or fill
 * "Add Other School" when it is not listed. The two ways exclude each other: using one clears the
 * other. MOCK: the list is in src/mock/schools.ts and nothing is saved.
 */
export function SelectSchoolScreen() {
  const router = useRouter();
  const [pick, setPick] = useState(EMPTY_PICK);
  const [other, setOther] = useState(EMPTY_OTHER);
  const [open, setOpen] = useState<PickKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<OtherKey, boolean>>>({});

  const otherFilled = Object.values(other).some((v) => v.trim() !== '');

  const optionsFor = (k: PickKey): string[] => {
    if (k === 'state') return stateOptions();
    if (k === 'city') return cityOptions(pick.state);
    if (k === 'district') return districtOptions(pick.state, pick.city);
    return schoolOptions(pick.state, pick.city, pick.district);
  };
  const enabled = (k: PickKey): boolean =>
    k === 'state' ||
    (k === 'city' && !!pick.state) ||
    (k === 'district' && !!pick.city) ||
    (k === 'school' && !!pick.district);

  const choose = (k: PickKey, value: string) => {
    // Changing a level clears everything below it (city depends on state, and so on).
    const order: PickKey[] = ['state', 'city', 'district', 'school'];
    const next = { ...pick, [k]: value };
    for (const lower of order.slice(order.indexOf(k) + 1)) next[lower] = '';
    setPick(next);
    setOther(EMPTY_OTHER);
    setTouched({});
    setOpen(null);
  };

  const setOtherField = (k: OtherKey, v: string) => {
    setOther((o) => ({ ...o, [k]: k === 'pincode' ? v.replace(/\D/g, '') : v }));
    if (pick.state) setPick(EMPTY_PICK);
  };

  const otherResult = otherSchoolSchema.safeParse(other);
  const otherErrors: Partial<Record<OtherKey, string>> = {};
  if (!otherResult.success) {
    for (const issue of otherResult.error.issues) {
      const key = issue.path[0] as OtherKey;
      if (!otherErrors[key]) otherErrors[key] = issue.message;
    }
  }
  const otherError = (k: OtherKey) => (submitted || touched[k] ? otherErrors[k] : undefined);
  const pickError = (k: PickKey) =>
    submitted && !otherFilled && !pick[k] ? PICK_META[k].error : undefined;

  const valid = otherFilled ? otherResult.success : Object.values(pick).every(Boolean);

  const onContinue = () => {
    setSubmitted(true);
    if (!valid) return;
    router.replace('/(auth)/add-staff');
  };

  const otherFields: {
    key: OtherKey;
    label: string;
    placeholder: string;
    Icon: LucideIcon;
    keyboardType?: 'number-pad';
    maxLength: number;
  }[] = [
    {
      key: 'name',
      label: 'School Name',
      placeholder: 'Enter school name',
      Icon: GraduationCap,
      maxLength: 100,
    },
    {
      key: 'address',
      label: 'Full Address',
      placeholder: 'Enter complete address',
      Icon: House,
      maxLength: 200,
    },
    {
      key: 'pincode',
      label: 'Pincode',
      placeholder: 'Enter pincode',
      Icon: MapPin,
      keyboardType: 'number-pad',
      maxLength: 6,
    },
  ];

  const listFor = open ? optionsFor(open) : [];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Select Your School
        </Text>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {(Object.keys(PICK_META) as PickKey[]).map((k) => {
            const { label, placeholder, Icon } = PICK_META[k];
            const err = pickError(k);
            const on = enabled(k);
            return (
              <View key={k} style={styles.fieldWrap}>
                <Pressable
                  testID={`school-${k}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}, ${pick[k] || 'not selected'}`}
                  accessibilityState={{ disabled: !on }}
                  disabled={!on}
                  onPress={() => setOpen(k)}
                  style={[styles.select, err ? styles.selectError : null, !on && styles.disabled]}
                >
                  <Icon size={20} color={PURPLE} fill={PURPLE} strokeWidth={1.5} />
                  <View style={styles.selectText}>
                    <Text style={styles.selectLabel}>{label}</Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.selectValue, !pick[k] && styles.placeholder]}
                    >
                      {pick[k] || placeholder}
                    </Text>
                  </View>
                  <ChevronDown size={24} color="#3A3A4A" />
                </Pressable>
                {err ? <Text style={styles.error}>{err}</Text> : null}
              </View>
            );
          })}

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <View style={styles.orPill}>
              <Text style={styles.orText}>OR</Text>
            </View>
            <View style={styles.orLine} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.plus}>
                <Plus size={22} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Add Other School</Text>
                <Text style={styles.cardSub}>
                  If your school is not listed above, please enter the details below.
                </Text>
              </View>
            </View>

            {otherFields.map(({ key, label, placeholder, Icon, keyboardType, maxLength }) => {
              const err = otherError(key);
              return (
                <View key={key} style={styles.fieldWrapSmall}>
                  <View style={[styles.other, err ? styles.selectError : null]}>
                    <Icon size={20} color={PURPLE} fill={PURPLE} strokeWidth={1.5} />
                    <View style={styles.selectText}>
                      <Text style={styles.otherLabel}>
                        {label} <Text style={styles.star}>*</Text>
                      </Text>
                      <TextInput
                        testID={`other-${key}`}
                        accessibilityLabel={label}
                        placeholder={placeholder}
                        placeholderTextColor="#8A8A99"
                        keyboardType={keyboardType}
                        maxLength={maxLength}
                        value={other[key]}
                        onChangeText={(t) => setOtherField(key, t)}
                        onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
                        style={[styles.otherInput, NO_OUTLINE]}
                      />
                    </View>
                  </View>
                  {err ? <Text style={styles.error}>{err}</Text> : null}
                </View>
              );
            })}
          </View>

          <Pressable
            testID="school-continue"
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={onContinue}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>Continue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={open !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)}>
          <View style={styles.pickerSheet} accessibilityViewIsModal>
            <Text style={styles.pickerTitle}>{open ? `Select ${PICK_META[open].label}` : ''}</Text>
            <ScrollView style={styles.pickerList}>
              {listFor.map((o) => (
                <Pressable
                  key={o}
                  testID={`option-${o}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: open ? pick[open] === o : false }}
                  onPress={() => open && choose(open, o)}
                  style={styles.pickerOption}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      open && pick[open] === o ? styles.pickerTextActive : null,
                    ]}
                  >
                    {o}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },
  flex: { flex: 1 },
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
  // The design has 25 left and 15 right (not symmetric); kept as drawn.
  form: { paddingLeft: 25, paddingRight: 15, paddingTop: 40, paddingBottom: 32 },
  fieldWrap: { marginBottom: 12 },
  fieldWrapSmall: { marginTop: 9 },
  select: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CFD3E6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selectError: { borderColor: ERROR },
  disabled: { opacity: 0.55 },
  selectText: { flex: 1 },
  selectLabel: { color: MUTED, fontSize: 13, lineHeight: 16 },
  selectValue: { color: TEXT, fontSize: 17, lineHeight: 22, fontWeight: '500' },
  placeholder: { color: '#8A8A99', fontWeight: '400' },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, marginTop: 4, marginLeft: 6 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#C9CBD6' },
  orPill: {
    height: 22,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: '#EDE7FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orText: { color: PURPLE, fontSize: 12, fontWeight: '700' },
  card: {
    marginTop: 22,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#B9C8F5',
    backgroundColor: '#C0CFFD',
    padding: 16,
    paddingBottom: 18,
  },
  cardHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  plus: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: TEXT, fontSize: 19, lineHeight: 24, fontWeight: '700' },
  cardSub: { color: MUTED, fontSize: 14, lineHeight: 17, marginTop: 2 },
  other: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  otherLabel: { color: '#222233', fontSize: 15, lineHeight: 19 },
  star: { color: '#C81E1E' },
  otherInput: { color: TEXT, fontSize: 17, lineHeight: 22, padding: 0, height: 24 },
  button: {
    height: 58,
    marginTop: 22,
    marginLeft: -6,
    marginRight: 6,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '500' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 24,
    maxHeight: '60%',
  },
  pickerList: { flexGrow: 0 },
  pickerTitle: { color: '#111111', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  pickerOption: { minHeight: 48, justifyContent: 'center' },
  pickerText: { color: '#333333', fontSize: 17 },
  pickerTextActive: { color: BLUE, fontWeight: '700' },
});
