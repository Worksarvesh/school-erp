import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme, type ThemeContextValue, StyleSheet, Text } from '@school-erp/ui';
import type { DayStatus } from '@/mock/attendance';
import { fonts } from '@/theme/fonts';
import { chartBars, countStatuses, datesFor, percentPresent, type Period } from '../stats';
import { ATTENDANCE_COLORS, AttendanceRing } from './AttendanceSummary';

const PERIODS: readonly { key: Period; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];
const STATUSES: readonly { key: DayStatus; label: string }[] = [
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'holiday', label: 'Holiday' },
];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface Props {
  /** Day chosen in the calendar: its week is the "Weekly" range. */
  selected: Date;
  /** Month shown in the calendar: the "Monthly" range. */
  month: Date;
  today: Date;
}

/**
 * Weekly / Monthly / Yearly attendance: the ring with Present / Absent / Holiday counts. Tapping
 * a count opens a bar chart of how many days had that status; Monthly and Yearly also list every
 * month of the academic year (in order) with its Present / Absent / Holiday days. MOCK data only.
 */
export function AttendanceInsights({ selected, month, today }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [status, setStatus] = useState<DayStatus | null>(null);

  const counts = countStatuses(datesFor(period, selected, month), today);
  const percentage = percentPresent(counts);
  const bars = status ? chartBars(period, status, selected, month, today) : [];
  const max = Math.max(1, ...bars.map((b) => b.value));
  const rangeLabel =
    period === 'weekly'
      ? 'this week'
      : period === 'monthly'
        ? `${MONTHS[month.getMonth()]} ${month.getFullYear()}`
        : 'this academic year';

  return (
    <View>
      <View style={styles.segment} accessibilityRole="tablist">
        {PERIODS.map((p) => {
          const active = p.key === period;
          return (
            <Pressable
              key={p.key}
              testID={`period-${p.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setPeriod(p.key)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <AttendanceRing
          percentage={percentage}
          trackColor={theme.colors.surfaceSubtle}
          size={124}
        />
        <View style={styles.info}>
          <Text style={styles.overall}>Overall Attendance</Text>
          <View style={styles.legendRow}>
            {STATUSES.map((s) => {
              const active = status === s.key;
              return (
                <Pressable
                  key={s.key}
                  testID={`status-${s.key}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${s.label}: ${counts[s.key]} days. Show chart`}
                  onPress={() => setStatus(active ? null : s.key)}
                  style={[
                    styles.legend,
                    active && { borderColor: ATTENDANCE_COLORS[s.key], backgroundColor: '#FFFFFF' },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: ATTENDANCE_COLORS[s.key] }]} />
                  <View>
                    <Text style={styles.value}>{counts[s.key]}</Text>
                    <Text style={styles.label}>{s.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {status ? (
        <View style={styles.chart} testID="attendance-chart">
          <Text style={styles.chartTitle}>
            {STATUSES.find((s) => s.key === status)?.label} days: {counts[status]} ({rangeLabel})
          </Text>
          <View style={styles.bars}>
            {bars.map((b, i) => (
              <View key={`${b.label}-${i}`} style={styles.barCol}>
                <Text style={styles.barValue}>{b.value}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(b.value / max) * 100}%`,
                        backgroundColor: ATTENDANCE_COLORS[status],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  return StyleSheet.create({
    segment: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radii.lg,
      padding: 4,
    },
    segmentItem: {
      flex: 1,
      minHeight: 36,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentItemActive: { backgroundColor: colors.surface },
    segmentText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.medium },
    segmentTextActive: { color: colors.primary, fontFamily: fonts.semibold },
    row: {
      marginTop: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.base,
      padding: spacing.base,
      borderRadius: radii.xl,
      backgroundColor: '#F4EFFC',
      borderWidth: 1,
      borderColor: '#E2D6F7',
    },
    info: { flex: 1, gap: spacing.sm },
    overall: { color: colors.text, fontSize: 17, fontFamily: fonts.medium },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dot: { width: 7, height: 7, borderRadius: radii.full, marginTop: 6 },
    value: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold },
    label: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.medium },
    chart: {
      marginTop: spacing.lg,
      padding: spacing.base,
      borderRadius: radii.xl,
      backgroundColor: '#F4EFFC',
      borderWidth: 1,
      borderColor: '#E2D6F7',
    },
    chartTitle: { color: colors.text, fontSize: 14, fontFamily: fonts.semibold },
    bars: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    barCol: { flex: 1, alignItems: 'center' },
    barValue: { color: colors.textSecondary, fontSize: 10, fontFamily: fonts.medium },
    barTrack: {
      width: '70%',
      height: 90,
      justifyContent: 'flex-end',
      marginVertical: 4,
    },
    bar: { width: '100%', borderRadius: 4, minHeight: 2 },
    barLabel: { color: colors.textSecondary, fontSize: 10, fontFamily: fonts.medium },
  });
}
