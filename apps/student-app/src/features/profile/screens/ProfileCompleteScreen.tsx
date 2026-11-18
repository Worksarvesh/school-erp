import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Dropdown,
  PrimaryButton,
  ProgressBar,
  ScreenContainer,
  SectionHeader,
  TextField,
} from '@/components';
import { BLOOD_GROUPS, mockStudent } from '@/mock/student';
import { useSession } from '@/state/session';
import { colors, iconSize, radius, shadows, spacing, touch, typography } from '@/theme';
import { formatMobile } from '@/features/auth/validation';
import type { OptionalProfileValues } from '../progress';
import { formatDisplayDate, optionalProfileSchema, profileCompletion } from '../progress';

type FeatherName = ComponentProps<typeof Feather>['name'];

/**
 * "Complete your profile". Approved V1 rules: parent name, parent mobile, gender, date of birth and
 * school details are school-controlled and read-only here (corrections go through the school
 * office). The student may fill only the optional fields, and this screen never blocks Home:
 * "Save and continue" and "Skip for now" both go to Home.
 */
export function ProfileCompleteScreen() {
  const router = useRouter();
  const saveProfile = useSession((s) => s.saveProfile);
  const skipProfile = useSession((s) => s.skipProfile);
  const saved = useSession((s) => s.optionalProfile);

  const { control, handleSubmit, formState } = useForm<OptionalProfileValues>({
    resolver: zodResolver(optionalProfileSchema),
    defaultValues: {
      height: saved.heightCm ? String(saved.heightCm) : '',
      bloodGroup: saved.bloodGroup,
    },
    mode: 'onChange',
  });
  const [height, bloodGroup] = useWatch({ control, name: ['height', 'bloodGroup'] });
  const percent = profileCompletion(mockStudent, { height, bloodGroup });

  const onSave = handleSubmit((values) => {
    saveProfile({
      heightCm: values.height ? Number(values.height) : undefined,
      bloodGroup: values.bloodGroup,
    });
    router.replace('/home');
  });
  const onSkip = () => {
    skipProfile();
    router.replace('/home');
  };

  const s = mockStudent;
  return (
    <ScreenContainer
      backgroundColor={colors.primary}
      footerBackgroundColor={colors.surface}
      padded={false}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            testID="save-profile"
            label="Save and continue"
            trailingIcon="check"
            disabled={!formState.isValid}
            onPress={() => void onSave()}
          />
          <Pressable
            testID="skip-profile"
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
            onPress={onSkip}
            style={styles.skip}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Complete your profile
        </Text>
        <View style={[styles.progressCard, shadows.card]}>
          <Text style={styles.progressLabel}>Profile {percent}% complete</Text>
          <ProgressBar
            percent={percent}
            accessibilityLabel={`Profile ${percent} percent complete`}
          />
        </View>
      </View>

      <View style={styles.sheet}>
        <SectionHeader
          title="School records"
          tag="Verified by School"
          tagIcon="check-circle"
          tagTone="success"
        />
        <ReadOnlyRow label="Parents' name" value={s.parent.name} />
        <ReadOnlyRow
          label="Parents' mobile number"
          value={formatMobile(s.parent.mobile)}
          prefix="+91"
          trailingIcon="check-circle"
          trailingColor={colors.success}
        />
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <ReadOnlyRow label="Gender" value={s.gender} />
          </View>
          <View style={styles.pairItem}>
            <ReadOnlyRow
              label="Date of birth"
              value={formatDisplayDate(s.dateOfBirth)}
              trailingIcon="calendar"
            />
          </View>
        </View>

        <View style={styles.schoolBlock}>
          <View style={styles.schoolLabelRow}>
            <Text style={styles.fieldLabel}>School details (locked)</Text>
            <View style={styles.inline}>
              <Feather name="lock" size={iconSize.xs} color={colors.textMuted} />
              <Text style={styles.caption}>Verified by School</Text>
            </View>
          </View>
          <View
            style={styles.schoolCard}
            accessible
            accessibilityLabel={`School details, read only. Class ${s.className}, Section ${s.section}, Roll ${s.rollNumber}, ${s.schoolName}, Academic Year ${s.academicYear}`}
          >
            <Feather name="award" size={iconSize.md} color={colors.primary} />
            <View style={styles.schoolText}>
              <Text style={styles.schoolTitle}>
                Class {s.className}, Section {s.section}, Roll {s.rollNumber}
              </Text>
              <Text style={styles.caption}>
                {s.schoolName} · Academic Year {s.academicYear}
              </Text>
            </View>
            <Feather name="lock" size={iconSize.sm} color={colors.textMuted} />
          </View>
          <Text style={styles.note}>Something wrong? Ask your school office to correct it.</Text>
        </View>

        <View style={styles.divider} />

        <SectionHeader title="Optional (you can skip)" tag="Can fill later" />
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Controller
              control={control}
              name="height"
              render={({ field }) => (
                <TextField
                  testID="height"
                  label="Height (cm)"
                  placeholder="Optional (e.g. 145)"
                  keyboardType="number-pad"
                  maxLength={3}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={formState.errors.height?.message}
                />
              )}
            />
          </View>
          <View style={styles.pairItem}>
            <Controller
              control={control}
              name="bloodGroup"
              render={({ field }) => (
                <Dropdown
                  testID="blood-group"
                  label="Blood group"
                  placeholder="Optional"
                  options={BLOOD_GROUPS}
                  value={field.value}
                  onChange={field.onChange}
                  clearable
                />
              )}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function ReadOnlyRow({
  label,
  value,
  prefix,
  trailingIcon = 'lock',
  trailingColor = colors.textMuted,
}: {
  label: string;
  value: string;
  prefix?: string;
  trailingIcon?: FeatherName;
  trailingColor?: string;
}) {
  return (
    <View
      style={styles.field}
      accessible
      accessibilityLabel={`${label}, ${prefix ?? ''} ${value}, read only`}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readOnly}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <Text style={styles.readOnlyValue} numberOfLines={1}>
          {value}
        </Text>
        <Feather name={trailingIcon} size={iconSize.sm} color={trailingColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: { ...typography.title, color: colors.textOnPrimary, textAlign: 'center' },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.sm,
  },
  progressLabel: { ...typography.label, color: colors.textPrimary },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  field: { gap: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.textPrimary },
  readOnly: {
    minHeight: touch.inputHeight,
    borderRadius: radius.input,
    backgroundColor: colors.lockedFill,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prefix: { ...typography.body, color: colors.textSecondary },
  readOnlyValue: { ...typography.body, color: colors.textPrimary, flex: 1 },
  pair: { flexDirection: 'row', gap: spacing.md },
  pairItem: { flex: 1 },
  schoolBlock: { gap: spacing.sm },
  schoolLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  schoolCard: {
    borderRadius: radius.input,
    backgroundColor: colors.lockedFill,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  schoolText: { flex: 1, gap: spacing.xxs },
  schoolTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  caption: { ...typography.caption, color: colors.textSecondary },
  note: { ...typography.caption, color: colors.textSecondary },
  divider: {
    height: spacing.xxs,
    backgroundColor: colors.inputFill,
    marginHorizontal: -spacing.xxl,
  },
  footer: { gap: spacing.xs, paddingHorizontal: spacing.xxl },
  skip: { minHeight: touch.minTarget, alignItems: 'center', justifyContent: 'center' },
  skipText: { ...typography.label, color: colors.primary },
});
