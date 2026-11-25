import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle2, Check, GraduationCap, IdCard, Lock } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, Text, scaled } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BloodGroup, Gender } from '@/mock/student';
import { BLOOD_GROUPS, mockStudent } from '@/mock/student';
import { useSession } from '@/state/session';
import { formatMobile } from '@/features/auth/validation';
import { DateField, PROFILE, SelectField, TextField } from '../components/ProfileKit';
import { dobRange, optionalProfileSchema, validateRequiredProfile } from '../progress';

const GENDERS = ['Male', 'Female'] as const;

/**
 * Profile completion (students only). Shown once after a student's first login; Save and
 * Android Back both go Home. Required fields (parents' name, mobile, gender, date of birth) are
 * marked with a red asterisk and validated here; school details are locked; height and blood
 * group are optional. Parents never see this screen.
 */
export function ProfileCompleteScreen() {
  const router = useRouter();
  const role = useSession((s) => s.role);
  const saved = useSession((s) => s.optionalProfile);
  const s = mockStudent;

  const [parentName, setParentName] = useState(saved.parentName ?? s.parent.name);
  const [parentMobile, setParentMobile] = useState(saved.parentMobile ?? s.parent.mobile);
  const [gender, setGender] = useState<(typeof GENDERS)[number] | undefined>(
    saved.gender === 'Female'
      ? 'Female'
      : saved.gender === 'Male'
        ? 'Male'
        : s.gender === 'Female'
          ? 'Female'
          : 'Male',
  );
  const [dateOfBirth, setDateOfBirth] = useState(saved.dateOfBirth ?? s.dateOfBirth);
  const [height, setHeight] = useState(saved.heightCm ? String(saved.heightCm) : '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | undefined>(saved.bloodGroup);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const goHome = useCallback(() => router.replace('/(tabs)'), [router]);

  useEffect(() => {
    void useSession.getState().markProfilePromptSeen();
  }, []);

  useEffect(() => {
    // BackHandler is Android-only; calling it on web throws and blanks the screen.
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [goHome]);

  if (role === 'parent') return <Redirect href="/(tabs)" />;

  const requiredErrors = validateRequiredProfile({ parentName, parentMobile, gender, dateOfBirth });
  const mobileValid = !requiredErrors.parentMobile;

  // Live completion: 4 editable required fields + locked school details + 2 optional fields.
  const filled = [
    !requiredErrors.parentName,
    !requiredErrors.parentMobile,
    !requiredErrors.gender,
    !requiredErrors.dateOfBirth,
    true,
    height.trim() !== '',
    bloodGroup !== undefined,
  ].filter(Boolean).length;
  const percent = Math.round((filled / 7) * 100);

  const setError = (key: string, message?: string) =>
    setErrors((prev) => ({ ...prev, [key]: message }));

  const onSave = () => {
    const next: Record<string, string | undefined> = { ...requiredErrors };
    const parsed = optionalProfileSchema.shape.height.safeParse(height);
    if (!parsed.success) next.height = parsed.error.issues[0]?.message;
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    useSession.getState().saveProfile({
      ...useSession.getState().optionalProfile,
      parentName: parentName.trim(),
      parentMobile,
      gender: gender as Gender,
      dateOfBirth,
      heightCm: height.trim() ? Number(height) : undefined,
      bloodGroup,
    });
    goHome();
  };

  const { min, max } = dobRange();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Complete your profile
        </Text>
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Profile {percent}% complete</Text>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Profile ${percent} percent complete`}
            accessibilityValue={{ min: 0, max: 100, now: percent }}
            style={styles.track}
          >
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Required</Text>
            <View style={styles.amberTag}>
              <Text style={styles.amberTagText}>* Mandatory for school records</Text>
            </View>
          </View>

          <TextField
            testID="parent-name"
            label="Parents' name"
            required
            placeholder="Enter parents' name"
            autoCapitalize="words"
            value={parentName}
            onChangeText={(t) => {
              setParentName(t.replace(/[^A-Za-z .'-]/g, ''));
              setError('parentName');
            }}
            onBlur={() => setError('parentName', requiredErrors.parentName)}
            error={errors.parentName}
            suffix={<IdCard size={scaled(22)} color="#94A3B8" />}
          />
          <TextField
            testID="parent-mobile"
            label="Parents' mobile number"
            required
            prefix="+91"
            placeholder="98765 43210"
            keyboardType="number-pad"
            maxLength={11}
            value={formatMobile(parentMobile)}
            onChangeText={(t) => {
              setParentMobile(t.replace(/\D/g, '').slice(0, 10));
              setError('parentMobile');
            }}
            onBlur={() => setError('parentMobile', requiredErrors.parentMobile)}
            error={errors.parentMobile}
            suffix={
              mobileValid ? <CheckCircle2 size={scaled(22)} color={PROFILE.success} /> : undefined
            }
          />

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <SelectField<(typeof GENDERS)[number]>
                testID="gender"
                label="Gender"
                required
                options={GENDERS}
                value={gender}
                onChange={(v) => {
                  setGender(v);
                  setError('gender');
                }}
                placeholder="Select"
                error={errors.gender}
              />
            </View>
            <View style={styles.col}>
              <DateField
                testID="dob"
                label="Date of birth"
                required
                value={dateOfBirth}
                onChange={(iso) => {
                  setDateOfBirth(iso);
                  setError('dateOfBirth');
                }}
                minDate={min}
                maxDate={max}
                error={errors.dateOfBirth}
              />
            </View>
          </View>

          <View style={styles.lockedHeader}>
            <Text style={styles.lockedTitle}>School details (locked)</Text>
            <View style={styles.verified}>
              <Lock size={scaled(13)} color={PROFILE.muted} />
              <Text style={styles.verifiedText}>Verified by School</Text>
            </View>
          </View>
          <View
            accessible
            accessibilityLabel={`School details, verified by school, read only. Class ${s.className}, Section ${s.section}, Roll ${s.rollNumber}. ${s.schoolName}. Academic year ${s.academicYear}.`}
            style={styles.locked}
          >
            <View style={styles.capCircle}>
              <GraduationCap size={scaled(22)} color="#64748B" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.lockedMain}>
                Class {s.className}, Section {s.section}, Roll {s.rollNumber}
              </Text>
              <Text style={styles.lockedSub}>{s.schoolName}</Text>
              <Text style={styles.lockedSub}>• Academic Year {s.academicYear}</Text>
            </View>
            <Lock size={scaled(20)} color="#94A3B8" />
          </View>

          <View style={[styles.sectionRow, { marginTop: 28 }]}>
            <Text style={styles.optionalTitle}>Optional (you can skip)</Text>
            <Text style={styles.canFill}>Can fill later</Text>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <TextField
                testID="height"
                label="Height"
                placeholder="Optional (e.g. 145 cm)"
                keyboardType="number-pad"
                maxLength={3}
                value={height}
                onChangeText={(t) => {
                  setHeight(t.replace(/\D/g, ''));
                  setError('height');
                }}
                error={errors.height}
              />
            </View>
            <View style={styles.col}>
              <SelectField<BloodGroup>
                testID="blood-group"
                label="Blood group"
                options={BLOOD_GROUPS}
                value={bloodGroup}
                onChange={setBloodGroup}
                placeholder="Optional"
                clearable
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            testID="save-profile"
            accessibilityRole="button"
            accessibilityLabel="Save and continue"
            onPress={onSave}
            style={styles.saveButton}
          >
            <Text style={styles.saveLabel}>Save and continue</Text>
            <Check size={scaled(20)} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PROFILE.accent },
  flex: { flex: 1 },
  top: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: PROFILE.accent },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  progressTitle: { color: PROFILE.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  track: { height: 8, borderRadius: 4, backgroundColor: PROFILE.track, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: PROFILE.progress },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  sheetContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { color: PROFILE.text, fontSize: 22, fontWeight: '800' },
  amberTag: {
    backgroundColor: PROFILE.amberBg,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  amberTagText: { color: PROFILE.amber, fontSize: 12, fontWeight: '600' },
  twoCol: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  lockedTitle: { color: PROFILE.label, fontSize: 13 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: PROFILE.muted, fontSize: 12 },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: PROFILE.lockedBg,
    borderWidth: 1,
    borderColor: PROFILE.lockedBorder,
  },
  capCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedMain: { color: PROFILE.text, fontSize: 15, fontWeight: '700' },
  lockedSub: { color: PROFILE.muted, fontSize: 13, marginTop: 2 },
  optionalTitle: { color: PROFILE.text, fontSize: 16, fontWeight: '700' },
  canFill: { color: PROFILE.muted, fontSize: 13 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#F8F9FB',
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: PROFILE.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PROFILE.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
