import { Redirect, useRouter } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { Badge, Button, Card, Header, Input, Screen, useTheme } from '@school-erp/ui';
import { Dropdown, ProgressBar, SectionHeader } from '@/components';
import type { BloodGroup } from '@/mock/student';
import { BLOOD_GROUPS, mockStudent } from '@/mock/student';
import { useSession } from '@/state/session';
import { formatMobile, INDIAN_MOBILE, normalizeMobile } from '@/features/auth/validation';
import { formatDisplayDate, optionalProfileSchema, profileCompletion } from '../progress';

/**
 * Profile completion (students only, V1.2). It NEVER blocks Home:
 * - Shown once after a student's first login (the session marks it seen when it opens).
 * - School records are read-only, "Verified by School".
 * - Only optional fields (height, blood group) are editable.
 * - "Skip for now", "Save and continue" (always enabled) and Back all go to Home.
 * - Mock flag MOCK_FLAGS.parentMobileMissing: the parent mobile becomes editable with an amber
 *   "Pending confirmation by school" badge.
 * Parents are redirected to Home and never see this screen.
 */
export function ProfileCompleteScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const role = useSession((s) => s.role);
  const saved = useSession((s) => s.optionalProfile);
  const s = mockStudent;
  const parentMobileMissing = s.parent.mobile === '';

  const [height, setHeight] = useState(saved.heightCm ? String(saved.heightCm) : '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | undefined>(saved.bloodGroup);
  const [parentMobile, setParentMobile] = useState(saved.pendingParentMobile ?? '');
  const [errors, setErrors] = useState<{ height?: string; parentMobile?: string }>({});

  const goHome = useCallback(() => router.replace('/(tabs)'), [router]);

  useEffect(() => {
    void useSession.getState().markProfilePromptSeen();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [goHome]);

  if (role === 'parent') return <Redirect href="/(tabs)" />;

  const percent = profileCompletion(
    { ...s, parent: { ...s.parent, mobile: s.parent.mobile || parentMobile } },
    { height, bloodGroup },
  );

  const onSave = () => {
    const nextErrors: typeof errors = {};
    const parsed = optionalProfileSchema.safeParse({ height, bloodGroup });
    if (!parsed.success) {
      nextErrors.height = parsed.error.issues.find((i) => i.path[0] === 'height')?.message;
    }
    const mobile = normalizeMobile(parentMobile);
    if (parentMobileMissing && mobile !== '' && !INDIAN_MOBILE.test(mobile)) {
      nextErrors.parentMobile = 'Enter a valid 10-digit mobile number';
    }
    setErrors(nextErrors);
    if (nextErrors.height || nextErrors.parentMobile) return;

    useSession.getState().saveProfile({
      heightCm: height.trim() ? Number(height) : undefined,
      bloodGroup,
      pendingParentMobile: parentMobileMissing && mobile ? mobile : undefined,
    });
    goHome();
  };

  return (
    <Screen
      scrollable
      header={<Header title="Complete your profile" showBack onBack={goHome} />}
      contentContainerStyle={{ padding: spacing.base }}
      footer={
        <View style={{ padding: spacing.base, gap: spacing.sm }}>
          <Button testID="save-profile" label="Save and continue" size="lg" onPress={onSave} />
          <Button testID="skip-profile" label="Skip for now" variant="ghost" onPress={goHome} />
        </View>
      }
    >
      <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.sm, marginBottom: spacing.sm }}>
        Your school has already filled in your records. You can add the optional details now or later.
      </Text>
      <ProgressBar percent={percent} accessibilityLabel={`Profile ${percent} percent complete`} />
      <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs, marginTop: spacing.xs }}>
        {percent}% complete
      </Text>

      <SectionHeader title="School records" tag="Verified by School" tagIcon={BadgeCheck} tagTone="success" />
      <Card variant="outlined">
        <ReadOnlyRow label="Parents' name" value={s.parent.name} />
        {parentMobileMissing ? (
          <View style={{ marginTop: spacing.sm }}>
            <View style={{ marginBottom: spacing.xs }}>
              <Badge label="Pending confirmation by school" variant="warning" />
            </View>
            <Input
              testID="parent-mobile"
              label="Parents' mobile number"
              placeholder="10-digit mobile number"
              leftIcon={<Text style={{ color: colors.text, fontSize: typography.fontSizes.base }}>+91</Text>}
              keyboardType="number-pad"
              maxLength={10}
              value={parentMobile}
              onChangeText={(t) => setParentMobile(t.replace(/\D/g, ''))}
              error={errors.parentMobile}
            />
          </View>
        ) : (
          <ReadOnlyRow label="Parents' mobile number" value={`+91 ${formatMobile(s.parent.mobile)}`} />
        )}
        <ReadOnlyRow label="Gender" value={s.gender} />
        <ReadOnlyRow label="Date of birth" value={formatDisplayDate(s.dateOfBirth)} />
        <ReadOnlyRow label="Class / Section" value={`${s.className} - ${s.section}`} />
        <ReadOnlyRow label="Roll number" value={String(s.rollNumber)} />
        <ReadOnlyRow label="School" value={s.schoolName} />
        <ReadOnlyRow label="Academic year" value={s.academicYear} last />
      </Card>

      <SectionHeader title="Optional details" tag="Can fill later" />
      <Input
        testID="height"
        label="Height (cm)"
        placeholder="e.g. 142"
        keyboardType="number-pad"
        maxLength={3}
        value={height}
        onChangeText={(t) => setHeight(t.replace(/\D/g, ''))}
        error={errors.height}
      />
      <Dropdown
        testID="blood-group"
        label="Blood group"
        options={BLOOD_GROUPS}
        value={bloodGroup}
        onChange={setBloodGroup}
        placeholder="Select blood group"
        clearable
      />
    </Screen>
  );
}

function ReadOnlyRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. Verified by school, read only.`}
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.medium }}>
        {value}
      </Text>
    </View>
  );
}
