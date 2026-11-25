import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, Text } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BLOOD_GROUPS, type BloodGroup } from '@/mock/student';
import { useSession, type OptionalProfile } from '@/state/session';
import { PROFILE, SelectField, TextField } from '../components/ProfileKit';
import { ProfileTopBar } from '../components/ProfileTopBar';
import {
  editValue,
  profileSections,
  type EditKey,
  type SectionField,
  type SectionId,
} from '../profileData';
import { optionalProfileSchema } from '../progress';

const KEYBOARD: Partial<Record<EditKey, 'number-pad' | 'email-address'>> = {
  heightCm: 'number-pad',
  weightKg: 'number-pad',
  studentMobile: 'number-pad',
  emergencyContactPhone: 'number-pad',
  email: 'email-address',
};
const DIGITS_ONLY: EditKey[] = ['heightCm', 'weightKg', 'studentMobile', 'emergencyContactPhone'];
const MAX_LENGTH: Partial<Record<EditKey, number>> = {
  heightCm: 3,
  weightKg: 3,
  studentMobile: 10,
  emergencyContactPhone: 10,
};
const ALL_EDIT_KEYS: EditKey[] = [
  'heightCm',
  'weightKg',
  'hobbies',
  'studentMobile',
  'email',
  'address',
  'emergencyContactName',
  'emergencyContactPhone',
  'bloodGroup',
];
/** Editable key -> name used by optionalProfileSchema. */
const SCHEMA_KEY: Record<EditKey, string> = {
  heightCm: 'height',
  weightKg: 'weight',
  hobbies: 'hobbies',
  studentMobile: 'studentMobile',
  email: 'email',
  address: 'address',
  emergencyContactName: 'emergencyContactName',
  emergencyContactPhone: 'emergencyContactPhone',
  bloodGroup: 'bloodGroup',
};

/** One Profile section: read-only school records plus the fields the student may edit. */
export function ProfileSectionScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const saved = useSession((s) => s.optionalProfile);
  const def = profileSections(saved).find((s) => s.id === (section as SectionId));

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(ALL_EDIT_KEYS.map((k) => [k, editValue(saved, k)])),
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [done, setDone] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  if (!def) {
    return (
      <SafeAreaView edges={['top']} style={styles.root}>
        <ProfileTopBar title="Profile" onBack={back} />
        <Text style={styles.empty}>Section not found.</Text>
      </SafeAreaView>
    );
  }

  const editable = def.fields.filter((f) => f.edit);

  const setValue = (key: EditKey, text: string) => {
    setValues((v) => ({ ...v, [key]: DIGITS_ONLY.includes(key) ? text.replace(/\D/g, '') : text }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setDone(false);
  };

  const onSave = () => {
    const parsed = optionalProfileSchema.safeParse({
      height: values.heightCm,
      weight: values.weightKg,
      bloodGroup: values.bloodGroup || undefined,
      studentMobile: values.studentMobile,
      email: values.email,
      address: values.address,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      hobbies: values.hobbies,
    });
    const next: Record<string, string | undefined> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = editable.find((f) => f.edit && SCHEMA_KEY[f.edit] === issue.path[0]);
        if (field?.edit) next[field.edit] ??= issue.message;
      }
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const patch: OptionalProfile = { ...useSession.getState().optionalProfile };
    for (const f of editable) {
      const key = f.edit as EditKey;
      const text = (values[key] ?? '').trim();
      if (key === 'heightCm' || key === 'weightKg') patch[key] = text ? Number(text) : undefined;
      else if (key === 'bloodGroup')
        patch.bloodGroup = (text || undefined) as BloodGroup | undefined;
      else patch[key] = text || undefined;
    }
    useSession.getState().saveProfile(patch);
    setDone(true);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <ProfileTopBar title={def.title} onBack={back} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>{def.note}</Text>
        {def.fields.map((f) => (
          <FieldRow key={f.label} field={f} values={values} errors={errors} onChange={setValue} />
        ))}
        {editable.length > 0 ? (
          <>
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
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldRow({
  field,
  values,
  errors,
  onChange,
}: {
  field: SectionField;
  values: Record<string, string>;
  errors: Record<string, string | undefined>;
  onChange: (key: EditKey, text: string) => void;
}) {
  const key = field.edit;
  if (!key) {
    return (
      <View style={styles.block}>
        <Text style={styles.label}>{field.label}</Text>
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>{field.value}</Text>
        </View>
      </View>
    );
  }
  if (key === 'bloodGroup') {
    return (
      <SelectField<BloodGroup>
        label={field.label}
        options={BLOOD_GROUPS}
        value={BLOOD_GROUPS.find((g) => g === values.bloodGroup)}
        onChange={(v) => onChange('bloodGroup', v ?? '')}
        placeholder="Optional"
        clearable
      />
    );
  }
  return (
    <TextField
      label={field.label}
      placeholder="Optional"
      keyboardType={KEYBOARD[key]}
      maxLength={MAX_LENGTH[key]}
      autoCapitalize={key === 'email' ? 'none' : 'sentences'}
      value={values[key] ?? ''}
      onChangeText={(t) => onChange(key, t)}
      error={errors[key]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  note: { color: PROFILE.muted, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  block: { marginBottom: 16 },
  label: { color: PROFILE.label, fontSize: 13, marginBottom: 8, marginLeft: 4 },
  readOnly: {
    minHeight: 50,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PROFILE.lockedBorder,
    backgroundColor: PROFILE.lockedBg,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  readOnlyText: { color: PROFILE.text, fontSize: 15 },
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
  empty: { padding: 24, color: PROFILE.muted },
});
