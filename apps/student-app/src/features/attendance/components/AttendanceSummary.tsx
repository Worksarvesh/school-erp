import { CircleCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme, type ThemeContextValue, StyleSheet, Text, scaled } from '@school-erp/ui';
import { mockAttendanceStats, type AttendancePeriod } from '@/mock/academic';
import { fonts } from '@/theme/fonts';

/** Attendance colours shared by the Academic and Attendance screens. */
export const ATTENDANCE_COLORS = {
  present: '#16A34A',
  presentBg: '#E7F6EE',
  absent: '#B91C1C',
  holiday: '#2F80ED',
} as const;

const PERIODS: readonly { key: AttendancePeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

/** Message under the attendance ring. */
export function attendanceRemark(percentage: number): string {
  if (percentage >= 90) return 'Good, Keep it up!';
  if (percentage >= 75) return 'Fair, keep going!';
  return 'Low attendance, please improve';
}

interface AttendanceSummaryProps {
  /** Shows the green "Good, Keep it up!" message under the ring (Academic screen). */
  showRemark?: boolean;
}

/** Daily / Weekly / Monthly tabs, the attendance ring and the Present / Absent / Holiday counts. */
export function AttendanceSummary({ showRemark = false }: AttendanceSummaryProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const [period, setPeriod] = useState<AttendancePeriod>('daily');
  const stats = mockAttendanceStats[period];
  const good = stats.percentage >= 75;

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

      <View style={styles.attendanceRow}>
        <AttendanceRing percentage={stats.percentage} trackColor={colors.surfaceSubtle} />
        <View style={styles.attendanceInfo}>
          <Text style={styles.overallTitle}>Overall Attendance</Text>
          <View style={styles.legendRow}>
            <Legend
              color={ATTENDANCE_COLORS.present}
              value={stats.present}
              label="Present"
              styles={styles}
            />
            <Legend
              color={ATTENDANCE_COLORS.absent}
              value={stats.absent}
              label="Absent"
              styles={styles}
            />
            <Legend
              color={ATTENDANCE_COLORS.holiday}
              value={stats.holiday}
              label="Holiday"
              styles={styles}
            />
          </View>
        </View>
      </View>

      {showRemark ? (
        <View style={[styles.remark, !good && styles.remarkWarn]}>
          <CircleCheck
            size={scaled(16)}
            color={good ? ATTENDANCE_COLORS.present : colors.warning}
          />
          <Text style={[styles.remarkText, !good && { color: colors.warning }]}>
            {attendanceRemark(stats.percentage)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function AttendanceRing({
  percentage,
  trackColor,
  size = 104,
}: {
  percentage: number;
  trackColor: string;
  size?: number;
}) {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;
  const green = ATTENDANCE_COLORS.present;

  return (
    <View
      style={{
        width: scaled(size),
        height: scaled(size),
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessible
      accessibilityLabel={`${percentage} percent present`}
    >
      <Svg
        width={scaled(size)}
        height={scaled(size)}
        viewBox={`0 0 ${size} ${size}`}
        style={StyleSheet.absoluteFill}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={green}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        style={{
          color: green,
          fontSize: scaled(26),
          fontFamily: fonts.bold,
          lineHeight: scaled(30),
        }}
      >
        {percentage}
        <Text style={{ fontSize: scaled(18) }}>%</Text>
      </Text>
      <Text style={{ color: '#1F2937', fontSize: scaled(12), fontFamily: fonts.semibold }}>
        Present
      </Text>
    </View>
  );
}

function Legend({
  color,
  value,
  label,
  styles,
}: {
  color: string;
  value: number;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.legendValue}>{value}</Text>
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
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
    segmentItemActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    segmentText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.medium },
    segmentTextActive: { color: colors.primary, fontFamily: fonts.semibold },
    attendanceRow: {
      marginTop: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.base,
    },
    attendanceInfo: { flex: 1, gap: spacing.sm },
    overallTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
    legendRow: { flexDirection: 'row', gap: spacing.md },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 7, height: 7, borderRadius: radii.full, marginTop: 6 },
    legendValue: { color: colors.text, fontSize: 14, fontFamily: fonts.semibold },
    legendLabel: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.medium },
    remark: {
      marginTop: spacing.lg,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: ATTENDANCE_COLORS.presentBg,
      borderRadius: radii.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      minWidth: '80%',
      justifyContent: 'center',
    },
    remarkWarn: { backgroundColor: colors.warningBg },
    remarkText: { color: ATTENDANCE_COLORS.present, fontSize: 14, fontFamily: fonts.semibold },
  });
}
