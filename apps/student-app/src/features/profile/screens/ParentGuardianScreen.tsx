import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockStudentRecord } from '../../../core/mocks/fixtures';
import { mockStudent } from '@/mock/student';
import { useSession, type OptionalProfile } from '@/state/session';
import { PROFILE, TextField } from '../components/ProfileKit';
import { ProfileTopBar } from '../components/ProfileTopBar';
import { validateParentGuardian, type ParentGuardianKey } from '../progress';

const GROUPS: readonly {
  name: ParentGuardianKey;
  mobile: ParentGuardianKey;
  nameLabel: string;
  mobileLabel: string;
}[] = [
  {
    name: 'parentName',
    mobile: 'parentMobile',
    nameLabel: "Parent's name",
    mobileLabel: "Parent's mobile number",
  },
  {
    name: 'motherName',
    mobile: 'motherMobile',
    nameLabel: "Mother's name",
    mobileLabel: "Mother's mobile number",
  },
  {
    name: 'guardianName',
    mobile: 'guardianMobile',
    nameLabel: "Guardian's name",
    mobileLabel: "Guardian's mobile number",
  },
];
const MOBILE_KEYS: ParentGuardianKey[] = ['parentMobile', 'motherMobile', 'guardianMobile'];

function initialValues(saved: OptionalProfile): Record<ParentGuardianKey, string> {
  return {
    parentName: saved.parentName ?? mockStudentRecord.fatherName ?? '',
    parentMobile: saved.parentMobile ?? mockStudent.parent.mobile ?? '',
    motherName: saved.motherName ?? mockStudentRecord.motherName ?? '',
    motherMobile: saved.motherMobile ?? '',
    guardianName: saved.guardianName ?? '',
    guardianMobile: saved.guardianMobile ?? '',
  };
}

/**
 * Parent & Guardian Information: parent, mother and guardian, each with a name and a mobile
 * number. At least one name + mobile pair is mandatory. MOCK: saved on the device only.
 */
export function ParentGuardianScreen() {
  const router = useRouter();
  const saved = useSession((s) => s.optionalProfile);
  const [values, setValues] = useState(() => initialValues(saved));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [done, setDone] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  const setValue = (key: ParentGuardianKey, text: string) => {
    setValues((v) => ({ ...v, [key]: MOBILE_KEYS.includes(key) ? text.replace(/\D/g, '') : text }));
    setErrors({});
    setDone(false);
  };

  const onSave = () => {
    const next = validateParentGuardian(values);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const patch: OptionalProfile = { ...useSession.getState().optionalProfile };
    for (const g of GROUPS) {
      patch[g.name] = values[g.name].trim() || undefined;
      patch[g.mobile] = values[g.mobile] || undefined;
    }
    useSession.getState().saveProfile(patch);
    setDone(true);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <ProfileTopBar title="Parent & Guardian Information" onBack={back} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>
          Add at least one name with its mobile number. A name and its mobile number go together.
        </Text>
        {GROUPS.map((g) => (
          <View key={g.name}>
            <TextField
              label={g.nameLabel}
              placeholder="Enter name"
              value={values[g.name]}
              onChangeText={(t) => setValue(g.name, t)}
              error={errors[g.name]}
            />
            <TextField
              label={g.mobileLabel}
              placeholder="10-digit mobile number"
              prefix="+91"
              keyboardType="number-pad"
              maxLength={10}
              value={values[g.mobile]}
              onChangeText={(t) => setValue(g.mobile, t)}
              error={errors[g.mobile]}
            />
          </View>
        ))}
        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
        <Pressable
          testID="save-section"
          accessibilityRole="button"
          accessibilityLabel="Save changes"
          onPress={onSave}
          style={styles.save}
        >
          <Text style={styles.saveText}>Save changes</Text>
        </Pressable>
        {done ? (
          <Text accessibilityLiveRegion="polite" style={styles.saved}>
            Saved
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  note: { color: PROFILE.muted, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  formError: { color: PROFILE.error, fontSize: 13, marginBottom: 8, marginLeft: 4 },
  save: {
    height: 54,
    borderRadius: 27,
    backgroundColor: PROFILE.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  saved: {
    color: PROFILE.success,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
});
